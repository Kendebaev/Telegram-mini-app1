import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { TelegramProvider } from './context/TelegramContext';
import { Header } from './components/Navigation/Header';
import { BottomNav } from './components/Navigation/BottomNav';
import { MockTelegramDevBar } from './components/Navigation/MockTelegramDevBar';
import { AuroraBackground } from './components/ui/AuroraBackground';
import { ToastHost } from './components/ui/ToastHost';
import { DashboardView } from './components/Dashboard/DashboardView';
import { HistoryView } from './components/History/HistoryView';
import { AnalyticsView } from './components/Analytics/AnalyticsView';
import { PlanView } from './components/Plan/PlanView';
import { SettingsModal } from './components/Settings/SettingsModal';
import { AddTransactionScreen } from './components/ExpenseLogging/AddTransactionScreen';
import { TransactionDetailSheet } from './components/History/TransactionDetailSheet';
import { CategoryManagementScreen } from './components/ExpenseLogging/CategoryManagementScreen';
import { useUIStore } from './stores/uiStore';
import { useSettingsStore } from './stores/settingsStore';
import { useCategoryStore } from './stores/categoryStore';
import { useTransactionStore } from './stores/transactionStore';

const MainLayout: React.FC = () => {
  const {
    activeTab,
    isManageCategoriesOpen,
    isSettingsOpen,
    closeManageCategories,
    closeSettings,
  } = useUIStore();

  const { fetchProfile } = useSettingsStore();
  const { fetchCategories } = useCategoryStore();
  const { fetchTransactions, fetchHashtagSuggestions } = useTransactionStore();

  useEffect(() => {
    fetchProfile();
    fetchCategories();
    fetchTransactions();
    fetchHashtagSuggestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="relative flex min-h-[100dvh] flex-col overflow-x-hidden text-ink">
      <AuroraBackground />
      <MockTelegramDevBar />
      <Header />

      <main className="relative z-10 mx-auto w-full max-w-md flex-1 px-4 pb-32 pt-2">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
        >
          {activeTab === 'dashboard' && <DashboardView />}
          {activeTab === 'history' && <HistoryView />}
          {activeTab === 'plan' && <PlanView />}
          {activeTab === 'analytics' && <AnalyticsView />}
        </motion.div>
      </main>

      <BottomNav />

      <SettingsModal isOpen={isSettingsOpen} onClose={closeSettings} />
      <AddTransactionScreen />
      <CategoryManagementScreen open={isManageCategoriesOpen} onClose={closeManageCategories} />
      <TransactionDetailSheet />
      <ToastHost />
    </div>
  );
};

export default function App() {
  return (
    <TelegramProvider>
      <MainLayout />
    </TelegramProvider>
  );
}
