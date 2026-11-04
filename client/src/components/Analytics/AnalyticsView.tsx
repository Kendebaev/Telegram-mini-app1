import { useMemo } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarDays,
  PiggyBank,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from 'recharts';
import { useTransactionStore } from '../../stores/transactionStore';
import { useSettingsStore, useTranslation } from '../../stores/settingsStore';
import { useUIStore } from '../../stores/uiStore';
import {
  budgetSnapshot,
  dayKey,
  endOfMonth,
  hashtagBreakdown,
  heatmapSeries,
  monthlySeries,
  monthlyTotals,
  startOfMonth,
} from '../../utils/finance';
import { Surface } from '../ui/Surface';
import { MonthSwitcher } from '../ui/MonthSwitcher';
import { SpendingTrend } from './SpendingTrend';
import { CategoryBreakdown } from './CategoryBreakdown';

export function AnalyticsView() {
  const { t, language } = useTranslation();
  const formatAmount = useSettingsStore((s) => s.formatAmount);
  const transactions = useTransactionStore((s) => s.transactions);
  const month = useUIStore((s) => s.viewMonth);
  const setMonth = useUIStore((s) => s.setViewMonth);
  const locale = language === 'ru' ? 'ru-RU' : 'en-US';
  const totals = useMemo(
    () => monthlyTotals(transactions, month),
    [transactions, month],
  );
  const series = useMemo(
    () => monthlySeries(transactions, 6, month, locale),
    [transactions, month, locale],
  );
  const heatmap = useMemo(
    () => heatmapSeries(transactions, month),
    [transactions, month],
  );
  const elapsed = budgetSnapshot(totals.expense, 0, month).daysElapsed;
  const tags = hashtagBreakdown(transactions, month).slice(0, 6);
  const offset =
    (new Date(month.getFullYear(), month.getMonth(), 1).getDay() + 6) % 7;
  const weekdays = Array.from({ length: 7 }, (_, i) =>
    new Date(2024, 0, i + 1).toLocaleDateString(locale, { weekday: 'short' }),
  );
  const openDay = (date: string) => {
    const ui = useUIStore.getState();
    ui.resetFilters();
    ui.setFilterType('expense');
    ui.setFilterDateRange(date, date);
    ui.setActiveTab('history');
  };
  return (
    <div className="space-y-6">
      <div className="page-heading">
        <p className="eyebrow">{t('analytics')}</p>
        <h1>{t('analytics_title')}</h1>
        <p className="mt-2 text-sm text-muted">{t('analytics_description')}</p>
      </div>
      <div className="flex justify-end">
        <MonthSwitcher value={month} onChange={setMonth} language={language} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Surface className="metric-card">
          <span className="metric-icon bg-accent-soft text-accent">
            <PiggyBank size={18} />
          </span>
          <p className="mt-3 text-xs text-muted">{t('net_savings')}</p>
          <p
            className={`mt-1 font-num text-xl font-semibold ${totals.net < 0 ? 'text-coral' : ''}`}
          >
            {formatAmount(totals.net)}
          </p>
        </Surface>
        <Surface className="metric-card">
          <span className="metric-icon bg-coral-soft text-coral">
            <CalendarDays size={18} />
          </span>
          <p
            className="mt-3 text-xs text-muted"
            title={t('average_elapsed_hint')}
          >
            {t('average_elapsed')}
          </p>
          <p className="mt-1 font-num text-xl font-semibold">
            {formatAmount(totals.expense / Math.max(1, elapsed))}
          </p>
        </Surface>
      </div>
      <SpendingTrend month={month} />
      <CategoryBreakdown month={month} />
      <Surface className="p-5">
        <h2 className="section-title">{t('cash_flow')}</h2>
        <div className="my-4 flex gap-4 text-xs text-muted">
          <span className="flex items-center gap-1">
            <ArrowDownLeft size={14} className="text-mint" />
            {t('income')}
          </span>
          <span className="flex items-center gap-1">
            <ArrowUpRight size={14} className="text-coral" />
            {t('expenses')}
          </span>
        </div>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <BarChart
              data={series}
              barGap={5}
              margin={{ top: 10, bottom: 0, left: 0, right: 0 }}
              accessibilityLayer
            >
              <CartesianGrid
                vertical={false}
                stroke="var(--line)"
                strokeDasharray="3 5"
              />
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'var(--faint)', fontSize: 11 }}
                tickMargin={10}
              />
              <Tooltip
                cursor={{ fill: 'var(--panel-inset)' }}
                content={({ active, payload, label }) =>
                  active && payload?.length ? (
                    <div className="chart-tooltip">
                      <p className="mb-2 text-xs capitalize text-muted">
                        {label}
                      </p>
                      {payload.map((p) => (
                        <p
                          key={String(p.dataKey)}
                          className="mt-1 text-xs"
                          style={{ color: p.color }}
                        >
                          {t(p.dataKey === 'income' ? 'income' : 'expenses')} ·{' '}
                          {formatAmount(Number(p.value))}
                        </p>
                      ))}
                    </div>
                  ) : null
                }
              />
              <Bar
                dataKey="income"
                fill="var(--mint)"
                radius={[5, 5, 0, 0]}
                maxBarSize={18}
                isAnimationActive={false}
              />
              <Bar
                dataKey="expense"
                fill="var(--coral)"
                radius={[5, 5, 0, 0]}
                maxBarSize={18}
                isAnimationActive={false}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Surface>
      <Surface className="p-5">
        <h2 className="section-title">{t('spending_calendar')}</h2>
        <p className="mt-2 text-xs leading-relaxed text-muted">
          {t('calendar_hint')}
        </p>
        <div className="mt-5 grid grid-cols-7 gap-1.5">
          {weekdays.map((day, i) => (
            <span key={i} className="pb-2 text-center text-[11px] text-muted">
              {day}
            </span>
          ))}
          {Array.from({ length: offset }, (_, i) => (
            <span key={`empty-${i}`} />
          ))}
          {heatmap.map((cell) => (
            <button
              type="button"
              key={cell.date}
              onClick={() => openDay(cell.date)}
              className="calendar-day"
              aria-label={`${cell.date}: ${formatAmount(cell.expense)}`}
              style={{
                background:
                  cell.level === 0
                    ? 'var(--panel-inset)'
                    : `color-mix(in srgb, var(--accent) ${18 + cell.level * 18}%, var(--panel-strong))`,
                color: cell.level >= 3 ? 'var(--on-accent)' : 'var(--ink)',
              }}
            >
              <span>{cell.day}</span>
              {cell.expense > 0 && (
                <i className="h-1 w-1 rounded-full bg-current opacity-60" />
              )}
            </button>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-end gap-1.5 text-[11px] text-muted">
          <span>{t('less')}</span>
          {[0, 1, 2, 3, 4].map((level) => (
            <span
              key={level}
              className="h-2.5 w-2.5 rounded-sm"
              style={{
                background:
                  level === 0
                    ? 'var(--panel-inset)'
                    : `color-mix(in srgb, var(--accent) ${18 + level * 18}%, var(--panel-strong))`,
              }}
            />
          ))}
          <span>{t('more')}</span>
        </div>
      </Surface>
      {tags.length > 0 && (
        <Surface className="p-5">
          <h2 className="section-title">{t('top_tags')}</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <button
                key={tag.tag}
                type="button"
                className="rounded-xl border border-line bg-panel-inset px-3 py-2 text-left"
                onClick={() => {
                  const ui = useUIStore.getState();
                  ui.resetFilters();
                  ui.setFilterType('expense');
                  ui.setFilterHashtag(tag.tag);
                  ui.setFilterDateRange(
                    dayKey(startOfMonth(month)),
                    dayKey(endOfMonth(month)),
                  );
                  ui.setActiveTab('history');
                }}
              >
                <span className="block text-xs font-medium text-accent">
                  #{tag.tag}
                </span>
                <span className="mt-1 block text-xs text-muted">
                  {formatAmount(tag.amount)}
                </span>
              </button>
            ))}
          </div>
        </Surface>
      )}
      <p className="brand-footer">
        <span className="brand-dot" />
        Vault · {t('brand_caption')}
      </p>
    </div>
  );
}
