import { motion, AnimatePresence } from "motion/react";
import { AlertTriangle, X } from "lucide-react";
import { cn } from "../cn";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = 'info'
}: ConfirmationModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-white dark:bg-zinc-900 w-full max-w-sm rounded-[32px] p-6 shadow-2xl border border-zinc-200 dark:border-zinc-800"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col items-center text-center space-y-4">
              <div className={cn(
                "p-4 rounded-2xl",
                variant === 'danger' ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400" :
                variant === 'warning' ? "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400" :
                "bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400"
              )}>
                <AlertTriangle className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-bold dark:text-white">{title}</h3>
                <p className="text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed">
                  {message}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 w-full pt-4">
                <button
                  onClick={onClose}
                  className="px-4 py-3 rounded-2xl font-bold text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all active:scale-95"
                >
                  {cancelLabel}
                </button>
                <button
                  onClick={() => {
                    onConfirm();
                    onClose();
                  }}
                  className={cn(
                    "px-4 py-3 rounded-2xl font-bold text-white transition-all active:scale-95 shadow-lg",
                    variant === 'danger' ? "bg-red-600 hover:bg-red-700 shadow-red-200 dark:shadow-red-900/20" :
                    variant === 'warning' ? "bg-amber-600 hover:bg-amber-700 shadow-amber-200 dark:shadow-amber-900/20" :
                    "bg-sky-600 hover:bg-sky-700 shadow-sky-200 dark:shadow-sky-900/20"
                  )}
                >
                  {confirmLabel}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
