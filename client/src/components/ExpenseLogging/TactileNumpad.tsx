import React, { useRef } from 'react';
import { Delete, Equal } from 'lucide-react';
import { useTelegram } from '../../context/TelegramContext';
import { useTranslation } from '../../stores/settingsStore';

interface TactileNumpadProps {
  value: string;
  onChange: (newValue: string) => void;
  onSubmit?: () => void;
}

const keyBase =
  'flex h-[50px] items-center justify-center rounded-2xl border border-line bg-panel-inset font-display text-lg font-semibold text-ink transition-all active:scale-[0.94] active:bg-accent-soft';

export const TactileNumpad: React.FC<TactileNumpadProps> = ({ value, onChange, onSubmit }) => {
  const { haptic } = useTelegram();
  const { t } = useTranslation();
  const deleteTimerRef = useRef<number | null>(null);

  const handleKeyPress = (char: string) => {
    haptic.impact('light');

    if (char === '+' || char === '-') {
      if (!value || value === '0') return;
      if (['+', '-'].includes(value.slice(-1))) {
        onChange(value.slice(0, -1) + char);
        return;
      }
      const evaluated = evaluateSimpleExpression(value);
      onChange(`${evaluated}${char}`);
      return;
    }

    if (char === '.') {
      const parts = value.split(/[+-]/);
      const currentSegment = parts[parts.length - 1];
      if (currentSegment.includes('.')) return;
      if (!currentSegment) {
        onChange(value + '0.');
        return;
      }
      onChange(value + '.');
      return;
    }

    const parts = value.split(/[+-]/);
    const currentSegment = parts[parts.length - 1];

    if (currentSegment && currentSegment.includes('.')) {
      const decimals = currentSegment.split('.')[1];
      if (decimals && decimals.length >= 2) return;
    }

    if (value === '0' || !value) {
      onChange(char);
    } else {
      onChange(value + char);
    }
  };

  const handleDelete = () => {
    haptic.impact('medium');
    if (!value || value === '0') return;
    if (value.length <= 1) onChange('0');
    else onChange(value.slice(0, -1));
  };

  const handleClearAll = () => {
    haptic.notification('warning');
    onChange('0');
  };

  const startHold = () => {
    deleteTimerRef.current = window.setTimeout(() => {
      handleClearAll();
    }, 600);
  };

  const endHold = () => {
    if (deleteTimerRef.current) {
      window.clearTimeout(deleteTimerRef.current);
      deleteTimerRef.current = null;
    }
  };

  const handleEvaluate = () => {
    haptic.impact('medium');
    onChange(evaluateSimpleExpression(value).toString());
  };

  const isExpression = value.includes('+') || value.includes('-');
  const digit = (n: string) => (
    <button key={n} type="button" onClick={() => handleKeyPress(n)} className={keyBase}>
      {n}
    </button>
  );

  return (
    <div className="grid w-full grid-cols-4 gap-2">
      {['1', '2', '3'].map(digit)}
      <button
        type="button"
        onClick={() => handleKeyPress('+')}
        className={`${keyBase} border-accent/25 bg-accent-soft text-accent`}
      >
        +
      </button>

      {['4', '5', '6'].map(digit)}
      <button
        type="button"
        onClick={() => handleKeyPress('-')}
        className={`${keyBase} border-accent/25 bg-accent-soft text-accent`}
      >
        −
      </button>

      {['7', '8', '9'].map(digit)}
      <button
        type="button"
        onClick={handleDelete}
        onTouchStart={startHold}
        onTouchEnd={endHold}
        onMouseDown={startHold}
        onMouseUp={endHold}
        onMouseLeave={endHold}
        aria-label={t('delete')}
        className={`${keyBase} border-coral/25 bg-coral-soft text-coral`}
      >
        <Delete size={20} />
      </button>

      <button type="button" onClick={() => handleKeyPress('.')} className={keyBase}>
        .
      </button>
      {digit('0')}
      <button
        type="button"
        onClick={handleClearAll}
        className={`${keyBase} text-[11px] font-bold uppercase tracking-wider text-faint`}
      >
        C
      </button>
      <button
        type="button"
        onClick={isExpression ? handleEvaluate : onSubmit}
        aria-label={t('done')}
        className="flex h-[50px] items-center justify-center rounded-2xl bg-gradient-to-tr from-accent to-accent-2 text-white shadow-glow transition-all active:scale-[0.94]"
      >
        {isExpression ? (
          <Equal size={20} strokeWidth={2.6} />
        ) : (
          <span className="text-[11px] font-bold uppercase tracking-wider">OK</span>
        )}
      </button>
    </div>
  );
};

export function evaluateSimpleExpression(expr: string): number {
  if (!expr) return 0;
  const sanitized = expr.replace(/[+-]$/, '');
  try {
    if (!/^[0-9.+-\s]+$/.test(sanitized)) return parseFloat(sanitized) || 0;
    const tokens = sanitized.match(/([+-]?[0-9.]+)/g);
    if (!tokens) return 0;
    const sum = tokens.reduce((acc, curr) => acc + parseFloat(curr), 0);
    return Math.round(sum * 100) / 100;
  } catch {
    return parseFloat(sanitized) || 0;
  }
}
