import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarDays,
  Check,
  ChevronRight,
  Flame,
  Plus,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Wallet,
  Zap,
} from 'lucide-react';
import { useTelegram } from '../../context/TelegramContext';
import { useCategoryStore } from '../../stores/categoryStore';
import { usePlanStore } from '../../stores/planStore';
import { useSettingsStore, useTranslation } from '../../stores/settingsStore';
import { useToastStore } from '../../stores/toastStore';
import { useTransactionStore } from '../../stores/transactionStore';
import { useUIStore } from '../../stores/uiStore';
import type { Category, RecurringBill, Transaction, TransactionType } from '../../types/models';
import {
  addMonths,
  billDueDate,
  budgetSnapshot,
  categoryBreakdown,
  dailySeries,
  dayKey,
  daysInMonth,
  formatDayLabel,
  monthlySeries,
  monthlyTotals,
  percentChange,
  recentTemplates,
  spendingStreak,
  suggestedBudget,
  totalsOf,
  upcomingBills,
} from '../../utils/finance';
import { getLocalizedCategoryName } from '../../utils/translations';
import { CategoryIcon } from '../glass/CategoryIcon';
import { AnimatedNumber } from '../ui/AnimatedNumber';
import { IconTile } from '../ui/IconTile';
import { MonthSwitcher } from '../ui/MonthSwitcher';
import { ProgressRing } from '../ui/ProgressRing';
import { SectionHeader } from '../ui/SectionHeader';
import { Sparkline } from '../ui/Sparkline';
import { Surface } from '../ui/Surface';
import { EmptyState } from '../ui/EmptyState';

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0 },
};

