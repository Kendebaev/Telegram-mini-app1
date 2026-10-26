import type {
  Category,
  MonthlyComparisonItem,
  QuickTemplate,
  RecurringBill,
  Transaction,
  TransactionType,
} from '../types/models';

const DAY_MS = 86_400_000;

export function dayKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`;
}

export function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function startOfMonth(ref: Date): Date {
  return new Date(ref.getFullYear(), ref.getMonth(), 1);
}

export function endOfMonth(ref: Date): Date {
  return new Date(ref.getFullYear(), ref.getMonth() + 1, 0, 23, 59, 59, 999);
}

export function daysInMonth(ref: Date): number {
  return new Date(ref.getFullYear(), ref.getMonth() + 1, 0).getDate();
}

export function isSameMonth(iso: string | Date, ref: Date): boolean {
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth();
}

export function inMonth(iso: string, ref: Date): boolean {
  return isSameMonth(iso, ref);
}

export function addMonths(ref: Date, delta: number): Date {
  return new Date(ref.getFullYear(), ref.getMonth() + delta, 1);
}

export function formatMonthLabel(ref: Date, locale = 'en-US'): string {
  return ref.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
}

export function formatMonthShort(ref: Date, locale = 'en-US'): string {
  return ref.toLocaleDateString(locale, { month: 'short' });
}

export function formatDayLabel(iso: string | Date, locale = 'en-US'): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  return d.toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short' });
}

/* ---------------------------------- stats --------------------------------- */

export interface PeriodTotals {
  income: number;
  expense: number;
  net: number;
  savingsRate: number;
  count: number;
}

export function totalsOf(txns: Transaction[]): PeriodTotals {
  let income = 0;
  let expense = 0;
  for (const t of txns) {
    if (t.type === 'income') income += Number(t.amount) || 0;
    else expense += Number(t.amount) || 0;
  }
  const savingsRate = income > 0 ? ((income - expense) / income) * 100 : 0;
  return {
    income: round2(income),
    expense: round2(expense),
    net: round2(income - expense),
    savingsRate: Math.max(-999, Math.min(999, savingsRate)),
    count: txns.length,
  };
}

export function monthlyTotals(txns: Transaction[], ref: Date): PeriodTotals {
  return totalsOf(txns.filter((t) => inMonth(t.date, ref)));
}

export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function percentChange(current: number, previous: number): number | null {
  if (previous <= 0) return null;
  return ((current - previous) / previous) * 100;
}

export interface DailyPoint {
  date: string;
  day: number;
  expense: number;
  income: number;
}

export function dailySeries(txns: Transaction[], ref: Date): DailyPoint[] {
  const total = daysInMonth(ref);
  const points: DailyPoint[] = Array.from({ length: total }, (_, i) => ({
    date: dayKey(new Date(ref.getFullYear(), ref.getMonth(), i + 1)),
    day: i + 1,
    expense: 0,
    income: 0,
  }));

  for (const t of txns) {
    if (!inMonth(t.date, ref)) continue;
    const d = new Date(t.date);
    const point = points[d.getDate() - 1];
    if (!point) continue;
    if (t.type === 'income') point.income += Number(t.amount) || 0;
    else point.expense += Number(t.amount) || 0;
  }

  return points.map((p) => ({
    ...p,
    expense: round2(p.expense),
    income: round2(p.income),
  }));
}

export function monthlySeries(
  txns: Transaction[],
  count = 6,
  ref: Date = new Date(),
  locale = 'en-US',
): MonthlyComparisonItem[] {
  const result: MonthlyComparisonItem[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const month = addMonths(ref, -i);
    const totals = monthlyTotals(txns, month);
    result.push({
      month: formatMonthShort(month, locale),
      income: totals.income,
      expense: totals.expense,
      net: totals.net,
    });
  }
  return result;
}

export interface CategorySpend {
  id: string;
  name: string;
  icon: string;
  color: string;
  amount: number;
  count: number;
  share: number;
}

export function categoryBreakdown(
  txns: Transaction[],
  categories: Category[],
  ref: Date,
  type: TransactionType = 'expense',
): CategorySpend[] {
  const scoped = txns.filter((t) => t.type === type && inMonth(t.date, ref));
  const map = new Map<string, CategorySpend>();
  let total = 0;

  for (const t of scoped) {
    const meta = categories.find((c) => c.id === t.category_id);
    const key = meta?.id ?? 'uncategorized';
    const amount = Number(t.amount) || 0;
    total += amount;
    const existing = map.get(key);
    if (existing) {
      existing.amount += amount;
      existing.count += 1;
    } else {
      map.set(key, {
        id: key,
        name: meta?.name ?? 'Other',
        icon: meta?.icon ?? 'CircleDashed',
        color: meta?.color ?? '#94A3B8',
        amount,
        count: 1,
        share: 0,
      });
    }
  }

  return Array.from(map.values())
    .map((item) => ({
      ...item,
      amount: round2(item.amount),
      share: total > 0 ? (item.amount / total) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);
}

export function hashtagBreakdown(txns: Transaction[], ref: Date, type: TransactionType = 'expense') {
  const map = new Map<string, number>();
  for (const t of txns) {
    if (t.type !== type || !inMonth(t.date, ref)) continue;
    const amount = Number(t.amount) || 0;
    for (const tag of t.hashtags ?? []) {
      map.set(tag, (map.get(tag) ?? 0) + amount);
    }
  }
  return Array.from(map.entries())
    .map(([tag, amount]) => ({ tag, amount: round2(amount) }))
    .sort((a, b) => b.amount - a.amount);
}

/* --------------------------------- budgets -------------------------------- */

export interface BudgetSnapshot {
  budget: number;
  spent: number;
  remaining: number;
  progress: number;
  daysTotal: number;
  daysElapsed: number;
  daysLeft: number;
  dailyAllowance: number;
  perDaySafe: number;
  expected: number;
  projected: number;
  paceDelta: number;
  status: 'under' | 'on-track' | 'over';
}

export function budgetSnapshot(
  spent: number,
  budget: number,
  ref: Date = new Date(),
  now: Date = new Date(),
): BudgetSnapshot {
  const daysTotal = daysInMonth(ref);
  const isCurrent = monthKey(ref) === monthKey(now);
  const isPast = startOfMonth(ref) < startOfMonth(now);
  const daysElapsed = isCurrent ? Math.min(now.getDate(), daysTotal) : isPast ? daysTotal : 0;
  const daysLeft = Math.max(0, daysTotal - daysElapsed);
  const expected = budget > 0 ? (budget * daysElapsed) / daysTotal : 0;
  const projected = daysElapsed > 0 ? (spent / daysElapsed) * daysTotal : 0;
  const remaining = round2(budget - spent);
  const perDaySafe = daysLeft > 0 ? Math.max(0, remaining / daysLeft) : Math.max(0, remaining);

  let status: BudgetSnapshot['status'] = 'on-track';
  if (budget > 0) {
    if (spent > budget) status = 'over';
    else if (spent > expected * 1.06) status = 'over';
    else if (spent < expected * 0.92) status = 'under';
  }

  return {
    budget,
    spent: round2(spent),
    remaining,
    progress: budget > 0 ? spent / budget : 0,
    daysTotal,
    daysElapsed,
    daysLeft,
    dailyAllowance: daysTotal > 0 ? round2(budget / daysTotal) : 0,
    perDaySafe: round2(perDaySafe),
    expected: round2(expected),
    projected: round2(projected),
    paceDelta: round2(spent - expected),
    status,
  };
}

export function suggestedBudget(txns: Transaction[], now: Date = new Date()): number {
  const previous: number[] = [];
  for (let i = 1; i <= 3; i++) {
    const month = addMonths(now, -i);
    const totals = monthlyTotals(txns, month);
    if (totals.expense > 0) previous.push(totals.expense);
  }

  let base = 0;
  if (previous.length) {
    base = previous.reduce((a, b) => a + b, 0) / previous.length;
  } else {
    const current = monthlyTotals(txns, now);
    if (current.expense > 0) {
      const days = Math.max(now.getDate(), 1);
      base = (current.expense / days) * daysInMonth(now);
    }
  }

  if (base <= 0) return 0;
  const step = base > 1000 ? 50 : 10;
  return Math.ceil(base / step) * step;
}

/* --------------------------------- streaks -------------------------------- */

export interface StreakInfo {
  current: number;
  best: number;
}

export function spendingStreak(txns: Transaction[], now: Date = new Date()): StreakInfo {
  const keys = new Set(txns.map((t) => dayKey(new Date(t.date))));
  const cursor = startOfDay(now);

  if (!keys.has(dayKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }

  let current = 0;
  while (keys.has(dayKey(cursor))) {
    current += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  const sorted = Array.from(keys).sort();
  let best = 0;
  let run = 0;
  let prev: Date | null = null;
  for (const key of sorted) {
    const d = new Date(`${key}T12:00:00`);
    if (prev && Math.round((d.getTime() - prev.getTime()) / DAY_MS) === 1) run += 1;
    else run = 1;
    best = Math.max(best, run);
    prev = d;
  }

  return { current, best };
}

/* ------------------------------- calendar map ------------------------------ */

export interface HeatCell extends DailyPoint {
  level: number;
}

export function heatmapSeries(txns: Transaction[], ref: Date): HeatCell[] {
  const points = dailySeries(txns, ref);
  const max = points.reduce((m, p) => Math.max(m, p.expense), 0);
  return points.map((p) => ({
    ...p,
    level: p.expense <= 0 || max <= 0 ? 0 : Math.max(1, Math.ceil((p.expense / max) * 4)),
  }));
}

/* ------------------------------ recurring bills ---------------------------- */

export function billDueDate(bill: RecurringBill, now: Date = new Date()): Date {
  const today = startOfDay(now);
  const thisMonthDay = Math.min(bill.day, daysInMonth(now));
  let due = new Date(now.getFullYear(), now.getMonth(), thisMonthDay);
  if (due < today) {
    const next = addMonths(now, 1);
    due = new Date(next.getFullYear(), next.getMonth(), Math.min(bill.day, daysInMonth(next)));
  }
  return due;
}

export function daysUntil(date: Date, now: Date = new Date()): number {
  return Math.round((startOfDay(date).getTime() - startOfDay(now).getTime()) / DAY_MS);
}

export function billPaidThisMonth(bill: RecurringBill, now: Date = new Date()): boolean {
  return bill.last_paid === monthKey(now);
}

export interface UpcomingBill {
  bill: RecurringBill;
  due: Date;
  daysLeft: number;
  paid: boolean;
}

export function upcomingBills(bills: RecurringBill[], now: Date = new Date()): UpcomingBill[] {
  return bills
    .map((bill) => {
      const due = billDueDate(bill, now);
      return { bill, due, daysLeft: daysUntil(due, now), paid: billPaidThisMonth(bill, now) };
    })
    .sort((a, b) => {
      if (a.paid !== b.paid) return a.paid ? 1 : -1;
      return a.daysLeft - b.daysLeft;
    });
}

export function monthlyBillsTotal(bills: RecurringBill[]): number {
  return round2(bills.reduce((sum, b) => sum + Number(b.amount || 0), 0));
}

/* -------------------------------- templates ------------------------------- */

export function recentTemplates(txns: Transaction[], limit = 6): QuickTemplate[] {
  const sorted = [...txns].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
  const seen = new Set<string>();
  const templates: QuickTemplate[] = [];

  for (const t of sorted) {
    const key = `${t.type}|${t.category_id ?? ''}|${t.amount}|${(t.note ?? '').slice(0, 24)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    templates.push({
      id: t.id,
      type: t.type,
      amount: Number(t.amount) || 0,
      category_id: t.category_id ?? null,
      note: t.note ?? '',
      hashtags: t.hashtags ?? [],
      payment_method: t.payment_method,
    });
    if (templates.length >= limit) break;
  }

  return templates;
}

