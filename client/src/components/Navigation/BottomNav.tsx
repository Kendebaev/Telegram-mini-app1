import React from 'react';
import { ArrowLeftRight, Home, PieChart, Plus, Target } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTelegram } from '../../context/TelegramContext';
import { useTranslation } from '../../stores/settingsStore';
import { useUIStore } from '../../stores/uiStore';
import type { ActiveTab } from '../../types/models';

interface NavItem {
  id: ActiveTab;
  labelKey: 'home' | 'activity' | 'plan' | 'insights';
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
}

const LEFT_ITEMS: NavItem[] = [
  { id: 'dashboard', labelKey: 'home', icon: Home },
  { id: 'history', labelKey: 'activity', icon: ArrowLeftRight },
];

const RIGHT_ITEMS: NavItem[] = [
  { id: 'plan', labelKey: 'plan', icon: Target },
  { id: 'analytics', labelKey: 'insights', icon: PieChart },
];

export const BottomNav: React.FC = () => {
  const { haptic } = useTelegram();
  const { activeTab, setActiveTab, openAddTransaction } = useUIStore();
  const { t } = useTranslation();

  const renderItem = (item: NavItem) => {
    const Icon = item.icon;
    const isActive = activeTab === item.id;

    return (
      <button
        key={item.id}
        type="button"
        onClick={() => {
          if (isActive) return;
          haptic.selection();
          setActiveTab(item.id);
        }}
        aria-current={isActive ? 'page' : undefined}
        className="relative flex flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl py-1.5"
      >
        {isActive && (
          <motion.span
            layoutId="nav-active-pill"
            className="absolute inset-x-0.5 inset-y-0 rounded-2xl border border-accent/20 bg-accent-soft"
            transition={{ type: 'spring', stiffness: 480, damping: 40 }}
          />
        )}
        <Icon
          size={19}
          strokeWidth={isActive ? 2.4 : 1.9}
          className={`relative z-10 transition-colors ${isActive ? 'text-accent' : 'text-faint'}`}
        />
        <span
          className={`relative z-10 text-[9px] font-bold tracking-tight transition-colors ${
            isActive ? 'text-accent' : 'text-faint'
          }`}
        >
          {t(item.labelKey)}
        </span>
      </button>
    );
  };

  return (
    <nav className="pointer-events-none fixed inset-x-4 bottom-[max(0.9rem,env(safe-area-inset-bottom))] z-40 mx-auto max-w-md">
      <div className="pointer-events-auto relative flex items-end gap-1 rounded-[28px] border border-line bg-panel/90 px-2 py-2 shadow-float backdrop-blur-2xl">
        {LEFT_ITEMS.map(renderItem)}

        <div className="relative flex w-14 shrink-0 justify-center">
          <button
            type="button"
            onClick={() => {
              haptic.impact('medium');
              openAddTransaction();
            }}
            aria-label={t('add')}
            className="group absolute bottom-2 h-14 w-14 -translate-y-4 rounded-full border border-white/25 bg-gradient-to-tr from-accent via-accent-2 to-accent p-[2px] shadow-glow transition-transform active:scale-90"
          >
            <span className="absolute inset-0 -z-10 rounded-full bg-accent/40 blur-xl" aria-hidden="true" />
            <span className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-tr from-accent to-accent-2">
              <Plus
                size={24}
                strokeWidth={2.6}
                className="text-white transition-transform duration-300 group-hover:rotate-90"
              />
            </span>
          </button>
        </div>

        {RIGHT_ITEMS.map(renderItem)}
      </div>
    </nav>
  );
};
