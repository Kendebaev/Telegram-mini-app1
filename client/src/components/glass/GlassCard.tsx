import React from 'react';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'income' | 'expense' | 'accent';
  interactive?: boolean;
  className?: string;
  children: React.ReactNode;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  variant = 'default',
  interactive = false,
  className = '',
  children,
  ...props
}) => {
  let variantStyles =
    'bg-white/85 dark:bg-zinc-900/60 border-slate-200/80 dark:border-white/[0.08] shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)] text-slate-900 dark:text-white';

  if (variant === 'elevated') {
    variantStyles =
      'bg-white/95 dark:bg-zinc-800/75 border-slate-200 dark:border-white/[0.12] shadow-lg dark:shadow-2xl text-slate-900 dark:text-white';
  } else if (variant === 'income') {
    variantStyles =
      'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-200/80 dark:border-emerald-500/25 shadow-sm dark:shadow-income-glow text-slate-900 dark:text-white';
  } else if (variant === 'expense') {
    variantStyles =
      'bg-rose-50/80 dark:bg-rose-950/30 border-rose-200/80 dark:border-rose-500/25 shadow-sm dark:shadow-expense-glow text-slate-900 dark:text-white';
  } else if (variant === 'accent') {
    variantStyles =
      'bg-indigo-50/80 dark:bg-indigo-950/35 border-indigo-200/80 dark:border-indigo-500/30 shadow-sm dark:shadow-glass-glow text-slate-900 dark:text-white';
  }

  const interactiveStyles = interactive
    ? 'cursor-pointer active:scale-[0.985] transition-all duration-200 hover:border-slate-300 dark:hover:border-white/[0.18]'
    : '';

  return (
    <div
      className={`relative backdrop-blur-xl border rounded-3xl p-4 overflow-hidden transition-colors duration-200 ease-out ${variantStyles} ${interactiveStyles} ${className}`}
      {...props}
    >
      {/* Top subtle rim highlight */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-slate-300/40 dark:via-white/15 to-transparent pointer-events-none" />
      {children}
    </div>
  );
};
