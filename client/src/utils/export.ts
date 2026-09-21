import type { Transaction, Category } from '../types/models';

export function exportTransactionsToCSV(
  transactions: Transaction[],
  categories: Category[],
  currencyCode: string
) {
  const categoryMap = new Map<string, string>();
  categories.forEach((c) => categoryMap.set(c.id, c.name));

  const headers = ['ID', 'Date', 'Type', 'Category', 'Amount', 'Currency', 'Payment Method', 'Note', 'Hashtags'];

  const rows = transactions.map((t) => {
    const catName = t.category?.name || categoryMap.get(t.category_id || '') || (t.type === 'income' ? 'Other Income' : 'Other Expense');
    const cleanNote = t.note ? `"${t.note.replace(/"/g, '""')}"` : '""';
    const cleanTags = t.hashtags && t.hashtags.length > 0 ? `"${t.hashtags.join(', ')}"` : '""';
    const formattedDate = new Date(t.date).toISOString().slice(0, 10);

    return [
      t.id,
      formattedDate,
      t.type,
      `"${catName}"`,
      t.amount.toFixed(2),
      currencyCode,
      t.payment_method,
      cleanNote,
      cleanTags,
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `vault-transactions-${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportDataToJSON(
  transactions: Transaction[],
  categories: Category[],
  startingBalance: number,
  currencyCode: string
) {
  const payload = {
    exportedAt: new Date().toISOString(),
    version: '2.0.0',
    app: 'Vault Telegram Mini App',
    settings: {
      currency: currencyCode,
      startingBalance,
    },
    categories,
    transactions,
  };

  const jsonStr = JSON.stringify(payload, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `vault-backup-${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
