import React, { useEffect } from 'react';
import { TelegramProvider } from './context/TelegramContext';
import { Header } from './components/Navigation/Header';
import { BottomNav } from './components/Navigation/BottomNav';
import { MockTelegramDevBar } from './components/Navigation/MockTelegramDevBar';
import { BackgroundMesh } from './components/glass/BackgroundMesh';
import { DashboardView } from './components/Dashboard/DashboardView';
import { HistoryView } from './components/History/HistoryView';
import { AnalyticsView } from './components/Analytics/AnalyticsView';
import { SettingsScreen } from './components/Settings/SettingsScreen';
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
    isAddTransactionOpen,
    isManageCategoriesOpen,
    isSettingsOpen,
    closeManageCategories,
    closeSettings,
  } = useUIStore();

  const { fetchProfile } = useSettingsStore();
  const { fetchCategories } = useCategoryStore();
  const { fetchTransactions, fetchHashtagSuggestions } = useTransactionStore();

  // Startup data hydration
  useEffect(() => {
    fetchProfile();
    fetchCategories();
    fetchTransactions();
    fetchHashtagSuggestions();
  }, []);

  return (
    <div className="relative min-h-screen min-h-[100dvh] bg-[#F4F6F9] dark:bg-[#080A0F] text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200 overflow-x-hidden selection:bg-indigo-500/30">
      {/* Glowing ambient background mesh */}
      <BackgroundMesh />

      {/* Dev Simulator Bar for testing in browser outside Telegram */}
      <MockTelegramDevBar />

      {/* Main App Header */}
      <Header />

      {/* Main Tab Views */}
      <main className="relative z-10 flex-1 w-full max-w-md mx-auto px-4 py-4 pb-28">
        {activeTab === 'dashboard' && <DashboardView />}
        {activeTab === 'history' && <HistoryView />}
        {activeTab === 'analytics' && <AnalyticsView />}
        {activeTab === 'settings' && <SettingsScreen />}
      </main>

      {/* Floating Bottom Glass Navigation Dock (strictly 4 elements) */}
      <BottomNav />

      {/* Glassmorphic Settings Modal / Bottom Sheet */}
      <SettingsModal isOpen={isSettingsOpen} onClose={closeSettings} />

      {/* Full-screen Add / Edit Transaction Sheet */}
      {isAddTransactionOpen && <AddTransactionScreen />}

      {/* Standalone Category Management Modal */}
      {isManageCategoriesOpen && !isAddTransactionOpen && (
        <CategoryManagementScreen onClose={closeManageCategories} />
      )}

      {/* Transaction Detail Bottom Sheet */}
      <TransactionDetailSheet />
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
