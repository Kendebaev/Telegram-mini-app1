import React from 'react';
import { X } from 'lucide-react';
import { SettingsScreen } from './SettingsScreen';
import { useTelegram } from '../../context/TelegramContext';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { haptic } = useTelegram();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#070A12] rounded-t-3xl sm:rounded-3xl shadow-2xl border border-white/[0.12] overflow-hidden flex flex-col max-h-[90vh] safe-bottom">
        <div className="p-4 border-b border-white/[0.08] flex items-center justify-between">
          <div className="font-bold text-sm text-white">App Settings</div>
          <button
            type="button"
            onClick={() => {
              haptic.impact('light');
              onClose();
            }}
            className="p-1.5 rounded-full text-slate-400 hover:text-white bg-white/[0.06] active:scale-95 transition-all"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-4 overflow-y-auto no-scrollbar">
          <SettingsScreen />
        </div>
      </div>
    </div>
  );
};
