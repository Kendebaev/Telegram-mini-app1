import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  CalendarDays,
  Flame,
  Gauge,
  Lightbulb,
  PieChart as PieIcon,
  PiggyBank,
  Tag,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import {
  Cell,
  Pie,
  PieChart as RePieChart,
  ResponsiveContainer,
} from 'recharts';
import { useTelegram } from '../../context/TelegramContext';
import { useCategoryStore } from '../../stores/categoryStore';
import { usePlanStore } from '../../stores/planStore';
import { useSettingsStore, useTranslation } from '../../stores/settingsStore';
import { useTransactionStore } from '../../stores/transactionStore';
import type { CategorySpend, Insight } from '../../utils/finance';
import {
  addMonths,
  buildInsights,
  categoryBreakdown,
  formatMonthLabel,
  hashtagBreakdown,
  heatmapSeries,
  monthlySeries,
  monthlyTotals,
  percentChange,
} from '../../utils/finance';
import type { TransactionType } from '../../types/models';
import { getLocalizedCategoryName } from '../../utils/translations';
import { EmptyState } from '../ui/EmptyState';
import { MonthSwitcher } from '../ui/MonthSwitcher';
import { SectionHeader } from '../ui/SectionHeader';
import { Segmented } from '../ui/Segmented';
import { Surface } from '../ui/Surface';
import { CategoryIcon } from '../glass/CategoryIcon';

