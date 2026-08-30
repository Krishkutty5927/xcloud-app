"use client";

import { Loader2, Cloud } from "lucide-react";
import { motion } from "framer-motion";

export function LoadingScreen() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center animate-in fade-in duration-500">
      <div className="relative">
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, 5, -5, 0]
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="w-24 h-24 bg-primary-container text-primary rounded-[2.5rem] flex items-center justify-center shadow-lg"
        >
          <Cloud size={48} fill="currentColor" fillOpacity={0.2} />
        </motion.div>
        <div className="absolute -bottom-2 -right-2">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-black text-on-surface">Synchronizing Vault</h2>
        <p className="text-sm font-medium text-on-surface-variant max-w-xs mx-auto">
          Securing your encrypted environment and preparing your digital life...
        </p>
      </div>
    </div>
  );
}

export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center p-8">
      <Loader2 className="animate-spin text-primary" size={32} />
    </div>
  );
}
