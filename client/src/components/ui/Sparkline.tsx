import React, { useId } from 'react';

interface SparklineProps {
  data: number[];
  height?: number;
  strokeWidth?: number;
  color?: string;
  fill?: boolean;
  className?: string;
}

function buildLine(points: Array<{ x: number; y: number }>): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y} L 100 ${points[0].y}`;

  let path = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i += 1) {
    const previous = points[i - 1];
    const current = points[i];
    const midX = (previous.x + current.x) / 2;
    path += ` C ${midX} ${previous.y}, ${midX} ${current.y}, ${current.x} ${current.y}`;
  }
  return path;
}

export const Sparkline: React.FC<SparklineProps> = ({
  data,
  height = 48,
  strokeWidth = 2,
  color = 'var(--accent)',
  fill = true,
  className = '',
}) => {
  const rawId = useId().replace(/:/g, '');
  const gradientId = `spark-${rawId}`;
  const safeData = data.length > 0 ? data : [0, 0];
  const max = Math.max(...safeData, 1);
  const min = Math.min(...safeData, 0);
  const range = max - min || 1;
  const padding = 5;
  const step = safeData.length > 1 ? 100 / (safeData.length - 1) : 100;

  const points = safeData.map((value, index) => ({
    x: index * step,
    y: height - padding - ((value - min) / range) * (height - padding * 2),
  }));

  const line = buildLine(points);
  const area = `${line} L 100 ${height} L 0 ${height} Z`;

  return (
    <svg
      viewBox={`0 0 100 ${height}`}
      preserveAspectRatio="none"
      className={className}
      style={{ width: '100%', height }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.34" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {fill && <path d={area} fill={`url(#${gradientId})`} />}
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
};
