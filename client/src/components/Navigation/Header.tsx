import React from 'react';
import { ShieldCheck, Settings } from 'lucide-react';
import { useTelegram } from '../../context/TelegramContext';
import { useSettingsStore } from '../../stores/settingsStore';
import { useUIStore } from '../../stores/uiStore';

export const Header: React.FC = () => {
  const { user, isInsideTelegram, haptic } = useTelegram();
  const { currencyConfig } = useSettingsStore();
  const { openSettings } = useUIStore();

  return (
    <header className="sticky top-0 z-30 bg-[#F4F6F9]/80 dark:bg-[#080A0F]/80 backdrop-blur-xl px-4 py-3 border-b border-slate-200/60 dark:border-white/[0.06] safe-top transition-colors duration-200">
      <div className="max-w-md mx-auto flex items-center justify-between">
        {/* Left: Brand & User Avatar */}
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-[1.5px] shadow-sm dark:shadow-lg dark:shadow-indigo-500/20">
              <div className="w-full h-full rounded-[14px] bg-white dark:bg-[#0D1322] flex items-center justify-center overflow-hidden">
                {user.photo_url ? (
                  <img src={user.photo_url} alt={user.first_name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs font-bold text-slate-800 dark:text-white tracking-wider">
                    {user.first_name?.[0] || 'V'}
                    {user.last_name?.[0] || ''}
                  </span>
                )}
              </div>
            </div>
            {/* Online / Telegram sync badge */}
            <span
              className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#F4F6F9] dark:border-[#070A12] ${
                isInsideTelegram ? 'bg-emerald-500 animate-pulse' : 'bg-indigo-500'
              }`}
              title={isInsideTelegram ? 'Telegram WebApp Sync Active' : 'Offline / Dev Mode'}
            />
          </div>

          <div>
            <div className="flex items-center space-x-1.5">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                <ShieldCheck size={11} className="stroke-[2.5]" />
                Vault
              </span>
              <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-indigo-50 dark:bg-white/[0.06] text-indigo-700 dark:text-slate-400 border border-indigo-200/60 dark:border-white/[0.06] font-semibold">
                PRO
              </span>
            </div>
            <div className="text-sm font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
              {user.first_name} {user.last_name || ''}
            </div>
          </div>
        </div>

        {/* Right: Currency Indicator & Settings Action */}
        <div className="flex items-center space-x-2">
          {/* Currency Pill - clicking opens settings */}
          <button
            type="button"
            onClick={() => {
              haptic.selection();
              openSettings();
            }}
            aria-label="Currency settings"
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-white/80 dark:bg-white/[0.06] hover:bg-slate-100 dark:hover:bg-white/[0.1] border border-slate-200/80 dark:border-white/[0.08] shadow-2xs active:scale-95 transition-all text-slate-700 dark:text-slate-200"
          >
            <span className="text-xs">{currencyConfig.flag || '🌐'}</span>
            <span className="text-xs font-bold font-mono tracking-tight">{currencyConfig.code}</span>
          </button>

          {/* Settings Gear Button (36x36px) */}
          <button
            type="button"
            onClick={() => {
              haptic.impact('light');
              openSettings();
            }}
            aria-label="Open Settings"
            className="w-9 h-9 rounded-2xl flex items-center justify-center bg-white/80 dark:bg-white/[0.06] hover:bg-slate-100 dark:hover:bg-white/[0.1] text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200/80 dark:border-white/[0.08] shadow-2xs active:scale-90 transition-transform"
          >
            <Settings size={17} className="stroke-[2.1]" />
          </button>
        </div>
      </div>
    </header>
  );
};
