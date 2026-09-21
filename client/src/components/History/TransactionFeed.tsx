import React from 'react';
import { SearchX, CreditCard, Banknote } from 'lucide-react';
import { useTransactionStore } from '../../stores/transactionStore';
import { useCategoryStore } from '../../stores/categoryStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { useUIStore } from '../../stores/uiStore';
import { useTelegram } from '../../context/TelegramContext';
import { CategoryIcon } from '../glass/CategoryIcon';
import { GlassCard } from '../glass/GlassCard';
import type { Transaction } from '../../types/models';

function formatDateGroup(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();

  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  if (isToday) return 'Today';
  if (isYesterday) return 'Yesterday';

  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export const TransactionFeed: React.FC = () => {
  const { getFilteredTransactions } = useTransactionStore();
  const { getCategoryById } = useCategoryStore();
  const { formatAmount } = useSettingsStore();
  const { filters, setSelectedTransaction, resetFilters } = useUIStore();
  const { haptic } = useTelegram();

  const transactions = getFilteredTransactions(filters);

  if (transactions.length === 0) {
    return (
      <GlassCard className="p-8 text-center my-4 space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto border border-indigo-500/20">
          <SearchX size={24} />
        </div>
        <div>
          <h4 className="font-bold text-sm text-white">No Transactions Found</h4>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
            Try adjusting your search terms, date range, or category filters.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            haptic.impact('light');
            resetFilters();
          }}
          className="px-4 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] text-xs font-semibold text-white active:scale-95 transition-all"
        >
          Reset All Filters
        </button>
      </GlassCard>
    );
  }

  // Group by date
  const grouped: Record<string, Transaction[]> = {};
  transactions.forEach((tx) => {
    const key = formatDateGroup(tx.date);
    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(tx);
  });

  return (
    <div className="space-y-4 pb-20">
      {Object.entries(grouped).map(([dateGroup, items]) => {
        // Calculate day net total
        const dayNet = items.reduce((sum, item) => {
          return item.type === 'income' ? sum + Number(item.amount) : sum - Number(item.amount);
        }, 0);

        return (
          <div key={dateGroup} className="space-y-2">
            {/* Date Group Header */}
            <div className="flex items-center justify-between px-2 text-xs">
              <span className="font-bold uppercase tracking-wider text-slate-400">
                {dateGroup}
              </span>
              <span
                className={`font-semibold tabular-nums ${
                  dayNet >= 0 ? 'text-emerald-400' : 'text-slate-400'
                }`}
              >
                Net: {dayNet >= 0 ? '+' : ''}
                {formatAmount(dayNet)}
              </span>
            </div>

            {/* Transactions Card List */}
            <div className="space-y-1.5">
              {items.map((tx) => {
                const cat = tx.category || getCategoryById(tx.category_id);
                const isIncome = tx.type === 'income';

                return (
                  <div
                    key={tx.id}
                    onClick={() => {
                      haptic.selection();
                      setSelectedTransaction(tx);
                    }}
                    className="glass-card p-3 rounded-2.5xl flex items-center justify-between cursor-pointer active:scale-[0.985] transition-all hover:border-white/20"
                  >
                    {/* Left: Category Icon & Metadata */}
                    <div className="flex items-center space-x-3 min-w-0 pr-2">
                      <div
                        className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm"
                        style={{
                          backgroundColor: `${cat?.color || '#818CF8'}25`,
                          color: cat?.color || '#818CF8',
                        }}
                      >
                        <CategoryIcon
                          name={cat?.icon || (isIncome ? 'PlusCircle' : 'MoreHorizontal')}
                          size={20}
                          color={cat?.color}
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold text-white truncate">
                            {cat?.name || (isIncome ? 'Other Income' : 'Other Expense')}
                          </span>
                          <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                            {tx.payment_method === 'Cash' ? (
                              <Banknote size={10} />
                            ) : (
                              <CreditCard size={10} />
                            )}
                            {tx.payment_method}
                          </span>
                        </div>

                        {/* Note & Tags */}
                        <div className="text-[11px] text-slate-400 truncate mt-0.5 flex items-center gap-1.5">
                          <span>{formatTime(tx.date)}</span>
                          {tx.note && (
                            <>
                              <span>•</span>
                              <span className="text-slate-300 truncate">{tx.note}</span>
                            </>
                          )}
                          {tx.hashtags && tx.hashtags.length > 0 && (
                            <span className="text-indigo-400 font-mono text-[10px]">
                              #{tx.hashtags[0]}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Amount */}
                    <div className="text-right flex-shrink-0 pl-3">
                      <span
                        className={`text-sm font-extrabold tabular-nums tracking-tight ${
                          isIncome ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {isIncome ? '+' : '-'}
                        {formatAmount(tx.amount)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};
