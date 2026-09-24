import React, { useState, useEffect, useMemo } from 'react';
import {
  PieChart as RePieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import {
  PieChart,
  TrendingUp,
  LineChart,
  Lightbulb,
  Tag,
  ShieldCheck,
  Calendar,
  PiggyBank,
  Flame,
  X,
} from 'lucide-react';
import { apiRequest } from '../../utils/api';
import { useTransactionStore } from '../../stores/transactionStore';
import { useCategoryStore } from '../../stores/categoryStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { useTelegram } from '../../context/TelegramContext';
import { CategoryIcon } from '../glass/CategoryIcon';
import { GlassCard } from '../glass/GlassCard';
import type { AnalyticsData, TransactionType } from '../../types/models';

type AnalyticsTab = 'breakdown' | 'cashflow' | 'trend' | 'insights';
type PeriodOption = 'day' | 'week' | 'month' | 'all' | 'custom';

export const AnalyticsView: React.FC = () => {
  const { transactions } = useTransactionStore();
  const { getCategoryById } = useCategoryStore();
  const { formatAmount } = useSettingsStore();
  const { haptic } = useTelegram();

  const [activeTab, setActiveTab] = useState<AnalyticsTab>('breakdown');
  const [breakdownType, setBreakdownType] = useState<TransactionType>('expense');
  const [period, setPeriod] = useState<PeriodOption>('month');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [isCustomPickerOpen, setIsCustomPickerOpen] = useState<boolean>(false);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);

  // Fetch backend analytics baseline if available
  const fetchAnalytics = async () => {
    try {
      const data = await apiRequest<AnalyticsData>('/analytics');
      if (data) {
        setAnalyticsData(data);
      }
    } catch (err) {
      console.warn('Analytics fetch fallback:', err);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [transactions]);

  // Filter transactions according to selected period
  const filteredTransactions = useMemo(() => {
    const now = new Date();

    return transactions.filter((t) => {
      const d = new Date(t.date);

      if (period === 'day') {
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        return d >= startOfDay && d <= endOfDay;
      }

      if (period === 'week') {
        const dayOfWeek = now.getDay() || 7; // Monday = 1
        const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek + 1);
        startOfWeek.setHours(0, 0, 0, 0);
        return d >= startOfWeek;
      }

      if (period === 'month') {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        return d >= startOfMonth;
      }

      if (period === 'custom') {
        if (customStartDate && d < new Date(customStartDate)) return false;
        if (customEndDate && d > new Date(`${customEndDate}T23:59:59`)) return false;
        return true;
      }

      return true; // 'all'
    });
  }, [transactions, period, customStartDate, customEndDate]);

  // Compute breakdown items dynamically for active period & type
  const { breakdownItems, totalPeriodAmount, periodIncome, periodExpense, netSavings, savingsRate } =
    useMemo(() => {
      const pIncome = filteredTransactions
        .filter((t) => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const pExpense = filteredTransactions
        .filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const pNet = pIncome - pExpense;
      const sRate = pIncome > 0 ? Math.round((pNet / pIncome) * 100) : 0;

      const targetTx = filteredTransactions.filter((t) => t.type === breakdownType);
      const totalTypeAmount = targetTx.reduce((sum, t) => sum + Number(t.amount), 0);

      const catMap = new Map<string, { id: string; amount: number; count: number }>();
      targetTx.forEach((tx) => {
        const catId = tx.category_id || 'other';
        const curr = catMap.get(catId) || { id: catId, amount: 0, count: 0 };
        curr.amount += Number(tx.amount);
        curr.count += 1;
        catMap.set(catId, curr);
      });

      const items = Array.from(catMap.values())
        .map((item) => {
          const cat = getCategoryById(item.id);
          return {
            id: item.id,
            name: cat?.name || (breakdownType === 'income' ? 'Other Income' : 'Other Expense'),
            icon: cat?.icon || (breakdownType === 'income' ? 'PlusCircle' : 'MoreHorizontal'),
            color: cat?.color || (breakdownType === 'income' ? '#10B981' : '#F43F5E'),
            amount: item.amount,
            count: item.count,
            percentage: totalTypeAmount > 0 ? Math.round((item.amount / totalTypeAmount) * 100) : 0,
          };
        })
        .sort((a, b) => b.amount - a.amount);

      return {
        breakdownItems: items,
        totalPeriodAmount: totalTypeAmount,
        periodIncome: pIncome,
        periodExpense: pExpense,
        netSavings: pNet,
        savingsRate: sRate,
      };
    }, [filteredTransactions, breakdownType, getCategoryById]);

  const pieChartData = useMemo(() => {
    return breakdownItems.map((item) => ({
      name: item.name,
      value: item.amount,
      color: item.color,
      percentage: item.percentage,
    }));
  }, [breakdownItems]);

  // Daily spending curve for Trend tab
  const dailySpending = useMemo(() => {
    const dayMap = new Map<string, number>();

    filteredTransactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        const dateKey = t.date.split('T')[0];
        const prev = dayMap.get(dateKey) || 0;
        dayMap.set(dateKey, prev + Number(t.amount));
      });

    return Array.from(dayMap.entries())
      .map(([date, expense]) => ({ date, expense }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredTransactions]);

  // Cash Flow Monthly Comparison & Metrics
  const monthlyComparison = useMemo(() => {
    if (analyticsData?.monthlyComparison && analyticsData.monthlyComparison.length > 0) {
      return analyticsData.monthlyComparison;
    }

    // Dynamic month grouping from transactions
    const monthMap = new Map<string, { month: string; income: number; expense: number; net: number }>();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    transactions.forEach((tx) => {
      const d = new Date(tx.date);
      const label = `${months[d.getMonth()]} ${d.getFullYear().toString().slice(-2)}`;
      const curr = monthMap.get(label) || { month: label, income: 0, expense: 0, net: 0 };
      if (tx.type === 'income') curr.income += Number(tx.amount);
      if (tx.type === 'expense') curr.expense += Number(tx.amount);
      curr.net = curr.income - curr.expense;
      monthMap.set(label, curr);
    });

    const list = Array.from(monthMap.values());
    return list.length > 0 ? list : [{ month: 'Current', income: periodIncome, expense: periodExpense, net: netSavings }];
  }, [analyticsData, transactions, periodIncome, periodExpense, netSavings]);

  // Average Savings & Monthly Burn Rate computations
  const { averageSavings, monthlyBurnRate, dailyBurnRate } = useMemo(() => {
    const list = monthlyComparison;
    const monthsCount = Math.max(list.length, 1);
    const totalSavings = list.reduce((sum, m) => sum + (m.net !== undefined ? m.net : m.income - m.expense), 0);
    const totalExpenses = list.reduce((sum, m) => sum + m.expense, 0);

    const avgSavings = Math.round(totalSavings / monthsCount);
    const avgBurn = Math.round(totalExpenses / monthsCount);
    const dBurn = Math.round(avgBurn / 30);

    return {
      averageSavings: avgSavings,
      monthlyBurnRate: avgBurn,
      dailyBurnRate: dBurn,
    };
  }, [monthlyComparison]);

  const topHashtags = analyticsData?.topHashtags || [];

  return (
    <div className="space-y-4 pb-24 max-w-md mx-auto">
      {/* 4 View Tabs Navigation */}
      <div className="p-1 rounded-2xl bg-white/70 dark:bg-white/[0.04] backdrop-blur-xl border border-slate-200/80 dark:border-white/[0.08] shadow-2xs flex transition-colors">
        {[
          { id: 'breakdown' as AnalyticsTab, label: 'Breakdown', icon: PieChart },
          { id: 'cashflow' as AnalyticsTab, label: 'Cash Flow', icon: TrendingUp },
          { id: 'trend' as AnalyticsTab, label: 'Trend', icon: LineChart },
          { id: 'insights' as AnalyticsTab, label: 'Insights', icon: Lightbulb },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                haptic.selection();
                setActiveTab(tab.id);
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-all ${
                isActive
                  ? 'bg-slate-900 text-white dark:bg-indigo-600/40 dark:text-white dark:border dark:border-indigo-500/50 shadow-xs'
                  : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Icon size={13} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Period Filter Settings Bar (Day, Week, Month, All Time, Custom) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-1 overflow-x-auto no-scrollbar py-0.5 px-0.5">
          {[
            { id: 'day' as PeriodOption, label: 'Day' },
            { id: 'week' as PeriodOption, label: 'Week' },
            { id: 'month' as PeriodOption, label: 'Month' },
            { id: 'all' as PeriodOption, label: 'All Time' },
            { id: 'custom' as PeriodOption, label: 'Custom' },
          ].map((item) => {
            const isSelected = period === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  haptic.selection();
                  setPeriod(item.id);
                  if (item.id === 'custom') {
                    setIsCustomPickerOpen(true);
                  }
                }}
                className={`flex-1 py-1.5 px-2.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all active:scale-95 ${
                  isSelected
                    ? 'bg-slate-900 text-white dark:bg-indigo-600 dark:text-white shadow-2xs'
                    : 'bg-white/80 dark:bg-white/[0.04] text-slate-600 dark:text-zinc-400 border border-slate-200/80 dark:border-white/[0.06] hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Expandable Custom Date Range Selector */}
        {period === 'custom' && (isCustomPickerOpen || customStartDate || customEndDate) && (
          <div className="p-3 rounded-2xl bg-white/80 dark:bg-zinc-900/60 backdrop-blur-xl border border-slate-200/80 dark:border-white/[0.08] shadow-xs space-y-2 animate-in fade-in duration-150">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-zinc-400">
              <span className="flex items-center gap-1">
                <Calendar size={13} className="text-indigo-500" />
                Select Date Range
              </span>
              {(customStartDate || customEndDate) && (
                <button
                  type="button"
                  onClick={() => {
                    setCustomStartDate('');
                    setCustomEndDate('');
                  }}
                  className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
                >
                  <X size={11} />
                  Clear
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-400 dark:text-zinc-500 block mb-0.5">Start Date</label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-xs font-medium text-slate-900 dark:text-white focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 dark:text-zinc-500 block mb-0.5">End Date</label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-xs font-medium text-slate-900 dark:text-white focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tab 1: Breakdown */}
      {activeTab === 'breakdown' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Sub-toggle: Expense vs Income */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                haptic.selection();
                setBreakdownType('expense');
              }}
              className={`flex-1 py-2 px-3 rounded-2xl text-xs font-bold border transition-all ${
                breakdownType === 'expense'
                  ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/20 dark:border-rose-500/40 dark:text-rose-300 shadow-2xs'
                  : 'bg-white/70 dark:bg-white/[0.03] border-slate-200/80 dark:border-white/[0.06] text-slate-500 dark:text-slate-400'
              }`}
            >
              Expense Breakdown
            </button>
            <button
              type="button"
              onClick={() => {
                haptic.selection();
                setBreakdownType('income');
              }}
              className={`flex-1 py-2 px-3 rounded-2xl text-xs font-bold border transition-all ${
                breakdownType === 'income'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:border-emerald-500/40 dark:text-emerald-300 shadow-2xs'
                  : 'bg-white/70 dark:bg-white/[0.03] border-slate-200/80 dark:border-white/[0.06] text-slate-500 dark:text-slate-400'
              }`}
            >
              Income Breakdown
            </button>
          </div>

          {/* Donut Chart (With High-Contrast Light & Dark Mode Text) */}
          <GlassCard className="p-4 rounded-3xl">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-400 mb-2 text-center">
              {breakdownType === 'expense' ? 'Expenses by Category' : 'Income by Source'}
            </div>

            {pieChartData.length > 0 ? (
              <div className="h-56 w-full relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <RePieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={62}
                      outerRadius={88}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color || '#6366F1'} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl px-3.5 py-2 rounded-xl border border-slate-200/90 dark:border-white/20 text-xs shadow-xl space-y-0.5">
                              <span className="font-bold text-slate-900 dark:text-white">{data.name}</span>:{' '}
                              <span className="text-indigo-600 dark:text-indigo-400 font-mono font-bold">
                                {formatAmount(data.value)} ({data.percentage}%)
                              </span>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </RePieChart>
                </ResponsiveContainer>

                {/* Center Metric (Fully Visible in Both Light and Dark Themes) */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                    Total
                  </span>
                  <span className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white tabular-nums">
                    {formatAmount(totalPeriodAmount)}
                  </span>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-slate-500 dark:text-zinc-400">
                No {breakdownType} entries recorded for this {period}.
              </div>
            )}
          </GlassCard>

          {/* Category List */}
          <div className="space-y-2">
            {breakdownItems.map((item) => (
              <div
                key={item.id}
                className="glass-card p-3 rounded-2.5xl flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shadow-xs"
                    style={{ backgroundColor: `${item.color}25`, color: item.color }}
                  >
                    <CategoryIcon name={item.icon} size={18} color={item.color} />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">{item.name}</span>
                    <span className="text-[10px] text-slate-500 dark:text-zinc-400">{item.count} transactions</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-extrabold text-slate-900 dark:text-white block tabular-nums">
                    {formatAmount(item.amount)}
                  </span>
                  <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400">
                    {item.percentage}% of total
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Cash Flow (Upgraded with SVG Gradients, Glass Tooltip, Legend, and 2 Metric Widgets) */}
      {activeTab === 'cashflow' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Net Cash Flow Summary Card */}
          <GlassCard className="p-5 rounded-3xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                  Net Savings ({period === 'all' ? 'All Time' : period === 'custom' ? 'Selected Period' : `This ${period.charAt(0).toUpperCase() + period.slice(1)}`})
                </span>
                <div
                  className={`text-2xl font-extrabold tabular-nums tracking-tight mt-0.5 ${
                    netSavings >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {netSavings >= 0 ? '+' : ''}
                  {formatAmount(netSavings)}
                </div>
              </div>

              <div
                className={`px-3 py-1.5 rounded-2xl border text-xs font-bold ${
                  savingsRate >= 20
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-500/20 dark:border-emerald-500/40 dark:text-emerald-300 shadow-xs'
                    : 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-500/20 dark:border-amber-500/40 dark:text-amber-300'
                }`}
              >
                {savingsRate}% Savings Rate
              </div>
            </div>

            {/* Income vs Expense Monthly Comparison Bar Chart */}
            <div className="pt-2">
              {/* Header with Compact Legend */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-800 dark:text-zinc-200">
                  Monthly Inflow vs Outflow
                </span>
                <div className="flex items-center space-x-3 text-[11px] font-semibold">
                  <div className="flex items-center space-x-1.5 text-slate-600 dark:text-zinc-300">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-2xs" />
                    <span>Inflow</span>
                  </div>
                  <div className="flex items-center space-x-1.5 text-slate-600 dark:text-zinc-300">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-2xs" />
                    <span>Outflow</span>
                  </div>
                </div>
              </div>

              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyComparison} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                    {/* Vertical SVG Gradients */}
                    <defs>
                      <linearGradient id="inflowGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10B981" stopOpacity={1} />
                        <stop offset="100%" stopColor="#059669" stopOpacity={0.7} />
                      </linearGradient>
                      <linearGradient id="outflowGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#F43F5E" stopOpacity={1} />
                        <stop offset="100%" stopColor="#E11D48" stopOpacity={0.7} />
                      </linearGradient>
                    </defs>

                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.2)" />
                    <XAxis dataKey="month" stroke="#94A3B8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip
                      cursor={{ fill: 'rgba(99, 102, 241, 0.08)' }}
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const inc = Number(payload.find((p) => p.dataKey === 'income')?.value || 0);
                          const exp = Number(payload.find((p) => p.dataKey === 'expense')?.value || 0);
                          const net = inc - exp;
                          return (
                            <div className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl px-3.5 py-2.5 rounded-2xl border border-slate-200/90 dark:border-white/20 text-xs shadow-xl space-y-1.5 min-w-[150px]">
                              <div className="font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-white/10 pb-1">{label}</div>
                              <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                                <span>Inflow:</span>
                                <span className="tabular-nums">+{formatAmount(inc)}</span>
                              </div>
                              <div className="flex items-center justify-between text-rose-600 dark:text-rose-400 font-semibold">
                                <span>Outflow:</span>
                                <span className="tabular-nums">-{formatAmount(exp)}</span>
                              </div>
                              <div className={`flex items-center justify-between font-bold pt-1 border-t border-slate-100 dark:border-white/10 ${net >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                <span>Net Margin:</span>
                                <span className="tabular-nums">{net >= 0 ? '+' : ''}{formatAmount(net)}</span>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    {/* Bars with Vertical SVG Gradients & Rounded Radius */}
                    <Bar dataKey="income" fill="url(#inflowGrad)" radius={[6, 6, 0, 0]} name="Inflow" />
                    <Bar dataKey="expense" fill="url(#outflowGrad)" radius={[6, 6, 0, 0]} name="Outflow" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </GlassCard>

          {/* Under-Chart Widgets: Average Savings & Monthly Burn Rate */}
          <div className="grid grid-cols-2 gap-3">
            {/* Widget 1: Average Savings */}
            <GlassCard className="p-4 rounded-3xl space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <PiggyBank size={17} />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 block">
                    Avg Savings
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-zinc-500">Monthly Net</span>
                </div>
              </div>

              <div className="pt-1">
                <div className="text-lg font-extrabold tabular-nums tracking-tight text-slate-900 dark:text-white">
                  {averageSavings >= 0 ? '+' : ''}{formatAmount(averageSavings)}
                </div>
                <div className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 mt-0.5">
                  Surplus across periods
                </div>
              </div>
            </GlassCard>

            {/* Widget 2: Monthly Burn Rate */}
            <GlassCard className="p-4 rounded-3xl space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                  <Flame size={17} />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 block">
                    Burn Rate
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-zinc-500">Monthly Outflow</span>
                </div>
              </div>

              <div className="pt-1">
                <div className="text-lg font-extrabold tabular-nums tracking-tight text-slate-900 dark:text-white">
                  -{formatAmount(monthlyBurnRate)}
                </div>
                <div className="text-[10px] font-medium text-slate-500 dark:text-zinc-400 mt-0.5">
                  ~{formatAmount(dailyBurnRate)}/day pace
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      )}

      {/* Tab 3: Trend */}
      {activeTab === 'trend' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <GlassCard className="p-4 rounded-3xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                  Spending Curve ({period === 'all' ? 'All Time' : period})
                </span>
                <div className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">
                  {formatAmount(periodExpense)}
                </div>
              </div>

              <span className="text-xs text-slate-400 dark:text-zinc-500 capitalize">{period} Filtered</span>
            </div>

            {dailySpending.length > 0 ? (
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailySpending} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366F1" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#6366F1" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.2)" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(d) => {
                        const date = new Date(d);
                        return `${date.getDate()}/${date.getMonth() + 1}`;
                      }}
                      stroke="#94A3B8"
                      fontSize={11}
                      tickLine={false}
                    />
                    <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const item = payload[0].payload;
                          return (
                            <div className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl px-3 py-1.5 rounded-xl border border-slate-200/90 dark:border-white/20 text-xs shadow-xl">
                              <span className="font-bold text-slate-900 dark:text-white">{item.date}</span>:{' '}
                              <span className="text-rose-600 dark:text-rose-400 font-bold">{formatAmount(item.expense)}</span>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="expense"
                      stroke="#6366F1"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#trendGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-slate-500 dark:text-zinc-400">
                No daily spending recorded for this {period}.
              </div>
            )}
          </GlassCard>
        </div>
      )}

      {/* Tab 4: Insights */}
      {activeTab === 'insights' && (
        <div className="space-y-3 animate-in fade-in duration-200">
          {/* Health Status Card */}
          <GlassCard
            variant="accent"
            className="p-4 rounded-3xl flex items-center space-x-3.5"
          >
            <div className="w-11 h-11 rounded-2xl bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0 border border-indigo-500/30">
              <ShieldCheck size={22} />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white">Financial Health Status</div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                {savingsRate >= 30
                  ? 'Strong surplus! You are saving over 30% of your income.'
                  : savingsRate >= 10
                  ? 'Healthy balance. Your cash flow is in positive territory.'
                  : 'Spending pace is close to income. Keep an eye on non-essential categories.'}
              </p>
            </div>
          </GlassCard>

          {/* Top Hashtags Spend */}
          {topHashtags.length > 0 && (
            <GlassCard className="p-4 rounded-3xl space-y-3">
              <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-400">
                <Tag size={14} className="text-indigo-500" />
                <span>Top Hashtags by Spend</span>
              </div>

              <div className="space-y-2">
                {topHashtags.map((item) => (
                  <div key={item.tag} className="flex items-center justify-between text-xs">
                    <span className="font-mono text-indigo-600 dark:text-indigo-300 font-semibold">#{item.tag}</span>
                    <span className="font-bold text-slate-900 dark:text-white tabular-nums">
                      {formatAmount(item.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}

          {/* Month-over-month Delta */}
          <GlassCard className="p-4 rounded-3xl space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-400">
              Month-over-Month Change
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 dark:text-zinc-400">Expense Trend</span>
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                  (analyticsData?.summary?.monthExpenseDeltaPercent || 0) <= 0
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-500/20 dark:border-emerald-500/30 dark:text-emerald-300'
                    : 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-500/20 dark:border-rose-500/30 dark:text-rose-300'
                }`}
              >
                {(analyticsData?.summary?.monthExpenseDeltaPercent || 0) > 0 ? '+' : ''}
                {analyticsData?.summary?.monthExpenseDeltaPercent || 0}% vs last month
              </span>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
};
