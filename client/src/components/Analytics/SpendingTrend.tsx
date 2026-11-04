import { useId, useMemo, useState } from 'react';
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ArrowDownRight,
  ArrowUpRight,
  ChartNoAxesCombined,
} from 'lucide-react';
import { useSettingsStore, useTranslation } from '../../stores/settingsStore';
import { useTransactionStore } from '../../stores/transactionStore';
import {
  percentChange,
  trendSeries,
  type TrendPeriod,
  type TrendPoint,
} from '../../utils/finance';
import type { TransactionType } from '../../types/models';
import { Surface } from '../ui/Surface';

export function SpendingTrend({ month }: { month: Date }) {
  const { t, language } = useTranslation();
  const formatAmount = useSettingsStore((s) => s.formatAmount);
  const transactions = useTransactionStore((s) => s.transactions);
  const [period, setPeriod] = useState<TrendPeriod>('month');
  const [type, setType] = useState<TransactionType>('expense');
  const [showTable, setShowTable] = useState(false);
  const id = useId().replace(/:/g, '');
  const locale = language === 'ru' ? 'ru-RU' : 'en-US';
  const points = useMemo(
    () => trendSeries(transactions, period, month, new Date(), locale),
    [transactions, period, month, locale],
  );
  const previousKey = type === 'expense' ? 'previousExpense' : 'previousIncome';
  const total = points.reduce((s, p) => s + p[type], 0);
  const previous = points.reduce((s, p) => s + p[previousKey], 0);
  const delta = percentChange(total, previous);
  const good = delta !== null && (type === 'expense' ? delta <= 0 : delta >= 0);
  const hasData = points.some((p) => p[type] > 0 || p[previousKey] > 0);
  const dateLabel = (value: string) =>
    value
      ? new Date(`${value}T12:00:00`).toLocaleDateString(
          locale,
          period === 'half-year'
            ? { month: 'long', year: 'numeric' }
            : { day: 'numeric', month: 'short' },
        )
      : '—';
  const previousLabel = t(
    period === 'week'
      ? 'previous_week'
      : period === 'month'
        ? 'previous_month'
        : 'previous_half_year',
  );
  const color = 'var(--accent)';

  return (
    <Surface className="trend-card">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="section-title">{t('money_dynamics')}</h2>
        <div className="pill-switch" role="group" aria-label={t('filter_type')}>
          {(['expense', 'income'] as const).map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={type === value}
              onClick={() => setType(value)}
            >
              {t(value)}
            </button>
          ))}
        </div>
      </div>
      <div className="my-5 flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-xs text-muted">{t('total_period')}</p>
          <p className="mt-1 font-num text-[30px] font-semibold leading-tight">
            {formatAmount(total)}
          </p>
        </div>
        {delta !== null && (
          <span
            className={`trend-delta ${good ? 'text-mint bg-mint-soft' : 'text-coral bg-coral-soft'}`}
          >
            {delta <= 0 ? (
              <ArrowDownRight size={14} />
            ) : (
              <ArrowUpRight size={14} />
            )}
            {Math.abs(Math.round(delta))}%
          </span>
        )}
      </div>
      <div
        className="chart-periods"
        role="group"
        aria-label={t('chart_period')}
      >
        {(['week', 'month', 'half-year'] as const).map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={period === value}
            onClick={() => setPeriod(value)}
          >
            {t(
              value === 'week'
                ? 'seven_days'
                : value === 'month'
                  ? 'month'
                  : 'six_months',
            )}
          </button>
        ))}
      </div>
      {hasData ? (
        <div
          className="mt-5 h-[190px] w-full"
          role="group"
          aria-label={`${t('money_dynamics')}: ${t(type)}`}
        >
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <ComposedChart
              data={points}
              margin={{ top: 12, right: 8, bottom: 0, left: -14 }}
              accessibilityLayer
            >
              <defs>
                <linearGradient id={`trend-${id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.22} />
                  <stop offset="100%" stopColor={color} stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <CartesianGrid
                vertical={false}
                stroke="var(--line)"
                strokeDasharray="3 5"
              />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'var(--faint)', fontSize: 11 }}
                minTickGap={24}
                tickMargin={12}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'var(--faint)', fontSize: 10 }}
                tickFormatter={(value) =>
                  new Intl.NumberFormat(locale, {
                    notation: 'compact',
                    maximumFractionDigits: 1,
                  }).format(value)
                }
                width={52}
              />
              <Tooltip
                cursor={{
                  stroke: 'var(--line-strong)',
                  strokeDasharray: '4 4',
                }}
                content={({ active, payload }) => {
                  const point = payload?.[0]?.payload as TrendPoint | undefined;
                  if (!active || !point) return null;
                  return (
                    <div className="chart-tooltip">
                      <p className="mb-2 text-xs text-muted">
                        {dateLabel(point.date)}
                      </p>
                      <p className="font-semibold text-ink">
                        {t(type)} · {formatAmount(point[type])}
                      </p>
                      <p className="mt-1 text-xs text-muted">
                        {dateLabel(point.previousDate)} ·{' '}
                        {formatAmount(point[previousKey])}
                      </p>
                    </div>
                  );
                }}
              />
              <Line
                type="linear"
                dataKey={previousKey}
                stroke="var(--faint)"
                strokeWidth={1.5}
                strokeDasharray="4 5"
                dot={false}
                isAnimationActive={false}
              />
              <Area
                type="linear"
                dataKey={type}
                stroke={color}
                strokeWidth={2.5}
                fill={`url(#trend-${id})`}
                dot={
                  points.length <= 7
                    ? { r: 3, strokeWidth: 2, fill: 'var(--panel-strong)' }
                    : false
                }
                activeDot={{
                  r: 5,
                  stroke: 'var(--panel-strong)',
                  strokeWidth: 3,
                }}
                isAnimationActive={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="flex h-[190px] flex-col items-center justify-center gap-2 text-muted">
          <ChartNoAxesCombined size={28} strokeWidth={1.3} />
          <p className="text-sm">{t('no_entries_period')}</p>
        </div>
      )}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-[11px] text-muted">
        <div className="flex gap-4">
          <span className="flex items-center gap-1.5">
            <i className="h-0.5 w-3 bg-accent" />
            {t('selected_period')}
          </span>
          <span className="flex items-center gap-1.5">
            <i className="w-3 border-t border-dashed border-faint" />
            {previousLabel}
          </span>
        </div>
        <button
          type="button"
          className="text-accent"
          onClick={() => setShowTable(!showTable)}
          aria-expanded={showTable}
        >
          {t(showTable ? 'hide_values' : 'show_values')}
        </button>
      </div>
      {showTable && (
        <div className="mt-4 max-h-60 overflow-auto rounded-xl border border-line">
          <table className="w-full text-left text-xs">
            <caption className="sr-only">{t('money_dynamics')}</caption>
            <thead className="sticky top-0 bg-panel-solid">
              <tr>
                <th className="p-3">{t('date')}</th>
                <th className="p-3 text-right">{t(type)}</th>
                <th className="p-3 text-right">{previousLabel}</th>
              </tr>
            </thead>
            <tbody>
              {points.map((p) => (
                <tr className="border-t border-line" key={p.date}>
                  <td className="p-3">{dateLabel(p.date)}</td>
                  <td className="p-3 text-right tabular-nums">
                    {formatAmount(p[type])}
                  </td>
                  <td className="p-3 text-right tabular-nums text-muted">
                    {formatAmount(p[previousKey])}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {period !== 'week' && (
        <p className="mt-3 text-[11px] leading-relaxed text-faint">
          {t('matching_days_hint')}
        </p>
      )}
    </Surface>
  );
}