function stripTags(note?: string | null): string {
  return (note ?? '').replace(/#[\w-]+/g, '').trim();
}

function categoryOf(categories: Category[], id?: string | null): Category | undefined {
  return categories.find((c) => c.id === id);
}

export const DashboardView: React.FC = () => {
  const { haptic } = useTelegram();
  const { transactions } = useTransactionStore();
  const { categories } = useCategoryStore();
  const { startingBalance, formatAmount } = useSettingsStore();
  const { t, language } = useTranslation();
  const { monthlyBudget, categoryBudgets, goals, bills, setMonthlyBudget, markBillPaid } =
    usePlanStore();
  const { setActiveTab, openAddTransaction, setSelectedTransaction } = useUIStore();
  const showToast = useToastStore((s) => s.show);

  const [viewMonth, setViewMonth] = useState(() => new Date());
  const [payingId, setPayingId] = useState<string | null>(null);
  const now = new Date();
  const locale = language === 'ru' ? 'ru-RU' : 'en-US';

  const totals = useMemo(() => monthlyTotals(transactions, viewMonth), [transactions, viewMonth]);
  const previous = useMemo(
    () => monthlyTotals(transactions, addMonths(viewMonth, -1)),
    [transactions, viewMonth],
  );
  const delta = percentChange(totals.expense, previous.expense);
  const breakdown = useMemo(
    () => categoryBreakdown(transactions, categories, viewMonth).slice(0, 4),
    [transactions, categories, viewMonth],
  );
  const daily = useMemo(() => dailySeries(transactions, viewMonth), [transactions, viewMonth]);
  const streak = useMemo(() => spendingStreak(transactions, now), [transactions]);
  const templates = useMemo(() => recentTemplates(transactions, 4), [transactions]);
  const upcoming = useMemo(() => upcomingBills(bills, now).slice(0, 3), [bills]);
  const allTotals = useMemo(() => totalsOf(transactions), [transactions]);
  const balance = startingBalance + allTotals.net;

  const suggested = useMemo(() => suggestedBudget(transactions, viewMonth), [transactions, viewMonth]);
  const budget = monthlyBudget > 0 ? monthlyBudget : suggested;
  const hasCustomBudget = monthlyBudget > 0;
  const snapshot = useMemo(
    () => budgetSnapshot(totals.expense, budget, viewMonth, now),
    [totals.expense, budget, viewMonth],
  );

  const balanceTrend = useMemo(() => {
    const series = monthlySeries(transactions, 6, viewMonth);
    let running = startingBalance;
    const values = [running];
    for (const item of series) {
      running += item.net;
      values.push(running);
    }
    return values;
  }, [transactions, viewMonth, startingBalance]);

  const peakDay = daily.reduce((max, p) => (p.expense > max.expense ? p : max), daily[0]);
  const todaySpend =
    viewMonth.getFullYear() === now.getFullYear() && viewMonth.getMonth() === now.getMonth()
      ? daily[now.getDate() - 1]?.expense ?? 0
      : 0;
  const avgPerDay = totals.expense / Math.max(1, daysInMonth(viewMonth));
  const recent = useMemo(
    () =>
      [...transactions]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 4),
    [transactions],
  );
  const limitsCount = Object.keys(categoryBudgets).length;

  const handleQuickTemplate = (template: (typeof templates)[number]) => {
    haptic.selection();
    openAddTransaction(template.type, undefined, template);
  };

  const handleUseSuggested = () => {
    haptic.notification('success');
    setMonthlyBudget(suggested);
    showToast(`${t('monthly_budget')} · ${formatAmount(suggested)}`, 'success');
  };

  const handlePayBill = async (bill: RecurringBill) => {
    haptic.impact('medium');
    setPayingId(bill.id);
    try {
      await markBillPaid(bill.id);
      showToast(`${bill.name} · ${t('paid')}`, 'success');
    } finally {
      setPayingId(null);
    }
  };

  const statusLabel =
    snapshot.status === 'over'
      ? t('over_pace')
      : snapshot.status === 'under'
        ? t('under_pace')
        : t('on_track');
  const statusClass =
    snapshot.status === 'over'
      ? 'bg-coral-soft text-coral'
      : snapshot.status === 'under'
        ? 'bg-mint-soft text-mint'
        : 'bg-accent-soft text-accent';

  const openAdd = (type: TransactionType = 'expense') => {
    haptic.impact('light');
    openAddTransaction(type);
  };

  return (
    <motion.div
      className="space-y-6 pb-2"
      initial="hidden"
      animate="show"
      transition={{ staggerChildren: 0.06 }}
    >
      {/* Hero balance */}
      <motion.section variants={fadeUp} transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}>
        <div className="hero-shell relative overflow-hidden rounded-[30px] p-5 shadow-float">
          <div
            className="pointer-events-none absolute -right-20 -top-16 h-56 w-56 rounded-full bg-accent/35 blur-3xl"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -bottom-24 -left-10 h-48 w-48 rounded-full bg-mint/20 blur-3xl"
            aria-hidden="true"
          />

          <div className="relative z-10 flex items-start justify-between gap-3">
            <div>
              <p className="eyebrow text-hero-muted">{t('total_balance')}</p>
              <div className="mt-1 flex items-baseline gap-1 font-display text-[34px] font-bold leading-none tracking-tight text-hero-ink">
                <AnimatedNumber value={balance} format={(n) => formatAmount(n)} />
              </div>
              <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                <span className="inline-flex items-center gap-1 rounded-full border border-mint/25 bg-mint/15 px-2 py-0.5 text-[10px] font-bold text-mint">
                  <ArrowDownLeft size={11} />
                  {formatAmount(totals.income)}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-coral/25 bg-coral/15 px-2 py-0.5 text-[10px] font-bold text-coral">
                  <ArrowUpRight size={11} />
                  {formatAmount(totals.expense)}
                </span>
                {delta !== null && (
                  <span
                    className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                      delta <= 0
                        ? 'border-white/15 bg-white/10 text-mint'
                        : 'border-white/15 bg-white/10 text-coral'
                    }`}
                  >
                    {delta <= 0 ? <TrendingDown size={11} /> : <TrendingUp size={11} />}
                    {Math.abs(Math.round(delta))}%
                  </span>
                )}
              </div>
            </div>
            <MonthSwitcher
              value={viewMonth}
              onChange={setViewMonth}
              language={language}
              tone="dark"
            />
          </div>

          <div className="relative z-10 mt-4">
            <Sparkline data={balanceTrend} height={58} color="var(--accent-2)" strokeWidth={2.2} />
          </div>

          <div className="relative z-10 mt-4 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => openAdd('expense')}
              className="pressable flex items-center justify-center gap-1.5 rounded-2xl border border-white/15 bg-white/10 py-2.5 text-[11px] font-bold text-hero-ink backdrop-blur-sm"
            >
              <ArrowUpRight size={14} />
              {t('expense')}
            </button>
            <button
              type="button"
              onClick={() => openAdd('income')}
              className="pressable flex items-center justify-center gap-1.5 rounded-2xl border border-mint/30 bg-mint/20 py-2.5 text-[11px] font-bold text-mint backdrop-blur-sm"
            >
              <ArrowDownLeft size={14} />
              {t('income')}
            </button>
          </div>
        </div>
      </motion.section>

      {/* Quick entry */}
      <motion.section variants={fadeUp} transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}>
        <SectionHeader
          title={t('quick_entry')}
          actionLabel={t('new_entry')}
          onAction={() => openAdd('expense')}
          className="mb-2.5"
        />
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 no-scrollbar">
          <button
            type="button"
            onClick={() => openAdd('expense')}
            className="pressable flex shrink-0 items-center gap-2 rounded-2xl border border-dashed border-line-strong bg-panel-inset px-3 py-2.5"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent-soft text-accent">
              <Plus size={16} />
            </span>
            <span className="text-left">
              <span className="block text-[11px] font-bold text-ink">{t('new_entry')}</span>
              <span className="block text-[9px] text-faint">{t('quick_amount')}</span>
            </span>
          </button>

          {templates.map((template) => {
            const cat = categoryOf(categories, template.category_id);
            const title = stripTags(template.note) || (cat ? getLocalizedCategoryName(cat.name, language) : t('expense'));
            return (
              <button
                key={template.id}
                type="button"
                onClick={() => handleQuickTemplate(template)}
                className="pressable flex shrink-0 items-center gap-2 rounded-2xl border border-line bg-panel px-3 py-2.5 backdrop-blur-xl"
              >
                <IconTile
                  icon={cat?.icon ?? (template.type === 'income' ? 'ArrowDownLeft' : 'Receipt')}
                  color={cat?.color ?? (template.type === 'income' ? '#0F9F7A' : '#6354E8')}
                  size={32}
                />
                <span className="max-w-[9.5rem] text-left">
                  <span className="block truncate text-[11px] font-bold text-ink">{title}</span>
                  <span
                    className={`block text-[10px] font-bold ${
                      template.type === 'income' ? 'text-mint' : 'text-coral'
                    }`}
                  >
                    {template.type === 'income' ? '+' : '−'}
                    {formatAmount(template.amount)}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </motion.section>

      {/* Budget pulse */}
      <motion.section variants={fadeUp} transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}>
        <Surface className="relative overflow-hidden p-4">
          <div
            className="pointer-events-none absolute -right-12 -top-16 h-40 w-40 rounded-full bg-accent/10 blur-2xl"
            aria-hidden="true"
          />
          {hasCustomBudget ? (
            <div className="relative flex items-center gap-4">
              <ProgressRing
                progress={snapshot.progress}
                size={98}
                stroke={9}
                from="var(--accent)"
                to="var(--mint)"
              >
                <AnimatedNumber
                  value={Math.round(snapshot.progress * 100)}
                  format={(n) => `${Math.round(n)}%`}
                  className="font-display text-lg font-bold text-ink"
                />
              </ProgressRing>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="eyebrow">{t('budget_pulse')}</p>
                  <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${statusClass}`}>
                    {statusLabel}
                  </span>
                </div>
                <p className="mt-1 font-display text-xl font-bold tracking-tight text-ink">
                  {formatAmount(Math.max(0, snapshot.remaining))}
                </p>
                <p className="text-[10px] text-faint">
                  {t('budget_remaining')} · {formatAmount(snapshot.perDaySafe)} {t('per_day')}
                </p>
                <div className="mt-2.5 flex items-center justify-between text-[10px] text-muted">
                  <span>
                    {t('spent_label')} {formatAmount(snapshot.spent)}
                  </span>
                  <span>{formatAmount(snapshot.budget)}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    haptic.selection();
                    setActiveTab('plan');
                  }}
                  className="mt-2 inline-flex items-center gap-0.5 text-[10px] font-bold text-accent"
                >
                  {t('edit_budget')}
                  <ChevronRight size={12} />
                </button>
              </div>
            </div>
          ) : (
            <div className="relative flex items-start gap-3.5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-accent-soft text-accent">
                <Target size={22} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-display text-sm font-semibold text-ink">{t('no_budget_title')}</p>
                <p className="mt-1 text-[11px] leading-relaxed text-muted">{t('no_budget_sub')}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {suggested > 0 && (
                    <button
                      type="button"
                      onClick={handleUseSuggested}
                      className="pressable rounded-full bg-accent px-3 py-1.5 text-[10px] font-bold text-white shadow-glow"
                    >
                      {t('use_suggested')} · {formatAmount(suggested)}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      haptic.selection();
                      setActiveTab('plan');
                    }}
                    className="pressable rounded-full border border-line bg-panel-inset px-3 py-1.5 text-[10px] font-bold text-ink"
                  >
                    {t('set_budget')}
                  </button>
                </div>
              </div>
            </div>
          )}
        </Surface>
      </motion.section>

      {/* Category pulse */}
      <motion.section variants={fadeUp} transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}>
        <SectionHeader
          title={t('where_it_goes')}
          actionLabel={t('see_insights')}
          onAction={() => {
            haptic.selection();
            setActiveTab('analytics');
          }}
          className="mb-2.5"
        />
        <Surface padded={false} className="divide-y divide-line/70 px-4 py-1">
          {breakdown.length === 0 ? (
            <div className="py-5">
              <EmptyState
                compact
                icon={<Sparkles size={20} />}
                title={t('no_month_data')}
                body={t('no_transactions_sub')}
              />
            </div>
          ) : (
            breakdown.map((item, index) => (
              <div key={item.id} className="flex items-center gap-3 py-3">
                <IconTile icon={item.icon} color={item.color} size={36} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-[12px] font-bold text-ink">
                      {getLocalizedCategoryName(item.name, language)}
                    </p>
                    <p className="shrink-0 font-mono text-[11px] font-bold text-ink">
                      {formatAmount(item.amount)}
                    </p>
                  </div>
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-panel-inset">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: item.color }}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.max(4, item.share)}%` }}
                        transition={{
                          duration: 0.7,
                          delay: 0.08 * index,
                          ease: [0.16, 1, 0.3, 1],
                        }}
                      />
                    </div>
                    <span className="w-8 text-right font-mono text-[9px] font-semibold text-faint">
                      {Math.round(item.share)}%
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
          {limitsCount > 0 && (
            <div className="flex items-center justify-between py-2.5 text-[10px] text-faint">
              <span>
                {limitsCount} {t('category_limits').toLowerCase()}
              </span>
              <button
                type="button"
                onClick={() => {
                  haptic.selection();
                  setActiveTab('plan');
                }}
                className="font-bold text-accent"
              >
                {t('view_plan')}
              </button>
            </div>
          )}
        </Surface>
      </motion.section>

      {/* Month rhythm */}
      <motion.section variants={fadeUp} transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}>
        <Surface className="overflow-hidden p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gold-soft text-gold">
                <CalendarDays size={16} />
              </span>
              <div>
                <p className="font-display text-[13px] font-semibold text-ink">{t('month_rhythm')}</p>
                <p className="text-[10px] text-faint">
                  {t('per_day')} · {formatAmount(avgPerDay)}
                </p>
              </div>
            </div>
            {streak.current >= 2 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-coral-soft px-2.5 py-1 text-[10px] font-bold text-coral">
                <Flame size={12} />
                {streak.current} {t('day_streak')}
              </span>
            )}
          </div>

          <div className="mt-3">
            <Sparkline
              data={daily.map((d) => d.expense)}
              height={64}
              color="var(--accent)"
              strokeWidth={2}
            />
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2 border-t border-line/70 pt-3">
            <div>
              <p className="text-[9px] uppercase tracking-wider text-faint">{t('today_spent')}</p>
              <p className="font-mono text-[11px] font-bold text-ink">{formatAmount(todaySpend)}</p>
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-wider text-faint">{t('per_day')}</p>
              <p className="font-mono text-[11px] font-bold text-ink">{formatAmount(avgPerDay)}</p>
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-wider text-faint">{t('peak_day')}</p>
              <p className="font-mono text-[11px] font-bold text-ink">
                {peakDay ? formatAmount(peakDay.expense) : '—'}
              </p>
            </div>
          </div>
        </Surface>
      </motion.section>

      {/* Goals */}
      {goals.length > 0 && (
        <motion.section variants={fadeUp} transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}>
          <SectionHeader
            title={t('goals')}
            actionLabel={t('view_plan')}
            onAction={() => {
              haptic.selection();
              setActiveTab('plan');
            }}
            className="mb-2.5"
          />
          <div className="-mx-4 flex gap-2.5 overflow-x-auto px-4 pb-1 no-scrollbar">
            {goals.slice(0, 3).map((goal) => {
              const progress = Math.min(1, goal.target > 0 ? goal.saved / goal.target : 0);
              return (
                <button
                  key={goal.id}
                  type="button"
                  onClick={() => {
                    haptic.selection();
                    setActiveTab('plan');
                  }}
                  className="pressable w-[10.5rem] shrink-0 rounded-2xl border border-line bg-panel p-3 text-left backdrop-blur-xl"
                >
                  <div className="flex items-center justify-between">
                    <span
                      className="flex h-8 w-8 items-center justify-center rounded-xl"
                      style={{ backgroundColor: `${goal.color}22`, color: goal.color }}
                    >
                      <CategoryIcon name={goal.icon} size={15} color={goal.color} />
                    </span>
                    <span className="font-mono text-[10px] font-bold text-muted">
                      {Math.round(progress * 100)}%
                    </span>
                  </div>
                  <p className="mt-2 truncate text-[11px] font-bold text-ink">{goal.name}</p>
                  <p className="text-[9px] text-faint">
                    {formatAmount(goal.saved)} / {formatAmount(goal.target)}
                  </p>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-panel-inset">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: goal.color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.max(4, progress * 100)}%` }}
                      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </motion.section>
      )}

      {/* Upcoming bills */}
      {upcoming.length > 0 && (
        <motion.section variants={fadeUp} transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}>
          <SectionHeader
            title={t('upcoming')}
            actionLabel={t('view_plan')}
            onAction={() => {
              haptic.selection();
              setActiveTab('plan');
            }}
            className="mb-2.5"
          />
          <Surface padded={false} className="divide-y divide-line/70 px-4 py-1">
            {upcoming.map(({ bill, daysLeft, paid }) => (
              <div key={bill.id} className="flex items-center gap-3 py-3">
                <IconTile icon={bill.icon} color={bill.color} size={36} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12px] font-bold text-ink">{bill.name}</p>
                  <p className="text-[10px] text-faint">
                    {paid
                      ? t('paid')
                      : daysLeft <= 0
                        ? t('due_today')
                        : t('due_in').replace('{n}', String(daysLeft))}
                    {' · '}
                    {formatDayLabel(billDueDate(bill, now), locale)}
                  </p>
                </div>
                <span className="font-mono text-[11px] font-bold text-ink">
                  {formatAmount(bill.amount)}
                </span>
                <button
                  type="button"
                  onClick={() => void handlePayBill(bill)}
                  disabled={paid || payingId === bill.id}
                  aria-label={`${t('mark_paid')} ${bill.name}`}
                  className={`pressable flex h-7 w-7 items-center justify-center rounded-full border ${
                    paid
                      ? 'border-mint/30 bg-mint-soft text-mint'
                      : 'border-line bg-panel-inset text-muted hover:text-mint'
                  } disabled:opacity-60`}
                >
                  <Check size={13} />
                </button>
              </div>
            ))}
          </Surface>
        </motion.section>
      )}

      {/* Recent activity */}
      <motion.section variants={fadeUp} transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}>
        <SectionHeader
          title={t('recent_activity')}
          actionLabel={t('view_all')}
          onAction={() => {
            haptic.selection();
            setActiveTab('history');
          }}
          className="mb-2.5"
        />
        <Surface padded={false} className="px-4 py-1">
          {recent.length === 0 ? (
            <div className="py-6">
              <EmptyState
                compact
                icon={<Wallet size={20} />}
                title={t('no_transactions')}
                body={t('no_transactions_sub')}
                actionLabel={t('add')}
                onAction={() => openAdd('expense')}
              />
            </div>
          ) : (
            <div className="divide-y divide-line/70">
              {recent.map((tx: Transaction, index: number) => {
                const cat = categoryOf(categories, tx.category_id);
                const title =
                  stripTags(tx.note) ||
                  (cat ? getLocalizedCategoryName(cat.name, language) : t('expense'));
                const todayKey = dayKey(now);
                const yesterday = new Date(now);
                yesterday.setDate(now.getDate() - 1);
                const key = dayKey(new Date(tx.date));
                const dateLabel =
                  key === todayKey
                    ? t('today')
                    : key === dayKey(yesterday)
                      ? t('yesterday')
                      : formatDayLabel(tx.date, locale);

                return (
                  <motion.button
                    key={tx.id}
                    type="button"
                    onClick={() => {
                      haptic.selection();
                      setSelectedTransaction(tx);
                    }}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.04 * index, duration: 0.3 }}
                    className="flex w-full items-center gap-3 py-3 text-left"
                  >
                    <IconTile
                      icon={cat?.icon ?? (tx.type === 'income' ? 'ArrowDownLeft' : 'Receipt')}
                      color={cat?.color ?? (tx.type === 'income' ? '#0F9F7A' : '#94A3B8')}
                      size={38}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12px] font-bold text-ink">{title}</p>
                      <p className="truncate text-[10px] text-faint">
                        {cat ? getLocalizedCategoryName(cat.name, language) : t('expense')} ·{' '}
                        {dateLabel}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 font-mono text-[12px] font-bold ${
                        tx.type === 'income' ? 'text-mint' : 'text-ink'
                      }`}
                    >
                      {formatAmount(tx.type === 'expense' ? -tx.amount : tx.amount, true)}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          )}
        </Surface>
      </motion.section>

      <motion.div variants={fadeUp} className="flex items-center justify-center gap-1.5 pt-1 text-[9px] font-semibold uppercase tracking-widest2 text-faint">
        <Zap size={10} />
        {t('app_name')} · {t('app_subtitle')}
      </motion.div>
    </motion.div>
  );
};
