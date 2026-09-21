import { Router, Response } from 'express';
import { prisma } from '../db.js';
import { AuthenticatedRequest } from '../auth.js';

const router = Router();

// GET /api/analytics
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.telegramUser?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const userBigInt = BigInt(userId);
    const user = await prisma.user.findUnique({
      where: { telegram_id: userBigInt },
    });

    const startingBalance = user?.starting_balance ?? 0;

    const now = new Date();

    // Start of Today (local time)
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    // Start of This Week (Monday)
    const dayOfWeek = now.getDay();
    const distanceToMonday = (dayOfWeek + 6) % 7;
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - distanceToMonday);

    // Start of This Month
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // Start of Last Month & End of Last Month
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    // Fetch all user transactions
    const allTransactions = await prisma.transaction.findMany({
      where: { user_id: userBigInt },
      include: { category: true },
      orderBy: { date: 'asc' },
    });

    let totalExpenseToday = 0;
    let totalIncomeToday = 0;

    let totalExpenseWeek = 0;
    let totalIncomeWeek = 0;

    let totalExpenseMonth = 0;
    let totalIncomeMonth = 0;

    let totalExpenseLastMonth = 0;
    let totalIncomeLastMonth = 0;

    let allTimeExpense = 0;
    let allTimeIncome = 0;

    const expenseCategoryMap = new Map<string, { id: string; name: string; icon: string; color: string; amount: number; count: number }>();
    const incomeCategoryMap = new Map<string, { id: string; name: string; icon: string; color: string; amount: number; count: number }>();
    const dailyMap = new Map<string, { expense: number; income: number }>();
    const hashtagExpenseMap = new Map<string, number>();

    // Prepare monthly comparison buckets for the last 6 months
    const monthlyBuckets = new Map<string, { label: string; income: number; expense: number; net: number; sortKey: string }>();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleString('en-US', { month: 'short', year: '2-digit' });
      monthlyBuckets.set(key, { label, income: 0, expense: 0, net: 0, sortKey: key });
    }

    for (const tx of allTransactions) {
      const txDate = new Date(tx.date);
      const amount = Number(tx.amount);
      const isExpense = tx.type === 'expense';

      // All-time totals
      if (isExpense) {
        allTimeExpense += amount;
      } else {
        allTimeIncome += amount;
      }

      // Today
      if (txDate >= startOfToday && txDate <= endOfToday) {
        if (isExpense) totalExpenseToday += amount;
        else totalIncomeToday += amount;
      }

      // This Week
      if (txDate >= startOfWeek && txDate <= endOfToday) {
        if (isExpense) totalExpenseWeek += amount;
        else totalIncomeWeek += amount;
      }

      // This Month
      if (txDate >= startOfMonth && txDate <= endOfMonth) {
        if (isExpense) {
          totalExpenseMonth += amount;

          // Track category breakdown for expenses this month
          const catId = tx.category?.id || 'other-exp';
          const catName = tx.category?.name || 'Other Expense';
          const catIcon = tx.category?.icon || 'MoreHorizontal';
          const catColor = tx.category?.color || '#94A3B8';

          const existing = expenseCategoryMap.get(catId) || {
            id: catId,
            name: catName,
            icon: catIcon,
            color: catColor,
            amount: 0,
            count: 0,
          };
          existing.amount += amount;
          existing.count += 1;
          expenseCategoryMap.set(catId, existing);

          // Track hashtags for expenses this month
          try {
            const tags: string[] = JSON.parse(tx.hashtags);
            for (const t of tags) {
              hashtagExpenseMap.set(t, (hashtagExpenseMap.get(t) || 0) + amount);
            }
          } catch {
            // ignore parse err
          }
        } else {
          totalIncomeMonth += amount;

          // Track category breakdown for income this month
          const catId = tx.category?.id || 'other-inc';
          const catName = tx.category?.name || 'Other Income';
          const catIcon = tx.category?.icon || 'PlusCircle';
          const catColor = tx.category?.color || '#64748B';

          const existing = incomeCategoryMap.get(catId) || {
            id: catId,
            name: catName,
            icon: catIcon,
            color: catColor,
            amount: 0,
            count: 0,
          };
          existing.amount += amount;
          existing.count += 1;
          incomeCategoryMap.set(catId, existing);
        }

        // Daily trend for this month
        const dayKey = txDate.toISOString().slice(0, 10);
        const dayEntry = dailyMap.get(dayKey) || { expense: 0, income: 0 };
        if (isExpense) dayEntry.expense += amount;
        else dayEntry.income += amount;
        dailyMap.set(dayKey, dayEntry);
      }

      // Last Month
      if (txDate >= startOfLastMonth && txDate <= endOfLastMonth) {
        if (isExpense) totalExpenseLastMonth += amount;
        else totalIncomeLastMonth += amount;
      }

      // 6-month historical bucket
      const monthKey = `${txDate.getFullYear()}-${String(txDate.getMonth() + 1).padStart(2, '0')}`;
      if (monthlyBuckets.has(monthKey)) {
        const bucket = monthlyBuckets.get(monthKey)!;
        if (isExpense) {
          bucket.expense += amount;
        } else {
          bucket.income += amount;
        }
        bucket.net = bucket.income - bucket.expense;
      }
    }

    // Expense percentage delta vs last month
    let monthExpenseDeltaPercent = 0;
    if (totalExpenseLastMonth > 0) {
      monthExpenseDeltaPercent = Math.round(((totalExpenseMonth - totalExpenseLastMonth) / totalExpenseLastMonth) * 100);
    } else if (totalExpenseMonth > 0) {
      monthExpenseDeltaPercent = 100;
    }

    // Savings rate this month: ((income - expense) / income) * 100
    let savingsRate = 0;
    if (totalIncomeMonth > 0) {
      savingsRate = Math.round(((totalIncomeMonth - totalExpenseMonth) / totalIncomeMonth) * 100);
    }

    // Convert category maps to sorted arrays with percentages
    const expenseBreakdown = Array.from(expenseCategoryMap.values())
      .map((c) => ({
        ...c,
        amount: Math.round(c.amount * 100) / 100,
        percentage: totalExpenseMonth > 0 ? Math.round((c.amount / totalExpenseMonth) * 100) : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    const incomeBreakdown = Array.from(incomeCategoryMap.values())
      .map((c) => ({
        ...c,
        amount: Math.round(c.amount * 100) / 100,
        percentage: totalIncomeMonth > 0 ? Math.round((c.amount / totalIncomeMonth) * 100) : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    // Monthly comparison array
    const monthlyComparison = Array.from(monthlyBuckets.values()).map((b) => ({
      month: b.label,
      income: Math.round(b.income * 100) / 100,
      expense: Math.round(b.expense * 100) / 100,
      net: Math.round(b.net * 100) / 100,
    }));

    // Daily spending array sorted by date
    const dailySpending = Array.from(dailyMap.entries())
      .map(([date, val]) => ({
        date,
        expense: Math.round(val.expense * 100) / 100,
        income: Math.round(val.income * 100) / 100,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Top 5 hashtags by expense
    const topHashtags = Array.from(hashtagExpenseMap.entries())
      .map(([tag, amount]) => ({ tag, amount: Math.round(amount * 100) / 100 }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    // Current total balance = starting_balance + allTimeIncome - allTimeExpense
    const currentBalance = Math.round((startingBalance + allTimeIncome - allTimeExpense) * 100) / 100;

    res.json({
      summary: {
        currentBalance,
        startingBalance,
        today: {
          expense: Math.round(totalExpenseToday * 100) / 100,
          income: Math.round(totalIncomeToday * 100) / 100,
          net: Math.round((totalIncomeToday - totalExpenseToday) * 100) / 100,
        },
        thisWeek: {
          expense: Math.round(totalExpenseWeek * 100) / 100,
          income: Math.round(totalIncomeWeek * 100) / 100,
          net: Math.round((totalIncomeWeek - totalExpenseWeek) * 100) / 100,
        },
        thisMonth: {
          expense: Math.round(totalExpenseMonth * 100) / 100,
          income: Math.round(totalIncomeMonth * 100) / 100,
          net: Math.round((totalIncomeMonth - totalExpenseMonth) * 100) / 100,
        },
        lastMonth: {
          expense: Math.round(totalExpenseLastMonth * 100) / 100,
          income: Math.round(totalIncomeLastMonth * 100) / 100,
          net: Math.round((totalIncomeLastMonth - totalExpenseLastMonth) * 100) / 100,
        },
        monthExpenseDeltaPercent,
        savingsRate,
      },
      categoryBreakdown: {
        expenses: expenseBreakdown,
        income: incomeBreakdown,
      },
      monthlyComparison,
      dailySpending,
      topHashtags,
    });
  } catch (error) {
    console.error('Error computing analytics:', error);
    res.status(500).json({ error: 'Failed to compute analytics' });
  }
});

export default router;
