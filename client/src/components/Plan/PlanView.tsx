import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  CalendarClock,
  Check,
  ChevronRight,
  CircleDollarSign,
  Gauge,
  PiggyBank,
  Plus,
  Receipt,
  Sparkles,
  Target,
  Trash2,
  Wallet,
} from 'lucide-react';
import { useTelegram } from '../../context/TelegramContext';
import { useCategoryStore } from '../../stores/categoryStore';
import { usePlanStore } from '../../stores/planStore';
import { useSettingsStore, useTranslation } from '../../stores/settingsStore';
import { useToastStore } from '../../stores/toastStore';
import { useTransactionStore } from '../../stores/transactionStore';
import type { PaymentMethod } from '../../types/models';
import {
  billDueDate,
  budgetSnapshot,
  categoryBreakdown,
  formatDayLabel,
  monthlyBillsTotal,
  monthlyTotals,
  suggestedBudget,
  upcomingBills,
} from '../../utils/finance';
import { getLocalizedCategoryName } from '../../utils/translations';
import { CategoryIcon } from '../glass/CategoryIcon';
import { CategoryPicker } from '../ExpenseLogging/CategoryPicker';
import { Chip } from '../ui/Chip';
import { EmptyState } from '../ui/EmptyState';
import { IconTile } from '../ui/IconTile';
import { ProgressRing } from '../ui/ProgressRing';
import { SectionHeader } from '../ui/SectionHeader';
import { Sheet } from '../ui/Sheet';
import { Surface } from '../ui/Surface';

const GOAL_ICONS = ['Target', 'Plane', 'Home', 'Car', 'GraduationCap', 'HeartPulse', 'Laptop', 'Gift'];
const GOAL_COLORS = ['#8B7CFF', '#0F9F7A', '#DD4B65', '#B8860B', '#38BDF8', '#F472B6'];

type SheetMode = 'budget' | 'limit' | 'goal' | 'bill' | 'contribute' | null;

const inputClass =
  'w-full rounded-2xl border border-line bg-panel-inset px-3.5 py-2.5 text-[13px] text-ink placeholder:text-faint focus:border-accent/40 focus:outline-none';

const Field: React.FC<{ label: string; hint?: string; children: React.ReactNode }> = ({
  label,
  hint,
  children,
}) => (
  <label className="block">
    <span className="mb-1.5 flex items-baseline justify-between">
      <span className="eyebrow">{label}</span>
      {hint && <span className="text-[9px] text-faint">{hint}</span>}
    </span>
    {children}
  </label>
);

