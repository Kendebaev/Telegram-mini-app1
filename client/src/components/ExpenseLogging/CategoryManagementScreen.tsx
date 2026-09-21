import React, { useState } from 'react';
import { X, Plus, Trash2, ArrowLeft, Check } from 'lucide-react';
import { useCategoryStore } from '../../stores/categoryStore';
import { useTelegram } from '../../context/TelegramContext';
import { CategoryIcon } from '../glass/CategoryIcon';
import { GlassButton } from '../glass/GlassButton';
import { GlassCard } from '../glass/GlassCard';
import type { TransactionType, Category } from '../../types/models';

interface CategoryManagementScreenProps {
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
  onClose,
  defaultType = 'expense',
}) => {
  const { categories, addCustomCategory, deleteCustomCategory } = useCategoryStore();
  const { haptic, backButton } = useTelegram();

  const [activeTab, setActiveTab] = useState<TransactionType>(defaultType);
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('Sparkles');
  const [selectedColor, setSelectedColor] = useState('#818CF8');
  const [deleteConfirmCat, setDeleteConfirmCat] = useState<Category | null>(null);

  React.useEffect(() => {
    backButton.show();
    const handleBack = () => onClose();
    backButton.onClick(handleBack);
    return () => {
      backButton.offClick(handleBack);
      backButton.hide();
    };
  }, [backButton, onClose]);

  const filteredCategories = categories.filter((c) => c.type === activeTab);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    haptic.notification('success');
    await addCustomCategory({
      name: newName.trim(),
      icon: selectedIcon,
      color: selectedColor,
      type: activeTab,
    });

    setNewName('');
    setIsCreating(false);
  };

  const handleDelete = async (cat: Category) => {
    haptic.impact('heavy');
    await deleteCustomCategory(cat.id);
    setDeleteConfirmCat(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#070A12]/95 backdrop-blur-2xl flex flex-col safe-top safe-bottom animate-in fade-in duration-200">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/[0.08] flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => {
              haptic.impact('light');
              onClose();
            }}
            className="p-2 rounded-xl bg-white/[0.06] text-slate-300 active:scale-95 transition-all"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h2 className="text-base font-bold text-white">Manage Categories</h2>
            <p className="text-xs text-slate-400">Custom categories & assignments</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            haptic.impact('light');
            setIsCreating(!isCreating);
          }}
          className="p-2 rounded-xl bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 active:scale-95 transition-all"
        >
          {isCreating ? <X size={18} /> : <Plus size={18} />}
        </button>
      </div>

      {/* Segmented Type Toggle */}
      <div className="px-4 py-3">
        <div className="p-1 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex">
          <button
            type="button"
            onClick={() => {
              haptic.selection();
              setActiveTab('expense');
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'expense'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Expense Categories
          </button>
          <button
            type="button"
            onClick={() => {
              haptic.selection();
              setActiveTab('income');
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'income'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Income Categories
          </button>
        </div>
      </div>

      {/* Main Body */}
      <div className="flex-1 overflow-y-auto px-4 pb-20 space-y-4 no-scrollbar">
        {/* Create Form when active */}
        {isCreating && (
          <GlassCard variant="accent" className="space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center justify-between">
              <span>New {activeTab === 'expense' ? 'Expense' : 'Income'} Category</span>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="text-slate-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </h3>

            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Category Name (e.g. Subscriptions)"
              className="w-full px-3.5 py-2.5 rounded-xl glass-input text-sm"
              autoFocus
            />

            {/* Icon Picker */}
            <div>
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                Select Icon
              </label>
              <div className="grid grid-cols-6 gap-2 max-h-32 overflow-y-auto p-1 no-scrollbar">
                {AVAILABLE_ICONS.map((iconName) => {
                  const isSelected = selectedIcon === iconName;
                  return (
                    <button
                      key={iconName}
                      type="button"
                      onClick={() => {
                        haptic.selection();
                        setSelectedIcon(iconName);
                      }}
                      className={`p-2 rounded-xl border flex items-center justify-center transition-all ${
                        isSelected
                          ? 'bg-indigo-600/30 border-indigo-400 text-white'
                          : 'bg-white/[0.04] border-white/[0.06] text-slate-400'
                      }`}
                    >
                      <CategoryIcon name={iconName} size={18} />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Color Picker */}
            <div>
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                Select Color
              </label>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((color) => {
                  const isSelected = selectedColor === color;
                  return (
                    <button
                      key={color}
                      type="button"
                      onClick={() => {
                        haptic.selection();
                        setSelectedColor(color);
                      }}
                      className="w-8 h-8 rounded-full flex items-center justify-center transition-transform active:scale-90"
                      style={{ backgroundColor: color }}
                    >
                      {isSelected && <Check size={16} className="text-white drop-shadow" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <GlassButton
              variant="primary"
              onClick={handleCreate}
              disabled={!newName.trim()}
              className="w-full mt-2"
            >
              Add Category
            </GlassButton>
          </GlassCard>
        )}

        {/* Existing Categories List */}
        <div className="space-y-2">
          {filteredCategories.map((cat) => (
            <div
              key={cat.id}
              className="glass-card flex items-center justify-between p-3 rounded-2xl"
            >
              <div className="flex items-center space-x-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{
                    backgroundColor: `${cat.color}25`,
                    color: cat.color,
                  }}
                >
                  <CategoryIcon name={cat.icon} size={20} color={cat.color} />
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">{cat.name}</div>
                  <div className="text-[11px] text-slate-400">
                    {cat.is_custom ? 'Custom category' : 'Standard default'}
                  </div>
                </div>
              </div>

              {cat.is_custom && (
                <button
                  type="button"
                  onClick={() => setDeleteConfirmCat(cat)}
                  className="p-2 rounded-xl text-rose-400 hover:bg-rose-500/20 active:scale-90 transition-all"
                  aria-label="Delete category"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmCat && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <GlassCard className="max-w-xs w-full space-y-3">
            <h4 className="text-base font-bold text-white">Delete Category?</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Deleting <strong className="text-rose-400">{deleteConfirmCat.name}</strong> will reassign all its transactions to{' '}
              <strong className="text-white">
                {deleteConfirmCat.type === 'income' ? 'Other Income' : 'Other Expense'}
              </strong>
              .
            </p>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmCat(null)}
                className="flex-1 py-2.5 rounded-xl bg-white/[0.08] text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deleteConfirmCat)}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-lg shadow-rose-600/30"
              >
                Confirm Delete
              </button>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
};
