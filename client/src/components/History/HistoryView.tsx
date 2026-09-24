import React from 'react';
import { useTranslation } from '../../stores/settingsStore';
import { SearchAndFilterBar } from './SearchAndFilterBar';
import { TransactionFeed } from './TransactionFeed';

export const HistoryView: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      <div className="px-1 flex items-center justify-between">
        <h2 className="text-base font-extrabold text-white tracking-tight">{t('transaction_history')}</h2>
      </div>

      {/* Filter & Search Bar */}
      <SearchAndFilterBar />

      {/* Grouped Feed */}
      <TransactionFeed />
    </div>
  );
};
