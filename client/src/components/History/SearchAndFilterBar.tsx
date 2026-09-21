import React from 'react';
import { Search, X, Lock } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import { useCategoryStore } from '../../stores/categoryStore';
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
  } = useUIStore();
  const { getCategoriesByType } = useCategoryStore();
  const { haptic } = useTelegram();

  const isCategoryDisabled = filters.type === 'all';
  const availableCategories =
    filters.type === 'expense'
      ? getCategoriesByType('expense')
      : filters.type === 'income'
      ? getCategoriesByType('income')
      : [];

  const periods: Array<{ id: FilterState['period']; label: string }> = [
    { id: 'month', label: 'This Month' },
    { id: 'week', label: 'This Week' },
    { id: 'today', label: 'Today' },
    { id: 'last_month', label: 'Last Month' },
    { id: 'all', label: 'All Time' },
  ];

  return (
    <div className="space-y-3">
      {/* Search Bar */}
      <div className="relative flex items-center">
        <Search size={15} className="absolute left-3.5 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={filters.search}
          onChange={(e) => setFilterSearch(e.target.value)}
          placeholder="Search by note, #hashtag, or category..."
          className="w-full pl-9 pr-8 py-2.5 rounded-2xl glass-input text-xs font-medium text-white placeholder:text-slate-400"
        />
        {filters.search && (
          <button
            type="button"
            onClick={() => {
              haptic.impact('light');
              setFilterSearch('');
            }}
            className="absolute right-2.5 p-1 rounded-full text-slate-400 hover:text-white"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Type Toggle: All / Expense / Income */}
      <div className="p-1 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex">
        <button
          type="button"
          onClick={() => {
            haptic.selection();
            setFilterType('all');
          }}
          className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
            filters.type === 'all'
              ? 'bg-indigo-600/40 text-white border border-indigo-500/50 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          All
        </button>
        <button
          type="button"
          onClick={() => {
            haptic.selection();
            setFilterType('expense');
          }}
          className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
            filters.type === 'expense'
              ? 'bg-rose-500/25 text-rose-300 border border-rose-500/50 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Expenses
        </button>
        <button
          type="button"
          onClick={() => {
            haptic.selection();
            setFilterType('income');
          }}
          className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
            filters.type === 'income'
              ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/50 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Income
        </button>
      </div>

      {/* Category Pills (with lock logic when type === 'all') */}
      <div className="space-y-1">
        {isCategoryDisabled ? (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-[11px] text-slate-400">
            <Lock size={12} className="text-slate-500" />
            <span>Select <strong>Expense</strong> or <strong>Income</strong> above to filter by category</span>
          </div>
        ) : (
          <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar py-0.5">
            <button
              type="button"
              onClick={() => {
                haptic.selection();
                setFilterCategory('all');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all active:scale-95 ${
                filters.categoryId === 'all'
                  ? 'bg-white text-slate-950 font-bold shadow-sm'
                  : 'bg-white/[0.06] text-slate-400 border border-white/[0.08] hover:text-white'
              }`}
            >
              All Categories
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
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap flex items-center space-x-1.5 transition-all border active:scale-95 ${
                    isSelected
                      ? 'bg-indigo-600/30 border-indigo-400 text-white shadow-xs'
                      : 'bg-white/[0.04] border-white/[0.06] text-slate-400 hover:text-white'
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full inline-block"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Period Filter Pills & Payment Method */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar py-0.5 flex-1">
          {periods.map((p) => {
            const isActive = filters.period === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  haptic.selection();
                  setFilterPeriod(p.id);
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all active:scale-95 ${
                  isActive
                    ? 'bg-indigo-500/25 text-indigo-300 border border-indigo-500/50 shadow-xs'
                    : 'bg-white/[0.04] text-slate-400 border border-white/[0.06] hover:text-white'
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>

        {/* Payment Method Quick Filter */}
        <div className="flex items-center bg-white/[0.04] p-0.5 rounded-lg border border-white/[0.06] flex-shrink-0">
          {(['all', 'Card', 'Cash'] as const).map((method) => (
            <button
              key={method}
              type="button"
              onClick={() => {
                haptic.selection();
                setFilterPaymentMethod(method);
              }}
              className={`px-2 py-0.5 rounded-md text-[10px] font-semibold transition-all ${
                filters.paymentMethod === method
                  ? 'bg-indigo-600/40 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {method === 'all' ? 'All' : method}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
