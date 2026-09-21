import React, { useState, useEffect } from 'react';
import { X, ArrowLeft, CreditCard, Banknote } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useTransactionStore } from '../../stores/transactionStore';
import { useCategoryStore } from '../../stores/categoryStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { useUIStore } from '../../stores/uiStore';
import { useTelegram } from '../../context/TelegramContext';
import { TactileNumpad, evaluateSimpleExpression } from './TactileNumpad';
import { CategoryPicker } from './CategoryPicker';
import { HashtagSelector } from './HashtagSelector';
import { CategoryManagementScreen } from './CategoryManagementScreen';
import { GlassButton } from '../glass/GlassButton';
import type { TransactionType, PaymentMethod } from '../../types/models';

export const AddTransactionScreen: React.FC = () => {
  const { addTransaction, updateTransaction } = useTransactionStore();
  const { categories, getCategoriesByType } = useCategoryStore();
  const { currencyConfig } = useSettingsStore();
  const {
    closeAddTransaction,
    preselectedTransactionType,
    editingTransaction,
    isManageCategoriesOpen,
    openManageCategories,
    closeManageCategories,
  } = useUIStore();
  const { haptic, backButton } = useTelegram();

  const [type, setType] = useState<TransactionType>(
    editingTransaction?.type || preselectedTransactionType || 'expense'
  );
  const [rawAmount, setRawAmount] = useState<string>(
    editingTransaction ? editingTransaction.amount.toString() : '0'
  );
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    editingTransaction?.category_id || null
  );
  const [note, setNote] = useState<string>(editingTransaction?.note || '');
  const [hashtags, setHashtags] = useState<string[]>(editingTransaction?.hashtags || []);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    editingTransaction?.payment_method || 'Card'
  );
  const [dateOption, setDateOption] = useState<'today' | 'yesterday' | 'custom'>('today');
  const [customDate, setCustomDate] = useState<string>(
    editingTransaction ? new Date(editingTransaction.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10)
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Set default category if none selected or type changed
  useEffect(() => {
    const validCats = getCategoriesByType(type);
    if (!selectedCategoryId || !validCats.some((c) => c.id === selectedCategoryId)) {
      if (validCats.length > 0) {
        setSelectedCategoryId(validCats[0].id);
      }
    }
  }, [type, categories]);

  // Telegram native BackButton integration
  useEffect(() => {
    backButton.show();
    const handleBack = () => {
      closeAddTransaction();
    };
    backButton.onClick(handleBack);
    return () => {
      backButton.offClick(handleBack);
      backButton.hide();
    };
  }, []);

  const handleTypeChange = (newType: TransactionType) => {
    haptic.selection();
    setType(newType);
  };

  const calculatedAmount = evaluateSimpleExpression(rawAmount);

  const handleSubmit = async () => {
    if (calculatedAmount <= 0) {
      haptic.notification('error');
      return;
    }

    setIsSubmitting(true);
    haptic.notification('success');

    // Date computation
    let finalDate = new Date();
    if (dateOption === 'yesterday') {
      finalDate.setDate(finalDate.getDate() - 1);
    } else if (dateOption === 'custom') {
      finalDate = new Date(customDate);
    }

    try {
      if (editingTransaction) {
        await updateTransaction(editingTransaction.id, {
          type,
          amount: calculatedAmount,
          category_id: selectedCategoryId,
          note: note.trim() || null,
          hashtags,
          date: finalDate.toISOString(),
          payment_method: paymentMethod,
        });
      } else {
        await addTransaction({
          type,
          amount: calculatedAmount,
          category_id: selectedCategoryId,
          note: note.trim() || null,
          hashtags,
          date: finalDate.toISOString(),
          payment_method: paymentMethod,
        });

        // Confetti celebration if logging income!
        if (type === 'income') {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#10B981', '#34D399', '#06B6D4', '#6366F1'],
          });
        }
      }

      closeAddTransaction();
    } catch (err) {
      console.error('Save failed:', err);
      haptic.notification('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#070A12] flex flex-col safe-top safe-bottom overflow-y-auto no-scrollbar animate-in slide-in-from-bottom-6 duration-200">
      {/* Top Bar */}
      <div className="px-4 py-3 border-b border-white/[0.08] flex items-center justify-between sticky top-0 bg-[#070A12]/90 backdrop-blur-xl z-20">
        <button
          type="button"
          onClick={() => {
            haptic.impact('light');
            closeAddTransaction();
          }}
          className="p-2 rounded-xl bg-white/[0.06] text-slate-300 active:scale-95 transition-all"
        >
          <ArrowLeft size={18} />
        </button>

        <h2 className="text-sm font-bold text-white uppercase tracking-wider">
          {editingTransaction ? 'Edit Transaction' : type === 'income' ? 'Record Income' : 'Record Expense'}
        </h2>

        <button
          type="button"
          onClick={() => {
            haptic.impact('light');
            closeAddTransaction();
          }}
          className="p-2 rounded-xl bg-white/[0.06] text-slate-300 active:scale-95 transition-all"
        >
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 px-4 py-3 space-y-4 max-w-md mx-auto w-full pb-24">
        {/* Type Toggle: Expense vs Income */}
        <div className="p-1 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex relative">
          <button
            type="button"
            onClick={() => handleTypeChange('expense')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              type === 'expense'
                ? 'bg-rose-500/25 text-rose-300 border border-rose-500/50 shadow-lg shadow-rose-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>Expense</span>
          </button>
          <button
            type="button"
            onClick={() => handleTypeChange('income')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              type === 'income'
                ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/50 shadow-lg shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>Income</span>
          </button>
        </div>

        {/* Large Amount Display */}
        <div
          className={`glass-card p-4 rounded-3xl text-center border transition-all ${
            type === 'income' ? 'border-emerald-500/30 shadow-income-glow' : 'border-rose-500/30 shadow-expense-glow'
          }`}
        >
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
            Amount ({currencyConfig.code})
          </div>
          <div className="flex items-center justify-center space-x-1">
            <span
              className={`text-2xl font-bold ${
                type === 'income' ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {type === 'income' ? '+' : '-'} {currencyConfig.symbol}
            </span>
            <span
              className={`text-4xl font-extrabold tracking-tight tabular-nums ${
                type === 'income' ? 'text-emerald-300' : 'text-rose-300'
              }`}
            >
              {rawAmount}
            </span>
          </div>

          {/* Expression preview if user typed e.g. 20+15 */}
          {(rawAmount.includes('+') || rawAmount.includes('-')) && (
            <div className="mt-1 text-xs font-mono text-indigo-300">
              = {currencyConfig.symbol}{calculatedAmount.toFixed(2)}
            </div>
          )}
        </div>

        {/* Tactile Numpad */}
        <TactileNumpad
          value={rawAmount}
          onChange={setRawAmount}
          onSubmit={handleSubmit}
        />

        {/* Category Picker (Filtered by Type) */}
        <CategoryPicker
          selectedCategoryId={selectedCategoryId}
          onSelectCategory={setSelectedCategoryId}
          type={type}
          onOpenManageCategories={openManageCategories}
        />

        {/* Hashtags & Notes */}
        <HashtagSelector
          note={note}
          onChangeNote={setNote}
          tags={hashtags}
          onChangeTags={setHashtags}
        />

        {/* Payment Method & Date in 2 columns */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* Payment Method: Card vs Cash */}
          <div className="glass-card p-3 rounded-2xl">
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Payment Method
            </div>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => {
                  haptic.selection();
                  setPaymentMethod('Card');
                }}
                className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 border transition-all ${
                  paymentMethod === 'Card'
                    ? 'bg-indigo-600/30 border-indigo-500 text-white'
                    : 'bg-white/[0.04] border-white/[0.06] text-slate-400'
                }`}
              >
                <CreditCard size={13} />
                <span>Card</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  haptic.selection();
                  setPaymentMethod('Cash');
                }}
                className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 border transition-all ${
                  paymentMethod === 'Cash'
                    ? 'bg-indigo-600/30 border-indigo-500 text-white'
                    : 'bg-white/[0.04] border-white/[0.06] text-slate-400'
                }`}
              >
                <Banknote size={13} />
                <span>Cash</span>
              </button>
            </div>
          </div>

          {/* Date Selector */}
          <div className="glass-card p-3 rounded-2xl">
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Date
            </div>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => {
                  haptic.selection();
                  setDateOption('today');
                }}
                className={`flex-1 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  dateOption === 'today'
                    ? 'bg-indigo-600/30 border-indigo-500 text-white'
                    : 'bg-white/[0.04] border-white/[0.06] text-slate-400'
                }`}
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => {
                  haptic.selection();
                  setDateOption('yesterday');
                }}
                className={`flex-1 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  dateOption === 'yesterday'
                    ? 'bg-indigo-600/30 border-indigo-500 text-white'
                    : 'bg-white/[0.04] border-white/[0.06] text-slate-400'
                }`}
              >
                Yest.
              </button>
              <input
                type="date"
                value={customDate}
                onChange={(e) => {
                  setDateOption('custom');
                  setCustomDate(e.target.value);
                }}
                className="w-8 h-8 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-[10px] p-1 flex items-center justify-center"
                title="Pick custom date"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Save Button */}
      <div className="sticky bottom-0 inset-x-0 p-4 bg-[#070A12]/95 backdrop-blur-xl border-t border-white/[0.08] z-30 safe-bottom">
        <div className="max-w-md mx-auto">
          <GlassButton
            variant={type === 'income' ? 'income' : 'expense'}
            size="lg"
            onClick={handleSubmit}
            disabled={calculatedAmount <= 0 || isSubmitting}
            className="w-full shadow-2xl"
          >
            {isSubmitting
              ? 'Saving...'
              : editingTransaction
              ? 'Update Transaction'
              : type === 'income'
              ? `Save Income (+${currencyConfig.symbol}${calculatedAmount.toFixed(2)})`
              : `Save Expense (-${currencyConfig.symbol}${calculatedAmount.toFixed(2)})`}
          </GlassButton>
        </div>
      </div>

      {/* Category Management Sub-Screen */}
      {isManageCategoriesOpen && (
        <CategoryManagementScreen
          defaultType={type}
          onClose={closeManageCategories}
        />
      )}
    </div>
  );
};
