import { create } from 'zustand';
import { apiRequest } from '../utils/api';
import type { Category, TransactionType } from '../types/models';

export const INITIAL_CATEGORIES: Category[] = [
  // 12 Expense Categories
  { id: 'cat-exp-1', name: 'Food & Dining', icon: 'Utensils', color: '#F87171', type: 'expense', is_custom: false, order: 1 },
  { id: 'cat-exp-2', name: 'Groceries', icon: 'ShoppingCart', color: '#34D399', type: 'expense', is_custom: false, order: 2 },
  { id: 'cat-exp-3', name: 'Transport', icon: 'Car', color: '#60A5FA', type: 'expense', is_custom: false, order: 3 },
  { id: 'cat-exp-4', name: 'Housing & Rent', icon: 'Home', color: '#818CF8', type: 'expense', is_custom: false, order: 4 },
  { id: 'cat-exp-5', name: 'Bills & Utilities', icon: 'Receipt', color: '#FBBF24', type: 'expense', is_custom: false, order: 5 },
  { id: 'cat-exp-6', name: 'Entertainment', icon: 'Film', color: '#A78BFA', type: 'expense', is_custom: false, order: 6 },
  { id: 'cat-exp-7', name: 'Shopping', icon: 'ShoppingBag', color: '#F472B6', type: 'expense', is_custom: false, order: 7 },
  { id: 'cat-exp-8', name: 'Health & Fitness', icon: 'HeartPulse', color: '#FB7185', type: 'expense', is_custom: false, order: 8 },
  { id: 'cat-exp-9', name: 'Travel', icon: 'Plane', color: '#38BDF8', type: 'expense', is_custom: false, order: 9 },
  { id: 'cat-exp-10', name: 'Education', icon: 'GraduationCap', color: '#4ADE80', type: 'expense', is_custom: false, order: 10 },
  { id: 'cat-exp-11', name: 'Personal Care', icon: 'Sparkles', color: '#E879F9', type: 'expense', is_custom: false, order: 11 },
  { id: 'cat-exp-12', name: 'Other Expense', icon: 'MoreHorizontal', color: '#94A3B8', type: 'expense', is_custom: false, order: 12 },

  // 7 Income Categories
  { id: 'cat-inc-1', name: 'Salary', icon: 'Briefcase', color: '#10B981', type: 'income', is_custom: false, order: 1 },
  { id: 'cat-inc-2', name: 'Freelance', icon: 'Laptop', color: '#06B6D4', type: 'income', is_custom: false, order: 2 },
  { id: 'cat-inc-3', name: 'Investments', icon: 'TrendingUp', color: '#8B5CF6', type: 'income', is_custom: false, order: 3 },
  { id: 'cat-inc-4', name: 'Business', icon: 'Building2', color: '#3B82F6', type: 'income', is_custom: false, order: 4 },
  { id: 'cat-inc-5', name: 'Gifts', icon: 'Gift', color: '#EC4899', type: 'income', is_custom: false, order: 5 },
  { id: 'cat-inc-6', name: 'Rental', icon: 'Key', color: '#F59E0B', type: 'income', is_custom: false, order: 6 },
  { id: 'cat-inc-7', name: 'Other Income', icon: 'PlusCircle', color: '#64748B', type: 'income', is_custom: false, order: 7 },
];

const LOCAL_STORAGE_CATEGORIES = 'vault_categories';

interface CategoryState {
  categories: Category[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchCategories: () => Promise<void>;
  addCustomCategory: (cat: { name: string; icon: string; color: string; type: TransactionType }) => Promise<Category>;
  updateCustomCategory: (id: string, updates: Partial<Category>) => Promise<Category>;
  deleteCustomCategory: (id: string) => Promise<void>;
  getCategoryById: (id?: string | null) => Category | undefined;
  getCategoriesByType: (type: TransactionType) => Category[];
}

export const useCategoryStore = create<CategoryState>((set, get) => {
  const saved = localStorage.getItem(LOCAL_STORAGE_CATEGORIES);
  const initial = saved ? JSON.parse(saved) : INITIAL_CATEGORIES;

  return {
    categories: initial,
    isLoading: false,
    error: null,

    fetchCategories: async () => {
      set({ isLoading: true, error: null });
      try {
        const fetched = await apiRequest<Category[]>('/categories');
        if (Array.isArray(fetched) && fetched.length > 0) {
          localStorage.setItem(LOCAL_STORAGE_CATEGORIES, JSON.stringify(fetched));
          set({ categories: fetched, isLoading: false });
        } else {
          set({ isLoading: false });
        }
      } catch (err: any) {
        console.warn('Falling back to local categories:', err.message);
        set({ isLoading: false });
      }
    },

    addCustomCategory: async (data) => {
      set({ isLoading: true });
      try {
        const created = await apiRequest<Category>('/categories', {
          method: 'POST',
          body: JSON.stringify(data),
        });

        const next = [...get().categories, created];
        localStorage.setItem(LOCAL_STORAGE_CATEGORIES, JSON.stringify(next));
        set({ categories: next, isLoading: false });
        return created;
      } catch (err: any) {
        // Offline fallback: create locally
        const localCreated: Category = {
          id: `custom-${Date.now()}`,
          name: data.name,
          icon: data.icon,
          color: data.color,
          type: data.type,
          is_custom: true,
          order: get().categories.length + 1,
        };
        const next = [...get().categories, localCreated];
        localStorage.setItem(LOCAL_STORAGE_CATEGORIES, JSON.stringify(next));
        set({ categories: next, isLoading: false });
        return localCreated;
      }
    },

    updateCustomCategory: async (id, updates) => {
      set({ isLoading: true });
      try {
        const updated = await apiRequest<Category>(`/categories/${id}`, {
          method: 'PUT',
          body: JSON.stringify(updates),
        });

        const next = get().categories.map((c) => (c.id === id ? updated : c));
        localStorage.setItem(LOCAL_STORAGE_CATEGORIES, JSON.stringify(next));
        set({ categories: next, isLoading: false });
        return updated;
      } catch (err: any) {
        const next = get().categories.map((c) => (c.id === id ? { ...c, ...updates } : c));
        localStorage.setItem(LOCAL_STORAGE_CATEGORIES, JSON.stringify(next));
        set({ categories: next, isLoading: false });
        return next.find((c) => c.id === id)!;
      }
    },

    deleteCustomCategory: async (id) => {
      set({ isLoading: true });
      try {
        await apiRequest(`/categories/${id}`, { method: 'DELETE' });
      } catch (err) {
        console.warn('Backend delete category failed, deleting locally:', err);
      }

      const next = get().categories.filter((c) => c.id !== id);
      localStorage.setItem(LOCAL_STORAGE_CATEGORIES, JSON.stringify(next));
      set({ categories: next, isLoading: false });
    },

    getCategoryById: (id?: string | null) => {
      if (!id) return undefined;
      return get().categories.find((c) => c.id === id);
    },

    getCategoriesByType: (type: TransactionType) => {
      return get().categories.filter((c) => c.type === type);
    },
  };
});
