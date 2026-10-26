import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  zIndex?: number;
}

export const Sheet: React.FC<SheetProps> = ({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  zIndex = 70,
}) => {
  useEffect(() => {
    if (!open) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  return (
    <>
      {open && (
        <motion.div
          className="fixed inset-0 flex items-end justify-center sm:items-center sm:p-6"
          style={{ zIndex }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.16 }}
        >
          <motion.button
            type="button"
            aria-label="Close sheet"
            onClick={onClose}
            className="absolute inset-0 bg-black/55 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.16 }}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ y: 120, opacity: 0.6, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 340, damping: 32 }}
            className="relative flex max-h-[92dvh] w-full max-w-md flex-col overflow-hidden rounded-t-[32px] border border-line bg-panel-solid shadow-float safe-bottom sm:rounded-[32px]"
          >
            <div className="mx-auto mt-2.5 h-1 w-10 rounded-full bg-line-strong" />
            <div className="flex items-start justify-between gap-4 px-5 pb-3 pt-3">
              <div>
                <h3 className="font-display text-lg font-semibold tracking-tight text-ink">{title}</h3>
                {subtitle && <p className="mt-0.5 text-xs text-muted">{subtitle}</p>}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="pressable flex h-8 w-8 items-center justify-center rounded-full bg-panel-inset text-muted hover:text-ink"
              >
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 pb-4 no-scrollbar">{children}</div>
            {footer && <div className="border-t border-line px-5 py-3">{footer}</div>}
          </motion.div>
        </motion.div>
      )}
    </>
  );
};
