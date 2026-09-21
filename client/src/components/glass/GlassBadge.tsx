import React from 'react';

interface GlassBadgeProps {
  variant?: 'neutral' | 'income' | 'expense' | 'brand' | 'accent';
  size?: 'xs' | 'sm' | 'md';
  clickable?: boolean;
  onClick?: () => void;
  className?: string;
  children: React.ReactNode;
}

export const GlassBadge: React.FC<GlassBadgeProps> = ({
  variant = 'neutral',
  size = 'sm',
  clickable = false,
  onClick,
  className = '',
  children,
}) => {
  let variantStyles = 'bg-white/[0.06] text-slate-300 border-white/[0.08]';

  if (variant === 'income') {
    variantStyles = 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
  } else if (variant === 'expense') {
    variantStyles = 'bg-rose-500/15 text-rose-400 border-rose-500/30';
  } else if (variant === 'brand') {
    variantStyles = 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30';
  } else if (variant === 'accent') {
    variantStyles = 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30';
  }

  let sizeStyles = 'px-2.5 py-1 text-xs rounded-full';
  if (size === 'xs') sizeStyles = 'px-2 py-0.5 text-[10px] rounded-full';
  if (size === 'md') sizeStyles = 'px-3 py-1.5 text-sm rounded-xl';

  const interactive = clickable
    ? 'cursor-pointer active:scale-95 hover:border-white/20 transition-all'
    : '';

  return (
    <span
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 font-medium border backdrop-blur-sm ${variantStyles} ${sizeStyles} ${interactive} ${className}`}
    >
      {children}
    </span>
  );
};
