import React from 'react';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
  compact?: boolean;
  tone?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  body,
  actionLabel,
  onAction,
  compact = false,
  tone = 'var(--accent)',
}) => (
  <div className={`flex flex-col items-center text-center ${compact ? 'py-5' : 'py-8'}`}>
    <div className={`relative mb-4 ${compact ? 'h-16 w-16' : 'h-24 w-24'}`} aria-hidden="true">
      <div className="absolute inset-0 rounded-full border border-line" />
      <div className="absolute inset-2 rounded-full border border-dashed border-line-strong opacity-70 animate-rotate-slow" />
      <div
        className="absolute inset-[18%] rounded-full opacity-15 blur-lg"
        style={{ backgroundColor: tone }}
      />
      <div
        className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-2xl"
        style={{
          width: compact ? 34 : 46,
          height: compact ? 34 : 46,
          backgroundColor: `${tone}20`,
          color: tone,
        }}
      >
        {icon}
      </div>
      <span
        className="absolute right-[8%] top-[18%] h-1.5 w-1.5 rounded-full animate-float"
        style={{ backgroundColor: tone }}
      />
      <span
        className="absolute bottom-[12%] left-[18%] h-1 w-1 rounded-full bg-muted opacity-60"
        style={{ animationDelay: '1.2s' }}
      />
    </div>
    <h4 className="font-display text-sm font-semibold text-ink">{title}</h4>
    <p className="mx-auto mt-1 max-w-[17rem] text-[11px] leading-relaxed text-muted">{body}</p>
    {actionLabel && onAction && (
      <button
        type="button"
        onClick={onAction}
        className="pressable mt-4 rounded-full px-4 py-2 text-[11px] font-bold text-white"
        style={{ backgroundColor: tone, boxShadow: `0 10px 24px -14px ${tone}` }}
      >
        {actionLabel}
      </button>
    )}
  </div>
);
