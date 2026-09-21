import { create } from 'zustand';
import { apiRequest } from '../utils/api';
import type { CurrencyConfig } from '../types/models';

export const SUPPORTED_CURRENCIES: CurrencyConfig[] = [
  { code: 'USD', symbol: '$', name: 'US Dollar', flag: '🇺🇸' },
  { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇪🇺' },
  { code: 'GBP', symbol: '£', name: 'British Pound', flag: '🇬🇧' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', flag: '🇯🇵' },
  { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar', flag: '🇨🇦' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', flag: '🇦🇺' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', flag: '🇨🇭' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', flag: '🇨🇳' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', flag: '🇮🇳' },
  { code: 'KZT', symbol: '₸', name: 'Kazakhstani Tenge', flag: '🇰🇿' },
  { code: 'RUB', symbol: '₽', name: 'Russian Ruble', flag: '🇷🇺' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real', flag: '🇧🇷' },
];

const LOCAL_STORAGE_CURRENCY = 'vault_currency';
const LOCAL_STORAGE_STARTING_BALANCE = 'vault_starting_balance';

interface SettingsState {
  currency: string;
  currencyConfig: CurrencyConfig;
  startingBalance: number;
  isLoading: boolean;
  error: string | null;

  // Actions
  setCurrency: (code: string) => Promise<void>;
  setStartingBalance: (amount: number) => Promise<void>;
  fetchProfile: () => Promise<void>;
  wipeData: () => Promise<void>;
  formatAmount: (amount: number, showSign?: boolean) => string;
}

export const useSettingsStore = create<SettingsState>((set, get) => {
  const initialCurrency = localStorage.getItem(LOCAL_STORAGE_CURRENCY) || 'USD';
  const initialStartingBalance = parseFloat(localStorage.getItem(LOCAL_STORAGE_STARTING_BALANCE) || '0') || 0;
  const initialConfig = SUPPORTED_CURRENCIES.find((c) => c.code === initialCurrency) || SUPPORTED_CURRENCIES[0];

  return {
    currency: initialCurrency,
    currencyConfig: initialConfig,
    startingBalance: initialStartingBalance,
    isLoading: false,
    error: null,

    setCurrency: async (code: string) => {
      const config = SUPPORTED_CURRENCIES.find((c) => c.code === code) || SUPPORTED_CURRENCIES[0];
      localStorage.setItem(LOCAL_STORAGE_CURRENCY, code);
      set({ currency: code, currencyConfig: config });

      try {
        await apiRequest('/user/currency', {
          method: 'PUT',
          body: JSON.stringify({ currency: code }),
        });
      } catch (err) {
        console.warn('Backend currency update failed (offline mode):', err);
      }
    },

    setStartingBalance: async (amount: number) => {
      const sanitized = Math.round(amount * 100) / 100;
      localStorage.setItem(LOCAL_STORAGE_STARTING_BALANCE, sanitized.toString());
      set({ startingBalance: sanitized });

      try {
        await apiRequest('/user/starting-balance', {
          method: 'PUT',
          body: JSON.stringify({ starting_balance: sanitized }),
        });
      } catch (err) {
        console.warn('Backend starting balance update failed (offline mode):', err);
      }
    },

    fetchProfile: async () => {
      set({ isLoading: true, error: null });
      try {
        const profile = await apiRequest<{ currency?: string; starting_balance?: number }>('/user/profile');
        if (profile) {
          const cur = profile.currency || get().currency;
          const config = SUPPORTED_CURRENCIES.find((c) => c.code === cur) || SUPPORTED_CURRENCIES[0];
          const startBal = profile.starting_balance !== undefined ? profile.starting_balance : get().startingBalance;

          localStorage.setItem(LOCAL_STORAGE_CURRENCY, cur);
          localStorage.setItem(LOCAL_STORAGE_STARTING_BALANCE, startBal.toString());

          set({
            currency: cur,
            currencyConfig: config,
            startingBalance: startBal,
            isLoading: false,
          });
        }
      } catch (err: any) {
        console.warn('Using local profile settings:', err.message);
        set({ isLoading: false });
      }
    },

    wipeData: async () => {
      set({ isLoading: true });
      try {
        await apiRequest('/user/reset', { method: 'POST' });
        localStorage.removeItem(LOCAL_STORAGE_STARTING_BALANCE);
        set({ startingBalance: 0, isLoading: false });
      } catch (err: any) {
        set({ error: err.message, isLoading: false });
        throw err;
      }
    },

    formatAmount: (amount: number, showSign = false): string => {
      const { currencyConfig } = get();
      const absAmount = Math.abs(amount).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });

      const symbol = currencyConfig.symbol;
      const prefix = amount < 0 ? '-' : showSign && amount > 0 ? '+' : '';
      return `${prefix}${symbol}${absAmount}`;
    },
  };
});
