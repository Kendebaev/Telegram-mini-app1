import React from 'react';
import { ShieldCheck, Moon, Sun } from 'lucide-react';
import { useTelegram } from '../../context/TelegramContext';
import { useSettingsStore } from '../../stores/settingsStore';
import { useUIStore } from '../../stores/uiStore';

export const Header: React.FC = () => {
  const { user, isInsideTelegram, colorScheme, toggleTheme, haptic } = useTelegram();
  const { currencyConfig } = useSettingsStore();
  const { setActiveTab } = useUIStore();

  return (
    <header className="sticky top-0 z-30 bg-[#070A12]/80 backdrop-blur-xl px-4 py-3 border-b border-white/[0.06] safe-top">
      <div className="max-w-md mx-auto flex items-center justify-between">
        {/* Left: Brand & User Avatar */}
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-[1.5px] shadow-lg shadow-indigo-500/20">
              <div className="w-full h-full rounded-[14px] bg-[#0D1322] flex items-center justify-center overflow-hidden">
                {user.photo_url ? (
                  <img src={user.photo_url} alt={user.first_name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs font-bold text-white tracking-wider">
                    {user.first_name?.[0] || 'V'}
                    {user.last_name?.[0] || ''}
                  </span>
                )}
              </div>
            </div>
            {/* Online / Telegram sync badge */}
            <span
              className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#070A12] ${
                isInsideTelegram ? 'bg-emerald-400 animate-pulse' : 'bg-indigo-400'
              }`}
              title={isInsideTelegram ? 'Telegram WebApp Sync Active' : 'Offline / Dev Mode'}
            />
          </div>

          <div>
            <div className="flex items-center space-x-1.5">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-400 flex items-center gap-1">
                <ShieldCheck size={11} className="stroke-[2.5]" />
                Vault
              </span>
              <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-white/[0.06] text-slate-400 border border-white/[0.06]">
                Pro
              </span>
            </div>
            <div className="text-sm font-bold text-white tracking-tight leading-tight">
              {user.first_name} {user.last_name || ''}
            </div>
          </div>
        </div>

        {/* Right: Currency Indicator & Theme Switcher */}
        <div className="flex items-center space-x-2">
          {/* Currency Pill - clicking jumps to settings */}
          <button
            type="button"
            onClick={() => {
              haptic.selection();
              setActiveTab('settings');
            }}
            aria-label="Currency settings"
            className="flex items-center space-x-1 px-2.5 py-1 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] active:scale-95 transition-all"
          >
            <span className="text-xs">{currencyConfig.flag || '🌐'}</span>
            <span className="text-xs font-semibold text-slate-200">{currencyConfig.code}</span>
          </button>

          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={() => {
              haptic.impact('light');
              toggleTheme();
            }}
            aria-label="Toggle theme"
            className="p-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-slate-400 hover:text-white border border-white/[0.08] active:scale-95 transition-all"
          >
            {colorScheme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </div>
    </header>
  );
};
