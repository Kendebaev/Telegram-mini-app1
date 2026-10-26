import React, { useId } from 'react';
import { motion } from 'framer-motion';

interface ProgressRingProps {
  progress: number;
  size?: number;
  stroke?: number;
  from?: string;
  to?: string;
  track?: string;
  className?: string;
  children?: React.ReactNode;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  progress,
  size = 112,
  stroke = 9,
  from = 'var(--accent)',
  to = 'var(--accent-2)',
  track = 'var(--line)',
  className = '',
  children,
}) => {
  const rawId = useId().replace(/:/g, '');
  const gradientId = `ring-${rawId}`;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(1, Number.isFinite(progress) ? progress : 0));
  const offset = circumference * (1 - clamped);

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={from} />
            <stop offset="100%" stopColor={to} />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={track}
          strokeWidth={stroke}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ type: 'spring', stiffness: 46, damping: 16, mass: 0.9 }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  );
};
