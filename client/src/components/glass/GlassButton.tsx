import React from 'react';
import { useTelegram } from '../../context/TelegramContext';

interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'income' | 'expense' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  hapticStyle?: 'light' | 'medium' | 'heavy';
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export const GlassButton: React.FC<GlassButtonProps> = ({
  variant = 'secondary',
  size = 'md',
  hapticStyle = 'light',
  icon,
  children,
  className = '',
  onClick,
  disabled,
  ...props
}) => {
  const { haptic } = useTelegram();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    haptic.impact(hapticStyle);
    if (onClick) onClick(e);
  };

  let variantStyles = 'bg-white/[0.08] hover:bg-white/[0.12] text-slate-100 border border-white/[0.1]';
  if (variant === 'primary') {
    variantStyles = 'bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white shadow-lg shadow-indigo-500/30 border border-indigo-400/40';
  } else if (variant === 'income') {
    variantStyles = 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/30 border border-emerald-400/40';
  } else if (variant === 'expense') {
    variantStyles = 'bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white shadow-lg shadow-rose-500/30 border border-rose-400/40';
  } else if (variant === 'ghost') {
    variantStyles = 'bg-transparent hover:bg-white/[0.06] text-slate-300 border border-transparent';
  }

  let sizeStyles = 'px-4 py-2.5 text-sm rounded-xl gap-2';
  if (size === 'sm') sizeStyles = 'px-3 py-1.5 text-xs rounded-lg gap-1.5';
  if (size === 'lg') sizeStyles = 'px-5 py-3.5 text-base font-semibold rounded-2xl gap-2.5';

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center font-medium backdrop-blur-md transition-all duration-150 active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none ${variantStyles} ${sizeStyles} ${className}`}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </button>
  );
};
