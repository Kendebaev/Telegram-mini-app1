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
  Laptop, TrendingUp, Building2, Key, PlusCircle, Sparkles, Fuel, Gamepad2,
  Smartphone, Zap, Target, ArrowDownLeft, ArrowUpRight, CircleDashed,
  Wallet, PiggyBank, CreditCard, Banknote, CalendarDays, Heart, BookOpen,
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
  Laptop, TrendingUp, Building2, Key, PlusCircle, Sparkles, Fuel, Gamepad2,
  Smartphone, Zap, Target, ArrowDownLeft, ArrowUpRight, CircleDashed,
  Wallet, PiggyBank, CreditCard, Banknote, CalendarDays, Heart, BookOpen,
  HelpCircle,
};

export function getCategoryIcon(iconName: string, props?: LucideProps): React.ReactElement {
  const IconComponent = ICON_MAP[iconName] || HelpCircle;
  return <IconComponent size={20} {...props} />;
}
