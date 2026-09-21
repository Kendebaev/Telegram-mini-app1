import React from 'react';
import { Plus } from 'lucide-react';
import { useCategoryStore } from '../../stores/categoryStore';
import { CategoryIcon } from '../glass/CategoryIcon';
import { useTelegram } from '../../context/TelegramContext';
import type { TransactionType } from '../../types/models';

interface CategoryPickerProps {
  selectedCategoryId: string | null;
  onSelectCategory: (id: string) => void;
  type: TransactionType;
  onOpenManageCategories: () => void;
}

export const CategoryPicker: React.FC<CategoryPickerProps> = ({
  selectedCategoryId,
  onSelectCategory,
  type,
  onOpenManageCategories,
}) => {
  const { getCategoriesByType } = useCategoryStore();
  const { haptic } = useTelegram();

  const categories = getCategoriesByType(type);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2.5 px-1">
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Category
        </label>
        <button
          type="button"
          onClick={() => {
            haptic.impact('light');
            onOpenManageCategories();
          }}
          className="text-xs font-medium text-indigo-400 hover:text-indigo-300 active:scale-95 transition-all flex items-center gap-1"
        >
          <Plus size={13} />
          <span>Manage</span>
        </button>
      </div>

      <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto no-scrollbar p-1">
        {categories.map((cat) => {
          const isSelected = selectedCategoryId === cat.id;

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                haptic.selection();
                onSelectCategory(cat.id);
              }}
              className={`flex flex-col items-center justify-center p-2.5 rounded-2xl border transition-all duration-150 active:scale-95 ${
                isSelected
                  ? 'bg-white/[0.16] border-white/40 shadow-lg scale-[1.02]'
                  : 'bg-white/[0.04] border-white/[0.06] hover:bg-white/[0.08]'
              }`}
              style={{
                borderColor: isSelected ? cat.color : undefined,
                boxShadow: isSelected ? `0 0 16px -2px ${cat.color}60` : undefined,
              }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-1.5 transition-transform duration-150"
                style={{
                  backgroundColor: `${cat.color}25`,
                  color: cat.color,
                }}
              >
                <CategoryIcon name={cat.icon} size={20} color={cat.color} />
              </div>
              <span
                className={`text-[11px] font-medium text-center truncate max-w-full ${
                  isSelected ? 'text-white font-semibold' : 'text-slate-300'
                }`}
              >
                {cat.name}
              </span>
            </button>
          );
        })}

        {/* Add Category Quick Button */}
        <button
          type="button"
          onClick={() => {
            haptic.impact('light');
            onOpenManageCategories();
          }}
          className="flex flex-col items-center justify-center p-2.5 rounded-2xl border border-dashed border-white/20 bg-white/[0.02] hover:bg-white/[0.06] text-slate-400 active:scale-95 transition-all"
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-1.5 bg-white/[0.05] text-slate-300">
            <Plus size={18} />
          </div>
          <span className="text-[11px] font-medium text-slate-400">New</span>
        </button>
      </div>
    </div>
  );
};
