import React, { useState } from 'react';
import { X, Edit3, Trash2, Calendar, CreditCard, Banknote, Tag } from 'lucide-react';
import { useTransactionStore } from '../../stores/transactionStore';
import { useCategoryStore } from '../../stores/categoryStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { useUIStore } from '../../stores/uiStore';
import { useTelegram } from '../../context/TelegramContext';
import { CategoryIcon } from '../glass/CategoryIcon';
import { GlassBadge } from '../glass/GlassBadge';

export const TransactionDetailSheet: React.FC = () => {
  const { selectedTransactionForDetail, setSelectedTransaction, openAddTransaction } = useUIStore();
  const { deleteTransaction } = useTransactionStore();
  const { getCategoryById } = useCategoryStore();
  const { formatAmount } = useSettingsStore();
  const { haptic, backButton } = useTelegram();

  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  React.useEffect(() => {
    if (selectedTransactionForDetail) {
      backButton.show();
      const handleBack = () => setSelectedTransaction(null);
      backButton.onClick(handleBack);
      return () => {
        backButton.offClick(handleBack);
        backButton.hide();
      };
    }
  }, [selectedTransactionForDetail, backButton, setSelectedTransaction]);

  if (!selectedTransactionForDetail) return null;

  const tx = selectedTransactionForDetail;
  const isIncome = tx.type === 'income';
  const cat = tx.category || getCategoryById(tx.category_id);

  const handleEdit = () => {
    haptic.impact('medium');
    setSelectedTransaction(null);
    openAddTransaction(tx.type, tx);
  };

  const handleDelete = async () => {
    if (!isConfirmingDelete) {
      haptic.notification('warning');
      setIsConfirmingDelete(true);
      return;
    }

    haptic.impact('heavy');
    await deleteTransaction(tx.id);
    setSelectedTransaction(null);
  };

  const formattedDate = new Date(tx.date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  const formattedTime = new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#0D1322] border border-white/[0.12] rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] safe-bottom animate-in slide-in-from-bottom-8 duration-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/[0.08] flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Transaction Details
          </span>
          <button
            type="button"
            onClick={() => setSelectedTransaction(null)}
            className="p-1.5 rounded-full text-slate-400 hover:text-white bg-white/[0.06] active:scale-95 transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 overflow-y-auto no-scrollbar">
          {/* Amount Hero in Modal */}
          <div
            className={`glass-card p-5 rounded-3xl text-center border ${
              isIncome ? 'border-emerald-500/30 bg-emerald-950/20' : 'border-rose-500/30 bg-rose-950/20'
            }`}
          >
            <div className="inline-block mb-1">
              <GlassBadge variant={isIncome ? 'income' : 'expense'}>
                {isIncome ? 'Income' : 'Expense'}
              </GlassBadge>
            </div>
            <div
              className={`text-3xl font-extrabold tracking-tight tabular-nums ${
                isIncome ? 'text-emerald-300' : 'text-rose-300'
              }`}
            >
              {isIncome ? '+' : '-'}
              {formatAmount(tx.amount)}
            </div>
          </div>

          {/* Details list */}
          <div className="glass-card rounded-2.5xl p-4 space-y-3.5 border border-white/[0.08]">
            {/* Category */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">Category</span>
              <div className="flex items-center space-x-2">
                <div
                  className="w-6 h-6 rounded-lg flex items-center justify-center"
                  style={{
                    backgroundColor: `${cat?.color || '#818CF8'}25`,
                    color: cat?.color || '#818CF8',
                  }}
                >
                  <CategoryIcon name={cat?.icon || 'HelpCircle'} size={14} color={cat?.color} />
                </div>
                <span className="text-xs font-bold text-white">{cat?.name || 'Other'}</span>
              </div>
            </div>

            {/* Date & Time */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                <Calendar size={13} />
                Date & Time
              </span>
              <span className="text-xs font-semibold text-slate-200">
                {formattedDate} at {formattedTime}
              </span>
            </div>

            {/* Payment Method */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                {tx.payment_method === 'Cash' ? <Banknote size={13} /> : <CreditCard size={13} />}
                Payment Method
              </span>
              <span className="text-xs font-semibold text-slate-200">{tx.payment_method}</span>
            </div>

            {/* Note */}
            {tx.note && (
              <div className="pt-2 border-t border-white/[0.06]">
                <span className="text-xs text-slate-400 font-medium block mb-1">Note</span>
                <p className="text-xs text-slate-200 bg-white/[0.03] p-2.5 rounded-xl border border-white/[0.06]">
                  {tx.note}
                </p>
              </div>
            )}

            {/* Hashtags */}
            {tx.hashtags && tx.hashtags.length > 0 && (
              <div className="pt-2 border-t border-white/[0.06]">
                <span className="text-xs text-slate-400 font-medium block mb-1.5 flex items-center gap-1">
                  <Tag size={12} className="text-indigo-400" />
                  Hashtags
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {tx.hashtags.map((tag) => (
                    <GlassBadge key={tag} variant="brand" size="xs">
                      #{tag}
                    </GlassBadge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action buttons: Edit & Delete */}
          <div className="pt-2 flex items-center space-x-3">
            <button
              type="button"
              onClick={handleDelete}
              className={`flex-1 py-3 px-4 rounded-2xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
                isConfirmingDelete
                  ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
                  : 'bg-rose-500/15 text-rose-300 border border-rose-500/30 hover:bg-rose-500/25'
              } active:scale-95`}
            >
              <Trash2 size={15} />
              <span>{isConfirmingDelete ? 'Confirm Delete?' : 'Delete'}</span>
            </button>

            <button
              type="button"
              onClick={handleEdit}
              className="flex-1 py-3 px-4 rounded-2xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/30 border border-indigo-400/40 active:scale-95 transition-all flex items-center justify-center space-x-1.5"
            >
              <Edit3 size={15} />
              <span>Edit</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
