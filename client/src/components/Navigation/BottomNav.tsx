import {
  ArrowLeftRight,
  ChartNoAxesCombined,
  House,
  Plus,
  Target,
} from 'lucide-react';
import { useTelegram } from '../../context/TelegramContext';
import { useTranslation } from '../../stores/settingsStore';
import { useUIStore } from '../../stores/uiStore';

const items = [
  { id: 'dashboard', label: 'home', icon: House },
  { id: 'history', label: 'activity', icon: ArrowLeftRight },
  { id: 'plan', label: 'plan', icon: Target },
  { id: 'analytics', label: 'analytics', icon: ChartNoAxesCombined },
] as const;

export function BottomNav() {
  const { haptic } = useTelegram();
  const { activeTab, setActiveTab, openAddTransaction } = useUIStore();
  const { t } = useTranslation();
  const item = (index: number) => {
    const { id, label, icon: Icon } = items[index];
    return (
      <button
        key={id}
        type="button"
        className={`dock-item ${activeTab === id ? 'is-active' : ''}`}
        aria-current={activeTab === id ? 'page' : undefined}
        onClick={() => {
          if (activeTab !== id) {
            haptic.selection();
            setActiveTab(id);
          }
        }}
      >
        <Icon size={21} strokeWidth={activeTab === id ? 2 : 1.6} />
        <span>{t(label)}</span>
      </button>
    );
  };
  return (
    <nav className="app-dock" aria-label={t('app_name')}>
      <div className="dock-inner">
        {item(0)}
        {item(1)}
        <button
          type="button"
          className="dock-add pressable"
          aria-label={t('add')}
          onClick={() => {
            haptic.impact('light');
            openAddTransaction();
          }}
        >
          <Plus size={25} strokeWidth={2} />
        </button>
        {item(2)}
        {item(3)}
      </div>
    </nav>
  );
}
