import { useMemo, useState } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowRight,
  Eye,
  EyeOff,
  Plus,
  Target,
  Wallet,
} from 'lucide-react';
import { useTelegram } from '../../context/TelegramContext';
import { useCategoryStore } from '../../stores/categoryStore';
import { usePlanStore } from '../../stores/planStore';
import { useSettingsStore, useTranslation } from '../../stores/settingsStore';
import { useTransactionStore } from '../../stores/transactionStore';
import { useUIStore } from '../../stores/uiStore';
import {
  budgetSnapshot,
  formatDayLabel,
  monthlyTotals,
  recentTemplates,
  totalsOf,
  upcomingBills,
} from '../../utils/finance';
import { getLocalizedCategoryName } from '../../utils/translations';
import { IconTile } from '../ui/IconTile';
import { MonthSwitcher } from '../ui/MonthSwitcher';
import { SectionHeader } from '../ui/SectionHeader';
import { Surface } from '../ui/Surface';
import { EmptyState } from '../ui/EmptyState';
import { SpendingTrend } from '../Analytics/SpendingTrend';
import { CategoryBreakdown } from '../Analytics/CategoryBreakdown';

export function DashboardView() {
  const { haptic } = useTelegram();
  const transactions = useTransactionStore((s) => s.transactions);
  const categories = useCategoryStore((s) => s.categories);
  const { startingBalance, formatAmount } = useSettingsStore();
  const { t, language } = useTranslation();
  const { monthlyBudget, goals, bills } = usePlanStore();
  const {
    setActiveTab,
    openAddTransaction,
    setSelectedTransaction,
    resetFilters,
    viewMonth,
    setViewMonth,
  } = useUIStore();
  const [hidden, setHidden] = useState(
    () => localStorage.getItem('vault_balance_hidden') === 'true',
  );
  const locale = language === 'ru' ? 'ru-RU' : 'en-US';
  const totals = useMemo(
    () => monthlyTotals(transactions, viewMonth),
    [transactions, viewMonth],
  );
  const balance = startingBalance + totalsOf(transactions).net;
  const snapshot = budgetSnapshot(totals.expense, monthlyBudget, viewMonth);
  const templates = recentTemplates(transactions, 4);
  const upcoming = upcomingBills(bills)
    .filter((item) => !item.paid)
    .slice(0, 2);
  const recent = useMemo(
    () =>
      [...transactions]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 4),
    [transactions],
  );
  const openPlan = () => {
    haptic.selection();
    setActiveTab('plan');
  };

  return (
    <div className="dashboard-content space-y-6">
      <div className="page-heading">
        <p className="eyebrow">{t('overview_sub')}</p>
        <h1>{t('overview_title')}</h1>
      </div>
      <section className="balance-card" aria-label={t('total_balance')}>
        <div className="balance-art" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-sm text-hero-muted">
            <Wallet size={15} />
            <span>{t('total_balance')}</span>
            <button
              type="button"
              className="ml-auto flex h-9 w-9 items-center justify-center rounded-full text-hero-muted hover:bg-white/10 hover:text-white"
              aria-label={t(hidden ? 'show_balance' : 'hide_balance')}
              aria-pressed={hidden}
              onClick={() => {
                setHidden(!hidden);
                localStorage.setItem('vault_balance_hidden', String(!hidden));
              }}
            >
              {hidden ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
          <p className="balance-value" aria-live="polite">
            {hidden ? '••••••' : formatAmount(balance)}
          </p>
          <p className="mt-2 text-xs text-hero-muted">
            {t('all_time_balance')}
          </p>
          <div className="mt-7 grid grid-cols-2 gap-3">
            <button
              type="button"
              className="balance-action balance-action-primary"
              onClick={() => {
                haptic.impact('light');
                openAddTransaction('expense');
              }}
            >
              <ArrowUpRight size={18} />
              {t('expense')}
            </button>
            <button
              type="button"
              className="balance-action"
              onClick={() => {
                haptic.impact('light');
                openAddTransaction('income');
              }}
            >
              <ArrowDownLeft size={18} />
              {t('income')}
            </button>
          </div>
        </div>
      </section>
      <section aria-label={t('month_summary')}>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-muted">
            {t('monthly_overview')}
          </h2>
          <MonthSwitcher
            value={viewMonth}
            onChange={setViewMonth}
            language={language}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Surface className="metric-card">
            <span className="metric-icon bg-mint-soft text-mint">
              <ArrowDownLeft size={18} />
            </span>
            <p className="mt-3 text-xs text-muted">{t('income')}</p>
            <p className="mt-1 font-num text-xl font-semibold">
              {formatAmount(totals.income)}
            </p>
          </Surface>
          <Surface className="metric-card">
            <span className="metric-icon bg-coral-soft text-coral">
              <ArrowUpRight size={18} />
            </span>
            <p className="mt-3 text-xs text-muted">{t('expenses')}</p>
            <p className="mt-1 font-num text-xl font-semibold">
              {formatAmount(totals.expense)}
            </p>
          </Surface>
        </div>
      </section>
      <SpendingTrend month={viewMonth} />
      <Surface className="budget-card">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <span className="metric-icon bg-accent-soft text-accent">
              <Target size={18} />
            </span>
            <h2 className="section-title">{t('monthly_budget')}</h2>
          </div>
          <button
            type="button"
            onClick={openPlan}
            aria-label={t('edit_budget')}
            className="icon-button"
          >
            <ArrowUpRight size={18} />
          </button>
        </div>
        {monthlyBudget > 0 ? (
          <>
            <div className="mt-5 flex flex-wrap items-baseline justify-between gap-2">
              <p className="font-num text-2xl font-semibold">
                {formatAmount(Math.abs(snapshot.remaining))}
                <span className="ml-2 font-sans text-xs font-normal text-muted">
                  {t(
                    snapshot.remaining < 0
                      ? 'budget_exceeded'
                      : 'left_to_spend',
                  )}
                </span>
              </p>
              <span
                className={`text-xs font-semibold ${snapshot.progress >= 1 ? 'text-coral' : 'text-muted'}`}
              >
                {Math.round(snapshot.progress * 100)}%
              </span>
            </div>
            <div
              className="budget-track mt-4"
              role="progressbar"
              aria-label={t('monthly_budget')}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.min(100, Math.round(snapshot.progress * 100))}
              aria-valuetext={`${formatAmount(totals.expense)} / ${formatAmount(monthlyBudget)}`}
            >
              <span
                style={{
                  width: `${Math.min(100, snapshot.progress * 100)}%`,
                  background:
                    snapshot.progress >= 1 ? 'var(--coral)' : 'var(--accent)',
                }}
              />
              <i
                style={{
                  left: `${(snapshot.daysElapsed / snapshot.daysTotal) * 100}%`,
                }}
              />
            </div>
            <div className="mt-3 flex flex-wrap justify-between gap-2 text-xs text-muted">
              <span>
                {t('spent_label')} {formatAmount(totals.expense)} /{' '}
                {formatAmount(monthlyBudget)}
              </span>
              <span>
                {snapshot.daysLeft > 0
                  ? `${formatAmount(snapshot.perDaySafe)} ${t('per_day')}`
                  : t('budget_closed')}
              </span>
            </div>
          </>
        ) : (
          <div className="mt-4">
            <p className="max-w-xs text-sm leading-relaxed text-muted">
              {t('budget_setup_hint')}
            </p>
            <button
              type="button"
              className="mt-4 flex items-center gap-2 text-sm font-semibold text-accent"
              onClick={openPlan}
            >
              {t('set_budget')}
              <ArrowRight size={16} />
            </button>
          </div>
        )}
      </Surface>
      <CategoryBreakdown month={viewMonth} compact />
      {templates.length > 0 && (
        <section>
          <SectionHeader title={t('quick_entry')} className="mb-3" />
          <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
            {templates.map((template) => {
              const cat = categories.find((c) => c.id === template.category_id);
              return (
                <button
                  key={template.id}
                  type="button"
                  className="quick-template"
                  onClick={() =>
                    openAddTransaction(template.type, undefined, template)
                  }
                >
                  <IconTile
                    icon={cat?.icon ?? 'Receipt'}
                    color={cat?.color ?? '#25977b'}
                    size={32}
                  />
                  <span className="min-w-0 text-left">
                    <span className="block max-w-32 truncate text-xs font-medium">
                      {(template.note ?? '')
                        .replace(/#[\p{L}\p{N}_-]+/gu, '')
                        .trim() ||
                        (cat
                          ? getLocalizedCategoryName(cat.name, language)
                          : t(template.type))}
                    </span>
                    <span className="mt-0.5 block text-xs text-muted">
                      {formatAmount(template.amount)}
                    </span>
                  </span>
                  <Plus size={14} className="ml-1 text-faint" />
                </button>
              );
            })}
          </div>
        </section>
      )}
      {goals.length > 0 && (
        <section>
          <SectionHeader
            title={t('goals')}
            actionLabel={t('view_plan')}
            onAction={openPlan}
            className="mb-3"
          />
          <div className="grid grid-cols-2 gap-3">
            {goals.slice(0, 2).map((goal) => (
              <button
                key={goal.id}
                type="button"
                onClick={openPlan}
                className="panel p-4 text-left"
              >
                <IconTile icon={goal.icon} color={goal.color} size={36} />
                <p className="mt-3 truncate text-sm font-semibold">
                  {goal.name}
                </p>
                <p className="mt-1 text-xs text-muted">
                  {formatAmount(goal.saved)} / {formatAmount(goal.target)}
                </p>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-panel-inset">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min(100, (goal.saved / goal.target) * 100)}%`,
                      background: goal.color,
                    }}
                  />
                </div>
              </button>
            ))}
          </div>
        </section>
      )}
      {upcoming.length > 0 && (
        <section>
          <SectionHeader
            title={t('upcoming')}
            actionLabel={t('view_plan')}
            onAction={openPlan}
            className="mb-3"
          />
          <Surface padded={false} className="divide-y divide-line px-4">
            {upcoming.map(({ bill, daysLeft }) => (
              <button
                type="button"
                onClick={openPlan}
                key={bill.id}
                className="flex w-full items-center gap-3 py-4 text-left"
              >
                <IconTile icon={bill.icon} color={bill.color} size={38} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">
                    {bill.name}
                  </span>
                  <span className="mt-1 block text-xs text-muted">
                    {daysLeft <= 0
                      ? t('due_today')
                      : t('due_in').replace('{n}', String(daysLeft))}
                  </span>
                </span>
                <span className="text-sm font-semibold">
                  {formatAmount(bill.amount)}
                </span>
                <ArrowUpRight size={15} className="text-faint" />
              </button>
            ))}
          </Surface>
        </section>
      )}
      <section>
        <SectionHeader
          title={t('recent_activity')}
          actionLabel={t('view_all')}
          onAction={() => {
            resetFilters();
            useUIStore.getState().setFilterPeriod('all');
            setActiveTab('history');
          }}
          className="mb-3"
        />
        <Surface padded={false} className="px-4">
          {recent.length === 0 ? (
            <EmptyState
              compact
              icon={<Wallet size={24} />}
              title={t('no_transactions')}
              body={t('no_transactions_sub')}
              actionLabel={t('add')}
              onAction={() => openAddTransaction()}
            />
          ) : (
            <div className="divide-y divide-line">
              {recent.map((tx) => {
                const cat = categories.find((c) => c.id === tx.category_id);
                const name = cat
                  ? getLocalizedCategoryName(cat.name, language)
                  : t('other');
                const title =
                  (tx.note ?? '').replace(/#[\p{L}\p{N}_-]+/gu, '').trim() ||
                  name;
                return (
                  <button
                    key={tx.id}
                    type="button"
                    className="transaction-row"
                    onClick={() => {
                      haptic.selection();
                      setSelectedTransaction(tx);
                    }}
                  >
                    <IconTile
                      icon={cat?.icon ?? 'Receipt'}
                      color={cat?.color ?? '#25977b'}
                      size={42}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">
                        {title}
                      </span>
                      <span className="mt-1 block truncate text-xs text-muted">
                        {name} · {formatDayLabel(tx.date, locale)}
                      </span>
                    </span>
                    <span
                      className={`shrink-0 text-sm font-semibold tabular-nums ${tx.type === 'income' ? 'text-mint' : 'text-ink'}`}
                    >
                      {formatAmount(
                        tx.type === 'expense' ? -tx.amount : tx.amount,
                        true,
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </Surface>
      </section>
      <p className="brand-footer">
        <span className="brand-dot" />
        Vault · {t('brand_caption')}
      </p>
    </div>
  );
}
