import { useState } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';
import { ChevronRight, Layers } from 'lucide-react';
import { useCategoryStore } from '../../stores/categoryStore';
import { useSettingsStore, useTranslation } from '../../stores/settingsStore';
import { useTransactionStore } from '../../stores/transactionStore';
import { useUIStore } from '../../stores/uiStore';
import {
  categoryBreakdown,
  dayKey,
  endOfMonth,
  startOfMonth,
} from '../../utils/finance';
import {
  getLocalizedCategoryName,
  formatTransactionCount,
} from '../../utils/translations';
import type { TransactionType } from '../../types/models';
import { EmptyState } from '../ui/EmptyState';
import { IconTile } from '../ui/IconTile';
import { SectionHeader } from '../ui/SectionHeader';
import { Surface } from '../ui/Surface';

export function CategoryBreakdown({
  month,
  compact = false,
}: {
  month: Date;
  compact?: boolean;
}) {
  const { t, language } = useTranslation();
  const formatAmount = useSettingsStore((s) => s.formatAmount);
  const transactions = useTransactionStore((s) => s.transactions);
  const categories = useCategoryStore((s) => s.categories);
  const [type, setType] = useState<TransactionType>('expense');
  const items = categoryBreakdown(transactions, categories, month, type);
  const visible = compact ? items.slice(0, 4) : items;
  const total = items.reduce((sum, item) => sum + item.amount, 0);
  const [selected, setSelected] = useState<string | null>(null);
  const active = items.find((item) => item.id === selected);
  const openCategory = (id: string) => {
    const ui = useUIStore.getState();
    ui.resetFilters();
    ui.setFilterType(type);
    ui.setFilterCategory(id);
    ui.setFilterDateRange(
      dayKey(startOfMonth(month)),
      dayKey(endOfMonth(month)),
    );
    ui.setActiveTab('history');
  };
  return (
    <section>
      <SectionHeader
        title={t('where_it_goes')}
        actionLabel={compact ? t('see_insights') : undefined}
        onAction={
          compact
            ? () => useUIStore.getState().setActiveTab('analytics')
            : undefined
        }
        className="mb-3"
      />
      <Surface className="category-card">
        {!compact && (
          <div
            className="pill-switch mb-4 w-fit"
            role="group"
            aria-label={t('filter_type')}
          >
            {(['expense', 'income'] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setType(value);
                  setSelected(null);
                }}
                aria-pressed={type === value}
              >
                {t(value)}
              </button>
            ))}
          </div>
        )}
        {!items.length ? (
          <EmptyState
            compact
            icon={<Layers size={24} />}
            title={t('no_analytics_data')}
            body={t('no_entries_period')}
          />
        ) : (
          <>
            {!compact && (
              <div className="relative mx-auto h-56 max-w-xs">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <PieChart>
                    <Pie
                      data={items}
                      dataKey="amount"
                      innerRadius={72}
                      outerRadius={96}
                      paddingAngle={3}
                      cornerRadius={5}
                      stroke="none"
                      onClick={(_, index) => {
                        const id = items[index]?.id;
                        setSelected(selected === id ? null : (id ?? null));
                      }}
                      isAnimationActive={false}
                    >
                      {items.map((item) => (
                        <Cell
                          key={item.id}
                          fill={item.color}
                          opacity={selected && selected !== item.id ? 0.3 : 1}
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="max-w-32 truncate text-xs text-muted">
                    {active
                      ? getLocalizedCategoryName(active.name, language)
                      : t('total')}
                  </span>
                  <span className="mt-1 font-num text-xl font-semibold">
                    {formatAmount(active?.amount ?? total)}
                  </span>
                  <span className="mt-1 text-xs text-muted">
                    {active
                      ? `${Math.round(active.share)}%`
                      : formatTransactionCount(
                          items.reduce((sum, item) => sum + item.count, 0),
                          language,
                        )}
                  </span>
                </div>
              </div>
            )}
            <div className="space-y-1">
              {visible.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="category-row group"
                  onClick={() => openCategory(item.id)}
                  aria-label={`${getLocalizedCategoryName(item.name, language)} · ${formatAmount(item.amount)} · ${t('category_drilldown')}`}
                >
                  <IconTile icon={item.icon} color={item.color} size={38} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium">
                        {getLocalizedCategoryName(item.name, language)}
                      </span>
                      <span className="shrink-0 text-sm font-semibold tabular-nums">
                        {formatAmount(item.amount)}
                      </span>
                    </span>
                    <span className="mt-2 flex items-center gap-3">
                      <span className="block h-1.5 flex-1 overflow-hidden rounded-full bg-panel-inset">
                        <span
                          className="block h-full rounded-full"
                          style={{
                            width: `${item.share}%`,
                            background: item.color,
                          }}
                        />
                      </span>
                      <span className="w-8 text-right text-[11px] text-muted">
                        {Math.round(item.share)}%
                      </span>
                    </span>
                  </span>
                  <ChevronRight
                    size={14}
                    className="text-faint transition-transform group-hover:translate-x-0.5"
                  />
                </button>
              ))}
            </div>
          </>
        )}
      </Surface>
    </section>
  );
}