/* --------------------------------- history -------------------------------- */

export interface DayGroup {
  key: string;
  date: Date;
  items: Transaction[];
  expense: number;
  income: number;
  net: number;
}

export function groupByDay(txns: Transaction[]): DayGroup[] {
  const map = new Map<string, DayGroup>();

  for (const t of txns) {
    const key = dayKey(new Date(t.date));
    const existing = map.get(key);
    if (existing) {
      existing.items.push(t);
      if (t.type === 'expense') existing.expense += Number(t.amount) || 0;
      else existing.income += Number(t.amount) || 0;
    } else {
      map.set(key, {
        key,
        date: startOfDay(new Date(t.date)),
        items: [t],
        expense: t.type === 'expense' ? Number(t.amount) || 0 : 0,
        income: t.type === 'income' ? Number(t.amount) || 0 : 0,
        net: 0,
      });
    }
  }

  return Array.from(map.values())
    .map((g) => ({
      ...g,
      expense: round2(g.expense),
      income: round2(g.income),
      net: round2(g.income - g.expense),
      items: g.items.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      ),
    }))
    .sort((a, b) => b.date.getTime() - a.date.getTime());
}

/* --------------------------------- insights ------------------------------- */

export type InsightCode =
  | 'top-category'
  | 'month-delta'
  | 'savings-rate'
  | 'budget-pace'
  | 'streak'
  | 'biggest-day';

