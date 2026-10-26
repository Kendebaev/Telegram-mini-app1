import React from 'react';
import { ChevronRight } from 'lucide-react';

interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
  className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  eyebrow,
  title,
  actionLabel,
  onAction,
  icon,
  className = '',
}) => (
  <div className={`flex items-end justify-between gap-3 ${className}`}>
    <div className="min-w-0">
      {eyebrow && <div className="eyebrow mb-1">{eyebrow}</div>}
      <h2 className="flex items-center gap-2 font-display text-[17px] font-semibold tracking-tight text-ink">
        {icon}
        <span className="truncate">{title}</span>
      </h2>
    </div>
    {actionLabel && onAction && (
      <button
        type="button"
        onClick={onAction}
        className="group flex shrink-0 items-center gap-0.5 text-[11px] font-bold text-accent transition-opacity hover:opacity-75"
      >
        {actionLabel}
        <ChevronRight size={14} className="transition-transform group-hover:translate-x-0.5" />
      </button>
    )}
  </div>
);
