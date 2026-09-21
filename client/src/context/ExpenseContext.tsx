import React, { createContext, useContext } from 'react';
import type { Transaction, Category, CategoryBreakdownItem, DailySpendingItem } from '../types/models';
import { useTransactionStore } from '../stores/transactionStore';
import { useCategoryStore } from '../stores/categoryStore';
import { useSettingsStore } from '../stores/settingsStore';

export interface CategoryBreakdown extends CategoryBreakdownItem {}
export interface DailySpending extends DailySpendingItem {}
export type PeriodFilter = 'all' | 'today' | 'week' | 'month' | 'last_month';

interface ExpenseContextValue {
  expenses: Transaction[];
  filteredExpenses: Transaction[];
  categories: Category[];
  currency: string;
  isLoading: boolean;
  filterPeriod: PeriodFilter;
  filterCategory: string;
  searchQuery: string;
  addExpense: (data: any) => Promise<any>;
  updateExpense: (id: string, data: any) => Promise<any>;
  deleteExpense: (id: string) => Promise<any>;
}

const ExpenseContext = createContext<ExpenseContextValue | undefined>(undefined);

export const ExpenseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { transactions, addTransaction, updateTransaction, deleteTransaction, isLoading } = useTransactionStore();
  const { categories } = useCategoryStore();
  const { currency } = useSettingsStore();

  const value: ExpenseContextValue = {
    expenses: transactions,
    filteredExpenses: transactions,
    categories,
    currency,
    isLoading,
    filterPeriod: 'month',
    filterCategory: 'all',
    searchQuery: '',
    addExpense: addTransaction,
    updateExpense: updateTransaction,
    deleteExpense: deleteTransaction,
  };

  return <ExpenseContext.Provider value={value}>{children}</ExpenseContext.Provider>;
};

export const useExpenses = (): ExpenseContextValue => {
  const context = useContext(ExpenseContext);
  if (!context) {
    const { transactions, addTransaction, updateTransaction, deleteTransaction, isLoading } = useTransactionStore.getState();
    const { categories } = useCategoryStore.getState();
    const { currency } = useSettingsStore.getState();
    return {
      expenses: transactions,
      filteredExpenses: transactions,
      categories,
      currency,
      isLoading,
      filterPeriod: 'month',
      filterCategory: 'all',
      searchQuery: '',
      addExpense: addTransaction,
      updateExpense: updateTransaction,
      deleteExpense: deleteTransaction,
    };
  }
  return context;
};

export const useExpense = useExpenses;
