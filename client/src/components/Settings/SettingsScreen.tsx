import React, { useState } from 'react';
import {
  Coins,
  Download,
  FileSpreadsheet,
  Trash2,
  Smartphone,
  Wallet,
  Check,
  AlertTriangle,
  FolderTree,
  Hash,
  Plus,
  X,
  Languages,
} from 'lucide-react';
import { useSettingsStore, SUPPORTED_CURRENCIES, useTranslation } from '../../stores/settingsStore';
import { useTransactionStore } from '../../stores/transactionStore';
import { useCategoryStore } from '../../stores/categoryStore';
import { useUIStore } from '../../stores/uiStore';
import { useTelegram } from '../../context/TelegramContext';
import { GlassCard } from '../glass/GlassCard';
import { exportTransactionsToCSV, exportDataToJSON } from '../../utils/export';

export const SettingsScreen: React.FC = () => {
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
  const { user, isInsideTelegram, haptic } = useTelegram();

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

  const handleSaveBalance = async () => {
    const parsed = parseFloat(balanceInput);
    if (isNaN(parsed)) return;
    haptic.notification('success');
    await setStartingBalance(parsed);
    setIsEditingBalance(false);
  };

  const handleCurrencyChange = async (code: string) => {
    haptic.selection();
    await setCurrency(code);
  };

  const handleLanguageChange = async (lang: 'en' | 'ru') => {
    haptic.selection();
    await setLanguage(lang);
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
    <div className="space-y-4 pb-28 max-w-md mx-auto animate-in fade-in duration-200">
      <div className="px-1 flex items-center justify-between">
        <h2 className="text-base font-extrabold text-white tracking-tight">{t('settings_preferences')}</h2>
      </div>

      {/* 1. Telegram Profile Card */}
      <GlassCard className="p-4 rounded-3xl">
        <div className="flex items-center space-x-3.5">
          <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-[1.5px] shadow-md flex-shrink-0">
            <div className="w-full h-full rounded-[14px] bg-[#0D1322] flex items-center justify-center overflow-hidden">
              {user.photo_url ? (
                <img src={user.photo_url} alt={user.first_name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-base font-bold text-white">
                  {user.first_name?.[0] || 'V'}
                  {user.last_name?.[0] || ''}
                </span>
              )}
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-sm text-white truncate">
                {user.first_name} {user.last_name || ''}
              </span>
              {isInsideTelegram && (
                <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-semibold border border-emerald-500/30">
                  {t('telegram_verified')}
                </span>
              )}
            </div>

            <div className="text-xs text-slate-400 truncate mt-0.5">
              {user.username ? `@${user.username}` : `ID: ${user.id}`}
            </div>
          </div>
        </div>

        <div className="mt-3.5 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <Smartphone size={13} className="text-indigo-400" />
            <span>Vault Pro</span>
          </span>
          <span className="text-[11px] font-mono text-slate-500">{t('build_version')}</span>
        </div>
      </GlassCard>

      {/* 2. Bilingual Language Selector */}
      <GlassCard className="p-4 rounded-3xl space-y-3">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center border border-blue-500/25">
            <Languages size={16} />
          </div>
          <div>
            <span className="text-xs font-bold text-white block">{t('language')}</span>
            <span className="text-[11px] text-slate-400">{t('language_description')}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={() => handleLanguageChange('en')}
            className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all active:scale-95 ${
              language === 'en'
                ? 'bg-indigo-600/30 border-indigo-400 text-white shadow-xs'
                : 'bg-white/[0.03] border-white/[0.06] text-slate-300 hover:bg-white/[0.06]'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-base">🇬🇧</span>
              <div>
                <span className="text-xs font-bold block text-white">English</span>
                <span className="text-[10px] text-slate-400">EN</span>
              </div>
            </div>
            {language === 'en' && <Check size={14} className="text-indigo-400 shrink-0" />}
          </button>

          <button
            type="button"
            onClick={() => handleLanguageChange('ru')}
            className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all active:scale-95 ${
              language === 'ru'
                ? 'bg-indigo-600/30 border-indigo-400 text-white shadow-xs'
                : 'bg-white/[0.03] border-white/[0.06] text-slate-300 hover:bg-white/[0.06]'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-base">🇷🇺</span>
              <div>
                <span className="text-xs font-bold block text-white">Русский</span>
                <span className="text-[10px] text-slate-400">RU</span>
              </div>
            </div>
            {language === 'ru' && <Check size={14} className="text-indigo-400 shrink-0" />}
          </button>
        </div>
      </GlassCard>

      {/* 3. Starting Balance Editor */}
      <GlassCard className="p-4 rounded-3xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center border border-indigo-500/25">
              <Wallet size={16} />
            </div>
            <div>
              <span className="text-xs font-bold text-white block">{t('starting_balance')}</span>
              <span className="text-[11px] text-slate-400">{t('baseline_desc')}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              haptic.impact('light');
              setIsEditingBalance(!isEditingBalance);
              setBalanceInput(startingBalance.toString());
            }}
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 active:scale-95 transition-all"
          >
            {isEditingBalance ? t('cancel') : t('edit')}
          </button>
        </div>

        {isEditingBalance ? (
          <div className="pt-2 flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="number"
                step="0.01"
                value={balanceInput}
                onChange={(e) => setBalanceInput(e.target.value)}
                placeholder="0.00"
                className="w-full px-3.5 py-2 rounded-xl glass-input text-sm font-bold"
                autoFocus
              />
            </div>
            <button
              type="button"
              onClick={handleSaveBalance}
              className="py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/30 active:scale-95 transition-all"
            >
              {t('save')}
            </button>
          </div>
        ) : (
          <div className="pt-1 text-2xl font-extrabold text-white tabular-nums tracking-tight">
            {formatAmount(startingBalance)}
          </div>
        )}
      </GlassCard>

      {/* 4. Category Management Link */}
      <GlassCard
        interactive
        onClick={() => {
          haptic.impact('light');
          openManageCategories();
        }}
        className="p-4 rounded-3xl flex items-center justify-between"
      >
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center border border-cyan-500/25">
            <FolderTree size={16} />
          </div>
          <div>
            <span className="text-xs font-bold text-white block">{t('category_management')}</span>
            <span className="text-[11px] text-slate-400">
              {categories.length} {t('categories').toLowerCase()}
            </span>
          </div>
        </div>
        <span className="text-xs font-semibold text-indigo-400">{t('edit')}</span>
      </GlassCard>

      {/* 5. Suggested Hashtags */}
      <GlassCard className="p-4 rounded-3xl space-y-3">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-xl bg-violet-500/15 text-violet-400 flex items-center justify-center border border-violet-500/25">
            <Hash size={16} />
          </div>
          <div>
            <span className="text-xs font-bold text-white block">{t('suggested_hashtags')}</span>
            <span className="text-[11px] text-slate-400">{t('suggested_hashtags_sub')}</span>
          </div>
        </div>

        {/* Add Hashtag Form */}
        <form onSubmit={handleAddHashtag} className="flex gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">#</span>
            <input
              type="text"
              value={newHashtagInput}
              onChange={(e) => setNewHashtagInput(e.target.value)}
              placeholder={t('new_tag_placeholder')}
              className="w-full pl-7 pr-3 py-2 rounded-xl glass-input text-xs text-white placeholder:text-slate-500 focus:outline-none"
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
            <span className="text-[11px] text-slate-500 italic py-1">{t('no_tags_yet')}</span>
          ) : (
            hashtagSuggestions.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/[0.06] border border-white/[0.08] text-[11px] font-semibold text-zinc-300 group transition-all"
              >
                <span>#{tag}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveHashtag(tag)}
                  aria-label={`Remove #${tag}`}
                  className="w-4 h-4 rounded-full flex items-center justify-center text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 active:scale-90 transition-colors ml-0.5"
                >
                  <X size={10} />
                </button>
              </span>
            ))
          )}
        </div>
      </GlassCard>

      {/* 6. Currency Selector */}
      <GlassCard className="p-4 rounded-3xl space-y-3">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center border border-amber-500/25">
            <Coins size={16} />
          </div>
          <div>
            <span className="text-xs font-bold text-white block">{t('display_currency')}</span>
            <span className="text-[11px] text-slate-400">{t('currency_description')}</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 pt-1">
          {SUPPORTED_CURRENCIES.map((cur) => {
            const isSelected = currency === cur.code;
            return (
              <button
                key={cur.code}
                type="button"
                onClick={() => handleCurrencyChange(cur.code)}
                className={`p-2 rounded-2xl border text-left flex items-center justify-between transition-all active:scale-95 ${
                  isSelected
                    ? 'bg-indigo-600/30 border-indigo-400 text-white shadow-xs'
                    : 'bg-white/[0.03] border-white/[0.06] text-slate-300 hover:bg-white/[0.06]'
                }`}
              >
                <div>
                  <div className="text-xs font-bold flex items-center gap-1">
                    <span>{cur.flag}</span>
                    <span>{cur.code}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 truncate block">{cur.name}</span>
                </div>
                {isSelected && <Check size={14} className="text-indigo-400 shrink-0" />}
              </button>
            );
          })}
        </div>
      </GlassCard>

      {/* 7. Data Export */}
      <GlassCard className="p-4 rounded-3xl space-y-3">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center border border-emerald-500/25">
            <Download size={16} />
          </div>
          <div>
            <span className="text-xs font-bold text-white block">{t('export_backup')}</span>
            <span className="text-[11px] text-slate-400">{t('export_sub')}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 border border-white/[0.08] active:scale-95 transition-all text-xs font-semibold"
          >
            <FileSpreadsheet size={15} className="text-emerald-400" />
            <span>{t('export_csv')}</span>
          </button>

          <button
            type="button"
            onClick={handleExportJSON}
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 border border-white/[0.08] active:scale-95 transition-all text-xs font-semibold"
          >
            <Download size={15} className="text-indigo-400" />
            <span>{t('export_json')}</span>
          </button>
        </div>
      </GlassCard>

      {/* 8. Danger Zone */}
      <GlassCard className="p-4 rounded-3xl space-y-3 border-rose-500/25 bg-rose-950/15">
        <div className="flex items-center space-x-2 text-rose-400">
          <AlertTriangle size={16} />
          <span className="text-xs font-bold uppercase tracking-wider">{t('danger_zone')}</span>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          {t('danger_sub')}
        </p>

        <button
          type="button"
          onClick={() => {
            haptic.notification('warning');
            setIsConfirmingWipe(true);
          }}
          className="w-full py-2.5 rounded-2xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 active:scale-98 transition-all text-xs font-bold flex items-center justify-center gap-1.5"
        >
          <Trash2 size={14} />
          <span>{t('reset_data_btn')}</span>
        </button>
      </GlassCard>

      {/* Confirmation Modal */}
      {isConfirmingWipe && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <GlassCard className="max-w-xs w-full space-y-3 border-rose-500/40">
            <h4 className="text-base font-bold text-white flex items-center gap-2">
              <AlertTriangle className="text-rose-400" size={18} />
              <span>{t('reset_modal_title')}</span>
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              {t('reset_modal_desc')}
            </p>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmingWipe(false)}
                className="flex-1 py-2.5 rounded-xl bg-white/[0.08] text-slate-300 text-xs font-semibold"
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                onClick={handleConfirmWipe}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-lg shadow-rose-600/30"
              >
                {t('reset_confirm_btn')}
              </button>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
};
