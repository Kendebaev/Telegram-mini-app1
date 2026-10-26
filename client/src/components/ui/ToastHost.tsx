import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, Sparkles } from 'lucide-react';
import { useToastStore } from '../../stores/toastStore';

export const ToastHost: React.FC = () => {
  const { toast, dismiss } = useToastStore();

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(dismiss, 2600);
    return () => window.clearTimeout(timer);
  }, [toast, dismiss]);

  const Icon = toast?.tone === 'error' ? AlertCircle : toast?.tone === 'success' ? CheckCircle2 : Sparkles;
  const iconColor =
    toast?.tone === 'error' ? 'var(--coral)' : toast?.tone === 'success' ? 'var(--mint)' : 'var(--accent-2)';

  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          key={toast.id}
          role="status"
          initial={{ opacity: 0, y: 18, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 420, damping: 32 }}
          className="pointer-events-none fixed inset-x-0 bottom-28 z-[90] mx-auto flex max-w-md justify-center px-4"
        >
          <div className="flex items-center gap-2 rounded-full border border-line bg-panel-solid px-4 py-2.5 shadow-float backdrop-blur-xl">
            <Icon size={15} style={{ color: iconColor }} />
            <span className="text-[11px] font-semibold text-ink">{toast.message}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
