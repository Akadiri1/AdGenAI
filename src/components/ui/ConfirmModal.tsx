"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";

type ConfirmOptions = {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
};

type ConfirmContextValue = {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
};

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [resolve, setResolve] = useState<((v: boolean) => void) | null>(null);

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    return new Promise((res) => {
      setOptions(opts);
      setResolve(() => res);
    });
  }, []);

  function answer(value: boolean) {
    resolve?.(value);
    setOptions(null);
    setResolve(null);
  }

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <AnimatePresence>
        {options && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[500] bg-black/50 backdrop-blur-sm"
              onClick={() => answer(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="fixed left-1/2 top-1/2 z-[501] w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-black/10 bg-white p-6 shadow-2xl"
            >
              <div className="flex items-start gap-3 mb-4">
                {options.danger && (
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-danger/10">
                    <AlertTriangle className="h-5 w-5 text-danger" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-heading text-lg font-bold text-text-primary">{options.title}</h3>
                  <p className="mt-1 text-sm text-text-secondary leading-relaxed">{options.message}</p>
                </div>
                <button
                  onClick={() => answer(false)}
                  className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-black/5 hover:bg-black/10 transition-colors"
                >
                  <X className="h-4 w-4 text-text-secondary" />
                </button>
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => answer(false)}
                  className="flex h-10 items-center rounded-xl border-2 border-black/10 px-4 text-sm font-semibold text-text-primary hover:bg-bg-secondary transition-colors"
                >
                  {options.cancelLabel ?? "Cancel"}
                </button>
                <button
                  onClick={() => answer(true)}
                  className={`flex h-10 items-center rounded-xl px-4 text-sm font-semibold text-white transition-colors ${
                    options.danger
                      ? "bg-danger hover:bg-danger/90"
                      : "bg-primary hover:bg-primary-dark"
                  }`}
                >
                  {options.confirmLabel ?? "Confirm"}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used inside ConfirmProvider");
  return ctx.confirm;
}
