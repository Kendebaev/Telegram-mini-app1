import { create } from 'zustand';
import type { ActiveTab, Transaction, TransactionType, FilterState } from '../types/models';

const DEFAULT_FILTERS: FilterState = {
  type: 'all',
  categoryId: 'all',
  period: 'month',
  search: '',
  paymentMethod: 'all',
  hashtag: undefined,
  startDate: undefined,
  endDate: undefined,
};

interface UIState {
  activeTab: ActiveTab;
  isAddTransactionOpen: boolean;
  isManageCategoriesOpen: boolean;
  selectedTransactionForDetail: Transaction | null;
  editingTransaction: Transaction | null;
  preselectedTransactionType: TransactionType;
  filters: FilterState;

  // Actions
  setActiveTab: (tab: ActiveTab) => void;
  openAddTransaction: (type?: TransactionType, txToEdit?: Transaction) => void;
  closeAddTransaction: () => void;
  openManageCategories: () => void;
  closeManageCategories: () => void;
  setSelectedTransaction: (tx: Transaction | null) => void;
  setFilterType: (type: 'all' | 'expense' | 'income') => void;
  setFilterCategory: (categoryId: string) => void;
  setFilterPeriod: (period: FilterState['period']) => void;
  setFilterSearch: (search: string) => void;
  setFilterPaymentMethod: (method: FilterState['paymentMethod']) => void;
  setFilterHashtag: (tag?: string) => void;
  setFilterDateRange: (start?: string, end?: string) => void;
  resetFilters: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeTab: 'dashboard',
  isAddTransactionOpen: false,
  isManageCategoriesOpen: false,
  selectedTransactionForDetail: null,
  editingTransaction: null,
  preselectedTransactionType: 'expense',
  filters: DEFAULT_FILTERS,

  setActiveTab: (tab) => set({ activeTab: tab }),

  openAddTransaction: (type = 'expense', txToEdit) => {
    set({
      isAddTransactionOpen: true,
      preselectedTransactionType: type,
      editingTransaction: txToEdit || null,
    });
  },

  closeAddTransaction: () => {
    set({
      isAddTransactionOpen: false,
      editingTransaction: null,
    });
  },

  openManageCategories: () => set({ isManageCategoriesOpen: true }),
  closeManageCategories: () => set({ isManageCategoriesOpen: false }),

  setSelectedTransaction: (tx) => set({ selectedTransactionForDetail: tx }),

  // When type = 'all', force category to 'all' because categories are disjoint
  setFilterType: (type) => {
    set((state) => ({
      filters: {
        ...state.filters,
        type,
        categoryId: type === 'all' ? 'all' : state.filters.categoryId,
      },
    }));
  },

  setFilterCategory: (categoryId) => {
    set((state) => ({
      filters: {
        ...state.filters,
        categoryId,
      },
    }));
  },

  setFilterPeriod: (period) => {
    set((state) => ({
      filters: {
        ...state.filters,
        period,
        startDate: undefined,
        endDate: undefined,
      },
    }));
  },

  setFilterSearch: (search) => {
    set((state) => ({
      filters: {
        ...state.filters,
        search,
      },
    }));
  },

  setFilterPaymentMethod: (paymentMethod) => {
    set((state) => ({
      filters: {
        ...state.filters,
        paymentMethod,
      },
    }));
  },

  setFilterHashtag: (hashtag) => {
    set((state) => ({
      filters: {
        ...state.filters,
        hashtag,
      },
    }));
  },

  setFilterDateRange: (startDate, endDate) => {
    set((state) => ({
      filters: {
        ...state.filters,
        startDate,
        endDate,
        period: 'all',
      },
    }));
  },

  resetFilters: () => set({ filters: DEFAULT_FILTERS }),
}));
