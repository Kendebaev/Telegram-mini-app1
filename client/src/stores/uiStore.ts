import { create } from 'zustand';
import type {
  ActiveTab,
  FilterState,
  QuickTemplate,
  Transaction,
  TransactionType,
} from '../types/models';

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
  isSettingsOpen: boolean;
  selectedTransactionForDetail: Transaction | null;
  editingTransaction: Transaction | null;
  preselectedTransactionType: TransactionType;
  prefillTemplate: QuickTemplate | null;
  filters: FilterState;

  // Actions
  setActiveTab: (tab: ActiveTab) => void;
  openAddTransaction: (
    type?: TransactionType,
    txToEdit?: Transaction,
    prefill?: QuickTemplate | null,
  ) => void;
  closeAddTransaction: () => void;
  openManageCategories: () => void;
  closeManageCategories: () => void;
  openSettings: () => void;
  closeSettings: () => void;
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
  isSettingsOpen: false,
  selectedTransactionForDetail: null,
  editingTransaction: null,
  preselectedTransactionType: 'expense',
  prefillTemplate: null,
  filters: DEFAULT_FILTERS,

  setActiveTab: (tab) => set({ activeTab: tab }),

  openAddTransaction: (type = 'expense', txToEdit, prefill = null) => {
    set({
      isAddTransactionOpen: true,
      preselectedTransactionType: type,
      editingTransaction: txToEdit || null,
      prefillTemplate: prefill,
    });
  },

  closeAddTransaction: () => {
    set({
      isAddTransactionOpen: false,
      editingTransaction: null,
      prefillTemplate: null,
    });
  },

  openManageCategories: () => set({ isManageCategoriesOpen: true }),
  closeManageCategories: () => set({ isManageCategoriesOpen: false }),

  openSettings: () => set({ isSettingsOpen: true }),
  closeSettings: () => set({ isSettingsOpen: false }),

  setSelectedTransaction: (tx) => set({ selectedTransactionForDetail: tx }),

  // Categories are disjoint per type, so reset the category whenever the type changes
  setFilterType: (type) => {
    set((state) => ({
      filters: {
        ...state.filters,
        type,
        categoryId:
          type === 'all' || type !== state.filters.type ? 'all' : state.filters.categoryId,
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
