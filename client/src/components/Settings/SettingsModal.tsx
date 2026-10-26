import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  Check,
  Coins,
  Download,
  FileSpreadsheet,
  FolderTree,
  Hash,
  Languages,
  Moon,
  Plus,
  Search,
  Smartphone,
  Sun,
  Trash2,
  Wallet,
  X,
} from 'lucide-react';
import { useTelegram } from '../../context/TelegramContext';
import {
  useSettingsStore,
  SUPPORTED_CURRENCIES,
  useTranslation,
} from '../../stores/settingsStore';
import { useTransactionStore } from '../../stores/transactionStore';
import { INITIAL_CATEGORIES, useCategoryStore } from '../../stores/categoryStore';
import { usePlanStore } from '../../stores/planStore';
import { useUIStore } from '../../stores/uiStore';
import { useToastStore } from '../../stores/toastStore';
import { Sheet } from '../ui/Sheet';
import { Surface } from '../ui/Surface';
import { formatCategoryCount } from '../../utils/translations';
import { Segmented } from '../ui/Segmented';
import { exportTransactionsToCSV, exportDataToJSON } from '../../utils/export';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SectionTitleProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  iconClass?: string;
}

const SectionTitle: React.FC<SectionTitleProps> = ({
  icon,
  title,
  subtitle,
  iconClass = 'bg-accent-soft text-accent',
}) => (
  <div className="flex items-center gap-2.5">
    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${iconClass}`}>
      {icon}
    </div>
    <div className="min-w-0">
      <span className="block text-[11px] font-bold text-ink">{title}</span>
      {subtitle && <span className="block truncate text-[10px] text-muted">{subtitle}</span>}
    </div>
  </div>
);

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { themeMode, setThemeMode, user, isInsideTelegram, haptic, backButton } = useTelegram();
  const { currency, setCurrency, startingBalance, setStartingBalance, wipeData, formatAmount } =
    useSettingsStore();
  const { t, language, setLanguage } = useTranslation();
  const { transactions, hashtagSuggestions, addHashtagSuggestion, removeHashtagSuggestion } =
    useTransactionStore();
  const { categories } = useCategoryStore();
  const resetPlan = usePlanStore((s) => s.resetPlan);
  const { openManageCategories } = useUIStore();
  const showToast = useToastStore((s) => s.show);

  const [currencySearch, setCurrencySearch] = useState('');
  const [isEditingBalance, setIsEditingBalance] = useState(false);
  const [balanceInput, setBalanceInput] = useState(startingBalance.toString());
  const [isConfirmingReset, setIsConfirmingReset] = useState(false);
  const [newHashtagInput, setNewHashtagInput] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setCurrencySearch('');
    setIsEditingBalance(false);
    setBalanceInput(startingBalance.toString());
    setIsConfirmingReset(false);
    setNewHashtagInput('');
  }, [isOpen, startingBalance]);

  useEffect(() => {
    if (!isOpen) return;
    backButton.show();
    backButton.onClick(onClose);
    return () => {
      backButton.offClick(onClose);
      backButton.hide();
    };
  }, [isOpen, backButton, onClose]);

  const filteredCurrencies = SUPPORTED_CURRENCIES.filter(
    (config) =>
      config.code.toLowerCase().includes(currencySearch.toLowerCase()) ||
      config.name.toLowerCase().includes(currencySearch.toLowerCase()) ||
      config.symbol.includes(currencySearch),
  );

  const handleSaveBalance = async () => {
    const parsed = parseFloat(balanceInput);
    if (Number.isNaN(parsed)) {
      haptic.notification('error');
      showToast(t('enter_amount'), 'error');
      return;
    }
    haptic.notification('success');
    await setStartingBalance(parsed);
    setIsEditingBalance(false);
    showToast(t('balance_updated'), 'success');
  };

  const handleAddHashtag = async (event: React.FormEvent) => {
    event.preventDefault();
    const clean = newHashtagInput.trim().replace(/^#/, '');
    if (!clean) return;
    haptic.notification('success');
    await addHashtagSuggestion(clean);
    setNewHashtagInput('');
  };

  const handleRemoveHashtag = async (tag: string) => {
    haptic.impact('light');
    await removeHashtagSuggestion(tag);
  };

  const handleExportCSV = () => {
    haptic.notification('success');
    exportTransactionsToCSV(transactions, categories, currency);
  };

  const handleExportJSON = () => {
    haptic.notification('success');
    exportDataToJSON(transactions, categories, startingBalance, currency);
  };

  const handleReset = async () => {
    if (!isConfirmingReset) {
      haptic.notification('warning');
      setIsConfirmingReset(true);
      return;
    }

    haptic.impact('heavy');

    // Keep an explicit empty array so the demo seed does not return on reload
    localStorage.setItem('vault_transactions', '[]');
    localStorage.setItem('vault_hashtags', '[]');
    localStorage.removeItem('vault_categories');

    useTransactionStore.setState({ transactions: [], hashtagSuggestions: [] });
    useCategoryStore.setState({ categories: INITIAL_CATEGORIES });
    resetPlan();

    try {
      await wipeData();
    } catch {
      await setStartingBalance(0);
    }

    setIsConfirmingReset(false);
    showToast(t('reset_done'), 'success');
    onClose();
  };

  return (
    <Sheet
      open={isOpen}
      onClose={onClose}
      title={t('settings_preferences')}
      subtitle={t('app_subtitle')}
      zIndex={75}
    >
      <div className="space-y-3.5 pb-3">
        {/* Profile */}
        <Surface className="flex items-center gap-3.5 p-4">
          <div className="h-12 w-12 shrink-0 rounded-2xl bg-gradient-to-br from-accent via-accent-2 to-mint p-[1.5px]">
            <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-[14px] bg-panel-solid">
              {user.photo_url ? (
                <img src={user.photo_url} alt={user.first_name} className="h-full w-full object-cover" />
              ) : (
                <span className="font-display text-base font-semibold text-ink">
                  {user.first_name?.[0] || 'V'}
                </span>
              )}
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="truncate text-sm font-bold text-ink">
                {user.first_name} {user.last_name || ''}
              </span>
              {isInsideTelegram && (
                <span className="shrink-0 rounded-full border border-line bg-mint-soft px-1.5 py-0.5 text-[9px] font-bold text-mint">
                  {t('verified')}
                </span>
              )}
            </div>
            <div className="mt-0.5 truncate text-[10px] font-medium text-muted">
              {user.username ? `@${user.username}` : `ID: ${user.id}`}
            </div>
          </div>
          <div className="shrink-0 text-right">
            <div className="font-num text-[12px] font-semibold text-ink">
              {formatAmount(startingBalance)}
            </div>
            <div className="text-[9px] font-medium text-faint">{t('starting_balance')}</div>
          </div>
        </Surface>

        {/* Language */}
        <Surface tone="inset" className="space-y-2.5 p-3.5">
          <SectionTitle
            icon={<Languages size={15} />}
            title={t('language')}
            subtitle={t('language_description')}
            iconClass="bg-accent-soft text-accent"
          />
          <div className="grid grid-cols-2 gap-2">
            {([
              { id: 'en' as const, flag: '🇬🇧', label: 'English', short: 'EN' },
              { id: 'ru' as const, flag: '🇷🇺', label: 'Русский', short: 'RU' },
            ]).map((option) => {
              const active = language === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    haptic.selection();
                    void setLanguage(option.id);
                  }}
                  className={`pressable flex items-center justify-between gap-2 rounded-2xl border px-3 py-2.5 text-left transition-colors ${
                    active
                      ? 'border-accent bg-accent-soft'
                      : 'border-line bg-panel-solid'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="text-sm">{option.flag}</span>
                    <span>
                      <span className={`block text-[11px] font-bold ${active ? 'text-accent' : 'text-ink'}`}>
                        {option.label}
                      </span>
                      <span className="block text-[9px] font-medium text-faint">{option.short}</span>
                    </span>
                  </span>
                  {active && <Check size={13} className="shrink-0 text-accent" />}
                </button>
              );
            })}
          </div>
        </Surface>

        {/* Appearance */}
        <Surface tone="inset" className="space-y-2.5 p-3.5">
          <SectionTitle
            icon={<Sun size={15} />}
            title={t('appearance')}
            subtitle={t('theme_liquid')}
            iconClass="bg-gold-soft text-gold"
          />
          <Segmented
            value={themeMode}
            onChange={(value) => {
              haptic.selection();
              setThemeMode(value);
            }}
            options={[
              { value: 'dark', label: t('dark'), icon: <Moon size={12} /> },
              { value: 'light', label: t('light'), icon: <Sun size={12} /> },
              { value: 'system', label: t('system'), icon: <Smartphone size={12} /> },
            ]}
            size="sm"
            ariaLabel={t('theme')}
          />
        </Surface>

        {/* Currency */}
        <Surface tone="inset" className="space-y-2.5 p-3.5">
          <SectionTitle
            icon={<Coins size={15} />}
            title={t('active_currency')}
            subtitle={t('currency_description')}
            iconClass="bg-mint-soft text-mint"
          />

          <div className="relative">
            <Search
              size={13}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint"
            />
            <input
              type="text"
              value={currencySearch}
              onChange={(event) => setCurrencySearch(event.target.value)}
              placeholder={t('search_currency_placeholder')}
              className="h-9 w-full rounded-xl border border-line bg-panel-solid pl-8 pr-3 text-[11px] font-medium text-ink placeholder:text-faint outline-none focus:border-accent"
            />
          </div>

          <div className="no-scrollbar grid max-h-52 grid-cols-2 gap-1.5 overflow-y-auto">
            {filteredCurrencies.map((config) => {
              const active = currency === config.code;
              return (
                <button
                  key={config.code}
                  type="button"
                  onClick={() => {
                    haptic.selection();
                    void setCurrency(config.code);
                  }}
                  className={`pressable flex items-center justify-between gap-1.5 rounded-xl border px-2.5 py-2 text-left transition-colors ${
                    active
                      ? 'border-accent bg-accent-soft'
                      : 'border-line bg-panel-solid'
                  }`}
                >
                  <span className="flex min-w-0 items-center gap-1.5">
                    <span className="text-[13px]">{config.flag}</span>
                    <span className="min-w-0">
                      <span className={`block text-[10px] font-bold ${active ? 'text-accent' : 'text-ink'}`}>
                        {config.code}
                      </span>
                      <span className="block truncate text-[9px] text-faint">{config.name}</span>
                    </span>
                  </span>
                  {active && <Check size={12} className="shrink-0 text-accent" />}
                </button>
              );
            })}
            {filteredCurrencies.length === 0 && (
              <div className="col-span-2 py-3 text-center text-[10px] text-faint">
                {t('no_results')}
              </div>
            )}
          </div>
        </Surface>

        {/* Starting balance */}
        <Surface tone="inset" className="space-y-2.5 p-3.5">
          <div className="flex items-center justify-between gap-3">
            <SectionTitle
              icon={<Wallet size={15} />}
              title={t('starting_balance')}
              subtitle={t('baseline_desc')}
              iconClass="bg-gold-soft text-gold"
            />
            <button
              type="button"
              onClick={() => {
                haptic.selection();
                if (isEditingBalance) {
                  void handleSaveBalance();
                } else {
                  setBalanceInput(startingBalance.toString());
                  setIsEditingBalance(true);
                }
              }}
              className={`pressable shrink-0 rounded-full px-3 py-1.5 text-[10px] font-bold ${
                isEditingBalance
                  ? 'bg-accent text-white'
                  : 'bg-panel-solid text-accent'
              }`}
            >
              {isEditingBalance ? t('save') : t('edit')}
            </button>
          </div>

          <AnimatePresence initial={false}>
            {isEditingBalance ? (
              <motion.div
                key="input"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="flex items-center gap-2"
              >
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-faint">
                    {useSettingsStore.getState().currencyConfig.symbol}
                  </span>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={balanceInput}
                    onChange={(event) => setBalanceInput(event.target.value)}
                    className="h-10 w-full rounded-xl border border-line bg-panel-solid pl-8 pr-3 text-[13px] font-semibold text-ink outline-none focus:border-accent"
                    autoFocus
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditingBalance(false)}
                  className="pressable flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-panel-solid text-muted"
                  aria-label={t('cancel')}
                >
                  <X size={14} />
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="value"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="font-num text-[20px] font-semibold text-ink"
              >
                {formatAmount(startingBalance)}
              </motion.div>
            )}
          </AnimatePresence>
        </Surface>

        {/* Categories */}
        <button
          type="button"
          onClick={() => {
            haptic.impact('light');
            onClose();
            openManageCategories();
          }}
          className="pressable flex w-full items-center justify-between gap-3 rounded-[20px] border border-line bg-panel-inset p-3.5 text-left"
        >
          <SectionTitle
            icon={<FolderTree size={15} />}
            title={t('category_management')}
            subtitle={formatCategoryCount(categories.length, language)}
            iconClass="bg-accent-soft text-accent"
          />
          <span className="shrink-0 text-[10px] font-bold text-accent">{t('configure')}</span>
        </button>

        {/* Hashtags */}
        <Surface tone="inset" className="space-y-2.5 p-3.5">
          <SectionTitle
            icon={<Hash size={15} />}
            title={t('suggested_hashtags')}
            subtitle={t('suggested_hashtags_sub')}
            iconClass="bg-accent-soft text-accent"
          />

          <form onSubmit={handleAddHashtag} className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-faint">
                #
              </span>
              <input
                type="text"
                value={newHashtagInput}
                onChange={(event) => setNewHashtagInput(event.target.value)}
                placeholder={t('new_tag_placeholder')}
                className="h-9 w-full rounded-xl border border-line bg-panel-solid pl-7 pr-3 text-[11px] font-medium text-ink placeholder:text-faint outline-none focus:border-accent"
              />
            </div>
            <button
              type="submit"
              disabled={!newHashtagInput.trim()}
              className="pressable flex h-9 items-center gap-1 rounded-xl bg-accent px-3 text-[10px] font-bold text-white disabled:opacity-40"
            >
              <Plus size={12} />
              {t('add')}
            </button>
          </form>

          <div className="no-scrollbar flex max-h-32 flex-wrap gap-1.5 overflow-y-auto">
            {hashtagSuggestions.length === 0 ? (
              <span className="py-1 text-[10px] italic text-faint">{t('no_tags_yet')}</span>
            ) : (
              hashtagSuggestions.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-full border border-line bg-panel-solid px-2.5 py-1 text-[10px] font-semibold text-ink-soft"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => void handleRemoveHashtag(tag)}
                    aria-label={`Remove #${tag}`}
                    className="pressable flex h-4 w-4 items-center justify-center rounded-full text-faint hover:text-coral"
                  >
                    <X size={10} />
                  </button>
                </span>
              ))
            )}
          </div>
        </Surface>

        {/* Export */}
        <Surface tone="inset" className="space-y-2.5 p-3.5">
          <SectionTitle
            icon={<Download size={15} />}
            title={t('export_backup')}
            subtitle={t('export_sub')}
            iconClass="bg-mint-soft text-mint"
          />
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleExportCSV}
              className="pressable flex items-center justify-center gap-1.5 rounded-xl border border-line bg-panel-solid py-2.5 text-[10px] font-bold text-ink"
            >
              <FileSpreadsheet size={13} className="text-mint" />
              {t('export_csv')}
            </button>
            <button
              type="button"
              onClick={handleExportJSON}
              className="pressable flex items-center justify-center gap-1.5 rounded-xl border border-line bg-panel-solid py-2.5 text-[10px] font-bold text-ink"
            >
              <Download size={13} className="text-accent" />
              {t('export_json')}
            </button>
          </div>
        </Surface>

        {/* Danger zone */}
        <Surface tone="inset" className="space-y-2.5 p-3.5">
          <SectionTitle
            icon={<AlertTriangle size={15} />}
            title={t('danger_zone')}
            subtitle={t('danger_sub')}
            iconClass="bg-coral-soft text-coral"
          />

          <AnimatePresence initial={false}>
            {isConfirmingReset && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="rounded-xl border border-line bg-coral-soft p-3">
                  <div className="text-[11px] font-bold text-coral">{t('reset_modal_title')}</div>
                  <p className="mt-1 text-[10px] leading-relaxed text-muted">
                    {t('reset_modal_desc')}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex gap-2">
            {isConfirmingReset && (
              <button
                type="button"
                onClick={() => setIsConfirmingReset(false)}
                className="pressable flex-1 rounded-xl border border-line bg-panel-solid py-2.5 text-[10px] font-bold text-muted"
              >
                {t('cancel')}
              </button>
            )}
            <button
              type="button"
              onClick={() => void handleReset()}
              className={`pressable flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-[10px] font-bold ${
                isConfirmingReset
                  ? 'bg-coral text-white'
                  : 'border border-line bg-panel-solid text-coral'
              }`}
            >
              <Trash2 size={12} />
              {isConfirmingReset ? t('reset_confirm_btn') : t('reset_data_btn')}
            </button>
          </div>
        </Surface>

        <p className="pt-1 text-center text-[9px] font-semibold uppercase tracking-[0.16em] text-faint">
          {t('build_version')}
        </p>
      </div>
    </Sheet>
  );
};