export const PlanView: React.FC = () => {
  const { haptic } = useTelegram();
  const { transactions } = useTransactionStore();
  const { categories, getCategoriesByType } = useCategoryStore();
  const { formatAmount } = useSettingsStore();
  const { t, language } = useTranslation();
  const {
    monthlyBudget,
    categoryBudgets,
    goals,
    bills,
    setMonthlyBudget,
    setCategoryBudget,
    removeCategoryBudget,
    addGoal,
    contributeToGoal,
    deleteGoal,
    addBill,
    deleteBill,
    markBillPaid,
  } = usePlanStore();
  const showToast = useToastStore((s) => s.show);

  const now = new Date();
  const locale = language === 'ru' ? 'ru-RU' : 'en-US';
  const totals = useMemo(() => monthlyTotals(transactions, now), [transactions]);
  const breakdown = useMemo(
    () => categoryBreakdown(transactions, categories, now, 'expense'),
    [transactions, categories],
  );
  const spendByCategory = useMemo(
    () => new Map(breakdown.map((item) => [item.id, item])),
    [breakdown],
  );
  const suggested = useMemo(() => suggestedBudget(transactions, now), [transactions]);
  const effectiveBudget = monthlyBudget > 0 ? monthlyBudget : suggested;
  const snap = useMemo(
    () => budgetSnapshot(totals.expense, effectiveBudget, now, now),
    [totals.expense, effectiveBudget],
  );
  const upcoming = useMemo(() => upcomingBills(bills, now), [bills]);
  const billsTotal = monthlyBillsTotal(bills);
  const goalsSaved = goals.reduce((sum, g) => sum + g.saved, 0);
  const goalsTarget = goals.reduce((sum, g) => sum + g.target, 0);

  const expenseCategories = getCategoriesByType('expense');
  const limits = Object.entries(categoryBudgets)
    .map(([id, limit]) => {
      const cat = categories.find((c) => c.id === id);
      const spend = spendByCategory.get(id)?.amount ?? 0;
      return { id, limit, cat, spend };
    })
    .sort((a, b) => b.spend / Math.max(1, b.limit) - a.spend / Math.max(1, a.limit));

  const [sheet, setSheet] = useState<SheetMode>(null);
  const [budgetDraft, setBudgetDraft] = useState('');
  const [limitCategoryId, setLimitCategoryId] = useState('');
  const [limitDraft, setLimitDraft] = useState('');
  const [goalDraft, setGoalDraft] = useState({
    name: '',
    target: '',
    icon: 'Target',
    color: GOAL_COLORS[0],
    deadline: '',
  });
  const [billDraft, setBillDraft] = useState({
    name: '',
    amount: '',
    day: '1',
    categoryId: '',
    payment: 'Card' as PaymentMethod,
  });
  const [contributeGoalId, setContributeGoalId] = useState<string | null>(null);
  const [contributeDraft, setContributeDraft] = useState('');
  const [payingId, setPayingId] = useState<string | null>(null);

  const openBudget = () => {
    haptic.selection();
    setBudgetDraft(String(monthlyBudget > 0 ? monthlyBudget : suggested || ''));
    setSheet('budget');
  };

  const openLimit = (categoryId?: string) => {
    haptic.selection();
    const initial = categoryId ?? expenseCategories[0]?.id ?? '';
    setLimitCategoryId(initial);
    setLimitDraft(String(categoryBudgets[initial] ?? ''));
    setSheet('limit');
  };

  const openGoal = () => {
    haptic.selection();
    setGoalDraft({ name: '', target: '', icon: 'Target', color: GOAL_COLORS[0], deadline: '' });
    setSheet('goal');
  };

  const openBill = () => {
    haptic.selection();
    const first = expenseCategories[0];
    setBillDraft({
      name: '',
      amount: '',
      day: '1',
      categoryId: first?.id ?? '',
      payment: 'Card',
    });
    setSheet('bill');
  };

  const openContribute = (goalId: string) => {
    haptic.selection();
    setContributeGoalId(goalId);
    setContributeDraft('');
    setSheet('contribute');
  };

  const closeSheet = () => setSheet(null);

  const handleSave = () => {
    haptic.notification('success');

    if (sheet === 'budget') {
      const value = Math.max(0, Number(budgetDraft) || 0);
      setMonthlyBudget(value);
      showToast(`${t('monthly_budget')} · ${formatAmount(value)}`, 'success');
    } else if (sheet === 'limit' && limitCategoryId) {
      const value = Math.max(0, Number(limitDraft) || 0);
      if (value <= 0) {
        removeCategoryBudget(limitCategoryId);
      } else {
        setCategoryBudget(limitCategoryId, value);
      }
      showToast(t('category_limits'), 'success');
    } else if (sheet === 'goal') {
      if (!goalDraft.name.trim() || !(Number(goalDraft.target) > 0)) {
        showToast(t('enter_amount'), 'error');
        return;
      }
      addGoal({
        name: goalDraft.name,
        target: Number(goalDraft.target),
        icon: goalDraft.icon,
        color: goalDraft.color,
        deadline: goalDraft.deadline ? new Date(`${goalDraft.deadline}T12:00:00`).toISOString() : undefined,
      });
      showToast(t('savings_goals'), 'success');
    } else if (sheet === 'bill') {
      if (!billDraft.name.trim() || !(Number(billDraft.amount) > 0)) {
        showToast(t('enter_amount'), 'error');
        return;
      }
      const cat = categories.find((c) => c.id === billDraft.categoryId);
      addBill({
        name: billDraft.name,
        amount: Number(billDraft.amount),
        day: Number(billDraft.day),
        category_id: billDraft.categoryId || null,
        icon: cat?.icon ?? 'Receipt',
        color: cat?.color ?? '#5EEAD4',
        payment_method: billDraft.payment,
      });
      showToast(t('recurring_bills'), 'success');
    } else if (sheet === 'contribute' && contributeGoalId) {
      const value = Number(contributeDraft) || 0;
      if (value <= 0) {
        showToast(t('enter_amount'), 'error');
        return;
      }
      contributeToGoal(contributeGoalId, value);
      showToast(t('saved_label'), 'success');
    }

    closeSheet();
  };

  const handlePayBill = async (id: string, name: string) => {
    haptic.impact('medium');
    setPayingId(id);
    try {
      await markBillPaid(id);
      showToast(`${name} · ${t('paid')}`, 'success');
    } finally {
      setPayingId(null);
    }
  };

  const selectedBillCategory = categories.find((c) => c.id === billDraft.categoryId);
  const sheetTitles: Record<Exclude<SheetMode, null>, string> = {
    budget: t('edit_budget'),
    limit: t('set_limit'),
    goal: t('new_goal'),
    bill: t('new_bill'),
    contribute: t('add_funds'),
  };

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="px-1">
        <p className="eyebrow">{t('plan')}</p>
        <h1 className="mt-0.5 font-display text-[22px] font-bold tracking-tight text-ink">
          {t('plan_title')}
        </h1>
        <p className="mt-1 text-[11px] text-muted">{t('plan_sub')}</p>
      </div>

      {/* Budget */}
      <Surface className="relative overflow-hidden p-4">
        <div
          className="pointer-events-none absolute -right-14 -top-16 h-44 w-44 rounded-full bg-accent/10 blur-2xl"
          aria-hidden="true"
        />
        <div className="relative flex items-center justify-between">
          <p className="eyebrow">{t('monthly_budget')}</p>
          <button
            type="button"
            onClick={openBudget}
            className="pressable flex items-center gap-1 rounded-full border border-line bg-panel-inset px-2.5 py-1 text-[10px] font-bold text-ink"
          >
            {t('edit_budget')}
            <ChevronRight size={11} />
          </button>
        </div>

        {effectiveBudget > 0 ? (
          <div className="relative mt-3 flex items-center gap-4">
            <ProgressRing
              progress={snap.progress}
              size={106}
              stroke={10}
              from="var(--accent)"
              to="var(--mint)"
            >
              <span className="font-display text-xl font-bold text-ink">
                {Math.round(snap.progress * 100)}%
              </span>
            </ProgressRing>
            <div className="min-w-0 flex-1 space-y-1.5">
              <div>
                <p className="font-display text-[22px] font-bold leading-none text-ink">
                  {formatAmount(Math.max(0, snap.remaining))}
                </p>
                <p className="mt-1 text-[10px] text-faint">{t('left_to_spend')}</p>
              </div>
              <div className="flex items-center gap-2 text-[10px]">
                <span className="rounded-full bg-panel-inset px-2 py-0.5 font-semibold text-muted">
                  {t('spent_label')} {formatAmount(snap.spent)}
                </span>
                <span className="rounded-full bg-panel-inset px-2 py-0.5 font-semibold text-muted">
                  {formatAmount(snap.budget)}
                </span>
              </div>
              <p className="text-[10px] text-muted">
                {formatAmount(snap.perDaySafe)} {t('per_day')} ·{' '}
                <span className={snap.status === 'over' ? 'text-coral' : 'text-mint'}>
                  {snap.status === 'over' ? t('over_pace') : t('on_track')}
                </span>
              </p>
              {!monthlyBudget && (
                <p className="flex items-center gap-1 text-[9px] font-bold text-accent">
                  <Sparkles size={10} />
                  {t('use_suggested')}: {formatAmount(suggested)}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="relative mt-3 flex items-center gap-3 rounded-2xl border border-dashed border-line-strong p-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent-soft text-accent">
              <Target size={20} />
            </span>
            <div className="flex-1">
              <p className="text-[11px] font-bold text-ink">{t('no_budget_title')}</p>
              <p className="text-[10px] text-faint">{t('no_budget_sub')}</p>
            </div>
            <button
              type="button"
              onClick={openBudget}
              className="pressable shrink-0 rounded-full bg-accent px-3 py-1.5 text-[10px] font-bold text-white"
            >
              {t('set_budget')}
            </button>
          </div>
        )}
      </Surface>

      {/* Category limits */}
      <section>
        <SectionHeader
          title={t('category_limits')}
          actionLabel={t('add_limit')}
          onAction={() => openLimit()}
          className="mb-2.5"
        />
        {limits.length === 0 ? (
          <Surface>
            <EmptyState
              compact
              icon={<Gauge size={20} />}
              title={t('no_limits')}
              body={t('no_limits_sub')}
              actionLabel={t('add_limit')}
              onAction={() => openLimit()}
            />
          </Surface>
        ) : (
          <Surface padded={false} className="divide-y divide-line/70 px-4 py-1">
            {limits.map(({ id, limit, cat, spend }) => {
              const ratio = limit > 0 ? spend / limit : 0;
              const over = spend > limit;
              const color = cat?.color ?? 'var(--accent)';
              return (
                <div key={id} className="flex items-center gap-3 py-3">
                  <IconTile icon={cat?.icon ?? 'CircleDashed'} color={color} size={34} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-[11px] font-bold text-ink">
                        {cat ? getLocalizedCategoryName(cat.name, language) : t('expense')}
                      </p>
                      <p
                        className={`shrink-0 font-mono text-[10px] font-bold ${
                          over ? 'text-coral' : 'text-muted'
                        }`}
                      >
                        {formatAmount(spend)} / {formatAmount(limit)}
                      </p>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-panel-inset">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: over ? 'var(--coral)' : color }}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, Math.max(3, ratio * 100))}%` }}
                        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => openLimit(id)}
                    aria-label={t('edit')}
                    className="pressable flex h-7 w-7 items-center justify-center rounded-full bg-panel-inset text-faint hover:text-ink"
                  >
                    <ChevronRight size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      haptic.impact('light');
                      removeCategoryBudget(id);
                      showToast(t('remove'), 'default');
                    }}
                    aria-label={t('remove')}
                    className="pressable flex h-7 w-7 items-center justify-center rounded-full bg-panel-inset text-faint hover:text-coral"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              );
            })}
          </Surface>
        )}
      </section>

      {/* Goals */}
      <section>
        <SectionHeader
          title={t('savings_goals')}
          actionLabel={t('new_goal')}
          onAction={openGoal}
          className="mb-2.5"
        />
        {goals.length === 0 ? (
          <Surface>
            <EmptyState
              compact
              icon={<PiggyBank size={20} />}
              title={t('no_goals_short')}
              body={t('goals_sub')}
              actionLabel={t('add_goal')}
              onAction={openGoal}
            />
          </Surface>
        ) : (
          <>
            <div className="mb-2 flex items-center justify-between rounded-2xl border border-line bg-panel-inset px-3 py-2 text-[10px] text-muted">
              <span>
                {t('saved_label')} <strong className="text-ink">{formatAmount(goalsSaved)}</strong>
              </span>
              <span>
                {t('of_target')} <strong className="text-ink">{formatAmount(goalsTarget)}</strong>
              </span>
            </div>
            <div className="space-y-2.5">
              {goals.map((goal) => {
                const progress = Math.min(1, goal.target > 0 ? goal.saved / goal.target : 0);
                const completed = goal.saved >= goal.target;
                return (
                  <Surface key={goal.id} className="p-3.5">
                    <div className="flex items-center gap-3">
                      <ProgressRing
                        progress={progress}
                        size={58}
                        stroke={6}
                        from={goal.color}
                        to={goal.color}
                        track="var(--line)"
                      >
                        <CategoryIcon name={goal.icon} size={18} color={goal.color} />
                      </ProgressRing>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="truncate text-[12px] font-bold text-ink">{goal.name}</p>
                          {completed && (
                            <span className="rounded-full bg-mint-soft px-1.5 py-0.5 text-[8px] font-bold text-mint">
                              {t('completed')}
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 font-mono text-[10px] text-muted">
                          {formatAmount(goal.saved)}{' '}
                          <span className="text-faint">/ {formatAmount(goal.target)}</span>
                        </p>
                        <div className="mt-1 flex items-center gap-2 text-[9px] text-faint">
                          {goal.deadline && (
                            <span className="inline-flex items-center gap-1">
                              <CalendarClock size={10} />
                              {new Date(goal.deadline).toLocaleDateString(locale, {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                          )}
                          <span>{Math.round(progress * 100)}%</span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openContribute(goal.id)}
                          className="pressable flex items-center gap-1 rounded-full bg-accent-soft px-2.5 py-1 text-[9px] font-bold text-accent"
                        >
                          <Plus size={11} />
                          {t('add_funds')}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(t('delete_goal_confirm'))) {
                              haptic.notification('warning');
                              deleteGoal(goal.id);
                            }
                          }}
                          aria-label={t('delete')}
                          className="pressable text-faint hover:text-coral"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </Surface>
                );
              })}
            </div>
          </>
        )}
      </section>

      {/* Recurring bills */}
      <section>
        <SectionHeader
          title={t('recurring_bills')}
          actionLabel={t('new_bill')}
          onAction={openBill}
          className="mb-2.5"
        />
        {bills.length === 0 ? (
          <Surface>
            <EmptyState
              compact
              icon={<Receipt size={20} />}
              title={t('no_bills')}
              body={t('no_bills_sub')}
              actionLabel={t('new_bill')}
              onAction={openBill}
            />
          </Surface>
        ) : (
          <>
            <div className="mb-2 flex items-center justify-between rounded-2xl border border-line bg-panel-inset px-3 py-2 text-[10px] text-muted">
              <span className="inline-flex items-center gap-1.5">
                <CircleDollarSign size={12} className="text-accent" />
                {t('monthly_commitments')}
              </span>
              <strong className="font-mono text-ink">
                {formatAmount(billsTotal)}
                <span className="font-body text-[9px] text-faint">{t('per_month')}</span>
              </strong>
            </div>
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
                    onClick={() => void handlePayBill(bill.id, bill.name)}
                    disabled={paid || payingId === bill.id}
                    aria-label={t('mark_paid')}
                    className={`pressable flex h-7 w-7 items-center justify-center rounded-full border ${
                      paid
                        ? 'border-mint/30 bg-mint-soft text-mint'
                        : 'border-line bg-panel-inset text-muted hover:text-mint'
                    } disabled:opacity-60`}
                  >
                    <Check size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(t('delete_bill_confirm'))) {
                        haptic.notification('warning');
                        deleteBill(bill.id);
                      }
                    }}
                    aria-label={t('delete')}
                    className="pressable flex h-7 w-7 items-center justify-center rounded-full bg-panel-inset text-faint hover:text-coral"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </Surface>
          </>
        )}
      </section>

      {/* Planner sheet */}
      <Sheet
        open={sheet !== null}
        onClose={closeSheet}
        title={sheet ? sheetTitles[sheet] : ''}
        subtitle={sheet === 'budget' ? `${t('suggested')}: ${formatAmount(suggested)}` : undefined}
        footer={
          <div className="flex gap-2">
            <button
              type="button"
              onClick={closeSheet}
              className="pressable flex-1 rounded-2xl border border-line bg-panel-inset py-3 text-[12px] font-bold text-muted"
            >
              {t('cancel')}
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="pressable flex-[1.6] rounded-2xl bg-gradient-to-r from-accent to-accent-2 py-3 text-[12px] font-bold text-white shadow-glow"
            >
              {t('save')}
            </button>
          </div>
        }
      >
        <div className="space-y-4 pb-1">
          {sheet === 'budget' && (
            <>
              <Field label={t('monthly_budget')} hint={`${t('suggested')}: ${formatAmount(suggested)}`}>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-xs text-faint">
                    {useSettingsStore.getState().currencyConfig.symbol}
                  </span>
                  <input
                    type="number"
                    inputMode="decimal"
                    min={0}
                    value={budgetDraft}
                    onChange={(e) => setBudgetDraft(e.target.value)}
                    placeholder="0"
                    className={`${inputClass} pl-8 font-mono`}
                  />
                </div>
              </Field>
              {suggested > 0 && (
                <Chip
                  size="sm"
                  active={Number(budgetDraft) === suggested}
                  accent="var(--accent)"
                  icon={<Sparkles size={11} />}
                  onClick={() => setBudgetDraft(String(suggested))}
                >
                  {t('use_suggested')} · {formatAmount(suggested)}
                </Chip>
              )}
              <p className="text-[10px] leading-relaxed text-faint">{t('no_budget_sub')}</p>
            </>
          )}

          {sheet === 'limit' && (
            <>
              <CategoryPicker
                selectedCategoryId={limitCategoryId}
                onSelectCategory={setLimitCategoryId}
                type="expense"
                onOpenManageCategories={() => undefined}
              />
              <Field label={t('limit')}>
                <input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  value={limitDraft}
                  onChange={(e) => setLimitDraft(e.target.value)}
                  placeholder="0"
                  className={`${inputClass} font-mono`}
                />
              </Field>
            </>
          )}

          {sheet === 'goal' && (
            <>
              <Field label={t('goal_name')}>
                <input
                  value={goalDraft.name}
                  onChange={(e) => setGoalDraft({ ...goalDraft, name: e.target.value })}
                  placeholder={t('goal_name')}
                  className={inputClass}
                />
              </Field>
              <Field label={t('target_amount')}>
                <input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  value={goalDraft.target}
                  onChange={(e) => setGoalDraft({ ...goalDraft, target: e.target.value })}
                  placeholder="0"
                  className={`${inputClass} font-mono`}
                />
              </Field>
              <Field label={t('target_date')} hint={t('optional')}>
                <input
                  type="date"
                  value={goalDraft.deadline}
                  onChange={(e) => setGoalDraft({ ...goalDraft, deadline: e.target.value })}
                  className={inputClass}
                />
              </Field>
              <div>
                <p className="eyebrow mb-2">{t('select_icon')}</p>
                <div className="flex flex-wrap gap-2">
                  {GOAL_ICONS.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setGoalDraft({ ...goalDraft, icon })}
                      className={`flex h-10 w-10 items-center justify-center rounded-xl border transition-all ${
                        goalDraft.icon === icon
                          ? 'border-transparent text-white'
                          : 'border-line bg-panel-inset text-muted'
                      }`}
                      style={
                        goalDraft.icon === icon
                          ? { backgroundColor: goalDraft.color }
                          : undefined
                      }
                    >
                      <CategoryIcon name={icon} size={17} />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="eyebrow mb-2">{t('select_color')}</p>
                <div className="flex flex-wrap gap-2">
                  {GOAL_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setGoalDraft({ ...goalDraft, color })}
                      aria-label={color}
                      className={`h-8 w-8 rounded-full transition-transform ${
                        goalDraft.color === color ? 'scale-110 ring-2 ring-ink ring-offset-2 ring-offset-panel-solid' : ''
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </>
          )}

          {sheet === 'bill' && (
            <>
              <Field label={t('bill_name')}>
                <input
                  value={billDraft.name}
                  onChange={(e) => setBillDraft({ ...billDraft, name: e.target.value })}
                  placeholder="Netflix, Rent..."
                  className={inputClass}
                />
              </Field>
              <div className="grid grid-cols-2 gap-2.5">
                <Field label={t('amount_label')}>
                  <input
                    type="number"
                    inputMode="decimal"
                    min={0}
                    value={billDraft.amount}
                    onChange={(e) => setBillDraft({ ...billDraft, amount: e.target.value })}
                    placeholder="0"
                    className={`${inputClass} font-mono`}
                  />
                </Field>
                <Field label={t('due_day')}>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={31}
                    value={billDraft.day}
                    onChange={(e) => setBillDraft({ ...billDraft, day: e.target.value })}
                    className={`${inputClass} font-mono`}
                  />
                </Field>
              </div>
              <div>
                <p className="eyebrow mb-2">{t('categories')}</p>
                <div className="flex flex-wrap gap-1.5">
                  {expenseCategories.slice(0, 8).map((cat) => {
                    const active = billDraft.categoryId === cat.id;
                    return (
                      <Chip
                        key={cat.id}
                        size="sm"
                        active={active}
                        accent={cat.color}
                        icon={<CategoryIcon name={cat.icon} size={10} color={active ? '#fff' : cat.color} />}
                        onClick={() => setBillDraft({ ...billDraft, categoryId: cat.id })}
                      >
                        {getLocalizedCategoryName(cat.name, language)}
                      </Chip>
                    );
                  })}
                </div>
              </div>
              <div>
                <p className="eyebrow mb-2">{t('payment_method')}</p>
                <div className="flex gap-2">
                  <Chip
                    active={billDraft.payment === 'Card'}
                    accent="var(--accent)"
                    onClick={() => setBillDraft({ ...billDraft, payment: 'Card' })}
                    className="flex-1 justify-center"
                  >
                    {t('card')}
                  </Chip>
                  <Chip
                    active={billDraft.payment === 'Cash'}
                    accent="var(--accent)"
                    onClick={() => setBillDraft({ ...billDraft, payment: 'Cash' })}
                    className="flex-1 justify-center"
                  >
                    {t('cash')}
                  </Chip>
                </div>
              </div>
              {selectedBillCategory && (
                <p className="text-[10px] text-faint">
                  {t('saving_for')}: {getLocalizedCategoryName(selectedBillCategory.name, language)}
                </p>
              )}
            </>
          )}

          {sheet === 'contribute' && (
            <>
              <Field label={t('add_funds')}>
                <input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  value={contributeDraft}
                  onChange={(e) => setContributeDraft(e.target.value)}
                  placeholder="0"
                  className={`${inputClass} font-mono`}
                  autoFocus
                />
              </Field>
              <div className="flex flex-wrap gap-2">
                {[10, 25, 50, 100].map((amount) => (
                  <Chip
                    key={amount}
                    size="sm"
                    accent="var(--accent)"
                    active={Number(contributeDraft) === amount}
                    icon={<Wallet size={11} />}
                    onClick={() => setContributeDraft(String(amount))}
                  >
                    +{formatAmount(amount)}
                  </Chip>
                ))}
              </div>
              <p className="text-[10px] text-faint">
                {goals.find((g) => g.id === contributeGoalId)?.name}
              </p>
            </>
          )}
        </div>
      </Sheet>
    </motion.div>
  );
};
