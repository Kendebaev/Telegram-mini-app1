import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Plus, Trash2, X } from 'lucide-react';
import { useCategoryStore } from '../../stores/categoryStore';
import { useTranslation } from '../../stores/settingsStore';
import { useToastStore } from '../../stores/toastStore';
import { getLocalizedCategoryName } from '../../utils/translations';
import { useTelegram } from '../../context/TelegramContext';
import { CategoryIcon } from '../glass/CategoryIcon';
import { IconTile } from '../ui/IconTile';
import { Segmented } from '../ui/Segmented';
import { Sheet } from '../ui/Sheet';
import { Surface } from '../ui/Surface';
import type { TransactionType } from '../../types/models';

interface CategoryManagementScreenProps {
  open: boolean;
  onClose: () => void;
  defaultType?: TransactionType;
}

const AVAILABLE_ICONS = [
  'Utensils', 'ShoppingCart', 'Car', 'Home', 'Receipt', 'Film',
  'ShoppingBag', 'HeartPulse', 'Plane', 'GraduationCap', 'Sparkles', 'MoreHorizontal',
  'Briefcase', 'Laptop', 'TrendingUp', 'Building2', 'Gift', 'Key',
  'Coffee', 'Fuel', 'Gamepad2', 'Wifi', 'Smartphone', 'Zap',
];

const PRESET_COLORS = [
  '#F87171', '#FB923C', '#FBBF24', '#34D399', '#10B981', '#38BDF8',
  '#60A5FA', '#818CF8', '#A78BFA', '#E879F9', '#F472B6', '#94A3B8',
];

