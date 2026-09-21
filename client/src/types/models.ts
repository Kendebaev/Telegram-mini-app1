export type TransactionType = 'expense' | 'income';

export type PaymentMethod = 'Card' | 'Cash';

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: TransactionType;
  is_custom: boolean;
  order: number;
  user_id?: string | number | null;
}

export interface Transaction {
  id: string;
  user_id?: string | number;
  category_id?: string | null;
  type: TransactionType;
  amount: number;
  note?: string | null;
  hashtags: string[];
  date: string; // ISO string
  payment_method: PaymentMethod;
  currency?: string;
  created_at?: string;
  updated_at?: string;
  category?: Category | null;
}

export interface PeriodSummary {
  expense: number;
  income: number;
  net: number;
}

export interface AnalyticsSummary {
  currentBalance: number;
  startingBalance: number;
  today: PeriodSummary;
  thisWeek: PeriodSummary;
  thisMonth: PeriodSummary;
  lastMonth: PeriodSummary;
  monthExpenseDeltaPercent: number;
  savingsRate: number;
}

export interface CategoryBreakdownItem {
  id: string;
  name: string;
  icon: string;
  color: string;
  amount: number;
  count: number;
  percentage: number;
}

export interface MonthlyComparisonItem {
  month: string;
  income: number;
  expense: number;
  net: number;
}

export interface DailySpendingItem {
  date: string;
  expense: number;
  income: number;
}

export interface TopHashtagItem {
  tag: string;
  amount: number;
}

export interface AnalyticsData {
  summary: AnalyticsSummary;
  categoryBreakdown: {
    expenses: CategoryBreakdownItem[];
    income: CategoryBreakdownItem[];
  };
  monthlyComparison: MonthlyComparisonItem[];
  dailySpending: DailySpendingItem[];
  topHashtags: TopHashtagItem[];
}

export interface CurrencyConfig {
  code: string;
  symbol: string;
  name: string;
  flag?: string;
}

export type ActiveTab = 'dashboard' | 'history' | 'analytics' | 'settings';

export interface FilterState {
  type: 'all' | 'expense' | 'income';
  categoryId: string; // 'all' or specific id
  period: 'all' | 'today' | 'week' | 'month' | 'last_month';
  startDate?: string;
  endDate?: string;
  hashtag?: string;
  paymentMethod: 'all' | 'Card' | 'Cash';
  search: string;
}
