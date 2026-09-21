import React from 'react';
import { useTransactionStore } from '../../stores/transactionStore';
import { useCategoryStore } from '../../stores/categoryStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { CategoryIcon } from '../glass/CategoryIcon';
import { GlassCard } from '../glass/GlassCard';

export const CategoryDistributionBars: React.FC = () => {
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
    <GlassCard className="p-4 rounded-3xl space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
          Spending Breakdown
        </h3>
        <span className="text-[11px] font-semibold text-slate-400">This Month</span>
      </div>

      <div className="space-y-3 pt-1">
        {sortedCategories.map((item) => (
          <div key={item.id} className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                <div
                  className="w-6 h-6 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${item.color}25`, color: item.color }}
                >
                  <CategoryIcon name={item.icon} size={13} color={item.color} />
                </div>
                <span className="font-semibold text-slate-200">{item.name}</span>
              </div>

              <div className="flex items-center space-x-2">
                <span className="font-bold text-white tabular-nums">
                  {formatAmount(item.amount)}
                </span>
                <span className="text-[11px] text-slate-400 w-8 text-right font-medium">
                  {item.percentage}%
                </span>
              </div>
            </div>

            {/* Visual Bar */}
            <div className="h-1.5 w-full bg-white/[0.06] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${item.percentage}%`,
                  backgroundColor: item.color,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
};
