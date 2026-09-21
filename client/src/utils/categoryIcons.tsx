import React from 'react';
import {
  Utensils,
  Car,
  ShoppingCart,
  Film,
  Receipt,
  HeartPulse,
  ShoppingBag,
  MoreHorizontal,
  Coffee,
  Plane,
  Home,
  GraduationCap,
  Briefcase,
  Dumbbell,
  Wifi,
  Gift,
  HelpCircle,
  type LucideProps,
} from 'lucide-react';

export const ICON_MAP: Record<string, React.ComponentType<LucideProps>> = {
  Utensils,
  Car,
  ShoppingCart,
  Film,
  Receipt,
  HeartPulse,
  ShoppingBag,
  MoreHorizontal,
  Coffee,
  Plane,
  Home,
  GraduationCap,
  Briefcase,
  Dumbbell,
  Wifi,
  Gift,
};

export function getCategoryIcon(iconName: string, props?: LucideProps): React.ReactElement {
  const IconComponent = ICON_MAP[iconName] || HelpCircle;
  return <IconComponent size={20} {...props} />;
}
