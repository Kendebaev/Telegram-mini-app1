import { create } from 'zustand';
import type { PaymentMethod, RecurringBill, SavingsGoal } from '../types/models';
import { monthKey } from '../utils/finance';
import { useTransactionStore } from './transactionStore';

const STORAGE_KEY = 'vault_plan_v1';

interface PlanData {
  monthlyBudget: number;
  categoryBudgets: Record<string, number>;
  goals: SavingsGoal[];
  bills: RecurringBill[];
}

const EMPTY_PLAN: PlanData = {
  monthlyBudget: 0,
  categoryBudgets: {},
  goals: [],
  bills: [],
};

function loadPlan(): PlanData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...EMPTY_PLAN };
    const parsed = JSON.parse(raw) as Partial<PlanData>;
    return {
      monthlyBudget: Number(parsed.monthlyBudget) || 0,
      categoryBudgets: parsed.categoryBudgets ?? {},
      goals: Array.isArray(parsed.goals) ? parsed.goals : [],
      bills: Array.isArray(parsed.bills) ? parsed.bills : [],
    };
  } catch {
    return { ...EMPTY_PLAN };
  }
}

function persist(data: PlanData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

interface PlanState extends PlanData {
  setMonthlyBudget: (amount: number) => void;
  setCategoryBudget: (categoryId: string, amount: number) => void;
  removeCategoryBudget: (categoryId: string) => void;

  addGoal: (goal: {
    name: string;
    target: number;
    icon?: string;
    color?: string;
    deadline?: string;
  }) => void;
  contributeToGoal: (id: string, amount: number) => void;
  deleteGoal: (id: string) => void;

  addBill: (bill: {
    name: string;
    amount: number;
    day: number;
    icon?: string;
    color?: string;
    category_id?: string | null;
    payment_method?: PaymentMethod;
  }) => void;
  deleteBill: (id: string) => void;
  markBillPaid: (id: string) => Promise<void>;

  resetPlan: () => void;
}

function snapshot(state: PlanState): PlanData {
  return {
    monthlyBudget: state.monthlyBudget,
    categoryBudgets: state.categoryBudgets,
    goals: state.goals,
    bills: state.bills,
  };
}

export const usePlanStore = create<PlanState>((set, get) => {
  const initial = loadPlan();

  return {
    ...initial,

    setMonthlyBudget: (amount) => {
      const monthlyBudget = Math.max(0, Number(amount) || 0);
      set({ monthlyBudget });
      persist({ ...snapshot(get()), monthlyBudget });
    },

    setCategoryBudget: (categoryId, amount) => {
      const value = Math.max(0, Number(amount) || 0);
      const categoryBudgets = { ...get().categoryBudgets };
      if (value <= 0) delete categoryBudgets[categoryId];
      else categoryBudgets[categoryId] = value;
      set({ categoryBudgets });
      persist({ ...snapshot(get()), categoryBudgets });
    },

    removeCategoryBudget: (categoryId) => {
      const categoryBudgets = { ...get().categoryBudgets };
      delete categoryBudgets[categoryId];
      set({ categoryBudgets });
      persist({ ...snapshot(get()), categoryBudgets });
    },

    addGoal: ({ name, target, icon, color, deadline }) => {
      const goal: SavingsGoal = {
        id: `goal-${Date.now()}`,
        name: name.trim(),
        icon: icon ?? 'Target',
        color: color ?? '#8B7CFF',
        target: Math.max(1, Number(target) || 0),
        saved: 0,
        deadline,
        created_at: new Date().toISOString(),
      };
      if (!goal.name) return;
      const goals = [...get().goals, goal];
      set({ goals });
      persist({ ...snapshot(get()), goals });
    },

    contributeToGoal: (id, amount) => {
      const delta = Number(amount) || 0;
      if (!delta) return;
      const goals = get().goals.map((g) =>
        g.id === id ? { ...g, saved: Math.max(0, Math.round((g.saved + delta) * 100) / 100) } : g,
      );
      set({ goals });
      persist({ ...snapshot(get()), goals });
    },

    deleteGoal: (id) => {
      const goals = get().goals.filter((g) => g.id !== id);
      set({ goals });
      persist({ ...snapshot(get()), goals });
    },

    addBill: ({ name, amount, day, icon, color, category_id, payment_method }) => {
      const clean = name.trim();
      if (!clean) return;
      const bill: RecurringBill = {
        id: `bill-${Date.now()}`,
        name: clean,
        icon: icon ?? 'Receipt',
        color: color ?? '#5EEAD4',
        amount: Math.max(0, Number(amount) || 0),
        category_id: category_id ?? null,
        day: Math.min(31, Math.max(1, Math.round(Number(day) || 1))),
        payment_method: payment_method ?? 'Card',
        created_at: new Date().toISOString(),
      };
      const bills = [...get().bills, bill];
      set({ bills });
      persist({ ...snapshot(get()), bills });
    },

    deleteBill: (id) => {
      const bills = get().bills.filter((b) => b.id !== id);
      set({ bills });
      persist({ ...snapshot(get()), bills });
    },

    markBillPaid: async (id) => {
      const bill = get().bills.find((b) => b.id === id);
      if (!bill) return;

      await useTransactionStore.getState().addTransaction({
        type: 'expense',
        amount: bill.amount,
        category_id: bill.category_id ?? undefined,
        note: bill.name,
        hashtags: ['recurring'],
        payment_method: bill.payment_method,
        date: new Date().toISOString(),
      });

      const bills = get().bills.map((b) =>
        b.id === id ? { ...b, last_paid: monthKey(new Date()) } : b,
      );
      set({ bills });
      persist({ ...snapshot(get()), bills });
    },

    resetPlan: () => {
      const empty: PlanData = {
        monthlyBudget: 0,
        categoryBudgets: {},
        goals: [],
        bills: [],
      };
      set(empty);
      persist(empty);
    },
  };
});
