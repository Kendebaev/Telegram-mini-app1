import React from 'react';
import { LayoutDashboard, History, Plus, PieChart, Settings } from 'lucide-react';
import { useTelegram } from '../../context/TelegramContext';
import { useUIStore } from '../../stores/uiStore';
import type { ActiveTab } from '../../types/models';

export const TabBar: React.FC = () => {
  const { haptic } = useTelegram();
  const { activeTab, setActiveTab, openAddTransaction } = useUIStore();

  const navItems: Array<{ id: ActiveTab; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }> = [
    { id: 'dashboard', label: 'Vault', icon: LayoutDashboard },
    { id: 'history', label: 'History', icon: History },
    { id: 'analytics', label: 'Analytics', icon: PieChart },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 pb-safe pointer-events-none">
      <div className="max-w-md mx-auto px-4 pb-2 pt-1 pointer-events-auto">
        {/* Floating Glass Dock */}
        <div className="glass-dock rounded-3xl px-3 py-2 flex items-center justify-between relative shadow-2xl">
          {/* Left two tabs */}
          {navItems.slice(0, 2).map((item) => {
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
                className={`flex-1 flex flex-col items-center justify-center py-1 rounded-2xl transition-all duration-200 active:scale-95 ${
                  isActive ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="relative">
                  <Icon size={20} className={isActive ? 'stroke-[2.4]' : 'stroke-[1.8]'} />
                  {isActive && (
                    <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-indigo-400 shadow-[0_0_8px_#818CF8]" />
                  )}
                </div>
                <span className={`text-[10px] mt-1 font-medium tracking-tight ${isActive ? 'font-semibold text-white' : ''}`}>
                  {item.label}
                </span>
              </button>
            );
          })}

          {/* Elevated Center "+" Add Button */}
          <div className="flex-shrink-0 px-2 relative -top-3.5">
            <button
              type="button"
              onClick={() => {
                haptic.impact('medium');
                openAddTransaction();
              }}
              aria-label="Add transaction"
              className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 text-white p-3.5 shadow-lg shadow-indigo-500/40 hover:shadow-indigo-500/60 border border-white/25 active:scale-90 transition-all duration-150 flex items-center justify-center group"
            >
              <Plus size={24} className="stroke-[2.8] transition-transform duration-200 group-hover:rotate-90" />
            </button>
          </div>

          {/* Right two tabs */}
          {navItems.slice(2, 4).map((item) => {
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
                className={`flex-1 flex flex-col items-center justify-center py-1 rounded-2xl transition-all duration-200 active:scale-95 ${
                  isActive ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="relative">
                  <Icon size={20} className={isActive ? 'stroke-[2.4]' : 'stroke-[1.8]'} />
                  {isActive && (
                    <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-indigo-400 shadow-[0_0_8px_#818CF8]" />
                  )}
                </div>
                <span className={`text-[10px] mt-1 font-medium tracking-tight ${isActive ? 'font-semibold text-white' : ''}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
