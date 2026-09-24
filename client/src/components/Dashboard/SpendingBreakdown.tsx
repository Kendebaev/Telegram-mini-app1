import React from 'react';
import { useTransactionStore } from '../../stores/transactionStore';
import { useCategoryStore } from '../../stores/categoryStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { CategoryIcon } from '../glass/CategoryIcon';
import { GlassCard } from '../glass/GlassCard';

export const SpendingBreakdown: React.FC = () => {
  const { transactions } = useTransactionStore();
  const { getCategoryById } = useCategoryStore();
  const { formatAmount } = useSettingsStore();

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Group current month expenses by category
  const monthExpenses = transactions.filter(
    (t) => t.type === 'expense' && new Date(t.date) >= startOfMonth
  );

  const totalExpense = monthExpenses.reduce((sum, t) => sum + Number(t.amount), 0);

  const categoryMap = new Map<string, { id: string; amount: number }>();
  monthExpenses.forEach((tx) => {
    const catId = tx.category_id || 'other';
    const curr = categoryMap.get(catId) || { id: catId, amount: 0 };
    curr.amount += Number(tx.amount);
    categoryMap.set(catId, curr);
  });

  const sortedCategories = Array.from(categoryMap.values())
    .map((item) => {
      const cat = getCategoryById(item.id);
      return {
        id: item.id,
        name: cat?.name || 'Other',
        icon: cat?.icon || 'MoreHorizontal',
        color: cat?.color || '#94A3B8',
        amount: item.amount,
        percentage: totalExpense > 0 ? Math.round((item.amount / totalExpense) * 100) : 0,
      };
    })
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  if (sortedCategories.length === 0) {
    return null;
  }

  return (
    <GlassCard className="p-5 rounded-3xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
          Spending Breakdown
        </h3>
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border border-slate-200/60 dark:border-white/[0.06]">
          This Month
        </span>
      </div>

      {/* Category Rows */}
      <div className="space-y-3.5 pt-0.5">
        {sortedCategories.map((item) => (
          <div key={item.id} className="space-y-2">
            <div className="flex items-center justify-between">
              {/* Category Icon squircle + Title */}
              <div className="flex items-center space-x-2.5 min-w-0">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform active:scale-95"
                  style={{
                    backgroundColor: `${item.color}18`,
                    color: item.color,
                  }}
                >
                  <CategoryIcon name={item.icon} size={16} color={item.color} />
                </div>
                <span className="text-sm font-medium text-slate-800 dark:text-zinc-200 truncate">
                  {item.name}
                </span>
              </div>

              {/* Amount & Percentage */}
              <div className="flex items-center space-x-2 flex-shrink-0 pl-2">
                <span className="text-sm font-bold tabular-nums text-slate-900 dark:text-white">
                  {formatAmount(item.amount)}
                </span>
                <span className="text-xs font-semibold tabular-nums text-slate-400 dark:text-zinc-500 w-9 text-right">
                  {item.percentage}%
                </span>
              </div>
            </div>

            {/* High-Definition Ultra-Slim Progress Bar */}
            <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(item.percentage, 100)}%`,
                  background: `linear-gradient(90deg, ${item.color}CC, ${item.color})`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
};
