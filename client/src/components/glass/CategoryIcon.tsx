import React from 'react';
import * as LucideIcons from 'lucide-react';

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
  const IconComponent = (LucideIcons as any)[name] || LucideIcons.HelpCircle;

  return <IconComponent size={size} color={color} className={className} />;
};
