import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTelegram } from '../../context/TelegramContext';

interface MonthSwitcherProps {
  value: Date;
  onChange: (month: Date) => void;
  language?: 'en' | 'ru';
  tone?: 'default' | 'dark';
  className?: string;
}

export const MonthSwitcher: React.FC<MonthSwitcherProps> = ({
  value,
  onChange,
  language = 'en',
  tone = 'default',
  className = '',
}) => {
  const { haptic } = useTelegram();
  const now = new Date();
  const atCurrentMonth =
    value.getFullYear() === now.getFullYear() && value.getMonth() === now.getMonth();

  const shift = (delta: number) => {
    haptic.selection();
    onChange(new Date(value.getFullYear(), value.getMonth() + delta, 1));
  };

  const label = new Intl.DateTimeFormat(language === 'ru' ? 'ru-RU' : 'en-US', {
    month: 'long',
    year: 'numeric',
  }).format(value);

  const isDark = tone === 'dark';
  const buttonClass = isDark
    ? 'border-white/15 bg-white/10 text-white/70 hover:text-white'
    : 'border-line bg-panel-inset text-muted hover:text-ink';
  const labelClass = isDark ? 'text-white' : 'text-ink';

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <button
        type="button"
        onClick={() => shift(-1)}
        aria-label="Previous month"
        className={`pressable flex h-8 w-8 items-center justify-center rounded-full border ${buttonClass}`}
      >
        <ChevronLeft size={15} />
      </button>
      <span className={`min-w-[7.5rem] text-center text-[11px] font-bold capitalize tracking-tight ${labelClass}`}>
        {label}
      </span>
      <button
        type="button"
        onClick={() => shift(1)}
        disabled={atCurrentMonth}
        aria-label="Next month"
        className={`pressable flex h-8 w-8 items-center justify-center rounded-full border disabled:opacity-30 ${buttonClass}`}
      >
        <ChevronRight size={15} />
      </button>
    </div>
  );
};
