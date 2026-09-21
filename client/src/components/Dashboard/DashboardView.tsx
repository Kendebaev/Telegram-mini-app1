import React from 'react';
import { BalanceCard } from './BalanceCard';
import { CategoryDistributionBars } from './CategoryDistributionBars';
import { RecentTransactionsWidget } from './RecentTransactionsWidget';

export const DashboardView: React.FC = () => {
  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* 1. Net Balance Hero & Cash Flow */}
      <BalanceCard />

      {/* 2. Top Category Spending Distribution Bars */}
      <CategoryDistributionBars />

      {/* 3. Recent Transactions Feed */}
      <RecentTransactionsWidget />
    </div>
  );
};
