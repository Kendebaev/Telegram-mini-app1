import React from 'react';
import { ArrowRight, CreditCard, Banknote } from 'lucide-react';
import { useTransactionStore } from '../../stores/transactionStore';
import { useCategoryStore } from '../../stores/categoryStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { useUIStore } from '../../stores/uiStore';
import { useTelegram } from '../../context/TelegramContext';
import { CategoryIcon } from '../glass/CategoryIcon';
import { GlassCard } from '../glass/GlassCard';

function formatTransactionDate(dateStr: string): string {
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

  const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (isToday) return `Today, ${timeStr}`;
  if (isYesterday) return `Yesterday, ${timeStr}`;

  return `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${timeStr}`;
}

export const RecentTransactionsWidget: React.FC = () => {
  const { transactions } = useTransactionStore();
  const { getCategoryById } = useCategoryStore();
  const { formatAmount } = useSettingsStore();
  const { setActiveTab, setSelectedTransaction } = useUIStore();
  const { haptic } = useTelegram();

  const recentList = transactions.slice(0, 5);

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
          Recent Activity
        </h3>
        <button
          type="button"
          onClick={() => {
            haptic.selection();
            setActiveTab('history');
          }}
          className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 active:scale-95 transition-all"
        >
          <span>View All</span>
          <ArrowRight size={13} />
        </button>
      </div>

      {recentList.length === 0 ? (
        <GlassCard className="p-6 text-center text-slate-400">
          <p className="text-sm">No transactions yet.</p>
          <p className="text-xs text-slate-500 mt-1">Tap the '+' button below to record your first entry.</p>
        </GlassCard>
      ) : (
        <div className="space-y-2">
          {recentList.map((tx) => {
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
                {/* Left: Icon & Info */}
                <div className="flex items-center space-x-3 min-w-0">
                  <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm"
                    style={{
                      backgroundColor: `${cat?.color || '#818CF8'}25`,
                      color: cat?.color || '#818CF8',
                    }}
                  >
                    <CategoryIcon name={cat?.icon || 'HelpCircle'} size={19} color={cat?.color} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-white truncate">
                        {cat?.name || (isIncome ? 'Other Income' : 'Other Expense')}
                      </span>
                      {/* Payment Method badge */}
                      <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                        {tx.payment_method === 'Cash' ? <Banknote size={10} /> : <CreditCard size={10} />}
                        {tx.payment_method}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400 truncate flex items-center gap-1 mt-0.5">
                      <span>{formatTransactionDate(tx.date)}</span>
                      {tx.note && (
                        <>
                          <span>•</span>
                          <span className="text-slate-300 truncate">{tx.note}</span>
                        </>
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
      )}
    </div>
  );
};
