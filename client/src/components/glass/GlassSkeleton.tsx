import React from 'react';

interface GlassSkeletonProps {
  className?: string;
  variant?: 'card' | 'line' | 'circle';
}

export const GlassSkeleton: React.FC<GlassSkeletonProps> = ({
  className = '',
  variant = 'line',
}) => {
  let baseStyles = 'relative overflow-hidden bg-white/[0.05] border border-white/[0.04] animate-pulse';

  if (variant === 'circle') {
    baseStyles += ' rounded-full';
  } else if (variant === 'card') {
    baseStyles += ' rounded-3xl p-4';
  } else {
    baseStyles += ' rounded-xl';
  }

  return (
    <div className={`${baseStyles} ${className}`}>
      {/* Shimmer reflection */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.08] to-transparent animate-shimmer" />
    </div>
  );
};
