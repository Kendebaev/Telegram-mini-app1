import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { apiRequest } from '../../utils/api';
import { useTransactionStore } from '../../stores/transactionStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { useTelegram } from '../../context/TelegramContext';
import { CategoryIcon } from '../glass/CategoryIcon';
import { GlassCard } from '../glass/GlassCard';
import type { AnalyticsData, TransactionType } from '../../types/models';

type AnalyticsTab = 'breakdown' | 'cashflow' | 'trend' | 'insights';

export const AnalyticsView: React.FC = () => {
  const { transactions } = useTransactionStore();
  const { formatAmount } = useSettingsStore();
  const { haptic } = useTelegram();

  const [activeTab, setActiveTab] = useState<AnalyticsTab>('breakdown');
  const [breakdownType, setBreakdownType] = useState<TransactionType>('expense');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [, setIsLoading] = useState(false);

  // Fetch from /api/analytics
  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const data = await apiRequest<AnalyticsData>('/analytics');
      if (data) {
        setAnalyticsData(data);
      }
    } catch (err) {
      console.warn('Analytics fetch fallback:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [transactions]);

  // Fallback calculations if backend unavailable
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthTransactions = transactions.filter((t) => new Date(t.date) >= startOfMonth);

  const monthExpense = monthTransactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const monthIncome = monthTransactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const netSavings = monthIncome - monthExpense;
  const savingsRate = monthIncome > 0 ? Math.round((netSavings / monthIncome) * 100) : 0;

  // Breakdown items for pie chart
  const activeBreakdownItems =
    analyticsData?.categoryBreakdown
      ? breakdownType === 'expense'
        ? analyticsData.categoryBreakdown.expenses
        : analyticsData.categoryBreakdown.income
      : [];

  const pieChartData = activeBreakdownItems.map((item) => ({
    name: item.name,
    value: item.amount,
    color: item.color,
    percentage: item.percentage,
  }));

  const monthlyComparison = analyticsData?.monthlyComparison || [];
  const dailySpending = analyticsData?.dailySpending || [];
  const topHashtags = analyticsData?.topHashtags || [];

  return (
    <div className="space-y-4 pb-24 max-w-md mx-auto">
      {/* 4 View Tabs Navigation */}
      <div className="p-1 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex">
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
                  ? 'bg-indigo-600/40 text-white border border-indigo-500/50 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Icon size={13} />
              <span>{tab.label}</span>
            </button>
          );
        })}
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
              className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold border transition-all ${
                breakdownType === 'expense'
                  ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                  : 'bg-white/[0.03] border-white/[0.06] text-slate-400'
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
              className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold border transition-all ${
                breakdownType === 'income'
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                  : 'bg-white/[0.03] border-white/[0.06] text-slate-400'
              }`}
            >
              Income Breakdown
            </button>
          </div>

          {/* Donut Chart */}
          <GlassCard className="p-4 rounded-3xl">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2 text-center">
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
                            <div className="glass-card px-3 py-1.5 rounded-xl border border-white/20 text-xs shadow-xl">
                              <span className="font-bold text-white">{data.name}</span>:{' '}
                              <span className="text-indigo-300 font-mono font-bold">
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

                {/* Center metric */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    Total
                  </span>
                  <span className="text-sm font-extrabold text-white tabular-nums">
                    {formatAmount(
                      pieChartData.reduce((acc, curr) => acc + curr.value, 0)
                    )}
                  </span>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-slate-400">
                No {breakdownType} entries recorded for this month.
              </div>
            )}
          </GlassCard>

          {/* Category List */}
          <div className="space-y-2">
            {activeBreakdownItems.map((item) => (
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
                    <span className="text-xs font-bold text-white block">{item.name}</span>
                    <span className="text-[10px] text-slate-400">{item.count} transactions</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-extrabold text-white block tabular-nums">
                    {formatAmount(item.amount)}
                  </span>
                  <span className="text-[10px] font-semibold text-indigo-400">
                    {item.percentage}% of total
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Cash Flow */}
      {activeTab === 'cashflow' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Net Cash Flow Summary Card */}
          <GlassCard className="p-4 rounded-3xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Net Savings this Month
                </span>
                <div
                  className={`text-2xl font-extrabold tabular-nums tracking-tight mt-0.5 ${
                    netSavings >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {netSavings >= 0 ? '+' : ''}
                  {formatAmount(netSavings)}
                </div>
              </div>

              <div
                className={`px-3 py-1.5 rounded-2xl border text-xs font-bold ${
                  savingsRate >= 20
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 shadow-income-glow'
                    : 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                }`}
              >
                {savingsRate}% Savings Rate
              </div>
            </div>

            {/* Income vs Expense Monthly Comparison Bar Chart */}
            <div className="pt-2">
              <div className="text-xs font-bold text-slate-300 mb-3">
                Monthly Inflow vs Outflow
              </div>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyComparison} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="month" stroke="#94A3B8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const inc = payload.find((p) => p.dataKey === 'income')?.value || 0;
                          const exp = payload.find((p) => p.dataKey === 'expense')?.value || 0;
                          return (
                            <div className="glass-card px-3 py-2 rounded-xl border border-white/20 text-xs shadow-xl space-y-1">
                              <div className="font-bold text-white">{label}</div>
                              <div className="text-emerald-400 font-medium">Income: +{formatAmount(Number(inc))}</div>
                              <div className="text-rose-400 font-medium">Expenses: -{formatAmount(Number(exp))}</div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="income" fill="#10B981" radius={[4, 4, 0, 0]} name="Income" />
                    <Bar dataKey="expense" fill="#F43F5E" radius={[4, 4, 0, 0]} name="Expense" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Tab 3: Trend */}
      {activeTab === 'trend' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <GlassCard className="p-4 rounded-3xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Daily Spending Curve
                </span>
                <div className="text-xl font-extrabold text-white mt-0.5">
                  {formatAmount(monthExpense)}
                </div>
              </div>

              <span className="text-xs text-slate-400">Current Month</span>
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
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.06)" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(d) => `${new Date(d).getDate()}`}
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
                            <div className="glass-card px-3 py-1.5 rounded-xl border border-white/20 text-xs shadow-xl">
                              <span className="font-bold text-white">{item.date}</span>:{' '}
                              <span className="text-rose-400 font-bold">{formatAmount(item.expense)}</span>
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
              <div className="py-12 text-center text-xs text-slate-400">
                No daily spending recorded yet this month.
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
            <div className="w-11 h-11 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center flex-shrink-0 border border-indigo-500/30">
              <ShieldCheck size={22} />
            </div>
            <div>
              <div className="text-xs font-bold text-white">Financial Health Status</div>
              <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                {savingsRate >= 30
                  ? 'Strong surplus! You are saving over 30% of your income this month.'
                  : savingsRate >= 10
                  ? 'Healthy balance. Your cash flow is in positive territory.'
                  : 'Spending pace is close to income. Keep an eye on non-essential categories.'}
              </p>
            </div>
          </GlassCard>

          {/* Top Hashtags Spend */}
          {topHashtags.length > 0 && (
            <GlassCard className="p-4 rounded-3xl space-y-3">
              <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-slate-300">
                <Tag size={14} className="text-indigo-400" />
                <span>Top Hashtags by Spend</span>
              </div>

              <div className="space-y-2">
                {topHashtags.map((item) => (
                  <div key={item.tag} className="flex items-center justify-between text-xs">
                    <span className="font-mono text-indigo-300 font-semibold">#{item.tag}</span>
                    <span className="font-bold text-white tabular-nums">
                      {formatAmount(item.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}

          {/* Month-over-month Delta */}
          <GlassCard className="p-4 rounded-3xl space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Month-over-Month Change
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Expense Trend</span>
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                  (analyticsData?.summary?.monthExpenseDeltaPercent || 0) <= 0
                    ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-500/20 border-rose-500/30 text-rose-300'
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
