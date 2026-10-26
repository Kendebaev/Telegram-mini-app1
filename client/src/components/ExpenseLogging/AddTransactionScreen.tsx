import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Banknote,
  CalendarDays,
  ChevronDown,
  CreditCard,
  SlidersHorizontal,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useTelegram } from '../../context/TelegramContext';
import { useCategoryStore } from '../../stores/categoryStore';
import { useSettingsStore, useTranslation } from '../../stores/settingsStore';
import { useToastStore } from '../../stores/toastStore';
import { useTransactionStore } from '../../stores/transactionStore';
import { useUIStore } from '../../stores/uiStore';
import type { PaymentMethod, TransactionType } from '../../types/models';
import { CategoryPicker } from './CategoryPicker';
import { HashtagSelector } from './HashtagSelector';
import { TactileNumpad, evaluateSimpleExpression } from './TactileNumpad';
import { Segmented } from '../ui/Segmented';
import { Sheet } from '../ui/Sheet';
import { Chip } from '../ui/Chip';

export const AddTransactionScreen: React.FC = () => {
  const { addTransaction, updateTransaction } = useTransactionStore();
  const { categories, getCategoriesByType } = useCategoryStore();
  const { currencyConfig, formatAmount } = useSettingsStore();
  const { t } = useTranslation();
  const {
    isAddTransactionOpen,
    closeAddTransaction,
    preselectedTransactionType,
    editingTransaction,
    prefillTemplate,
    openManageCategories,
  } = useUIStore();
  const showToast = useToastStore((s) => s.show);
  const { haptic, backButton } = useTelegram();

  const [type, setType] = useState<TransactionType>('expense');
  const [rawAmount, setRawAmount] = useState('0');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Card');
  const [dateOption, setDateOption] = useState<'today' | 'yesterday' | 'custom'>('today');
  const [customDate, setCustomDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [showMore, setShowMore] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isAddTransactionOpen) return;

    const source = editingTransaction ?? prefillTemplate;
    setType(editingTransaction?.type ?? prefillTemplate?.type ?? preselectedTransactionType);
    setRawAmount(source ? String(source.amount) : '0');
    setSelectedCategoryId(source?.category_id ?? null);
    setNote(source?.note ?? '');
    setHashtags(source?.hashtags ?? []);
    setPaymentMethod(source?.payment_method ?? 'Card');
    setShowMore(false);
    setCustomDate(
      editingTransaction
        ? new Date(editingTransaction.date).toISOString().slice(0, 10)
        : new Date().toISOString().slice(0, 10),
    );
    setDateOption(editingTransaction ? 'custom' : 'today');
  }, [isAddTransactionOpen, editingTransaction, prefillTemplate, preselectedTransactionType]);

  useEffect(() => {
    const validCats = getCategoriesByType(type);
    if (!selectedCategoryId || !validCats.some((c) => c.id === selectedCategoryId)) {
      setSelectedCategoryId(validCats[0]?.id ?? null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, categories]);

  useEffect(() => {
    if (!isAddTransactionOpen) return;
    backButton.show();
    const handleBack = () => closeAddTransaction();
    backButton.onClick(handleBack);
    return () => {
      backButton.offClick(handleBack);
      backButton.hide();
    };
  }, [isAddTransactionOpen, backButton, closeAddTransaction]);

  const amount = evaluateSimpleExpression(rawAmount);
  const isIncome = type === 'income';

  const handleSubmit = async () => {
    if (amount <= 0) {
      haptic.notification('error');
      showToast(t('enter_amount'), 'error');
      return;
    }

    const finalDate = new Date();
    if (dateOption === 'yesterday') finalDate.setDate(finalDate.getDate() - 1);
    else if (dateOption === 'custom') finalDate.setTime(new Date(`${customDate}T12:00:00`).getTime());

    setIsSubmitting(true);
    haptic.notification('success');

    try {
      if (editingTransaction) {
        await updateTransaction(editingTransaction.id, {
          type,
          amount,
          category_id: selectedCategoryId,
          note: note.trim() || null,
          hashtags,
          date: finalDate.toISOString(),
          payment_method: paymentMethod,
        });
        showToast(t('entry_updated'), 'success');
      } else {
        await addTransaction({
          type,
          amount,
          category_id: selectedCategoryId,
          note: note.trim() || null,
          hashtags,
          date: finalDate.toISOString(),
          payment_method: paymentMethod,
        });
        showToast(isIncome ? t('income_added') : t('entry_saved'), 'success');

        if (isIncome) {
          confetti({
            particleCount: 90,
            spread: 72,
            origin: { y: 0.62 },
            colors: ['#0F9F7A', '#5EEAD4', '#6354E8', '#B9ADFF'],
            disableForReducedMotion: true,
          });
        }
      }
      closeAddTransaction();
    } catch (err) {
      console.error('Save failed:', err);
      haptic.notification('error');
      showToast(t('no_results'), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet
      open={isAddTransactionOpen}
      onClose={closeAddTransaction}
      title={editingTransaction ? t('edit_transaction_title') : t('new_transaction')}
      subtitle={`${currencyConfig.code} · ${currencyConfig.name}`}
      footer={
        <button
          type="button"
          onClick={handleSubmit}
          disabled={amount <= 0 || isSubmitting}
          className={`pressable w-full rounded-2xl py-3.5 font-display text-[13px] font-bold text-white shadow-glow disabled:opacity-40 ${
            isIncome
              ? 'bg-gradient-to-r from-mint to-emerald-500'
              : 'bg-gradient-to-r from-accent to-accent-2'
          }`}
        >
          {isSubmitting
            ? t('saving')
            : `${editingTransaction ? t('update_transaction') : isIncome ? t('save_income') : t('save_expense')} · ${formatAmount(amount)}`}
        </button>
      }
    >
      <div className="space-y-4 pb-1">
        <Segmented
          options={[
            { value: 'expense', label: t('expense'), icon: <ArrowUpRight size={13} /> },
            { value: 'income', label: t('income'), icon: <ArrowDownLeft size={13} /> },
          ]}
          value={type}
          onChange={(next) => {
            haptic.selection();
            setType(next);
          }}
          accent={isIncome ? 'var(--mint)' : 'var(--coral)'}
          ariaLabel={t('filter_type')}
        />

        <div
          className={`relative overflow-hidden rounded-3xl border p-4 text-center ${
            isIncome ? 'border-mint/25 bg-mint-soft' : 'border-coral/20 bg-coral-soft'
          }`}
        >
          <p className="eyebrow">{t('amount')}</p>
          <div className="mt-1 flex items-baseline justify-center gap-1.5">
            <span
              className={`font-display text-lg font-bold ${isIncome ? 'text-mint' : 'text-coral'}`}
            >
              {isIncome ? '+' : '−'} {currencyConfig.symbol}
            </span>
            <span className="font-mono text-[34px] font-bold leading-none tracking-tight text-ink">
              {rawAmount}
            </span>
          </div>
          {(rawAmount.includes('+') || rawAmount.includes('-')) && (
            <p className="mt-1.5 font-mono text-[10px] font-semibold text-muted">
              = {formatAmount(amount)}
            </p>
          )}
        </div>

        <TactileNumpad value={rawAmount} onChange={setRawAmount} onSubmit={handleSubmit} />

        <CategoryPicker
          selectedCategoryId={selectedCategoryId}
          onSelectCategory={setSelectedCategoryId}
          type={type}
          onOpenManageCategories={() => {
            haptic.impact('light');
            openManageCategories();
          }}
        />

        <HashtagSelector
          note={note}
          onChangeNote={setNote}
          tags={hashtags}
          onChangeTags={setHashtags}
        />

        <button
          type="button"
          onClick={() => {
            haptic.selection();
            setShowMore((v) => !v);
          }}
          className="flex w-full items-center justify-between rounded-2xl border border-line bg-panel-inset px-3.5 py-2.5 text-[11px] font-bold text-muted"
        >
          <span className="flex items-center gap-1.5">
            <SlidersHorizontal size={13} />
            {showMore ? t('less_options') : t('more_options')}
          </span>
          <ChevronDown
            size={14}
            className={`transition-transform duration-200 ${showMore ? 'rotate-180' : ''}`}
          />
        </button>

        <AnimatePresence initial={false}>
          {showMore && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden"
            >
              <div className="space-y-3">
                <div>
                  <p className="eyebrow mb-2">{t('payment_method')}</p>
                  <div className="flex gap-2">
                    <Chip
                      active={paymentMethod === 'Card'}
                      accent="var(--accent)"
                      icon={<CreditCard size={13} />}
                      onClick={() => {
                        haptic.selection();
                        setPaymentMethod('Card');
                      }}
                      className="flex-1 justify-center py-2"
                    >
                      {t('card')}
                    </Chip>
                    <Chip
                      active={paymentMethod === 'Cash'}
                      accent="var(--accent)"
                      icon={<Banknote size={13} />}
                      onClick={() => {
                        haptic.selection();
                        setPaymentMethod('Cash');
                      }}
                      className="flex-1 justify-center py-2"
                    >
                      {t('cash')}
                    </Chip>
                  </div>
                </div>

                <div>
                  <p className="eyebrow mb-2">{t('date_filter')}</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <Chip
                      active={dateOption === 'today'}
                      accent="var(--accent)"
                      onClick={() => {
                        haptic.selection();
                        setDateOption('today');
                      }}
                    >
                      {t('today')}
                    </Chip>
                    <Chip
                      active={dateOption === 'yesterday'}
                      accent="var(--accent)"
                      onClick={() => {
                        haptic.selection();
                        setDateOption('yesterday');
                      }}
                    >
                      {t('yesterday')}
                    </Chip>
                    <label
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold ${
                        dateOption === 'custom'
                          ? 'border-transparent bg-accent text-white'
                          : 'border-line bg-panel-inset text-muted'
                      }`}
                    >
                      <CalendarDays size={12} />
                      <input
                        type="date"
                        value={customDate}
                        onChange={(e) => {
                          setCustomDate(e.target.value);
                          setDateOption('custom');
                        }}
                        className="w-[6.9rem] bg-transparent text-[10px] font-bold text-inherit outline-none"
                      />
                    </label>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Sheet>
  );
};
