"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Unlock, LogOut, Loader2, ShieldAlert } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/context/toast-context';

export const PasscodeLockOverlay = () => {
  const { isAppLocked, unlockApp, logout, userMetadata } = useAuth();
  const { showToast } = useToast();
  const [passcode, setPasscode] = useState('');
  const [isError, setIsError] = useState(false);

  if (!isAppLocked) return null;

  const handleUnlock = () => {
    const success = unlockApp(passcode);
    if (success) {
      showToast("Vault Decrypted", "success");
    } else {
      setIsError(true);
      setPasscode('');
      showToast("Invalid Access Key", "error");
      setTimeout(() => setIsError(false), 500);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-surface flex items-center justify-center p-6 overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-primary/5 rounded-full blur-[120px] -mr-40 -mt-40" />
      <div className="absolute bottom-0 left-0 w-[30rem] h-[30rem] bg-secondary/5 rounded-full blur-[100px] -ml-20 -mb-20" />

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-sm bg-surface relative z-10 flex flex-col items-center text-center"
      >
        <div className="relative mb-10">
           <div className="w-24 h-24 bg-primary-container text-primary rounded-[2rem] flex items-center justify-center shadow-inner">
              <Lock size={48} />
           </div>
           <motion.div
             animate={isError ? { x: [-10, 10, -10, 10, 0] } : {}}
             className="absolute -top-2 -right-2 w-10 h-10 bg-error text-on-error rounded-2xl flex items-center justify-center shadow-lg border-4 border-surface"
           >
              <ShieldAlert size={20} />
           </motion.div>
        </div>

        <div className="space-y-3 mb-12">
           <h1 className="text-3xl font-black text-on-surface tracking-tighter">Vault Locked</h1>
           <p className="text-on-surface-variant font-medium text-sm px-6 leading-relaxed">
             This device is provisioned with an active lock. Enter your security digits to decrypt the local environment.
           </p>
        </div>

        <div className="w-full space-y-8">
           <input
             type="password"
             inputMode="numeric"
             pattern="[0-9]*"
             autoFocus
             value={passcode}
             onChange={(e) => setPasscode(e.target.value.replace(/\D/g, '').slice(0, 15))}
             onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
             placeholder="••••••"
             className="w-full bg-surface-variant/40 border-none rounded-[2rem] py-6 text-center text-4xl tracking-[0.8em] font-black focus:ring-4 focus:ring-primary/20 outline-none transition-all placeholder:tracking-normal placeholder:text-outline/20"
           />

           <div className="flex flex-col gap-4">
              <button
                onClick={handleUnlock}
                className="w-full py-5 bg-primary text-on-primary font-black rounded-3xl hover:shadow-2xl shadow-primary/20 transition-all active:scale-95 flex items-center justify-center gap-3 uppercase tracking-[0.2em] text-xs"
              >
                <Unlock size={18} />
                Access Vault
              </button>

              <div className="pt-4 border-t border-outline/5">
                 <button
                   onClick={() => {
                     if (confirm("Forgotten your access key? You will be signed out for security verification.")) {
                       logout();
                     }
                   }}
                   className="flex items-center gap-3 px-6 py-3 text-on-surface-variant hover:text-error transition-colors font-bold text-xs uppercase tracking-widest mx-auto group"
                 >
                   <LogOut size={16} className="group-hover:translate-x-1 transition-transform" />
                   Forgot Key? Terminate Session
                 </button>
              </div>
           </div>
        </div>

        <div className="mt-16 flex items-center gap-2 text-[10px] font-black text-outline uppercase tracking-[0.4em] opacity-40">
           <span>Encrypted Tunnel Active</span>
        </div>
      </motion.div>
    </div>
  );
};
