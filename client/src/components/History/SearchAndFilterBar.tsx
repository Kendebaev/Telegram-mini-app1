import React, { useState } from 'react';
import { Search, X, Lock, Calendar } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import { useCategoryStore } from '../../stores/categoryStore';
import { useTranslation } from '../../stores/settingsStore';
import { getLocalizedCategoryName } from '../../utils/translations';
import { useTelegram } from '../../context/TelegramContext';
import type { FilterState } from '../../types/models';

export const SearchAndFilterBar: React.FC = () => {
  const {
    filters,
    setFilterType,
    setFilterCategory,
    setFilterPeriod,
    setFilterSearch,
    setFilterPaymentMethod,
    setFilterDateRange,
  } = useUIStore();
  const { getCategoriesByType } = useCategoryStore();
  const { t, language } = useTranslation();
  const { haptic } = useTelegram();

  const [isCustomDateOpen, setIsCustomDateOpen] = useState(false);

  const isCategoryDisabled = filters.type === 'all';
  const availableCategories =
    filters.type === 'expense'
      ? getCategoriesByType('expense')
      : filters.type === 'income'
      ? getCategoriesByType('income')
      : [];

  const periods: Array<{ id: FilterState['period']; label: string }> = [
    { id: 'today', label: t('day') },
    { id: 'week', label: t('week') },
    { id: 'month', label: t('month') },
    { id: 'all', label: t('all_time') },
  ];

  const isCustomActive = Boolean(filters.startDate || filters.endDate);

  return (
    <div className="space-y-2.5">
      {/* Search Bar */}
      <div className="relative flex items-center">
        <Search size={15} className="absolute left-3.5 text-slate-400 dark:text-zinc-500 pointer-events-none" />
        <input
          type="text"
          value={filters.search}
          onChange={(e) => setFilterSearch(e.target.value)}
          placeholder={t('search_input_placeholder')}
          className="w-full pl-9 pr-8 py-2.5 rounded-2xl bg-white/70 dark:bg-zinc-900/40 backdrop-blur-md border border-slate-200/80 dark:border-white/10 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-500/80 transition-colors"
        />
        {filters.search && (
          <button
            type="button"
            onClick={() => {
              haptic.impact('light');
              setFilterSearch('');
            }}
            className="absolute right-2.5 p-1 rounded-full text-slate-400 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-white"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Tier 1 (Segmented Control): Floating Capsule Toggle */}
      <div className="p-1 rounded-2xl bg-white/70 dark:bg-white/[0.04] backdrop-blur-xl border border-slate-200/80 dark:border-white/[0.08] shadow-2xs flex transition-colors">
        <button
          type="button"
          onClick={() => {
            haptic.selection();
            setFilterType('all');
          }}
          className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all duration-150 ${
            filters.type === 'all'
              ? 'bg-indigo-600 text-white dark:bg-indigo-600/40 dark:text-white dark:border dark:border-indigo-500/50 shadow-sm'
              : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          {t('all')}
        </button>
        <button
          type="button"
          onClick={() => {
            haptic.selection();
            setFilterType('expense');
          }}
          className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all duration-150 ${
            filters.type === 'expense'
              ? 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-500/25 dark:text-rose-300 dark:border-rose-500/50 shadow-sm'
              : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          {t('expenses')}
        </button>
        <button
          type="button"
          onClick={() => {
            haptic.selection();
            setFilterType('income');
          }}
          className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all duration-150 ${
            filters.type === 'income'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/25 dark:text-emerald-300 dark:border-emerald-500/50 shadow-sm'
              : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          {t('income')}
        </button>
      </div>

      {/* Tier 2: Category Chips (with lock notice when Type is 'All') */}
      <div>
        {isCategoryDisabled ? (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100/80 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/[0.06] text-[11px] text-slate-500 dark:text-zinc-400">
            <Lock size={12} className="text-slate-400 dark:text-zinc-500" />
            <span>{t('category_filter_notice')}</span>
          </div>
        ) : (
          <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar py-0.5">
            <button
              type="button"
              onClick={() => {
                haptic.selection();
                setFilterCategory('all');
              }}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all active:scale-95 ${
                filters.categoryId === 'all'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 font-bold shadow-xs'
                  : 'bg-white/80 dark:bg-white/[0.06] text-slate-600 dark:text-zinc-400 border border-slate-200/80 dark:border-white/[0.08] hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {t('all_categories')}
            </button>

            {availableCategories.map((cat) => {
              const isSelected = filters.categoryId === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    haptic.selection();
                    setFilterCategory(cat.id);
                  }}
                  className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap flex items-center space-x-1.5 transition-all border active:scale-95 ${
                    isSelected
                      ? 'bg-indigo-50 border-indigo-300 text-indigo-700 dark:bg-indigo-600/30 dark:border-indigo-400 dark:text-white shadow-2xs'
                      : 'bg-white/80 dark:bg-white/[0.04] border-slate-200/80 dark:border-white/[0.06] text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full inline-block"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span>{getLocalizedCategoryName(cat.name, language)}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Period Filter Chips, Custom Range Button & Payment Method */}
      <div className="space-y-2 pt-0.5">
        <div className="flex items-center justify-between gap-2">
          {/* Period Chips */}
          <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar py-0.5 flex-1">
            {periods.map((p) => {
              const isActive = filters.period === p.id && !isCustomActive;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    haptic.selection();
                    setFilterPeriod(p.id);
                    setIsCustomDateOpen(false);
                  }}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all active:scale-95 ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-500/25 dark:text-indigo-300 dark:border-indigo-500/50 shadow-2xs'
                      : 'bg-white/80 dark:bg-white/[0.04] text-slate-500 dark:text-zinc-400 border border-slate-200/80 dark:border-white/[0.06] hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {p.label}
                </button>
              );
            })}

            {/* Custom Date Range Chip */}
            <button
              type="button"
              onClick={() => {
                haptic.selection();
                setIsCustomDateOpen(!isCustomDateOpen);
              }}
              className={`px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all flex items-center gap-1 active:scale-95 ${
                isCustomActive || isCustomDateOpen
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-500/25 dark:text-indigo-300 dark:border-indigo-500/50 shadow-2xs'
                  : 'bg-white/80 dark:bg-white/[0.04] text-slate-500 dark:text-zinc-400 border border-slate-200/80 dark:border-white/[0.06] hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Calendar size={11} />
              <span>{isCustomActive ? t('custom_range') : t('custom')}</span>
            </button>
          </div>

          {/* Payment Method Quick Filter */}
          <div className="flex items-center bg-white/70 dark:bg-white/[0.04] p-0.5 rounded-full border border-slate-200/80 dark:border-white/[0.06] flex-shrink-0">
            {(['all', 'Card', 'Cash'] as const).map((method) => (
              <button
                key={method}
                type="button"
                onClick={() => {
                  haptic.selection();
                  setFilterPaymentMethod(method);
                }}
                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold transition-all ${
                  filters.paymentMethod === method
                    ? 'bg-slate-900 text-white dark:bg-indigo-600/50 dark:text-white shadow-2xs'
                    : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
                }`}
              >
                {method === 'all' ? t('all') : method === 'Card' ? t('card') : t('cash')}
              </button>
            ))}
          </div>
        </div>

        {/* Expandable Custom Date Range Selector */}
        {isCustomDateOpen && (
          <div className="p-3 rounded-2xl bg-white/85 dark:bg-zinc-900/60 backdrop-blur-xl border border-slate-200/80 dark:border-white/[0.08] shadow-xs space-y-2 animate-in fade-in duration-150">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-zinc-400">
              <span className="flex items-center gap-1">
                <Calendar size={13} className="text-indigo-500" />
                {t('filter_by_custom_range')}
              </span>
              {isCustomActive && (
                <button
                  type="button"
                  onClick={() => {
                    setFilterDateRange(undefined, undefined);
                    setFilterPeriod('month');
                    setIsCustomDateOpen(false);
                  }}
                  className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
                >
                  <X size={11} />
                  {t('reset_range')}
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-400 dark:text-zinc-500 block mb-0.5">{t('start_date')}</label>
                <input
                  type="date"
                  value={filters.startDate || ''}
                  onChange={(e) => setFilterDateRange(e.target.value, filters.endDate)}
                  className="w-full px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-xs font-medium text-slate-900 dark:text-white focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 dark:text-zinc-500 block mb-0.5">{t('end_date')}</label>
                <input
                  type="date"
                  value={filters.endDate || ''}
                  onChange={(e) => setFilterDateRange(filters.startDate, e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-xs font-medium text-slate-900 dark:text-white focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
