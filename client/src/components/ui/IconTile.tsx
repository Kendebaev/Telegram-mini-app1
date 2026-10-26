import React from 'react';
import { CategoryIcon } from '../glass/CategoryIcon';

interface IconTileProps {
  icon: string;
  color?: string;
  size?: number;
  iconSize?: number;
  className?: string;
}

export const IconTile: React.FC<IconTileProps> = ({
  icon,
  color,
  size = 40,
  iconSize = 18,
  className = '',
}) => {
  const tint = color && color.startsWith('#') ? `${color}20` : 'var(--accent-soft)';
  return (
    <div
      className={`flex shrink-0 items-center justify-center ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.34,
        backgroundColor: tint,
        color: color || 'var(--accent)',
      }}
    >
      <CategoryIcon name={icon} size={iconSize} color={color} />
    </div>
  );
};
