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
} from 'lucide-react';
import { useSettingsStore, SUPPORTED_CURRENCIES } from '../../stores/settingsStore';
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
  const { transactions } = useTransactionStore();
  const { categories } = useCategoryStore();
  const { openManageCategories } = useUIStore();
  const { user, isInsideTelegram, haptic } = useTelegram();

  const [isEditingBalance, setIsEditingBalance] = useState(false);
  const [balanceInput, setBalanceInput] = useState(startingBalance.toString());
  const [isConfirmingWipe, setIsConfirmingWipe] = useState(false);

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
        <h2 className="text-base font-extrabold text-white tracking-tight">Settings & Preferences</h2>
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
                  Telegram Verified
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
          <span className="text-[11px] font-mono text-slate-500">v2.0.0 (Build 2026.09)</span>
        </div>
      </GlassCard>

      {/* 2. Starting Balance Editor */}
      <GlassCard className="p-4 rounded-3xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center border border-indigo-500/25">
              <Wallet size={16} />
            </div>
            <div>
              <span className="text-xs font-bold text-white block">Starting Balance</span>
              <span className="text-[11px] text-slate-400">Baseline before recorded transactions</span>
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
            {isEditingBalance ? 'Cancel' : 'Edit'}
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
              Save
            </button>
          </div>
        ) : (
          <div className="pt-1 text-2xl font-extrabold text-white tabular-nums tracking-tight">
            {formatAmount(startingBalance)}
          </div>
        )}
      </GlassCard>

      {/* 3. Category Management Link */}
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
            <span className="text-xs font-bold text-white block">Category Management</span>
            <span className="text-[11px] text-slate-400">
              {categories.length} categories • Manage custom icons & colors
            </span>
          </div>
        </div>
        <span className="text-xs font-semibold text-indigo-400">Configure</span>
      </GlassCard>

      {/* 4. Currency Selector */}
      <GlassCard className="p-4 rounded-3xl space-y-3">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center border border-amber-500/25">
            <Coins size={16} />
          </div>
          <div>
            <span className="text-xs font-bold text-white block">Display Currency</span>
            <span className="text-[11px] text-slate-400">Display-only formatting symbol</span>
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

      {/* 5. Data Export */}
      <GlassCard className="p-4 rounded-3xl space-y-3">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center border border-emerald-500/25">
            <Download size={16} />
          </div>
          <div>
            <span className="text-xs font-bold text-white block">Export & Backup</span>
            <span className="text-[11px] text-slate-400">Download your personal financial data</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 border border-white/[0.08] active:scale-95 transition-all text-xs font-semibold"
          >
            <FileSpreadsheet size={15} className="text-emerald-400" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={handleExportJSON}
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 border border-white/[0.08] active:scale-95 transition-all text-xs font-semibold"
          >
            <Download size={15} className="text-indigo-400" />
            <span>Export JSON</span>
          </button>
        </div>
      </GlassCard>

      {/* 6. Danger Zone */}
      <GlassCard className="p-4 rounded-3xl space-y-3 border-rose-500/25 bg-rose-950/15">
        <div className="flex items-center space-x-2 text-rose-400">
          <AlertTriangle size={16} />
          <span className="text-xs font-bold uppercase tracking-wider">Danger Zone</span>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          Wipe all transactions, custom categories, and hashtag history to start completely fresh.
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
          <span>Reset All Account Data</span>
        </button>
      </GlassCard>

      {/* Confirmation Modal */}
      {isConfirmingWipe && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <GlassCard className="max-w-xs w-full space-y-3 border-rose-500/40">
            <h4 className="text-base font-bold text-white flex items-center gap-2">
              <AlertTriangle className="text-rose-400" size={18} />
              <span>Reset Everything?</span>
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              This action <strong>cannot be undone</strong>. All your logged transactions and custom categories will be permanently deleted.
            </p>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmingWipe(false)}
                className="flex-1 py-2.5 rounded-xl bg-white/[0.08] text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmWipe}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-lg shadow-rose-600/30"
              >
                Yes, Reset All
              </button>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
};
