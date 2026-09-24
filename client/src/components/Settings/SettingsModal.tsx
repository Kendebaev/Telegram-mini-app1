import React, { useState, useEffect } from 'react';
import {
  X,
  Moon,
  Sun,
  Smartphone,
  Coins,
  Download,
  FileSpreadsheet,
  FolderTree,
  Wallet,
  Check,
  Search,
  AlertTriangle,
  Trash2,
  Hash,
  Plus,
  Languages,
} from 'lucide-react';
import { useTelegram } from '../../context/TelegramContext';
import { useSettingsStore, SUPPORTED_CURRENCIES, useTranslation } from '../../stores/settingsStore';
import { useTransactionStore } from '../../stores/transactionStore';
import { useCategoryStore } from '../../stores/categoryStore';
import { useUIStore } from '../../stores/uiStore';
import { exportTransactionsToCSV, exportDataToJSON } from '../../utils/export';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { themeMode, setThemeMode, user, isInsideTelegram, haptic, backButton } = useTelegram();
  const {
    currency,
    setCurrency,
    startingBalance,
    setStartingBalance,
    wipeData,
    formatAmount,
  } = useSettingsStore();
  const { t, language, setLanguage } = useTranslation();
  const {
    transactions,
    hashtagSuggestions,
    addHashtagSuggestion,
    removeHashtagSuggestion,
  } = useTransactionStore();
  const { categories } = useCategoryStore();
  const { openManageCategories } = useUIStore();

  const [currencySearch, setCurrencySearch] = useState('');
  const [isEditingBalance, setIsEditingBalance] = useState(false);
  const [balanceInput, setBalanceInput] = useState(startingBalance.toString());
  const [isConfirmingWipe, setIsConfirmingWipe] = useState(false);
  const [newHashtagInput, setNewHashtagInput] = useState('');

  const handleAddHashtag = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
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

  // Bind Telegram native BackButton
  useEffect(() => {
    if (isOpen) {
      backButton.show();
      backButton.onClick(onClose);
      return () => {
        backButton.offClick(onClose);
        backButton.hide();
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredCurrencies = SUPPORTED_CURRENCIES.filter(
    (c) =>
      c.code.toLowerCase().includes(currencySearch.toLowerCase()) ||
      c.name.toLowerCase().includes(currencySearch.toLowerCase()) ||
      c.symbol.includes(currencySearch)
  );

  const handleSaveBalance = async () => {
    const parsed = parseFloat(balanceInput);
    if (isNaN(parsed)) return;
    haptic.notification('success');
    await setStartingBalance(parsed);
    setIsEditingBalance(false);
  };

  const handleExportCSV = () => {
    haptic.notification('success');
    exportTransactionsToCSV(transactions, categories, currency);
  };

  const handleExportJSON = () => {
    haptic.notification('success');
    exportDataToJSON(transactions, categories, startingBalance, currency);
  };

  const handleConfirmWipe = async () => {
    haptic.impact('heavy');
    await wipeData();
    setIsConfirmingWipe(false);
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#F4F6F9] dark:bg-[#080A0F] rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-white/[0.12] overflow-hidden flex flex-col max-h-[88vh] safe-bottom animate-in slide-in-from-bottom duration-250 transition-colors">
        {/* Modal Header */}
        <div className="p-4 px-5 border-b border-slate-200/80 dark:border-white/[0.08] flex items-center justify-between bg-white/70 dark:bg-white/[0.02]">
          <div className="flex items-center space-x-2">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white tracking-tight">
              {t('settings_preferences')}
            </h3>
          </div>
          <button
            type="button"
            onClick={() => {
              haptic.impact('light');
              onClose();
            }}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-200/70 dark:bg-white/[0.06] active:scale-90 transition-all"
          >
            <X size={17} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto no-scrollbar space-y-4">
          {/* User Profile Summary */}
          <div className="p-4 rounded-2.5xl bg-white/80 dark:bg-zinc-900/60 backdrop-blur-xl border border-slate-200/80 dark:border-white/[0.08] flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-[1.5px] shadow-sm flex-shrink-0">
              <div className="w-full h-full rounded-[14px] bg-white dark:bg-[#0D1322] flex items-center justify-center overflow-hidden">
                {user.photo_url ? (
                  <img src={user.photo_url} alt={user.first_name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-base font-bold text-slate-800 dark:text-white">
                    {user.first_name?.[0] || 'V'}
                  </span>
                )}
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center space-x-1.5">
                <span className="font-bold text-sm text-slate-900 dark:text-white truncate">
                  {user.first_name} {user.last_name || ''}
                </span>
                {isInsideTelegram && (
                  <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[10px] font-semibold border border-emerald-500/20">
                    {t('verified')}
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-400 dark:text-zinc-500 truncate mt-0.5">
                {user.username ? `@${user.username}` : `ID: ${user.id}`}
              </div>
            </div>
          </div>

          {/* Section 0: Bilingual Language Selector */}
          <div className="p-4 rounded-2.5xl bg-white/80 dark:bg-zinc-900/60 backdrop-blur-xl border border-slate-200/80 dark:border-white/[0.08] space-y-3">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Languages size={15} />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white block">{t('language')}</span>
                <span className="text-[10px] text-slate-400 dark:text-zinc-500">{t('language_description')}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-0.5">
              <button
                type="button"
                onClick={async () => {
                  haptic.selection();
                  await setLanguage('en');
                }}
                className={`p-2.5 rounded-2xl border text-left flex items-center justify-between transition-all active:scale-95 ${
                  language === 'en'
                    ? 'bg-indigo-50 dark:bg-indigo-600/30 border-indigo-400 text-indigo-900 dark:text-white shadow-2xs'
                    : 'bg-white/60 dark:bg-white/[0.02] border-slate-200/80 dark:border-white/[0.06] text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm">🇬🇧</span>
                  <div>
                    <span className="text-xs font-bold block">English</span>
                    <span className="text-[9px] text-slate-400">EN</span>
                  </div>
                </div>
                {language === 'en' && <Check size={13} className="text-indigo-600 dark:text-indigo-400 shrink-0" />}
              </button>

              <button
                type="button"
                onClick={async () => {
                  haptic.selection();
                  await setLanguage('ru');
                }}
                className={`p-2.5 rounded-2xl border text-left flex items-center justify-between transition-all active:scale-95 ${
                  language === 'ru'
                    ? 'bg-indigo-50 dark:bg-indigo-600/30 border-indigo-400 text-indigo-900 dark:text-white shadow-2xs'
                    : 'bg-white/60 dark:bg-white/[0.02] border-slate-200/80 dark:border-white/[0.06] text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm">🇷🇺</span>
                  <div>
                    <span className="text-xs font-bold block">Русский</span>
                    <span className="text-[9px] text-slate-400">RU</span>
                  </div>
                </div>
                {language === 'ru' && <Check size={13} className="text-indigo-600 dark:text-indigo-400 shrink-0" />}
              </button>
            </div>
          </div>

          {/* Section 1: Appearance / Theme Switcher */}
          <div className="p-4 rounded-2.5xl bg-white/80 dark:bg-zinc-900/60 backdrop-blur-xl border border-slate-200/80 dark:border-white/[0.08] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                {t('appearance')}
              </span>
              <span className="text-[11px] text-slate-400 dark:text-zinc-500">{t('theme_liquid')}</span>
            </div>

            <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-slate-100/90 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/[0.06]">
              <button
                type="button"
                onClick={() => {
                  haptic.selection();
                  setThemeMode('dark');
                }}
                className={`py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  themeMode === 'dark'
                    ? 'bg-slate-900 text-white dark:bg-white/15 dark:text-white shadow-xs'
                    : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Moon size={13} />
                <span>{t('dark')}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  haptic.selection();
                  setThemeMode('light');
                }}
                className={`py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  themeMode === 'light'
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                    : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Sun size={13} />
                <span>{t('light')}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  haptic.selection();
                  setThemeMode('system');
                }}
                className={`py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  themeMode === 'system'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Smartphone size={13} />
                <span>{t('system')}</span>
              </button>
            </div>
          </div>

          {/* Section 2: Active Currency Selection */}
          <div className="p-4 rounded-2.5xl bg-white/80 dark:bg-zinc-900/60 backdrop-blur-xl border border-slate-200/80 dark:border-white/[0.08] space-y-3">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Coins size={15} />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white block">{t('active_currency')}</span>
                <span className="text-[10px] text-slate-400 dark:text-zinc-500">{t('currency_description')}</span>
              </div>
            </div>

            {/* Currency Search Input */}
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
              <input
                type="text"
                value={currencySearch}
                onChange={(e) => setCurrencySearch(e.target.value)}
                placeholder={t('search_currency_placeholder')}
                className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-100/80 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/[0.06] text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Currency Grid */}
            <div className="grid grid-cols-3 gap-2 max-h-44 overflow-y-auto no-scrollbar pt-1">
              {filteredCurrencies.map((cur) => {
                const isSelected = currency === cur.code;
                return (
                  <button
                    key={cur.code}
                    type="button"
                    onClick={async () => {
                      haptic.selection();
                      await setCurrency(cur.code);
                    }}
                    className={`p-2 rounded-xl border text-left flex items-center justify-between transition-all active:scale-95 ${
                      isSelected
                        ? 'bg-indigo-50 dark:bg-indigo-600/30 border-indigo-400 text-indigo-900 dark:text-white shadow-2xs'
                        : 'bg-white/60 dark:bg-white/[0.02] border-slate-200/80 dark:border-white/[0.06] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.06]'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold flex items-center gap-1">
                        <span>{cur.flag}</span>
                        <span>{cur.code}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 dark:text-zinc-500 truncate block">
                        {cur.symbol} • {cur.name}
                      </span>
                    </div>
                    {isSelected && <Check size={13} className="text-indigo-600 dark:text-indigo-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: Category Management */}
          <div
            onClick={() => {
              haptic.impact('light');
              onClose();
              openManageCategories();
            }}
            className="p-4 rounded-2.5xl bg-white/80 dark:bg-zinc-900/60 backdrop-blur-xl border border-slate-200/80 dark:border-white/[0.08] flex items-center justify-between cursor-pointer active:scale-[0.985] transition-all hover:border-slate-300 dark:hover:border-white/20"
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
                <FolderTree size={16} />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white block">{t('category_management')}</span>
                <span className="text-[11px] text-slate-400 dark:text-zinc-500">
                  {categories.length} {t('categories').toLowerCase()}
                </span>
              </div>
            </div>
            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">{t('configure')}</span>
          </div>

          {/* Section 4: Suggested Hashtags Management */}
          <div className="p-4 rounded-2.5xl bg-white/80 dark:bg-zinc-900/60 backdrop-blur-xl border border-slate-200/80 dark:border-white/[0.08] space-y-3">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-xl bg-violet-500/15 text-violet-600 dark:text-violet-400 flex items-center justify-center">
                <Hash size={15} />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white block">{t('suggested_hashtags')}</span>
                <span className="text-[10px] text-slate-400 dark:text-zinc-500">{t('suggested_hashtags_sub')}</span>
              </div>
            </div>

            {/* Add Hashtag Form */}
            <form onSubmit={handleAddHashtag} className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500 text-xs font-bold">#</span>
                <input
                  type="text"
                  value={newHashtagInput}
                  onChange={(e) => setNewHashtagInput(e.target.value)}
                  placeholder={t('new_tag_placeholder')}
                  className="w-full pl-7 pr-3 py-2 rounded-xl bg-slate-100/80 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/[0.06] text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <button
                type="submit"
                disabled={!newHashtagInput.trim()}
                className="py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold flex items-center gap-1 active:scale-95 transition-all shadow-xs"
              >
                <Plus size={13} />
                <span>{t('add')}</span>
              </button>
            </form>

            {/* Hashtag Badges */}
            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto no-scrollbar pt-1">
              {hashtagSuggestions.length === 0 ? (
                <span className="text-[11px] text-slate-400 dark:text-zinc-500 italic py-1">{t('no_tags_yet')}</span>
              ) : (
                hashtagSuggestions.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100/90 dark:bg-white/[0.06] border border-slate-200/80 dark:border-white/[0.08] text-[11px] font-semibold text-slate-700 dark:text-zinc-300 group transition-all"
                  >
                    <span>#{tag}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveHashtag(tag)}
                      aria-label={`Remove #${tag}`}
                      className="w-4 h-4 rounded-full flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 active:scale-90 transition-colors ml-0.5"
                    >
                      <X size={10} />
                    </button>
                  </span>
                ))
              )}
            </div>
          </div>

          {/* Section 5: Data Management & Export */}
          <div className="p-4 rounded-2.5xl bg-white/80 dark:bg-zinc-900/60 backdrop-blur-xl border border-slate-200/80 dark:border-white/[0.08] space-y-3">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Download size={15} />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white block">{t('export_backup')}</span>
                <span className="text-[10px] text-slate-400 dark:text-zinc-500">{t('export_sub')}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleExportCSV}
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl bg-white dark:bg-white/[0.04] hover:bg-slate-50 dark:hover:bg-white/[0.08] text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-white/[0.08] active:scale-95 transition-all text-xs font-semibold shadow-2xs"
              >
                <FileSpreadsheet size={15} className="text-emerald-600 dark:text-emerald-400" />
                <span>{t('export_csv')}</span>
              </button>

              <button
                type="button"
                onClick={handleExportJSON}
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl bg-white dark:bg-white/[0.04] hover:bg-slate-50 dark:hover:bg-white/[0.08] text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-white/[0.08] active:scale-95 transition-all text-xs font-semibold shadow-2xs"
              >
                <Download size={15} className="text-indigo-600 dark:text-indigo-400" />
                <span>{t('export_json')}</span>
              </button>
            </div>
          </div>

          {/* Section 6: Starting Balance Editor */}
          <div className="p-4 rounded-2.5xl bg-white/80 dark:bg-zinc-900/60 backdrop-blur-xl border border-slate-200/80 dark:border-white/[0.08] space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Wallet size={15} />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">{t('starting_balance')}</span>
                  <span className="text-[10px] text-slate-400 dark:text-zinc-500">{t('baseline_desc')}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  haptic.impact('light');
                  setIsEditingBalance(!isEditingBalance);
                  setBalanceInput(startingBalance.toString());
                }}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                {isEditingBalance ? t('cancel') : t('edit')}
              </button>
            </div>

            {isEditingBalance ? (
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="number"
                  step="0.01"
                  value={balanceInput}
                  onChange={(e) => setBalanceInput(e.target.value)}
                  placeholder="0.00"
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-100 dark:bg-white/[0.06] border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleSaveBalance}
                  className="py-2 px-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold active:scale-95 shadow-xs"
                >
                  {t('save')}
                </button>
              </div>
            ) : (
              <div className="text-xl font-extrabold text-slate-900 dark:text-white tabular-nums tracking-tight pt-0.5">
                {formatAmount(startingBalance)}
              </div>
            )}
          </div>

          {/* Section 7: Danger Zone */}
          <div className="p-4 rounded-2.5xl bg-rose-500/[0.05] border border-rose-500/20 space-y-2">
            <div className="flex items-center space-x-1.5 text-rose-600 dark:text-rose-400">
              <AlertTriangle size={14} />
              <span className="text-[11px] font-bold uppercase tracking-wider">{t('danger_zone')}</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-zinc-400 leading-relaxed">
              {t('danger_sub')}
            </p>
            <button
              type="button"
              onClick={() => {
                haptic.notification('warning');
                setIsConfirmingWipe(true);
              }}
              className="w-full py-2.5 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30 active:scale-98 transition-all text-xs font-bold flex items-center justify-center gap-1.5"
            >
              <Trash2 size={13} />
              <span>{t('reset_data_btn')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Wipe Confirmation Dialog */}
      {isConfirmingWipe && (
        <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-xs w-full p-5 rounded-3xl bg-white dark:bg-[#0D1322] border border-rose-500/40 shadow-2xl space-y-3">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <AlertTriangle className="text-rose-500" size={17} />
              <span>{t('reset_modal_title')}</span>
            </h4>
            <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
              {t('reset_modal_desc')}
            </p>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmingWipe(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-white/[0.08] text-slate-700 dark:text-slate-300 text-xs font-semibold"
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                onClick={handleConfirmWipe}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-md shadow-rose-600/30"
              >
                {t('reset_confirm_btn')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
