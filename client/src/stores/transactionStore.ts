import { create } from 'zustand';
import { apiRequest } from '../utils/api';
import type { Transaction, FilterState, PaymentMethod, TransactionType } from '../types/models';
import { useSettingsStore } from './settingsStore';

const LOCAL_STORAGE_TRANSACTIONS = 'vault_transactions';
const LOCAL_STORAGE_HASHTAGS = 'vault_hashtags';

function getSampleTransactions(): Transaction[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 14, 30).toISOString();
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 19, 15).toISOString();
  const twoDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2, 11, 45).toISOString();
  const threeDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 3, 16, 20).toISOString();
  const fiveDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 5, 9, 0).toISOString();
  const lastWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7, 13, 0).toISOString();

  return [
    {
      id: 'tx-seed-1',
      type: 'income',
      amount: 3200.0,
      category_id: 'cat-inc-1',
      note: 'Monthly salary payout #work',
      hashtags: ['salary', 'work'],
      date: fiveDaysAgo,
      payment_method: 'Card',
      created_at: fiveDaysAgo,
    },
    {
      id: 'tx-seed-2',
      type: 'income',
      amount: 450.0,
      category_id: 'cat-inc-2',
      note: 'Landing page design milestone #client',
      hashtags: ['freelance', 'client', 'design'],
      date: twoDaysAgo,
      payment_method: 'Card',
      created_at: twoDaysAgo,
    },
    {
      id: 'tx-seed-3',
      type: 'expense',
      amount: 32.5,
      category_id: 'cat-exp-1',
      note: 'Lunch at Italian bistro with team #lunch',
      hashtags: ['lunch', 'team'],
      date: today,
      payment_method: 'Card',
      created_at: today,
    },
    {
      id: 'tx-seed-4',
      type: 'expense',
      amount: 14.5,
      category_id: 'cat-exp-3',
      note: 'Taxi ride home in rain #uber',
      hashtags: ['uber', 'travel'],
      date: today,
      payment_method: 'Card',
      created_at: today,
    },
    {
      id: 'tx-seed-5',
      type: 'expense',
      amount: 78.4,
      category_id: 'cat-exp-2',
      note: 'Weekly supermarket essentials & fruits #food',
      hashtags: ['food', 'organic'],
      date: yesterday,
      payment_method: 'Card',
      created_at: yesterday,
    },
    {
      id: 'tx-seed-6',
      type: 'expense',
      amount: 22.0,
      category_id: 'cat-exp-6',
      note: 'Cinema IMAX ticket and popcorn #weekend',
      hashtags: ['weekend', 'movies'],
      date: yesterday,
      payment_method: 'Cash',
      created_at: yesterday,
    },
    {
      id: 'tx-seed-7',
      type: 'expense',
      amount: 95.0,
      category_id: 'cat-exp-5',
      note: 'High-speed fiber internet & utilities #home',
      hashtags: ['bills', 'home'],
      date: twoDaysAgo,
      payment_method: 'Card',
      created_at: twoDaysAgo,
    },
    {
      id: 'tx-seed-8',
      type: 'expense',
      amount: 54.0,
      category_id: 'cat-exp-7',
      note: 'Wireless earbuds case & braided cable #gadgets',
      hashtags: ['gadgets'],
      date: threeDaysAgo,
      payment_method: 'Card',
      created_at: threeDaysAgo,
    },
    {
      id: 'tx-seed-9',
      type: 'expense',
      amount: 45.0,
      category_id: 'cat-exp-8',
      note: 'Gym membership renewal & electrolytes #fitness',
      hashtags: ['fitness', 'gym'],
      date: lastWeek,
      payment_method: 'Card',
      created_at: lastWeek,
    },
  ];
}

interface TransactionState {
  transactions: Transaction[];
  isLoading: boolean;
  error: string | null;
  hashtagSuggestions: string[];

  // Actions
  fetchTransactions: (filters?: Partial<FilterState>) => Promise<void>;
  addTransaction: (tx: {
    type: TransactionType;
    amount: number;
    category_id?: string | null;
    note?: string | null;
    hashtags?: string[];
    date?: string;
    payment_method?: PaymentMethod;
  }) => Promise<Transaction>;
  updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<Transaction>;
  deleteTransaction: (id: string) => Promise<void>;
  fetchHashtagSuggestions: (query?: string) => Promise<void>;
  addHashtagSuggestion: (tag: string) => Promise<void>;
  removeHashtagSuggestion: (tag: string) => Promise<void>;

  // Selectors / Computations
  getAllTransactions: () => Transaction[];
  getTotalIncome: () => number;
  getTotalExpenses: () => number;
  getCurrentBalance: () => number;
  getFilteredTransactions: (filters: FilterState) => Transaction[];
}

