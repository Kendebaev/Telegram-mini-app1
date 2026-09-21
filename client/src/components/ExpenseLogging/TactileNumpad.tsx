import React, { useRef } from 'react';
import { Delete, Equal } from 'lucide-react';
import { useTelegram } from '../../context/TelegramContext';

interface TactileNumpadProps {
  value: string;
  onChange: (newValue: string) => void;
  onSubmit?: () => void;
}

export const TactileNumpad: React.FC<TactileNumpadProps> = ({
  value,
  onChange,
  onSubmit,
}) => {
  const { haptic } = useTelegram();
  const deleteTimerRef = useRef<any>(null);

  const handleKeyPress = (char: string) => {
    haptic.impact('light');

    // Handle operator
    if (char === '+' || char === '-') {
      if (!value || value === '0') return;
      // Don't add duplicate operators
      if (['+', '-'].includes(value.slice(-1))) {
        onChange(value.slice(0, -1) + char);
        return;
      }
      // If there is already an expression, evaluate it first
      try {
        const evaluated = evaluateSimpleExpression(value);
        onChange(`${evaluated}${char}`);
      } catch {
        onChange(value + char);
      }
      return;
    }

    // Handle decimal point
    if (char === '.') {
      const parts = value.split(/[+-]/);
      const currentSegment = parts[parts.length - 1];
      if (currentSegment.includes('.')) return; // already has decimal in current number
      if (!currentSegment) {
        onChange(value + '0.');
        return;
      }
      onChange(value + '.');
      return;
    }

    // Handle digits
    const parts = value.split(/[+-]/);
    const currentSegment = parts[parts.length - 1];

    // Restrict to max 2 decimal places
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
    if (value.length <= 1) {
      onChange('0');
    } else {
      onChange(value.slice(0, -1));
    }
  };

  const handleClearAll = () => {
    haptic.notification('warning');
    onChange('0');
  };

  const handleTouchStartDelete = () => {
    deleteTimerRef.current = setTimeout(() => {
      handleClearAll();
    }, 600);
  };

  const handleTouchEndDelete = () => {
    if (deleteTimerRef.current) {
      clearTimeout(deleteTimerRef.current);
      deleteTimerRef.current = null;
    }
  };

  const handleEvaluate = () => {
    haptic.impact('medium');
    try {
      const result = evaluateSimpleExpression(value);
      onChange(result.toString());
    } catch {
      // ignore
    }
  };

  const isExpression = value.includes('+') || value.includes('-');

  return (
    <div className="w-full max-w-sm mx-auto grid grid-cols-4 gap-2 px-1">
      {/* Row 1 */}
      <button
        type="button"
        onClick={() => handleKeyPress('1')}
        className="glass-card flex items-center justify-center h-14 rounded-2xl text-xl font-bold text-white active:scale-95 transition-all active:bg-white/20"
      >
        1
      </button>
      <button
        type="button"
        onClick={() => handleKeyPress('2')}
        className="glass-card flex items-center justify-center h-14 rounded-2xl text-xl font-bold text-white active:scale-95 transition-all active:bg-white/20"
      >
        2
      </button>
      <button
        type="button"
        onClick={() => handleKeyPress('3')}
        className="glass-card flex items-center justify-center h-14 rounded-2xl text-xl font-bold text-white active:scale-95 transition-all active:bg-white/20"
      >
        3
      </button>
      <button
        type="button"
        onClick={() => handleKeyPress('+')}
        className="glass-card bg-indigo-950/40 border-indigo-500/30 flex items-center justify-center h-14 rounded-2xl text-xl font-bold text-indigo-400 active:scale-95 transition-all"
      >
        +
      </button>

      {/* Row 2 */}
      <button
        type="button"
        onClick={() => handleKeyPress('4')}
        className="glass-card flex items-center justify-center h-14 rounded-2xl text-xl font-bold text-white active:scale-95 transition-all active:bg-white/20"
      >
        4
      </button>
      <button
        type="button"
        onClick={() => handleKeyPress('5')}
        className="glass-card flex items-center justify-center h-14 rounded-2xl text-xl font-bold text-white active:scale-95 transition-all active:bg-white/20"
      >
        5
      </button>
      <button
        type="button"
        onClick={() => handleKeyPress('6')}
        className="glass-card flex items-center justify-center h-14 rounded-2xl text-xl font-bold text-white active:scale-95 transition-all active:bg-white/20"
      >
        6
      </button>
      <button
        type="button"
        onClick={() => handleKeyPress('-')}
        className="glass-card bg-indigo-950/40 border-indigo-500/30 flex items-center justify-center h-14 rounded-2xl text-xl font-bold text-indigo-400 active:scale-95 transition-all"
      >
        −
      </button>

      {/* Row 3 */}
      <button
        type="button"
        onClick={() => handleKeyPress('7')}
        className="glass-card flex items-center justify-center h-14 rounded-2xl text-xl font-bold text-white active:scale-95 transition-all active:bg-white/20"
      >
        7
      </button>
      <button
        type="button"
        onClick={() => handleKeyPress('8')}
        className="glass-card flex items-center justify-center h-14 rounded-2xl text-xl font-bold text-white active:scale-95 transition-all active:bg-white/20"
      >
        8
      </button>
      <button
        type="button"
        onClick={() => handleKeyPress('9')}
        className="glass-card flex items-center justify-center h-14 rounded-2xl text-xl font-bold text-white active:scale-95 transition-all active:bg-white/20"
      >
        9
      </button>
      <button
        type="button"
        onClick={handleDelete}
        onTouchStart={handleTouchStartDelete}
        onTouchEnd={handleTouchEndDelete}
        onMouseDown={handleTouchStartDelete}
        onMouseUp={handleTouchEndDelete}
        onMouseLeave={handleTouchEndDelete}
        aria-label="Delete or hold to clear"
        className="glass-card bg-rose-950/30 border-rose-500/25 flex items-center justify-center h-14 rounded-2xl text-rose-400 active:scale-95 transition-all"
      >
        <Delete size={22} />
      </button>

      {/* Row 4 */}
      <button
        type="button"
        onClick={() => handleKeyPress('.')}
        className="glass-card flex items-center justify-center h-14 rounded-2xl text-2xl font-bold text-white active:scale-95 transition-all"
      >
        .
      </button>
      <button
        type="button"
        onClick={() => handleKeyPress('0')}
        className="glass-card flex items-center justify-center h-14 rounded-2xl text-xl font-bold text-white active:scale-95 transition-all active:bg-white/20"
      >
        0
      </button>
      <button
        type="button"
        onClick={handleClearAll}
        className="glass-card text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-center h-14 rounded-2xl active:scale-95 transition-all hover:text-white"
      >
        C
      </button>
      <button
        type="button"
        onClick={isExpression ? handleEvaluate : onSubmit}
        aria-label={isExpression ? 'Evaluate' : 'Done'}
        className="glass-card bg-gradient-to-r from-indigo-500 to-cyan-500 border-indigo-400/40 text-white flex items-center justify-center h-14 rounded-2xl active:scale-95 transition-all shadow-md shadow-indigo-500/30"
      >
        {isExpression ? <Equal size={22} className="stroke-[2.5]" /> : <span className="font-bold text-sm">OK</span>}
      </button>
    </div>
  );
};

export function evaluateSimpleExpression(expr: string): number {
  if (!expr) return 0;
  // Clean up trailing operators
  const sanitized = expr.replace(/[+-]$/, '');
  try {
    // Only allow digits, dot, + and -
    if (!/^[0-9.+-\s]+$/.test(sanitized)) return parseFloat(sanitized) || 0;
    // Simple parser for + and -
    const tokens = sanitized.match(/([+-]?[0-9.]+)/g);
    if (!tokens) return 0;
    const sum = tokens.reduce((acc, curr) => acc + parseFloat(curr), 0);
    return Math.round(sum * 100) / 100;
  } catch {
    return parseFloat(sanitized) || 0;
  }
}
