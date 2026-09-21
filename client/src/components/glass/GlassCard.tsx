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
  let variantStyles = 'bg-slate-900/65 border-white/[0.08] shadow-glass';

  if (variant === 'elevated') {
    variantStyles = 'bg-slate-800/70 border-white/[0.12] shadow-2xl';
  } else if (variant === 'income') {
    variantStyles = 'bg-emerald-950/35 border-emerald-500/25 shadow-income-glow';
  } else if (variant === 'expense') {
    variantStyles = 'bg-rose-950/35 border-rose-500/25 shadow-expense-glow';
  } else if (variant === 'accent') {
    variantStyles = 'bg-indigo-950/40 border-indigo-500/30 shadow-glass-glow';
  }

  const interactiveStyles = interactive
    ? 'cursor-pointer active:scale-[0.985] transition-all duration-200 hover:border-white/[0.18]'
    : '';

  return (
    <div
      className={`relative backdrop-blur-xl border rounded-2.5xl p-4 overflow-hidden ${variantStyles} ${interactiveStyles} ${className}`}
      {...props}
    >
      {/* Top subtle rim highlight */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" />
      {children}
    </div>
  );
};