export const AnalyticsView: React.FC = () => {
  const { haptic } = useTelegram();
  const { transactions } = useTransactionStore();
  const { categories } = useCategoryStore();
  const { formatAmount } = useSettingsStore();
  const { t, language } = useTranslation();
  const { monthlyBudget } = usePlanStore();

  const now = new Date();
  const locale = language === 'ru' ? 'ru-RU' : 'en-US';
  const [viewMonth, setViewMonth] = useState(() => new Date());
  const [breakdownType, setBreakdownType] = useState<TransactionType>('expense');

  const totals = useMemo(() => monthlyTotals(transactions, viewMonth), [transactions, viewMonth]);
  const previous = useMemo(
    () => monthlyTotals(transactions, addMonths(viewMonth, -1)),
    [transactions, viewMonth],
  );
  const expenseDelta = percentChange(totals.expense, previous.expense);
  const series = useMemo(
    () => monthlySeries(transactions, 6, viewMonth, locale),
    [transactions, viewMonth, locale],
  );
  const breakdown = useMemo(
    () => categoryBreakdown(transactions, categories, viewMonth, breakdownType),
    [transactions, categories, viewMonth, breakdownType],
  );
  const heatCells = useMemo(() => heatmapSeries(transactions, viewMonth), [transactions, viewMonth]);
  const tags = useMemo(
    () => hashtagBreakdown(transactions, viewMonth, 'expense').slice(0, 6),
    [transactions, viewMonth],
  );
  const insights = useMemo(
    () =>
      buildInsights({
        txns: transactions,
        categories,
        budget: monthlyBudget,
        ref: viewMonth,
        now,
      }),
    [transactions, categories, monthlyBudget, viewMonth],
  );

  const maxFlow = Math.max(
    ...series.map((m) => Math.max(m.income, m.expense)),
    1,
  );

  const donutData = useMemo(() => {
    const top = breakdown.slice(0, 5);
    const rest = breakdown.slice(5).reduce((sum, item) => sum + item.amount, 0);
    const items: CategorySpend[] = [...top];
    if (rest > 0) {
      items.push({
        id: 'other',
        name: t('other'),
        icon: 'CircleDashed',
        color: '#94A3B8',
        amount: rest,
        count: 0,
        share: 0,
      });
    }
    return items;
  }, [breakdown, t]);

  const breakdownTotal = breakdown.reduce((sum, item) => sum + item.amount, 0);
  const offset = (new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1).getDay() + 6) % 7;
  const weekdays = Array.from({ length: 7 }, (_, i) =>
    new Date(2024, 0, 1 + i).toLocaleDateString(locale, { weekday: 'narrow' }),
  );

  const insightText = (insight: Insight): string => {
    switch (insight.code) {
      case 'top-category': {
        const cat = categories.find((c) => c.id === insight.category_id);
        return `${t('top_category')}: ${cat ? getLocalizedCategoryName(cat.name, language) : '—'}`;
      }
      case 'month-delta':
        return t((insight.delta ?? 0) <= 0 ? 'delta_down' : 'delta_up').replace(
          '{p}',
          String(Math.round(insight.percent ?? 0)),
        );
      case 'savings-rate':
        return t('savings_kept').replace('{p}', String(Math.round(insight.percent ?? 0)));
      case 'budget-pace':
        return t((insight.delta ?? 0) <= 0 ? 'pace_under' : 'pace_over').replace(
          '{a}',
          formatAmount(insight.amount ?? 0),
        );
      case 'streak':
        return t('streak_msg').replace('{n}', String(insight.days ?? 0));
      case 'biggest-day':
        return t('biggest_day_msg').replace('{d}', String(insight.day ?? 1));
      default:
        return '';
    }
  };

  const insightVisual = (code: Insight['code']) => {
    if (code === 'month-delta') return TrendingDown;
    if (code === 'savings-rate') return PiggyBank;
    if (code === 'budget-pace') return Gauge;
    if (code === 'streak') return Flame;
    if (code === 'biggest-day') return CalendarDays;
    return PieIcon;
  };

  const toneClass = (tone: Insight['tone']) =>
    tone === 'good'
      ? 'bg-mint-soft text-mint'
      : tone === 'warn'
        ? 'bg-coral-soft text-coral'
        : 'bg-accent-soft text-accent';

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="px-1">
        <p className="eyebrow">{t('insights')}</p>
        <h1 className="mt-0.5 font-display text-[22px] font-bold tracking-tight text-ink">
          {t('insights_title')}
        </h1>
        <p className="mt-1 text-[11px] text-muted">{t('insights_sub')}</p>
        <div className="mt-2.5 flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-faint">
            {formatMonthLabel(viewMonth, locale)}
          </span>
          <MonthSwitcher value={viewMonth} onChange={setViewMonth} language={language} />
        </div>
      </div>

      {/* Overview */}
      <Surface padded={false} className="grid grid-cols-3 divide-x divide-line/70 px-1 py-3">
        <div className="px-3">
          <p className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-faint">
            <TrendingUp size={10} className="text-mint" />
            {t('income')}
          </p>
          <p className="mt-1 font-mono text-[12px] font-bold text-ink">
            {formatAmount(totals.income)}
          </p>
        </div>
        <div className="px-3">
          <p className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-faint">
            <TrendingDown size={10} className="text-coral" />
            {t('expense')}
          </p>
          <p className="mt-1 font-mono text-[12px] font-bold text-ink">
            {formatAmount(totals.expense)}
          </p>
          {expenseDelta !== null && (
            <p className={`mt-0.5 text-[9px] font-bold ${expenseDelta <= 0 ? 'text-mint' : 'text-coral'}`}>
              {expenseDelta <= 0 ? '↓' : '↑'} {Math.abs(Math.round(expenseDelta))}%
            </p>
          )}
        </div>
        <div className="px-3">
          <p className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-faint">
            <PiggyBank size={10} className="text-accent" />
            {t('net_savings')}
          </p>
          <p
            className={`mt-1 font-mono text-[12px] font-bold ${
              totals.net >= 0 ? 'text-ink' : 'text-coral'
            }`}
          >
            {formatAmount(totals.net, true)}
          </p>
          <p className="mt-0.5 text-[9px] text-faint">
            {Math.round(Math.max(0, totals.savingsRate))}% {t('saved_badge')}
          </p>
        </div>
      </Surface>

      {/* Insights */}
      <section>
        <SectionHeader title={t('insights')} className="mb-2.5" />
        {insights.length === 0 ? (
          <Surface>
            <EmptyState
              compact
              icon={<Lightbulb size={20} />}
              title={t('no_insights')}
              body={t('no_transactions_sub')}
            />
          </Surface>
        ) : (
          <div className="grid grid-cols-2 gap-2.5">
            {insights.map((insight) => {
              const Icon = insightVisual(insight.code);
              return (
                <motion.div
                  key={insight.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35 }}
                >
                  <Surface className="h-full p-3">
                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-xl ${toneClass(
                        insight.tone,
                      )}`}
                    >
                      <Icon size={15} />
                    </span>
                    <p className="mt-2 text-[10px] font-semibold leading-snug text-ink">
                      {insightText(insight)}
                    </p>
                    {insight.code === 'top-category' && insight.amount !== undefined && (
                      <p className="mt-1 font-mono text-[10px] font-bold text-muted">
                        {formatAmount(insight.amount)}
                      </p>
                    )}
                  </Surface>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>

      {/* Cash flow */}
      <section>
        <Surface className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-display text-[13px] font-semibold text-ink">{t('cash_flow')}</p>
              <p className="text-[10px] text-faint">{formatMonthLabel(viewMonth, locale)}</p>
            </div>
            <div className="flex items-center gap-2.5 text-[9px]">
              <span className="flex items-center gap-1 text-muted">
                <span className="h-2 w-2 rounded-full bg-mint" />
                {t('inflow_legend')}
              </span>
              <span className="flex items-center gap-1 text-muted">
                <span className="h-2 w-2 rounded-full bg-coral" />
                {t('outflow_legend')}
              </span>
            </div>
          </div>

          <div className="mt-4 flex items-end justify-between gap-2">
            {series.map((month, index) => (
              <div key={`${month.month}-${index}`} className="flex flex-1 flex-col items-center gap-1.5">
                <div className="flex h-32 w-full items-end justify-center gap-1">
                  <motion.div
                    className="w-2.5 rounded-full bg-mint"
                    initial={{ height: 2 }}
                    animate={{ height: Math.max(2, (month.income / maxFlow) * 128) }}
                    transition={{ duration: 0.7, delay: index * 0.04, ease: [0.16, 1, 0.3, 1] }}
                  />
                  <motion.div
                    className="w-2.5 rounded-full bg-coral"
                    initial={{ height: 2 }}
                    animate={{ height: Math.max(2, (month.expense / maxFlow) * 128) }}
                    transition={{ duration: 0.7, delay: index * 0.04 + 0.05, ease: [0.16, 1, 0.3, 1] }}
                  />
                </div>
                <span className="text-[9px] font-bold capitalize text-faint">{month.month}</span>
              </div>
            ))}
          </div>
        </Surface>
      </section>

      {/* Category breakdown */}
      <section>
        <SectionHeader title={t('expenses_by_category')} className="mb-2.5" />
        <Surface className="p-4">
          <Segmented
            size="sm"
            options={[
              { value: 'expense', label: t('expense') },
              { value: 'income', label: t('income') },
            ]}
            value={breakdownType}
            onChange={(next) => {
              haptic.selection();
              setBreakdownType(next);
            }}
            accent={breakdownType === 'expense' ? 'var(--coral)' : 'var(--mint)'}
            ariaLabel={t('filter_type')}
          />

          {donutData.length === 0 ? (
            <div className="py-6">
              <EmptyState
                compact
                icon={<Wallet size={20} />}
                title={t('no_analytics_data')}
                body={t('no_entries_period')}
              />
            </div>
          ) : (
            <>
              <div className="relative mt-2 h-[190px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RePieChart>
                    <Pie
                      data={donutData}
                      dataKey="amount"
                      nameKey="name"
                      innerRadius={58}
                      outerRadius={82}
                      paddingAngle={3}
                      stroke="none"
                      isAnimationActive
                      animationDuration={750}
                    >
                      {donutData.map((item) => (
                        <Cell key={item.id} fill={item.color} />
                      ))}
                    </Pie>
                  </RePieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-faint">
                    {t('total')}
                  </p>
                  <p className="font-display text-lg font-bold text-ink">
                    {formatAmount(breakdownTotal)}
                  </p>
                  <p className="text-[9px] text-faint">{t('tx_count_label')}</p>
                </div>
              </div>

              <div className="mt-2 space-y-2">
                {donutData.map((item) => (
                  <div key={item.id} className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="min-w-0 flex-1 truncate text-[11px] font-semibold text-ink">
                      {item.id === 'other' ? t('other') : getLocalizedCategoryName(item.name, language)}
                    </span>
                    <span className="font-mono text-[10px] font-bold text-muted">
                      {formatAmount(item.amount)}
                    </span>
                    <span className="w-9 text-right font-mono text-[9px] font-semibold text-faint">
                      {breakdownTotal > 0 ? Math.round((item.amount / breakdownTotal) * 100) : 0}%
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </Surface>
      </section>

      {/* Calendar heatmap */}
      <section>
        <Surface className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-display text-[13px] font-semibold text-ink">
                {t('spending_calendar')}
              </p>
              <p className="text-[10px] text-faint">{formatMonthLabel(viewMonth, locale)}</p>
            </div>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gold-soft text-gold">
              <CalendarDays size={15} />
            </span>
          </div>

          <div className="mt-3 grid grid-cols-7 gap-1">
            {weekdays.map((day, i) => (
              <span key={`${day}-${i}`} className="text-center text-[8px] font-bold uppercase text-faint">
                {day}
              </span>
            ))}
            {Array.from({ length: offset }).map((_, i) => (
              <span key={`blank-${i}`} />
            ))}
            {heatCells.map((cell) => (
              <div
                key={cell.date}
                title={`${cell.day}: ${formatAmount(cell.expense)}`}
                className="flex aspect-square items-center justify-center rounded-[7px] text-[8px] font-semibold"
                style={{
                  backgroundColor:
                    cell.level === 0
                      ? 'var(--panel-inset)'
                      : `rgba(139, 124, 255, ${0.16 + cell.level * 0.19})`,
                  color: cell.level >= 3 ? '#ffffff' : 'var(--muted)',
                }}
              >
                {cell.day}
              </div>
            ))}
          </div>

          <div className="mt-3 flex items-center justify-end gap-1.5 text-[9px] text-faint">
            <span>{t('less')}</span>
            {[0, 1, 2, 3, 4].map((level) => (
              <span
                key={level}
                className="h-2.5 w-2.5 rounded-[3px]"
                style={{
                  backgroundColor:
                    level === 0 ? 'var(--panel-inset)' : `rgba(139, 124, 255, ${0.16 + level * 0.19})`,
                }}
              />
            ))}
            <span>{t('more')}</span>
          </div>
        </Surface>
      </section>

      {/* Top tags */}
      {tags.length > 0 && (
        <section>
          <SectionHeader title={t('top_tags')} className="mb-2.5" />
          <Surface className="p-4">
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag.tag}
                  className="inline-flex items-center gap-1.5 rounded-full border border-line bg-panel-inset px-2.5 py-1.5"
                >
                  <Tag size={11} className="text-accent" />
                  <span className="text-[10px] font-bold text-ink">#{tag.tag}</span>
                  <span className="font-mono text-[9px] font-semibold text-faint">
                    {formatAmount(tag.amount)}
                  </span>
                </span>
              ))}
            </div>
          </Surface>
        </section>
      )}

      <div className="flex items-center justify-center gap-1.5 pb-1 text-[9px] font-semibold uppercase tracking-widest2 text-faint">
        <CategoryIcon name="Sparkles" size={10} />
        {formatMonthLabel(viewMonth, locale)}
      </div>
    </motion.div>
  );
};