export const CategoryManagementScreen: React.FC<CategoryManagementScreenProps> = ({
  open,
  onClose,
  defaultType = 'expense',
}) => {
  const { categories, addCustomCategory, deleteCustomCategory } = useCategoryStore();
  const { t, language } = useTranslation();
  const { haptic, backButton } = useTelegram();
  const showToast = useToastStore((s) => s.show);

  const [activeTab, setActiveTab] = useState<TransactionType>(defaultType);
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('Sparkles');
  const [selectedColor, setSelectedColor] = useState('#818CF8');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setActiveTab(defaultType);
    setIsCreating(false);
    setNewName('');
    setSelectedIcon('Sparkles');
    setSelectedColor('#818CF8');
    setDeleteConfirmId(null);
  }, [open, defaultType]);

  useEffect(() => {
    if (!open) return;
    backButton.show();
    backButton.onClick(onClose);
    return () => {
      backButton.offClick(onClose);
      backButton.hide();
    };
  }, [open, backButton, onClose]);

  const filteredCategories = categories.filter((cat) => cat.type === activeTab);
  const otherName = getLocalizedCategoryName(
    activeTab === 'income' ? 'Other Income' : 'Other Expense',
    language,
  );

  const handleCreate = async (event?: React.FormEvent) => {
    event?.preventDefault();
    if (!newName.trim()) return;

    haptic.notification('success');
    await addCustomCategory({
      name: newName.trim(),
      icon: selectedIcon,
      color: selectedColor,
      type: activeTab,
    });

    showToast(t('category_created'), 'success');
    setNewName('');
    setIsCreating(false);
  };

  const handleDelete = async (id: string) => {
    haptic.impact('heavy');
    await deleteCustomCategory(id);
    setDeleteConfirmId(null);
    showToast(t('category_deleted'), 'success');
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={t('manage_categories')}
      subtitle={t('custom_cats_sub')}
      zIndex={80}
    >
      <div className="space-y-3.5 pb-3">
        <Segmented
          value={activeTab}
          onChange={(value) => {
            haptic.selection();
            setActiveTab(value);
            setIsCreating(false);
            setDeleteConfirmId(null);
          }}
          options={[
            { value: 'expense', label: t('expense_categories') },
            { value: 'income', label: t('income_categories') },
          ]}
          size="sm"
          accent={activeTab === 'expense' ? 'var(--coral)' : 'var(--mint)'}
          ariaLabel={t('category_type')}
        />

        {/* Create toggle */}
        {!isCreating && (
          <button
            type="button"
            onClick={() => {
              haptic.selection();
              setIsCreating(true);
              setDeleteConfirmId(null);
            }}
            className="pressable flex w-full items-center justify-center gap-1.5 rounded-2xl border border-dashed border-line-strong py-2.5 text-[11px] font-bold text-accent"
          >
            <Plus size={14} />
            {activeTab === 'expense' ? t('new_expense_cat') : t('new_income_cat')}
          </button>
        )}

        {/* Create form */}
        <AnimatePresence initial={false}>
          {isCreating && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden"
            >
              <Surface tone="inset" className="space-y-3 p-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-ink">
                    {activeTab === 'expense' ? t('new_expense_cat') : t('new_income_cat')}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsCreating(false)}
                    aria-label={t('close')}
                    className="pressable flex h-6 w-6 items-center justify-center rounded-full bg-panel-solid text-muted"
                  >
                    <X size={12} />
                  </button>
                </div>

                <input
                  type="text"
                  value={newName}
                  onChange={(event) => setNewName(event.target.value)}
                  placeholder={t('cat_name_placeholder')}
                  className="h-10 w-full rounded-xl border border-line bg-panel-solid px-3 text-[12px] font-medium text-ink placeholder:text-faint outline-none focus:border-accent"
                  autoFocus
                />

                <div>
                  <div className="eyebrow mb-1.5">{t('select_icon')}</div>
                  <div className="no-scrollbar grid max-h-36 grid-cols-6 gap-1.5 overflow-y-auto">
                    {AVAILABLE_ICONS.map((iconName) => {
                      const selected = selectedIcon === iconName;
                      return (
                        <button
                          key={iconName}
                          type="button"
                          onClick={() => {
                            haptic.selection();
                            setSelectedIcon(iconName);
                          }}
                          className={`pressable flex h-9 items-center justify-center rounded-xl border ${
                            selected
                              ? 'border-accent bg-accent-soft text-accent'
                              : 'border-line bg-panel-solid text-muted'
                          }`}
                        >
                          <CategoryIcon name={iconName} size={16} />
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <div className="eyebrow mb-1.5">{t('select_color')}</div>
                  <div className="flex flex-wrap gap-2">
                    {PRESET_COLORS.map((color) => {
                      const selected = selectedColor === color;
                      return (
                        <button
                          key={color}
                          type="button"
                          onClick={() => {
                            haptic.selection();
                            setSelectedColor(color);
                          }}
                          aria-label={color}
                          className="pressable flex h-7 w-7 items-center justify-center rounded-full transition-transform"
                          style={{
                            backgroundColor: color,
                            boxShadow: selected
                              ? `0 0 0 2px var(--panel-strong), 0 0 0 4px ${color}`
                              : undefined,
                          }}
                        >
                          {selected && <Check size={13} className="text-white drop-shadow" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex gap-2 pt-0.5">
                  <button
                    type="button"
                    onClick={() => setIsCreating(false)}
                    className="pressable flex-1 rounded-xl border border-line bg-panel-solid py-2.5 text-[10px] font-bold text-muted"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleCreate()}
                    disabled={!newName.trim()}
                    className="pressable flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-accent py-2.5 text-[10px] font-bold text-white disabled:opacity-40"
                  >
                    <Plus size={12} />
                    {t('add_category_btn')}
                  </button>
                </div>
              </Surface>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Category list */}
        <div className="space-y-1.5">
          {filteredCategories.map((cat) => {
            const isConfirming = deleteConfirmId === cat.id;
            return (
              <Surface
                key={cat.id}
                tone="inset"
                padded={false}
                className="overflow-hidden"
              >
                <div className="flex items-center justify-between gap-3 px-3.5 py-2.5">
                  <div className="flex min-w-0 items-center gap-3">
                    <IconTile icon={cat.icon} color={cat.color} size={36} iconSize={16} />
                    <div className="min-w-0">
                      <div className="truncate text-[12px] font-semibold text-ink">
                        {getLocalizedCategoryName(cat.name, language)}
                      </div>
                      <div className="text-[9px] font-medium text-faint">
                        {cat.is_custom ? t('custom_cat_badge') : t('standard_cat_badge')}
                      </div>
                    </div>
                  </div>

                  {cat.is_custom && !isConfirming && (
                    <button
                      type="button"
                      onClick={() => {
                        haptic.selection();
                        setDeleteConfirmId(cat.id);
                      }}
                      aria-label={t('delete')}
                      className="pressable flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-coral-soft text-coral"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>

                <AnimatePresence initial={false}>
                  {isConfirming && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-2 border-t border-line bg-coral-soft px-3.5 py-2.5">
                        <div className="text-[10px] leading-relaxed text-muted">
                          {t('delete_cat_modal_desc')}{' '}
                          <strong className="text-ink">{otherName}</strong>.
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(null)}
                            className="pressable flex-1 rounded-lg border border-line bg-panel-solid py-1.5 text-[10px] font-bold text-muted"
                          >
                            {t('cancel')}
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDelete(cat.id)}
                            className="pressable flex-1 rounded-lg bg-coral py-1.5 text-[10px] font-bold text-white"
                          >
                            {t('confirm_delete_btn')}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Surface>
            );
          })}
        </div>
      </div>
    </Sheet>
  );
};
