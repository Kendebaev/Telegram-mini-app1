import React from 'react';

interface ChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  accent?: string;
  icon?: React.ReactNode;
  size?: 'sm' | 'md';
}

export const Chip: React.FC<ChipProps> = ({
  active = false,
  accent = 'var(--accent)',
  icon,
  size = 'md',
  className = '',
  children,
  ...props
}) => {
  const sizeClass = size === 'sm' ? 'px-2.5 py-1 text-[10px]' : 'px-3 py-1.5 text-[11px]';
  return (
    <button
      type="button"
      className={`inline-flex items-center gap-1.5 rounded-full border font-bold transition-all duration-200 active:scale-95 ${sizeClass} ${
        active
          ? 'border-transparent text-white shadow-sm'
          : 'border-line bg-panel-inset text-muted hover:border-line-strong hover:text-ink'
      } ${className}`}
      style={active ? { backgroundColor: accent, boxShadow: `0 8px 20px -12px ${accent}` } : undefined}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
};
