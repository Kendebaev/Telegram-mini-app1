import React from 'react';
import { LayoutDashboard, History, Plus, PieChart } from 'lucide-react';
import { useTelegram } from '../../context/TelegramContext';
import { useUIStore } from '../../stores/uiStore';
import type { ActiveTab } from '../../types/models';

export const BottomNav: React.FC = () => {
  const { haptic } = useTelegram();
  const { activeTab, setActiveTab, openAddTransaction } = useUIStore();

  const leftNavItems: Array<{ id: ActiveTab; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }> = [
    { id: 'dashboard', label: 'Vault', icon: LayoutDashboard },
    { id: 'history', label: 'History', icon: History },
  ];

  return (
    <nav className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] inset-x-4 max-w-md mx-auto z-40 pointer-events-none">
      <div className="pointer-events-auto">
        {/* Floating Glass Dock */}
        <div className="h-16 rounded-full px-4 flex items-center justify-between relative bg-white/85 dark:bg-zinc-950/80 backdrop-blur-2xl border border-slate-200/80 dark:border-white/10 shadow-2xl transition-colors duration-200">
          {/* Left Tabs: Vault & History */}
          <div className="flex-1 flex items-center justify-around pr-3">
            {leftNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    haptic.selection();
                    setActiveTab(item.id);
                  }}
                  className={`flex flex-col items-center justify-center py-1 rounded-2xl transition-all duration-200 active:scale-95 ${
                    isActive
                      ? 'text-indigo-600 dark:text-indigo-400'
                      : 'text-slate-400 dark:text-zinc-400 hover:text-slate-600 dark:hover:text-zinc-200'
                  }`}
                >
                  <div className="relative">
                    <Icon size={21} className={isActive ? 'stroke-[2.4]' : 'stroke-[1.9]'} />
                    {isActive && (
                      <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-indigo-600 dark:bg-indigo-400 shadow-[0_0_8px_#818CF8]" />
                    )}
                  </div>
                  <span
                    className={`text-[10px] mt-1 tracking-tight ${
                      isActive
                        ? 'font-bold text-slate-900 dark:text-white'
                        : 'font-medium text-slate-500 dark:text-zinc-400'
                    }`}
                  >
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Centered Elevated Add Button */}
          <div className="flex-shrink-0 px-1 relative -top-3">
            <button
              type="button"
              onClick={() => {
                haptic.impact('medium');
                openAddTransaction();
              }}
              aria-label="Add transaction"
              className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 text-white p-3 shadow-[0_0_16px_rgba(99,102,241,0.45)] hover:shadow-[0_0_22px_rgba(99,102,241,0.65)] border border-white/30 active:scale-90 transition-transform duration-150 flex items-center justify-center group"
            >
              <Plus size={22} className="stroke-[2.8] transition-transform duration-200 group-hover:rotate-90" />
            </button>
          </div>

          {/* Right Tab: Analytics */}
          <div className="flex-1 flex items-center justify-center pl-3">
            {(() => {
              const isActive = activeTab === 'analytics';
              return (
                <button
                  type="button"
                  onClick={() => {
                    haptic.selection();
                    setActiveTab('analytics');
                  }}
                  className={`flex flex-col items-center justify-center py-1 rounded-2xl transition-all duration-200 active:scale-95 ${
                    isActive
                      ? 'text-indigo-600 dark:text-indigo-400'
                      : 'text-slate-400 dark:text-zinc-400 hover:text-slate-600 dark:hover:text-zinc-200'
                  }`}
                >
                  <div className="relative">
                    <PieChart size={21} className={isActive ? 'stroke-[2.4]' : 'stroke-[1.9]'} />
                    {isActive && (
                      <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-indigo-600 dark:bg-indigo-400 shadow-[0_0_8px_#818CF8]" />
                    )}
                  </div>
                  <span
                    className={`text-[10px] mt-1 tracking-tight ${
                      isActive
                        ? 'font-bold text-slate-900 dark:text-white'
                        : 'font-medium text-slate-500 dark:text-zinc-400'
                    }`}
                  >
                    Analytics
                  </span>
                </button>
              );
            })()}
          </div>
        </div>
      </div>
    </nav>
  );
};
