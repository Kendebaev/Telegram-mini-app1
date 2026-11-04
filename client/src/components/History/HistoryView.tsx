import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Banknote,
  CalendarDays,
  CreditCard,
  Filter,
  Plus,
  RotateCcw,
  Search,
  SearchX,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { useTransactionStore } from '../../stores/transactionStore';
import { useCategoryStore } from '../../stores/categoryStore';
import { useSettingsStore, useTranslation } from '../../stores/settingsStore';
import { useUIStore } from '../../stores/uiStore';
import { useTelegram } from '../../context/TelegramContext';
import { Chip } from '../ui/Chip';
import { EmptyState } from '../ui/EmptyState';
import { IconTile } from '../ui/IconTile';
import { Segmented } from '../ui/Segmented';
import { Surface } from '../ui/Surface';
import { dayKey, groupByDay, totalsOf } from '../../utils/finance';
import { formatCategoryCount, formatTransactionCount, getLocalizedCategoryName } from '../../utils/translations';
import type { FilterState, Transaction } from '../../types/models';

export const HistoryView: React.FC = () => {
  const { t, language } = useTranslation();
  const { haptic } = useTelegram();
  const { formatAmount } = useSettingsStore();

  const transactions = useTransactionStore((s) => s.transactions);
  const isLoading = useTransactionStore((s) => s.isLoading);
  const getFilteredTransactions = useTransactionStore((s) => s.getFilteredTransactions);

  const categories = useCategoryStore((s) => s.categories);
  const getCategoryById = useCategoryStore((s) => s.getCategoryById);
  const getCategoriesByType = useCategoryStore((s) => s.getCategoriesByType);

  const filters = useUIStore((s) => s.filters);
  const setFilterType = useUIStore((s) => s.setFilterType);
  const setFilterCategory = useUIStore((s) => s.setFilterCategory);
  const setFilterPeriod = useUIStore((s) => s.setFilterPeriod);
  const setFilterSearch = useUIStore((s) => s.setFilterSearch);
  const setFilterPaymentMethod = useUIStore((s) => s.setFilterPaymentMethod);
  const setFilterDateRange = useUIStore((s) => s.setFilterDateRange);
  const resetFilters = useUIStore((s) => s.resetFilters);
  const setSelectedTransaction = useUIStore((s) => s.setSelectedTransaction);
  const openAddTransaction = useUIStore((s) => s.openAddTransaction);

  const [showFilters, setShowFilters] = useState(false);

  const list = useMemo(
    () => getFilteredTransactions(filters),
    // transactions is included so the memo refreshes when the store changes
    [getFilteredTransactions, filters, transactions],
  );
  const totals = useMemo(() => totalsOf(list), [list]);
  const groups = useMemo(() => groupByDay(list), [list]);

  const locale = language === 'ru' ? 'ru-RU' : 'en-US';
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const todayKey = dayKey(now);
  const yesterdayKey = dayKey(yesterday);

  const dayTitle = (date: Date) => {
    const key = dayKey(date);
    if (key === todayKey) return t('today');
    if (key === yesterdayKey) return t('yesterday');
    return date.toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short' });
  };

  const timeLabel = (iso: string) =>
    new Date(iso).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });

  const periods: Array<{ id: FilterState['period']; label: string }> = [
    { id: 'today', label: t('day') },
    { id: 'week', label: t('week') },
    { id: 'month', label: t('month') },
    { id: 'all', label: t('all_time') },
  ];

  const customActive = Boolean(filters.startDate || filters.endDate);
  const advancedActive = filters.paymentMethod !== 'all' || customActive;
  const categoryOptions = filters.type === 'all' ? [] : getCategoriesByType(filters.type);

  const handleReset = () => {
    haptic.impact('light');
    resetFilters();
    setShowFilters(false);
  };

  const openDetail = (tx: Transaction) => {
    haptic.selection();
    setSelectedTransaction(tx);
  };

  return (
    <div className="space-y-4 pb-2">
      {/* Title */}
      <div className="flex items-end justify-between gap-3 px-1">
        <div className="min-w-0">
          <div className="eyebrow">{t('activity')}</div>
          <h1 className="mt-1 font-display text-[26px] font-semibold leading-none tracking-tight text-ink">
            {t('all_activity')}
          </h1>
          <p className="mt-1.5 text-[11px] font-medium text-muted">
            {formatTransactionCount(totals.count, language)}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            haptic.impact('light');
            openAddTransaction();
          }}
          aria-label={t('new_entry')}
          className="pressable flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-accent-2 text-white shadow-glow"
        >
          <Plus size={19} />
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search
          size={15}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-faint"
        />
        <input
          type="text"
          value={filters.search}
          onChange={(event) => setFilterSearch(event.target.value)}
          placeholder={t('search_entries')}
          className="h-11 w-full rounded-2xl border border-line bg-panel pl-10 pr-10 text-xs font-medium text-ink placeholder:text-faint outline-none transition focus:border-accent focus:ring-2 focus:ring-accent-soft"
        />
        {filters.search && (
          <button
            type="button"
            onClick={() => {
              haptic.impact('light');
              setFilterSearch('');
            }}
            aria-label={t('clear')}
            className="pressable absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-panel-inset text-muted"
          >
            <X size={13} />
          </button>
        )}
      </div>

      {/* Type + category */}
      <div className="space-y-2.5">
        <Segmented
          value={filters.type}
          onChange={(value) => {
            haptic.selection();
            setFilterType(value);
          }}
          options={[
            { value: 'all', label: t('all') },
            { value: 'expense', label: t('expenses'), icon: <ArrowUpRight size={13} /> },
            { value: 'income', label: t('income'), icon: <ArrowDownLeft size={13} /> },
          ]}
          size="sm"
          ariaLabel={t('filter_type')}
        />

        {filters.type === 'all' ? (
          <motion.div
            key="notice"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-1.5 rounded-full border border-line bg-panel-inset px-3 py-2 text-[10px] font-medium text-muted"
          >
            <SlidersHorizontal size={12} className="shrink-0 text-faint" />
            <span>{t('category_filter_notice')}</span>
          </motion.div>
        ) : (
          <motion.div
            key={`cats-${filters.type}`}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1 py-0.5"
          >
              <Chip
                size="sm"
                active={filters.categoryId === 'all'}
                onClick={() => {
                  haptic.selection();
                  setFilterCategory('all');
                }}
              >
                {t('all_categories')}
              </Chip>
              {filters.categoryId === 'uncategorized' && <Chip size="sm" active onClick={() => setFilterCategory('uncategorized')}>{t('other')}</Chip>}
              {categoryOptions.map((cat) => (
                <Chip
                  key={cat.id}
                  size="sm"
                  active={filters.categoryId === cat.id}
                  accent={cat.color}
                  icon={
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: cat.color }}
                    />
                  }
                  onClick={() => {
                    haptic.selection();
                    setFilterCategory(cat.id);
                  }}
                  className="whitespace-nowrap"
                >
                  {getLocalizedCategoryName(cat.name, language)}
                </Chip>
              ))}
            </motion.div>
          )}
      </div>

      {/* Period + advanced filters */}
      <div className="flex items-center gap-2">
        <div className="no-scrollbar flex flex-1 items-center gap-1.5 overflow-x-auto py-0.5">
          {periods.map((period) => (
            <Chip
              key={period.id}
              size="sm"
              active={filters.period === period.id && !customActive}
              onClick={() => {
                haptic.selection();
                setFilterPeriod(period.id);
              }}
            >
              {period.label}
            </Chip>
          ))}
          <Chip
            size="sm"
            active={customActive}
            icon={<CalendarDays size={11} />}
            onClick={() => {
              haptic.selection();
              setShowFilters(true);
            }}
          >
            {customActive ? t('custom_range') : t('custom')}
          </Chip>
        </div>

        <button
          type="button"
          onClick={() => {
            haptic.selection();
            setShowFilters((open) => !open);
          }}
          aria-label={t('filters')}
          className={`pressable relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-colors ${
            showFilters || advancedActive
              ? 'border-transparent bg-accent text-white'
              : 'border-line bg-panel-inset text-muted'
          }`}
        >
          <Filter size={15} />
          {advancedActive && !showFilters && (
            <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-gold" />
          )}
        </button>
      </div>

      <AnimatePresence initial={false}>
        {customActive && <p className="flex items-center gap-2 px-1 text-xs text-muted"><CalendarDays size={13} />{filters.startDate} — {filters.endDate}</p>}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <Surface tone="inset" className="space-y-3 p-3">
              <div className="flex items-center justify-between">
                <span className="eyebrow flex items-center gap-1.5">
                  <Filter size={11} />
                  {t('filters')}
                </span>
                <button
                  type="button"
                  onClick={handleReset}
                  className="flex items-center gap-1 text-[10px] font-bold text-accent"
                >
                  <RotateCcw size={11} />
                  {t('clear_filters')}
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <span className="mr-0.5 text-[10px] font-semibold text-faint">
                  {t('filter_payment')}
                </span>
                <Chip
                  size="sm"
                  active={filters.paymentMethod === 'all'}
                  onClick={() => {
                    haptic.selection();
                    setFilterPaymentMethod('all');
                  }}
                >
                  {t('all')}
                </Chip>
                <Chip
                  size="sm"
                  active={filters.paymentMethod === 'Card'}
                  icon={<CreditCard size={11} />}
                  onClick={() => {
                    haptic.selection();
                    setFilterPaymentMethod('Card');
                  }}
                >
                  {t('card')}
                </Chip>
                <Chip
                  size="sm"
                  active={filters.paymentMethod === 'Cash'}
                  icon={<Banknote size={11} />}
                  onClick={() => {
                    haptic.selection();
                    setFilterPaymentMethod('Cash');
                  }}
                >
                  {t('cash')}
                </Chip>
              </div>

              <div>
                <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold text-faint">
                  <CalendarDays size={11} />
                  {t('select_date_range')}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <label className="block">
                    <span className="mb-1 block text-[9px] font-semibold uppercase tracking-wider text-faint">
                      {t('start_date')}
                    </span>
                    <input
                      type="date"
                      value={filters.startDate || ''}
                      onChange={(event) =>
                        setFilterDateRange(event.target.value || undefined, filters.endDate)
                      }
                      className="w-full rounded-xl border border-line bg-panel-solid px-2.5 py-1.5 text-[11px] font-medium text-ink outline-none focus:border-accent"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-[9px] font-semibold uppercase tracking-wider text-faint">
                      {t('end_date')}
                    </span>
                    <input
                      type="date"
                      value={filters.endDate || ''}
                      onChange={(event) =>
                        setFilterDateRange(filters.startDate, event.target.value || undefined)
                      }
                      className="w-full rounded-xl border border-line bg-panel-solid px-2.5 py-1.5 text-[11px] font-medium text-ink outline-none focus:border-accent"
                    />
                  </label>
                </div>
              </div>
            </Surface>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Summary strip */}
      <Surface tone="inset" padded={false} className="grid grid-cols-3 divide-x divide-line overflow-hidden">
        <div className="px-3 py-2.5">
          <div className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-faint">
            <ArrowDownLeft size={10} className="text-mint" />
            {t('income')}
          </div>
          <div className="mt-1 truncate font-num text-[12px] font-semibold text-mint">
            {formatAmount(totals.income, true)}
          </div>
        </div>
        <div className="px-3 py-2.5">
          <div className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-faint">
            <ArrowUpRight size={10} className="text-coral" />
            {t('expenses')}
          </div>
          <div className="mt-1 truncate font-num text-[12px] font-semibold text-coral">
            {formatAmount(totals.expense)}
          </div>
        </div>
        <div className="px-3 py-2.5">
          <div className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-faint">
            <SlidersHorizontal size={10} className="text-accent" />
            {t('net_day')}
          </div>
          <div
            className={`mt-1 truncate font-num text-[12px] font-semibold ${
              totals.net >= 0 ? 'text-ink' : 'text-coral'
            }`}
          >
            {formatAmount(totals.net, true)}
          </div>
        </div>
      </Surface>

      {/* Feed */}
      {isLoading && transactions.length === 0 ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-[70px] animate-pulse rounded-3xl border border-line bg-panel"
              style={{ animationDelay: `${i * 90}ms` }}
            />
          ))}
        </div>
      ) : list.length === 0 ? (
        <Surface className="mt-1">
          <EmptyState
            icon={<SearchX size={22} />}
            title={t('no_tx_found')}
            body={t('no_tx_found_sub')}
            actionLabel={t('reset_all_filters')}
            onAction={handleReset}
          />
        </Surface>
      ) : (
        <div className="space-y-5">
          {groups.map((group, groupIndex) => (
            <motion.section
              key={group.key}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.26,
                ease: [0.16, 1, 0.3, 1],
                delay: Math.min(groupIndex * 0.04, 0.2),
              }}
              className="space-y-2"
            >
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold tracking-wide text-ink">
                    {dayTitle(group.date)}
                  </span>
                  <span className="rounded-full bg-panel-inset px-1.5 py-0.5 text-[9px] font-bold text-faint">
                    {group.items.length}
                  </span>
                </div>
                <span
                  className={`font-num text-[11px] font-semibold ${
                    group.net >= 0 ? 'text-mint' : 'text-muted'
                  }`}
                >
                  {formatAmount(group.net, true)}
                </span>
              </div>

              <Surface
                padded={false}
                className="overflow-hidden divide-y divide-line"
              >
                {group.items.map((tx) => {
                  const isIncome = tx.type === 'income';
                  const cat = tx.category || getCategoryById(tx.category_id);
                  const catName = getLocalizedCategoryName(
                    cat?.name || (isIncome ? 'Other Income' : 'Other Expense'),
                    language,
                  );
                  const firstTag = tx.hashtags?.[0];
                  const noteText = tx.note
                    ?.replace(/#[^\s#]+/g, '')
                    .replace(/\s+/g, ' ')
                    .trim();

                  return (
                    <button
                      key={tx.id}
                      type="button"
                      onClick={() => openDetail(tx)}
                      className="pressable flex w-full items-center gap-3 px-3.5 py-3 text-left transition-colors hover:bg-panel-inset"
                    >
                      <IconTile
                        icon={cat?.icon || (isIncome ? 'PlusCircle' : 'MoreHorizontal')}
                        color={cat?.color || (isIncome ? '#10B981' : '#94A3B8')}
                        size={40}
                        iconSize={18}
                      />

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate text-[12px] font-semibold text-ink">
                            {catName}
                          </span>
                          {firstTag && (
                            <span className="shrink-0 rounded-full bg-accent-soft px-1.5 py-0.5 text-[9px] font-bold text-accent">
                              #{firstTag}
                            </span>
                          )}
                        </div>
                        <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-faint">
                          <span className="shrink-0 tabular-nums">{timeLabel(tx.date)}</span>
                          {noteText && (
                            <>
                              <span>·</span>
                              <span className="truncate">{noteText}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex shrink-0 flex-col items-end gap-0.5 pl-1">
                        <span
                          className={`font-num text-[13px] font-semibold ${
                            isIncome ? 'text-mint' : 'text-ink'
                          }`}
                        >
                          {isIncome ? '+' : '−'}
                          {formatAmount(tx.amount)}
                        </span>
                        <span className="flex items-center gap-1 text-[9px] text-faint">
                          {tx.payment_method === 'Cash' ? (
                            <Banknote size={10} />
                          ) : (
                            <CreditCard size={10} />
                          )}
                          {isIncome ? t('income') : t('expense')}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </Surface>
            </motion.section>
          ))}
        </div>
      )}

      <p className="pt-1 text-center text-[9px] font-semibold uppercase tracking-[0.18em] text-faint">
        {formatCategoryCount(categories.length, language)} · Vault
      </p>
    </div>
  );
};
