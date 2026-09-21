import type { CurrencyConfig } from '../types/expense';

export const SUPPORTED_CURRENCIES: CurrencyConfig[] = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'KZT', symbol: '₸', name: 'Kazakhstani Tenge' },
  { code: 'RUB', symbol: '₽', name: 'Russian Ruble' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'TRY', symbol: '₺', name: 'Turkish Lira' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
  { code: 'UZS', symbol: "so'm", name: 'Uzbek Som' },
];

export function getCurrencyConfig(code: string = 'USD'): CurrencyConfig {
  const found = SUPPORTED_CURRENCIES.find((c) => c.code.toUpperCase() === code.toUpperCase());
  return found || SUPPORTED_CURRENCIES[0];
}

export function formatCurrency(amount: number, currencyCode: string = 'USD'): string {
  const config = getCurrencyConfig(currencyCode);
  const formattedNumber = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);

  // Position symbol appropriately
  if (['KZT', 'RUB', 'TRY', 'UZS', 'AED'].includes(config.code)) {
    return `${formattedNumber} ${config.symbol}`;
  }
  return `${config.symbol}${formattedNumber}`;
}