export const useTransactionStore = create<TransactionState>((set, get) => {
  const saved = localStorage.getItem(LOCAL_STORAGE_TRANSACTIONS);
  const initial = saved ? JSON.parse(saved) : getSampleTransactions();
  const savedTags = localStorage.getItem(LOCAL_STORAGE_HASHTAGS);
  const initialTags = savedTags ? JSON.parse(savedTags) : ['salary', 'work', 'freelance', 'lunch', 'food', 'groceries', 'travel', 'home'];

  return {
    transactions: initial,
    isLoading: false,
    error: null,
    hashtagSuggestions: initialTags,

    fetchTransactions: async (filterParams) => {
      set({ isLoading: true, error: null });
      try {
        const queryParams = new URLSearchParams();
        if (filterParams?.type && filterParams.type !== 'all') queryParams.set('type', filterParams.type);
        if (filterParams?.categoryId && filterParams.categoryId !== 'all') queryParams.set('category_id', filterParams.categoryId);
        if (filterParams?.paymentMethod && filterParams.paymentMethod !== 'all') queryParams.set('payment_method', filterParams.paymentMethod);
        if (filterParams?.search) queryParams.set('search', filterParams.search);
        if (filterParams?.hashtag) queryParams.set('hashtag', filterParams.hashtag);
        if (filterParams?.startDate) queryParams.set('startDate', filterParams.startDate);
        if (filterParams?.endDate) queryParams.set('endDate', filterParams.endDate);

        const qs = queryParams.toString();
        const fetched = await apiRequest<Transaction[]>(`/transactions${qs ? `?${qs}` : ''}`);

        if (Array.isArray(fetched)) {
          // If no filters were specified, this is the full list
          if (!qs) {
            localStorage.setItem(LOCAL_STORAGE_TRANSACTIONS, JSON.stringify(fetched));
          }
          set({ transactions: fetched, isLoading: false });
        } else {
          set({ isLoading: false });
        }
      } catch (err: any) {
        console.warn('Falling back to local transactions:', err.message);
        set({ isLoading: false });
      }
    },

    addTransaction: async (data) => {
      set({ isLoading: true });
      try {
        const created = await apiRequest<Transaction>('/transactions', {
          method: 'POST',
          body: JSON.stringify(data),
        });

        const next = [created, ...get().transactions];
        localStorage.setItem(LOCAL_STORAGE_TRANSACTIONS, JSON.stringify(next));

        // Update tag suggestions locally too
        if (data.hashtags && data.hashtags.length > 0) {
          const currentTags = new Set(get().hashtagSuggestions);
          data.hashtags.forEach((t) => currentTags.add(t.toLowerCase()));
          const newTags = Array.from(currentTags);
          localStorage.setItem(LOCAL_STORAGE_HASHTAGS, JSON.stringify(newTags));
          set({ hashtagSuggestions: newTags });
        }

        set({ transactions: next, isLoading: false });
        return created;
      } catch (err: any) {
        // Offline fallback
        const localCreated: Transaction = {
          id: `tx-local-${Date.now()}`,
          type: data.type,
          amount: data.amount,
          category_id: data.category_id || null,
          note: data.note || null,
          hashtags: data.hashtags || [],
          date: data.date || new Date().toISOString(),
          payment_method: data.payment_method || 'Card',
          created_at: new Date().toISOString(),
        };

        const next = [localCreated, ...get().transactions];
        localStorage.setItem(LOCAL_STORAGE_TRANSACTIONS, JSON.stringify(next));
        set({ transactions: next, isLoading: false });
        return localCreated;
      }
    },

    updateTransaction: async (id, updates) => {
      set({ isLoading: true });
      try {
        const updated = await apiRequest<Transaction>(`/transactions/${id}`, {
          method: 'PUT',
          body: JSON.stringify(updates),
        });

        const next = get().transactions.map((t) => (t.id === id ? updated : t));
        localStorage.setItem(LOCAL_STORAGE_TRANSACTIONS, JSON.stringify(next));
        set({ transactions: next, isLoading: false });
        return updated;
      } catch (err: any) {
        const next = get().transactions.map((t) => (t.id === id ? { ...t, ...updates } : t));
        localStorage.setItem(LOCAL_STORAGE_TRANSACTIONS, JSON.stringify(next));
        set({ transactions: next, isLoading: false });
        return next.find((t) => t.id === id)!;
      }
    },

    deleteTransaction: async (id) => {
      set({ isLoading: true });
      try {
        await apiRequest(`/transactions/${id}`, { method: 'DELETE' });
      } catch (err) {
        console.warn('Backend delete transaction failed, deleting locally:', err);
      }

      const next = get().transactions.filter((t) => t.id !== id);
      localStorage.setItem(LOCAL_STORAGE_TRANSACTIONS, JSON.stringify(next));
      set({ transactions: next, isLoading: false });
    },

    fetchHashtagSuggestions: async (query?: string) => {
      try {
        const tags = await apiRequest<string[]>(`/hashtags/suggest${query ? `?query=${encodeURIComponent(query)}` : ''}`);
        if (Array.isArray(tags) && tags.length > 0) {
          set({ hashtagSuggestions: tags });
        }
      } catch {
        // use local
      }
    },

    addHashtagSuggestion: async (tag: string) => {
      const clean = tag.trim().replace(/^#/, '').toLowerCase();
      if (!clean) return;

      const current = get().hashtagSuggestions;
      if (!current.includes(clean)) {
        const next = [clean, ...current];
        localStorage.setItem(LOCAL_STORAGE_HASHTAGS, JSON.stringify(next));
        set({ hashtagSuggestions: next });
      }

      try {
        await apiRequest('/hashtags', {
          method: 'POST',
          body: JSON.stringify({ tag: clean }),
        });
      } catch (err) {
        console.warn('Backend add hashtag failed (saved locally):', err);
      }
    },

    removeHashtagSuggestion: async (tag: string) => {
      const clean = tag.trim().replace(/^#/, '').toLowerCase();
      if (!clean) return;

      const current = get().hashtagSuggestions;
      const next = current.filter((t) => t.toLowerCase() !== clean);
      localStorage.setItem(LOCAL_STORAGE_HASHTAGS, JSON.stringify(next));
      set({ hashtagSuggestions: next });

      try {
        await apiRequest(`/hashtags/${encodeURIComponent(clean)}`, {
          method: 'DELETE',
        });
      } catch (err) {
        console.warn('Backend delete hashtag failed (removed locally):', err);
      }
    },

    getAllTransactions: () => {
      return get().transactions;
    },

    getTotalIncome: () => {
      return get()
        .transactions.filter((t) => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0);
    },

    getTotalExpenses: () => {
      return get()
        .transactions.filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0);
    },

    // Total Net Balance = starting_balance + sum(income) - sum(expense)
    getCurrentBalance: () => {
      const starting = useSettingsStore.getState().startingBalance;
      const income = get().getTotalIncome();
      const expense = get().getTotalExpenses();
      return Math.round((starting + income - expense) * 100) / 100;
    },

    getFilteredTransactions: (filters: FilterState) => {
      let list = get().transactions;

      // Filter by type: 'all' | 'expense' | 'income'
      if (filters.type !== 'all') {
        list = list.filter((t) => t.type === filters.type);
      }

      // Filter by category
      if (filters.categoryId !== 'all') {
        list = list.filter((t) => t.category_id === filters.categoryId);
      }

      // Filter by payment method
      if (filters.paymentMethod !== 'all') {
        list = list.filter((t) => t.payment_method === filters.paymentMethod);
      }

      // Filter by hashtag
      if (filters.hashtag) {
        const cleanTag = filters.hashtag.replace(/^#/, '').toLowerCase();
        list = list.filter((t) => t.hashtags && t.hashtags.some((tag) => tag.toLowerCase() === cleanTag));
      }

      // Filter by period / dates
      if (filters.period !== 'all') {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7));
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

        list = list.filter((t) => {
          const d = new Date(t.date);
          if (filters.period === 'today') return d >= startOfToday;
          if (filters.period === 'week') return d >= startOfWeek;
          if (filters.period === 'month') return d >= startOfMonth;
          if (filters.period === 'last_month') return d >= startOfLastMonth && d <= endOfLastMonth;
          return true;
        });
      }

      // Filter by custom date range
      if (filters.startDate) {
        const start = new Date(filters.startDate);
        list = list.filter((t) => new Date(t.date) >= start);
      }
      if (filters.endDate) {
        const end = new Date(filters.endDate);
        list = list.filter((t) => new Date(t.date) <= end);
      }

      // Search query across note, hashtag, category
      if (filters.search && filters.search.trim()) {
        const q = filters.search.trim().toLowerCase();
        list = list.filter((t) => {
          const noteMatch = t.note?.toLowerCase().includes(q);
          const tagMatch = t.hashtags?.some((tag) => tag.toLowerCase().includes(q));
          const catMatch = t.category?.name?.toLowerCase().includes(q);
          return noteMatch || tagMatch || catMatch;
        });
      }

      return list;
    },
  };
});
