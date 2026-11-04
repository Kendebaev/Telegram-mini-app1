import React, { useId } from 'react';
import { motion } from 'framer-motion';

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
}

interface SegmentedProps<T extends string> {
  options: Array<SegmentedOption<T>>;
  value: T;
  onChange: (value: T) => void;
  accent?: string;
  size?: 'sm' | 'md';
  className?: string;
  ariaLabel?: string;
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  accent = 'var(--accent)',
  size = 'md',
  className = '',
  ariaLabel,
}: SegmentedProps<T>) {
  const rawId = useId().replace(/:/g, '');
  const layoutId = `segment-${rawId}`;

  const sizeClass = size === 'sm' ? 'py-1.5 text-[11px]' : 'py-2.5 text-xs';

  return (
    <div
      className={`relative flex items-center gap-1 rounded-2xl border border-line bg-panel-inset p-1 ${className}`}
      role="tablist"
      aria-label={ariaLabel}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => {
              if (!active) onChange(option.value);
            }}
            className={`relative flex-1 rounded-xl font-bold transition-colors duration-200 ${sizeClass}`}
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                className="absolute inset-0 rounded-xl"
                style={{
                  backgroundColor: accent,
                  boxShadow: `0 10px 25px -12px ${accent}`,
                }}
                transition={{ type: 'spring', stiffness: 520, damping: 42 }}
              />
            )}
            <span
              className={`relative z-10 flex items-center justify-center gap-1.5 whitespace-nowrap ${
                active ? '' : 'text-muted'
              }`}
              style={active ? { color: 'var(--on-accent)' } : undefined}
            >
              {option.icon}
              {option.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
