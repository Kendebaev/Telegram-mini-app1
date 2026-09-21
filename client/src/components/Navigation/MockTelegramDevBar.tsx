import React, { useState } from 'react';
import { useTelegram } from '../../context/TelegramContext';
import { useSettingsStore } from '../../stores/settingsStore';
import { Sun, Moon, ChevronDown, ChevronUp, Smartphone } from 'lucide-react';

export const MockTelegramDevBar: React.FC = () => {
  const { isInsideTelegram, colorScheme, toggleTheme, user } = useTelegram();
  const { currency, setCurrency } = useSettingsStore();
  const [isExpanded, setIsExpanded] = useState(false);

  // If actually running in real Telegram, do not show simulation bar
  if (isInsideTelegram) return null;

  return (
    <aside aria-label="Telegram Simulator Controls" className="sticky top-0 z-40 bg-gradient-to-r from-blue-900/95 via-indigo-900/95 to-blue-900/95 text-white text-[11px] backdrop-blur-md border-b border-blue-700/50 shadow-sm">
      <div className="max-w-lg mx-auto px-4 py-1.5 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-semibold text-blue-100 flex items-center space-x-1">
            <Smartphone size={12} />
            <span>TMA Dev Preview</span>
          </span>
          <span className="text-blue-300/80 hidden sm:inline">• Simulated TG WebApp</span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={toggleTheme}
            className="px-2 py-0.5 rounded-lg bg-blue-800/80 hover:bg-blue-700 text-blue-100 flex items-center space-x-1 transition-all"
          >
            {colorScheme === 'dark' ? <Sun size={11} /> : <Moon size={11} />}
            <span>{colorScheme === 'dark' ? 'Dark' : 'Light'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded-lg hover:bg-blue-800/60 text-blue-200 transition-all"
          >
            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="max-w-lg mx-auto px-4 py-2 border-t border-blue-800/50 flex flex-wrap items-center justify-between gap-2 text-blue-200">
          <div>
            Logged as: <strong className="text-white">@{user.username}</strong> ({user.first_name})
          </div>
          <div className="flex items-center space-x-1">
            <span>Currency:</span>
            {['USD', 'EUR', 'KZT', 'RUB'].map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCurrency(c)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                  currency === c ? 'bg-blue-500 text-white font-bold' : 'bg-blue-950/60 hover:bg-blue-800'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
};
