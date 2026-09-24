import React from 'react';
import { ArrowRight, CreditCard, Banknote } from 'lucide-react';
import { useTransactionStore } from '../../stores/transactionStore';
import { useCategoryStore } from '../../stores/categoryStore';
import { useSettingsStore, useTranslation } from '../../stores/settingsStore';
import { useUIStore } from '../../stores/uiStore';
import { useTelegram } from '../../context/TelegramContext';
import { CategoryIcon } from '../glass/CategoryIcon';
import { GlassCard } from '../glass/GlassCard';
import { getLocalizedCategoryName, type Language } from '../../utils/translations';

function formatTransactionDate(dateStr: string, lang: Language): string {
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

  const timeStr = date.toLocaleTimeString(lang === 'ru' ? 'ru-RU' : 'en-US', { hour: '2-digit', minute: '2-digit' });

  if (isToday) return lang === 'ru' ? `Сегодня, ${timeStr}` : `Today, ${timeStr}`;
  if (isYesterday) return lang === 'ru' ? `Вчера, ${timeStr}` : `Yesterday, ${timeStr}`;

  return `${date.toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-US', { month: 'short', day: 'numeric' })}, ${timeStr}`;
}

export const RecentTransactionsWidget: React.FC = () => {
  const { transactions } = useTransactionStore();
  const { getCategoryById } = useCategoryStore();
  const { formatAmount } = useSettingsStore();
  const { t, language } = useTranslation();
  const { setActiveTab, setSelectedTransaction } = useUIStore();
  const { haptic } = useTelegram();

  const recentList = transactions.slice(0, 5);

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
          {t('recent_activity')}
        </h3>
        <button
          type="button"
          onClick={() => {
            haptic.selection();
            setActiveTab('history');
          }}
          className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1 active:scale-95 transition-all"
        >
          <span>{t('view_all')}</span>
          <ArrowRight size={13} />
        </button>
      </div>

      {recentList.length === 0 ? (
        <GlassCard className="p-6 text-center text-slate-400 dark:text-zinc-500">
          <p className="text-sm font-medium text-slate-600 dark:text-zinc-300">{t('no_transactions_yet')}</p>
          <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1">{t('tap_to_record')}</p>
        </GlassCard>
      ) : (
        <div className="rounded-3xl overflow-hidden bg-white/80 dark:bg-zinc-900/60 backdrop-blur-xl border border-slate-200/80 dark:border-white/[0.08] shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)] divide-y divide-slate-100 dark:divide-white/[0.05] transition-colors duration-200">
          {recentList.map((tx) => {
            const cat = tx.category || getCategoryById(tx.category_id);
            const isIncome = tx.type === 'income';
            const rawCatName = cat?.name || (isIncome ? 'Other Income' : 'Other Expense');
            const localizedCatName = getLocalizedCategoryName(rawCatName, language);

            return (
              <div
                key={tx.id}
                onClick={() => {
                  haptic.selection();
                  setSelectedTransaction(tx);
                }}
                className="p-3.5 flex items-center justify-between cursor-pointer active:bg-slate-50 dark:active:bg-white/[0.04] transition-colors duration-150"
              >
                {/* Left: Icon & Info */}
                <div className="flex items-center space-x-3 min-w-0">
                  <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-2xs"
                    style={{
                      backgroundColor: `${cat?.color || '#818CF8'}18`,
                      color: cat?.color || '#818CF8',
                    }}
                  >
                    <CategoryIcon name={cat?.icon || 'HelpCircle'} size={18} color={cat?.color} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-1.5">
                      <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {localizedCatName}
                      </span>
                      {/* Payment Method micro-icon */}
                      <span className="text-slate-400 dark:text-zinc-500" title={tx.payment_method}>
                        {tx.payment_method === 'Cash' ? (
                          <Banknote size={12} className="stroke-[2.2]" />
                        ) : (
                          <CreditCard size={12} className="stroke-[2.2]" />
                        )}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400 dark:text-zinc-500 truncate flex items-center gap-1.5 mt-0.5">
                      <span>{formatTransactionDate(tx.date, language)}</span>
                      {tx.note && (
                        <>
                          <span>•</span>
                          <span className="text-slate-600 dark:text-zinc-300 truncate">{tx.note}</span>
                        </>
                      )}
                      {tx.hashtags && tx.hashtags.length > 0 && (
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 font-medium">
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
                      isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
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

export const RecentActivity = RecentTransactionsWidget;
