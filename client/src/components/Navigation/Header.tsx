import React from 'react';
import { Settings2 } from 'lucide-react';
import { useTelegram } from '../../context/TelegramContext';
import { useSettingsStore, useTranslation } from '../../stores/settingsStore';
import { useUIStore } from '../../stores/uiStore';

export const Header: React.FC = () => {
  const { user, isInsideTelegram, haptic } = useTelegram();
  const { currencyConfig } = useSettingsStore();
  const { openSettings } = useUIStore();
  const { t } = useTranslation();

  const hour = new Date().getHours();
  const greeting =
    hour < 5
      ? t('greeting_night')
      : hour < 12
        ? t('greeting_morning')
        : hour < 18
          ? t('greeting_afternoon')
          : t('greeting_evening');

  const initials = `${user.first_name?.[0] ?? 'A'}${user.last_name?.[0] ?? ''}`;

  return (
    <header className="sticky top-0 z-30 px-4 pb-2 pt-3 safe-top">
      <div className="mx-auto flex max-w-md items-center justify-between rounded-[22px] border border-line bg-panel/80 px-3 py-2 shadow-panel backdrop-blur-2xl">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="relative shrink-0">
            <div className="h-9 w-9 rounded-[14px] bg-gradient-to-tr from-accent via-accent-2 to-mint p-[1.5px]">
              <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-[12.5px] bg-panel-solid">
                {user.photo_url ? (
                  <img
                    src={user.photo_url}
                    alt={user.first_name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="font-display text-[11px] font-bold tracking-wide text-ink">
                    {initials}
                  </span>
                )}
              </div>
            </div>
            <span
              className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-canvas ${
                isInsideTelegram ? 'bg-mint' : 'bg-accent'
              }`}
              aria-hidden="true"
            />
          </div>

          <div className="min-w-0">
            <p className="text-[9px] font-bold uppercase tracking-widest2 text-faint">{greeting}</p>
            <p className="truncate font-display text-[13px] font-semibold leading-tight text-ink">
              {user.first_name} {user.last_name || ''}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              haptic.selection();
              openSettings();
            }}
            aria-label="Currency settings"
            className="pressable flex items-center gap-1.5 rounded-full border border-line bg-panel-inset px-2.5 py-1.5"
          >
            <span className="text-[11px] leading-none">{currencyConfig.flag || '🌐'}</span>
            <span className="font-mono text-[10px] font-bold tracking-tight text-ink">
              {currencyConfig.code}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              haptic.impact('light');
              openSettings();
            }}
            aria-label={t('settings')}
            className="pressable flex h-8 w-8 items-center justify-center rounded-full border border-line bg-panel-inset text-muted hover:text-ink"
          >
            <Settings2 size={15} />
          </button>
        </div>
      </div>
    </header>
  );
};
