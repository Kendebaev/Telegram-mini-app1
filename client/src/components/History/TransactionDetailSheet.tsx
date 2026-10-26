import React, { useState } from 'react';
import {
  Banknote,
  CalendarDays,
  CreditCard,
  Edit3,
  Tag,
  Trash2,
} from 'lucide-react';
import { useTransactionStore } from '../../stores/transactionStore';
import { useCategoryStore } from '../../stores/categoryStore';
import { useSettingsStore, useTranslation } from '../../stores/settingsStore';
import { useToastStore } from '../../stores/toastStore';
import { getLocalizedCategoryName } from '../../utils/translations';
import { useUIStore } from '../../stores/uiStore';
import { useTelegram } from '../../context/TelegramContext';
import { CategoryIcon } from '../glass/CategoryIcon';
import { IconTile } from '../ui/IconTile';
import { Sheet } from '../ui/Sheet';
import { Surface } from '../ui/Surface';

export const TransactionDetailSheet: React.FC = () => {
  const { selectedTransactionForDetail, setSelectedTransaction, openAddTransaction } = useUIStore();
  const { deleteTransaction } = useTransactionStore();
  const { getCategoryById } = useCategoryStore();
  const { formatAmount } = useSettingsStore();
  const { t, language } = useTranslation();
  const { haptic, backButton } = useTelegram();
  const showToast = useToastStore((s) => s.show);

  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  React.useEffect(() => {
    setIsConfirmingDelete(false);
  }, [selectedTransactionForDetail?.id]);

  React.useEffect(() => {
    if (!selectedTransactionForDetail) return;
    backButton.show();
    const handleBack = () => setSelectedTransaction(null);
    backButton.onClick(handleBack);
    return () => {
      backButton.offClick(handleBack);
      backButton.hide();
    };
  }, [selectedTransactionForDetail, backButton, setSelectedTransaction]);

  const tx = selectedTransactionForDetail;

  const handleEdit = () => {
    if (!tx) return;
    haptic.impact('medium');
    setSelectedTransaction(null);
    openAddTransaction(tx.type, tx);
  };

  const handleDelete = async () => {
    if (!tx) return;
    if (!isConfirmingDelete) {
      haptic.notification('warning');
      setIsConfirmingDelete(true);
      return;
    }

    haptic.impact('heavy');
    await deleteTransaction(tx.id);
    setSelectedTransaction(null);
    showToast(t('transaction_deleted'), 'success');
  };

  const isIncome = tx?.type === 'income';
  const cat = tx ? tx.category || getCategoryById(tx.category_id) : undefined;
  const tone = isIncome ? 'var(--mint)' : 'var(--coral)';

  const locale = language === 'ru' ? 'ru-RU' : 'en-US';
  const fullDate = tx
    ? new Date(tx.date).toLocaleDateString(locale, {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '';
  const time = tx
    ? new Date(tx.date).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <Sheet
      open={Boolean(tx)}
      onClose={() => setSelectedTransaction(null)}
      title={t('transaction_details')}
      subtitle={tx ? `${fullDate} · ${time}` : undefined}
      footer={
        tx ? (
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleDelete}
              className={`pressable flex h-12 flex-1 items-center justify-center gap-1.5 rounded-2xl text-xs font-bold transition-colors ${
                isConfirmingDelete
                  ? 'text-white'
                  : 'bg-coral-soft text-coral'
              }`}
              style={
                isConfirmingDelete
                  ? { backgroundColor: 'var(--coral)', boxShadow: '0 14px 32px -14px var(--coral)' }
                  : { border: '1px solid var(--coral)' }
              }
            >
              <Trash2 size={15} />
              {isConfirmingDelete ? t('confirm_delete_q') : t('delete')}
            </button>
            <button
              type="button"
              onClick={handleEdit}
              className="pressable flex h-12 flex-1 items-center justify-center gap-1.5 rounded-2xl bg-gradient-to-br from-accent to-accent-2 text-xs font-bold text-white shadow-glow"
            >
              <Edit3 size={15} />
              {t('edit')}
            </button>
          </div>
        ) : undefined
      }
    >
      {tx && (
        <div className="space-y-4 pb-2">
          {/* Amount hero */}
          <div
            className="relative overflow-hidden rounded-[26px] border p-5"
            style={{
              borderColor: tone,
              background: isIncome ? 'var(--mint-soft)' : 'var(--coral-soft)',
            }}
          >
            <div
              className="pointer-events-none absolute -right-6 -top-8 h-28 w-28 rounded-full opacity-30 blur-2xl"
              style={{ backgroundColor: tone }}
            />
            <div className="relative flex items-center justify-between gap-3">
              <div className="min-w-0">
                <span className="eyebrow" style={{ color: tone }}>
                  {isIncome ? t('income') : t('expense')}
                </span>
                <div
                  className="mt-1 truncate font-num text-[32px] font-semibold leading-none"
                  style={{ color: tone }}
                >
                  {isIncome ? '+' : '−'}
                  {formatAmount(tx.amount)}
                </div>
              </div>
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
                style={{ backgroundColor: `${cat?.color || '#818CF8'}22` }}
              >
                <CategoryIcon
                  name={cat?.icon || (isIncome ? 'PlusCircle' : 'MoreHorizontal')}
                  size={22}
                  color={cat?.color || '#818CF8'}
                />
              </div>
            </div>
            <div className="relative mt-3 flex items-center gap-1.5 text-[11px] font-semibold text-muted">
              <span className="truncate">
                {getLocalizedCategoryName(
                  cat?.name || (isIncome ? 'Other Income' : 'Other Expense'),
                  language,
                )}
              </span>
            </div>
          </div>

          {/* Details */}
          <Surface tone="inset" className="divide-y divide-line p-0">
            <div className="flex items-center justify-between gap-3 px-4 py-3">
              <span className="flex items-center gap-2 text-[11px] font-medium text-muted">
                <IconTile
                  icon={cat?.icon || 'HelpCircle'}
                  color={cat?.color}
                  size={26}
                  iconSize={13}
                />
                {t('categories')}
              </span>
              <span className="truncate text-[11px] font-bold text-ink">
                {getLocalizedCategoryName(
                  cat?.name || (isIncome ? 'Other Income' : 'Other Expense'),
                  language,
                )}
              </span>
            </div>

            <div className="flex items-center justify-between gap-3 px-4 py-3">
              <span className="flex items-center gap-2 text-[11px] font-medium text-muted">
                <CalendarDays size={14} className="text-faint" />
                {t('date_time')}
              </span>
              <span className="text-right text-[11px] font-bold text-ink">
                {new Date(tx.date).toLocaleDateString(locale, {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
                <span className="ml-1.5 font-medium text-muted">{time}</span>
              </span>
            </div>

            <div className="flex items-center justify-between gap-3 px-4 py-3">
              <span className="flex items-center gap-2 text-[11px] font-medium text-muted">
                {tx.payment_method === 'Cash' ? (
                  <Banknote size={14} className="text-faint" />
                ) : (
                  <CreditCard size={14} className="text-faint" />
                )}
                {t('payment_method')}
              </span>
              <span className="text-[11px] font-bold text-ink">
                {tx.payment_method === 'Cash' ? t('cash') : t('card')}
              </span>
            </div>
          </Surface>

          {tx.note && (
            <div className="space-y-1.5">
              <div className="eyebrow">{t('note_label')}</div>
              <p className="rounded-2xl border border-line bg-panel-inset px-3.5 py-3 text-[11px] leading-relaxed text-ink-soft">
                {tx.note}
              </p>
            </div>
          )}

          {tx.hashtags && tx.hashtags.length > 0 && (
            <div className="space-y-2">
              <div className="eyebrow flex items-center gap-1.5">
                <Tag size={11} />
                {t('tags')}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {tx.hashtags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-line bg-accent-soft px-2.5 py-1 text-[10px] font-bold text-accent"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Sheet>
  );
};
