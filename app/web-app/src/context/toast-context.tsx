"use client";

import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, AlertCircle, Info, Loader2 } from 'lucide-react';
import { useAuth } from './auth-context';

type ToastType = 'success' | 'error' | 'info' | 'loading';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type: ToastType) => string;
  hideToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const { userMetadata } = useAuth();

  const showToast = useCallback((message: string, type: ToastType) => {
    // Respect user preference for non-loading toasts
    if (type !== 'loading' && userMetadata?.preferences?.notifications?.pushToasts === false) {
      return '';
    }

    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    if (type !== 'loading') {
      setTimeout(() => hideToast(id), 5000);
    }
    return id;
  }, []);

  const hideToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 20, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              className={`
                flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl border min-w-[300px] max-w-md
                ${toast.type === 'success' ? 'bg-white dark:bg-gray-900 border-green-100 dark:border-green-900/30' : ''}
                ${toast.type === 'error' ? 'bg-white dark:bg-gray-900 border-red-100 dark:border-red-900/30' : ''}
                ${toast.type === 'info' ? 'bg-white dark:bg-gray-900 border-blue-100 dark:border-blue-900/30' : ''}
                ${toast.type === 'loading' ? 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800' : ''}
              `}
            >
              <div className="shrink-0">
                {toast.type === 'success' && <CheckCircle2 className="text-green-500" size={20} />}
                {toast.type === 'error' && <AlertCircle className="text-red-500" size={20} />}
                {toast.type === 'info' && <Info className="text-blue-500" size={20} />}
                {toast.type === 'loading' && <Loader2 className="text-blue-600 animate-spin" size={20} />}
              </div>
              <p className="flex-1 text-sm font-semibold text-gray-900 dark:text-white">
                {toast.message}
              </p>
              <button
                onClick={() => hideToast(toast.id)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-400 transition-colors"
              >
                <X size={16} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider");
  return context;
};
