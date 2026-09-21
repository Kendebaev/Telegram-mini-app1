import React from 'react';
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Plus, Minus, Wallet } from 'lucide-react';
import { useTransactionStore } from '../../stores/transactionStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { useUIStore } from '../../stores/uiStore';
import { useTelegram } from '../../context/TelegramContext';

export const BalanceCard: React.FC = () => {
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
      <div className="relative overflow-hidden rounded-3xl p-5 bg-gradient-to-br from-indigo-950/90 via-slate-900/95 to-[#0D1322] border border-white/[0.12] shadow-glass-glow backdrop-blur-2xl">
        {/* Glow orb inside card */}
        <div className="absolute -top-12 -right-12 w-44 h-44 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-44 h-44 rounded-full bg-cyan-500/15 blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-xl bg-white/[0.08] flex items-center justify-center text-indigo-400 border border-white/[0.08]">
                <Wallet size={14} />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Total Net Balance
              </span>
            </div>

            {/* Net Status Badge */}
            <div
              className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold backdrop-blur-md border ${
                netCashFlow >= 0
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                  : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
              }`}
            >
              {netCashFlow >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              <span>{savingsRate}% saved</span>
            </div>
          </div>

          {/* Large Balance Display */}
          <div className="mt-3.5 mb-5">
            <div className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight tabular-nums">
              {formatAmount(currentBalance)}
            </div>
            <div className="text-[11px] text-slate-400 font-medium mt-1">
              Live computed over all transactions & starting balance
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="grid grid-cols-2 gap-2.5 pt-3 border-t border-white/[0.08]">
            <button
              type="button"
              onClick={() => {
                haptic.impact('medium');
                openAddTransaction('income');
              }}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 active:scale-95 transition-all text-xs font-bold shadow-sm"
            >
              <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <Plus size={12} className="stroke-[3]" />
              </div>
              <span>Add Income</span>
            </button>

            <button
              type="button"
              onClick={() => {
                haptic.impact('medium');
                openAddTransaction('expense');
              }}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 active:scale-95 transition-all text-xs font-bold shadow-sm"
            >
              <div className="w-5 h-5 rounded-full bg-rose-500/20 flex items-center justify-center">
                <Minus size={12} className="stroke-[3]" />
              </div>
              <span>Add Expense</span>
            </button>
          </div>
        </div>
      </div>

      {/* Side-by-side Monthly Flow Cards */}
      <div className="grid grid-cols-2 gap-3">
        {/* Monthly Income Card */}
        <div className="glass-card p-3.5 rounded-2.5xl border border-emerald-500/20 bg-emerald-950/20 shadow-sm">
          <div className="flex items-center space-x-1.5 text-xs font-semibold text-emerald-400 mb-1">
            <ArrowUpRight size={15} className="stroke-[2.5]" />
            <span>Income this Mo.</span>
          </div>
          <div className="text-lg font-bold text-white tabular-nums">
            +{formatAmount(thisMonthIncome)}
          </div>
        </div>

        {/* Monthly Expense Card */}
        <div className="glass-card p-3.5 rounded-2.5xl border border-rose-500/20 bg-rose-950/20 shadow-sm">
          <div className="flex items-center space-x-1.5 text-xs font-semibold text-rose-400 mb-1">
            <ArrowDownRight size={15} className="stroke-[2.5]" />
            <span>Expenses this Mo.</span>
          </div>
          <div className="text-lg font-bold text-white tabular-nums">
            -{formatAmount(thisMonthExpense)}
          </div>
        </div>
      </div>
    </div>
  );
};
