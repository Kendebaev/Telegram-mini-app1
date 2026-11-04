import { Settings2 } from 'lucide-react';
import { useTelegram } from '../../context/TelegramContext';
import { useSettingsStore, useTranslation } from '../../stores/settingsStore';
import { useUIStore } from '../../stores/uiStore';

export function Header() {
  const { user, haptic } = useTelegram();
  const currency = useSettingsStore((s) => s.currency);
  const openSettings = useUIStore((s) => s.openSettings);
  const { t } = useTranslation();
  return (
    <header className="app-header safe-top">
      <div className="app-header-inner">
        <div className="flex items-center gap-2.5">
          <span className="vault-mark" aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
          </span>
          <span className="font-display text-[23px] font-semibold tracking-[-1px]">
            vault<span className="text-accent">.</span>
          </span>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="currency-label">{currency}</span>
          <button
            type="button"
            onClick={() => {
              haptic.selection();
              openSettings();
            }}
            className="profile-button"
            aria-label={`${t('settings')} · ${user.first_name}`}
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-soft text-xs font-semibold text-accent">{`${user.first_name?.[0] ?? 'V'}${user.last_name?.[0] ?? ''}`}</span>
            <Settings2 size={16} className="text-muted" />
          </button>
        </div>
      </div>
    </header>
  );
}
