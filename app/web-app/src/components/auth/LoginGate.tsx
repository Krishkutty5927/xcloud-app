"use client";

import React from 'react';
import { useAuth } from '@/context/auth-context';
import AuthPage from '@/app/auth/page';
import { Loader2, Cloud } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface LoginGateProps {
  children: React.ReactNode;
}

export const LoginGate = ({ children }: LoginGateProps) => {
  const { user, loading } = useAuth();

  return (
    <AnimatePresence mode="wait">
      {loading ? (
        <motion.div
          key="loading"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="min-h-screen flex items-center justify-center bg-[#F8FAFC]"
        >
          <div className="flex flex-col items-center gap-6">
            <div className="relative">
               <motion.div
                 animate={{ scale: [1, 1.05, 1] }}
                 transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                 className="w-24 h-24 bg-primary-container text-primary rounded-[2rem] flex items-center justify-center shadow-lg"
               >
                  <Cloud size={48} fill="currentColor" fillOpacity={0.2} />
               </motion.div>
               <div className="absolute -bottom-2 -right-2 bg-surface p-1.5 rounded-full shadow-md border border-outline/10">
                  <Loader2 className="animate-spin text-primary" size={24} />
               </div>
            </div>
            <div className="text-center space-y-1">
               <p className="text-on-surface font-black text-lg tracking-tight">Synchronizing Vault</p>
               <p className="text-on-surface-variant text-[10px] font-bold uppercase tracking-[0.2em] opacity-60">Establishing Secure Node...</p>
            </div>
          </div>
        </motion.div>
      ) : !user ? (
        <motion.div
          key="auth"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.5, ease: "anticipate" }}
          className="w-full h-full"
        >
          <AuthPage />
        </motion.div>
      ) : (
        <motion.div
          key="content"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full h-full"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
