import React from 'react';
import { ICON_MAP } from '../../utils/categoryIcons';

interface CategoryIconProps {
  name: string;
  size?: number;
  color?: string;
  className?: string;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({
  name,
  size = 20,
  color,
  className = '',
}) => {
  // Lookup Lucide icon dynamically
  const IconComponent = ICON_MAP[name] || ICON_MAP.HelpCircle;

  return <IconComponent size={size} color={color} className={className} />;
};
