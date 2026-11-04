import React from 'react';
import { motion } from 'framer-motion';
import { Settings2 } from 'lucide-react';
import { useCategoryStore } from '../../stores/categoryStore';
import { useTranslation } from '../../stores/settingsStore';
import { getLocalizedCategoryName } from '../../utils/translations';
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
  const { t, language } = useTranslation();
  const { haptic } = useTelegram();

  const categories = getCategoriesByType(type);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="eyebrow">{t('categories')}</p>
        <button
          type="button"
          onClick={() => {
            haptic.impact('light');
            onOpenManageCategories();
          }}
          className="flex items-center gap-1 text-[10px] font-bold text-accent"
        >
          <Settings2 size={12} />
          {t('manage')}
        </button>
      </div>

      <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 no-scrollbar">
        {categories.map((cat) => {
          const isSelected = selectedCategoryId === cat.id;
          return (
            <motion.button
              key={cat.id}
              type="button"
              aria-pressed={isSelected}
              whileTap={{ scale: 0.94 }}
              onClick={() => {
                haptic.selection();
                onSelectCategory(cat.id);
              }}
              className={`flex w-[4.4rem] shrink-0 flex-col items-center gap-1 rounded-2xl border px-1.5 py-2 transition-colors ${
                isSelected
                  ? 'border-transparent bg-panel-solid shadow-panel'
                  : 'border-line bg-panel-inset'
              }`}
              style={isSelected ? { boxShadow: `0 0 0 1.5px ${cat.color}, 0 10px 24px -16px ${cat.color}` } : undefined}
            >
              <span
                className="flex h-9 w-9 items-center justify-center rounded-xl"
                style={{ backgroundColor: `${cat.color}22`, color: cat.color }}
              >
                <CategoryIcon name={cat.icon} size={18} color={cat.color} />
              </span>
              <span
                className={`w-full truncate text-center text-[9px] leading-tight ${
                  isSelected ? 'font-bold text-ink' : 'font-medium text-muted'
                }`}
              >
                {getLocalizedCategoryName(cat.name, language)}
              </span>
            </motion.button>
          );
        })}

        <button
          type="button"
          onClick={() => {
            haptic.impact('light');
            onOpenManageCategories();
          }}
          className="flex w-[4.4rem] shrink-0 flex-col items-center gap-1 rounded-2xl border border-dashed border-line-strong bg-transparent px-1.5 py-2 text-faint"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-dashed border-line-strong">
            <Settings2 size={16} />
          </span>
          <span className="text-[9px] font-medium leading-tight">{t('new_category')}</span>
        </button>
      </div>
    </div>
  );
};
