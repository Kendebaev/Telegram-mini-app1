import React from 'react';
import { ArrowUpRight, ArrowDownRight, Plus, Minus } from 'lucide-react';
import { useTransactionStore } from '../../stores/transactionStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { useUIStore } from '../../stores/uiStore';
import { useTelegram } from '../../context/TelegramContext';

export const TotalNetBalance: React.FC = () => {
  const { getCurrentBalance, transactions } = useTransactionStore();
  const { formatAmount } = useSettingsStore();
  const { openAddTransaction } = useUIStore();
  const { haptic } = useTelegram();

  const currentBalance = getCurrentBalance();

  // Compute this month income and expenses
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const thisMonthTransactions = transactions.filter((t) => new Date(t.date) >= startOfMonth);
  const thisMonthIncome = thisMonthTransactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const thisMonthExpense = thisMonthTransactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const netCashFlow = thisMonthIncome - thisMonthExpense;
  const savingsRate = thisMonthIncome > 0 ? Math.round((netCashFlow / thisMonthIncome) * 100) : 0;

  return (
    <div className="space-y-3">
      {/* Hero Total Balance Card */}
      <div className="relative overflow-hidden rounded-3xl p-6 bg-white/80 dark:bg-zinc-900/60 backdrop-blur-xl border border-slate-200/80 dark:border-white/[0.08] shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)] transition-colors duration-200">
        {/* Ambient glow inside card */}
        <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-indigo-500/10 dark:bg-indigo-500/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-emerald-500/10 dark:bg-cyan-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10">
          {/* Header Row */}
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold tracking-wider uppercase text-slate-500 dark:text-zinc-400">
              Total Net Balance
            </span>

            {/* Savings Rate Badge with pulsing green dot */}
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 backdrop-blur-md">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>{savingsRate >= 0 ? `${savingsRate}% saved` : `${Math.abs(savingsRate)}% deficit`}</span>
            </div>
          </div>

          {/* Amount Display */}
          <div className="mt-3 mb-4">
            <div className="text-3xl sm:text-4xl font-extrabold tracking-tight tabular-nums text-slate-900 dark:text-white">
              {formatAmount(currentBalance)}
            </div>
            <div className="text-xs text-slate-400 dark:text-zinc-500 font-medium mt-1">
              Live computed across starting balance & all transactions
            </div>
          </div>

          {/* Sleek Paired Split Buttons */}
          <div className="grid grid-cols-2 gap-2.5 pt-3 border-t border-slate-100 dark:border-white/[0.06]">
            <button
              type="button"
              onClick={() => {
                haptic.impact('medium');
                openAddTransaction('income');
              }}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl bg-emerald-500/[0.08] hover:bg-emerald-500/[0.15] border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 active:scale-95 transition-all text-xs font-bold shadow-2xs"
            >
              <div className="w-4 h-4 rounded-full bg-emerald-500/15 flex items-center justify-center">
                <Plus size={11} className="stroke-[3]" />
              </div>
              <span>+ Add Income</span>
            </button>

            <button
              type="button"
              onClick={() => {
                haptic.impact('medium');
                openAddTransaction('expense');
              }}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl bg-rose-500/[0.08] hover:bg-rose-500/[0.15] border border-rose-500/20 text-rose-700 dark:text-rose-400 active:scale-95 transition-all text-xs font-bold shadow-2xs"
            >
              <div className="w-4 h-4 rounded-full bg-rose-500/15 flex items-center justify-center">
                <Minus size={11} className="stroke-[3]" />
              </div>
              <span>− Add Expense</span>
            </button>
          </div>
        </div>
      </div>

      {/* Monthly Metrics Row (2-column grid) */}
      <div className="grid grid-cols-2 gap-3">
        {/* Income Widget */}
        <div className="p-4 rounded-3xl bg-white/80 dark:bg-zinc-900/60 backdrop-blur-xl border border-slate-200/80 dark:border-white/[0.08] shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)] transition-colors duration-200">
          <div className="flex items-center space-x-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-1">
            <ArrowUpRight size={14} className="stroke-[2.5]" />
            <span className="text-slate-500 dark:text-zinc-400 font-medium">Income this Mo.</span>
          </div>
          <div className="text-lg font-bold tabular-nums text-slate-900 dark:text-white">
            +{formatAmount(thisMonthIncome)}
          </div>
        </div>

        {/* Expenses Widget */}
        <div className="p-4 rounded-3xl bg-white/80 dark:bg-zinc-900/60 backdrop-blur-xl border border-slate-200/80 dark:border-white/[0.08] shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)] transition-colors duration-200">
          <div className="flex items-center space-x-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 mb-1">
            <ArrowDownRight size={14} className="stroke-[2.5]" />
            <span className="text-slate-500 dark:text-zinc-400 font-medium">Expenses this Mo.</span>
          </div>
          <div className="text-lg font-bold tabular-nums text-slate-900 dark:text-white">
            -{formatAmount(thisMonthExpense)}
          </div>
        </div>
      </div>
    </div>
  );
};