export interface Insight {
  id: string;
  code: InsightCode;
  tone: 'good' | 'warn' | 'neutral';
  amount?: number;
  percent?: number;
  delta?: number;
  days?: number;
  day?: number;
  category_id?: string;
}

export function buildInsights(args: {
  txns: Transaction[];
  categories: Category[];
  budget: number;
  ref?: Date;
  now?: Date;
}): Insight[] {
  const { txns, categories, budget } = args;
  const ref = args.ref ?? new Date();
  const now = args.now ?? new Date();
  const insights: Insight[] = [];

  const totals = monthlyTotals(txns, ref);
  const breakdown = categoryBreakdown(txns, categories, ref, 'expense');
  const top = breakdown[0];
  if (top && top.amount > 0) {
    insights.push({
      id: 'top-category',
      code: 'top-category',
      tone: 'neutral',
      amount: top.amount,
      percent: top.share,
      category_id: top.id,
    });
  }

  const prev = monthlyTotals(txns, addMonths(ref, -1));
  const delta = percentChange(totals.expense, prev.expense);
  if (delta !== null) {
    insights.push({
      id: 'month-delta',
      code: 'month-delta',
      tone: delta <= 0 ? 'good' : 'warn',
      percent: Math.abs(delta),
      delta,
      amount: totals.expense,
    });
  }

  if (totals.income > 0) {
    insights.push({
      id: 'savings-rate',
      code: 'savings-rate',
      tone: totals.savingsRate >= 20 ? 'good' : totals.savingsRate >= 10 ? 'neutral' : 'warn',
      percent: Math.max(0, totals.savingsRate),
      amount: Math.max(0, totals.net),
    });
  }

  if (budget > 0) {
    const snap = budgetSnapshot(totals.expense, budget, ref, now);
    insights.push({
      id: 'budget-pace',
      code: 'budget-pace',
      tone: snap.status === 'over' ? 'warn' : snap.status === 'under' ? 'good' : 'neutral',
      amount: Math.abs(snap.paceDelta),
      delta: snap.paceDelta,
      percent: Math.min(999, snap.progress * 100),
    });
  }

  const streak = spendingStreak(txns, now);
  if (streak.current >= 2) {
    insights.push({ id: 'streak', code: 'streak', tone: 'good', days: streak.current });
  }

  const daily = dailySeries(txns, ref);
  const biggest = daily.reduce((max, p) => (p.expense > max.expense ? p : max), daily[0]);
  if (biggest && biggest.expense > 0) {
    insights.push({
      id: 'biggest-day',
      code: 'biggest-day',
      tone: 'neutral',
      amount: biggest.expense,
      day: biggest.day,
    });
  }

  const priority: Record<InsightCode, number> = {
    'budget-pace': 0,
    'month-delta': 1,
    'top-category': 2,
    'savings-rate': 3,
    streak: 4,
    'biggest-day': 5,
  };

  return insights.sort((a, b) => priority[a.code] - priority[b.code]).slice(0, 4);
}
