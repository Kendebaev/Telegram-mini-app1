import React from 'react';
import { SearchX, CreditCard, Banknote } from 'lucide-react';
import { useTransactionStore } from '../../stores/transactionStore';
import { useCategoryStore } from '../../stores/categoryStore';
import { useSettingsStore, useTranslation } from '../../stores/settingsStore';
import { useUIStore } from '../../stores/uiStore';
import { useTelegram } from '../../context/TelegramContext';
import { CategoryIcon } from '../glass/CategoryIcon';
import { GlassCard } from '../glass/GlassCard';
import { getLocalizedCategoryName, type Language } from '../../utils/translations';
import type { Transaction } from '../../types/models';

function formatDateGroup(dateStr: string, lang: Language): string {
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

  if (isToday) return lang === 'ru' ? 'СЕГОДНЯ' : 'TODAY';
  if (isYesterday) return lang === 'ru' ? 'ВЧЕРА' : 'YESTERDAY';

  return date
    .toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-US', {
      month: 'short',
      day: 'numeric',
    })
    .toUpperCase();
}

function formatTime(dateStr: string, lang: Language): string {
  return new Date(dateStr).toLocaleTimeString(lang === 'ru' ? 'ru-RU' : 'en-US', { hour: '2-digit', minute: '2-digit' });
}

export const TransactionFeed: React.FC = () => {
  const { getFilteredTransactions } = useTransactionStore();
  const { getCategoryById } = useCategoryStore();
  const { formatAmount } = useSettingsStore();
  const { t, language } = useTranslation();
  const { filters, setSelectedTransaction, resetFilters } = useUIStore();
  const { haptic } = useTelegram();

  const transactions = getFilteredTransactions(filters);

  if (transactions.length === 0) {
    return (
      <GlassCard className="p-8 text-center my-4 space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto border border-indigo-200/60 dark:border-indigo-500/20">
          <SearchX size={24} />
        </div>
        <div>
          <h4 className="font-bold text-sm text-slate-900 dark:text-white">{t('no_tx_found')}</h4>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 max-w-xs mx-auto">
            {t('no_tx_found_sub')}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            haptic.impact('light');
            resetFilters();
          }}
          className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.08] dark:hover:bg-white/[0.12] text-xs font-semibold text-slate-800 dark:text-white active:scale-95 transition-all"
        >
          {t('reset_all_filters')}
        </button>
      </GlassCard>
    );
  }

  // Group by date
  const grouped: Record<string, Transaction[]> = {};
  transactions.forEach((tx) => {
    const key = formatDateGroup(tx.date, language);
    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(tx);
  });

  return (
    <div className="space-y-4 pb-24">
      {Object.entries(grouped).map(([dateGroup, items]) => {
        // Calculate day net total
        const dayNet = items.reduce((sum, item) => {
          return item.type === 'income' ? sum + Number(item.amount) : sum - Number(item.amount);
        }, 0);

        return (
          <div key={dateGroup} className="space-y-1.5">
            {/* Date Group Header */}
            <div className="flex items-center justify-between px-2 text-[11px]">
              <span className="font-bold tracking-wider text-slate-500 dark:text-zinc-400">
                {dateGroup}
              </span>
              <span
                className={`font-semibold tabular-nums ${
                  dayNet >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-zinc-400'
                }`}
              >
                {t('net_day')}: {dayNet >= 0 ? '+' : ''}
                {formatAmount(dayNet)}
              </span>
            </div>

            {/* Sleek Grouped List Container with subtle dividers */}
            <div className="rounded-3xl overflow-hidden bg-white/80 dark:bg-zinc-900/60 backdrop-blur-xl border border-slate-200/80 dark:border-white/[0.08] shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)] divide-y divide-slate-100 dark:divide-white/[0.05] transition-colors duration-200">
              {items.map((tx) => {
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
                    {/* Left: Category Icon & Metadata */}
                    <div className="flex items-center space-x-3 min-w-0 pr-2">
                      <div
                        className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-2xs"
                        style={{
                          backgroundColor: `${cat?.color || '#818CF8'}18`,
                          color: cat?.color || '#818CF8',
                        }}
                      >
                        <CategoryIcon
                          name={cat?.icon || (isIncome ? 'PlusCircle' : 'MoreHorizontal')}
                          size={19}
                          color={cat?.color}
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-1.5">
                          <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {localizedCatName}
                          </span>
                          {/* Payment method micro-icon */}
                          <span className="text-slate-400 dark:text-zinc-500" title={tx.payment_method}>
                            {tx.payment_method === 'Cash' ? (
                              <Banknote size={12} className="stroke-[2.2]" />
                            ) : (
                              <CreditCard size={12} className="stroke-[2.2]" />
                            )}
                          </span>
                        </div>

                        {/* Timestamp, Note & Hashtags */}
                        <div className="text-[11px] text-slate-400 dark:text-zinc-500 truncate mt-0.5 flex items-center gap-1.5">
                          <span>{formatTime(tx.date, language)}</span>
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
          </div>
        );
      })}
    </div>
  );
};
