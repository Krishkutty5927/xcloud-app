"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Zap, Crown, Loader2, Sparkles } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/context/toast-context';

interface Plan {
  id: string;
  name: string;
  storage: number; // bytes
  price: string;
  color: string;
  icon: React.ReactNode;
  features: string[];
}

const plans: Plan[] = [
  {
    id: 'premium',
    name: 'Premium',
    storage: 107374182400, // 100GB
    price: '$9.99/mo',
    color: 'blue',
    icon: <Zap className="text-blue-500" />,
    features: ['100GB Secure Storage', 'Priority Sync', 'Shared Link Passwords']
  },
  {
    id: 'ultra',
    name: 'Ultra',
    storage: 1099511627776, // 1TB
    price: '$24.99/mo',
    color: 'purple',
    icon: <Crown className="text-purple-500" />,
    features: ['1TB Massive Storage', 'Advanced Encryption', '24/7 Support', 'Custom Branding']
  }
];

export const UpgradePlanModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handleUpgrade = async (plan: Plan) => {
    if (!user) return;
    setIsLoading(plan.id);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        storageAvailable: plan.storage,
        subscriptionPlan: plan.name
      });
      showToast(`Successfully upgraded to ${plan.name}!`, 'success');
      onClose();
    } catch (error: any) {
      showToast(error.message, 'error');
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-4xl bg-white/90 dark:bg-gray-900/90 backdrop-blur-2xl rounded-[2.5rem] p-8 md:p-12 shadow-2xl border border-white/20 dark:border-gray-800/50 overflow-hidden"
          >
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px] -mr-32 -mt-32" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-[80px] -ml-32 -mb-32" />

            <button
              onClick={onClose}
              className="absolute top-6 right-6 p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors z-10"
            >
              <X size={24} />
            </button>

            <div className="relative z-10 text-center mb-12">
               <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full text-xs font-black uppercase tracking-widest mb-4">
                  <Sparkles size={14} />
                  <span>Limited Time Offer</span>
               </div>
               <h2 className="text-4xl font-black text-gray-900 dark:text-white mb-2">Upgrade your space</h2>
               <p className="text-gray-500 dark:text-gray-400">Unlock the full potential of XCloud with expanded storage.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className="bg-white dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 p-8 rounded-[2rem] flex flex-col hover:border-blue-400 dark:hover:border-blue-500 transition-all group hover:shadow-xl"
                >
                   <div className="flex items-center justify-between mb-6">
                      <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-2xl group-hover:scale-110 transition-transform">
                         {plan.icon}
                      </div>
                      <p className="text-2xl font-black text-gray-900 dark:text-white">{plan.price}</p>
                   </div>

                   <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{plan.name}</h3>

                   <ul className="space-y-4 mb-10 flex-1">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400 font-medium">
                           <div className="w-5 h-5 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center text-green-500">
                              <Check size={12} />
                           </div>
                           {feature}
                        </li>
                      ))}
                   </ul>

                   <button
                     onClick={() => handleUpgrade(plan)}
                     disabled={!!isLoading}
                     className={`w-full py-4 rounded-2xl font-black text-white transition-all shadow-lg active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 ${
                        plan.id === 'ultra'
                          ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-purple-200 dark:shadow-none'
                          : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200 dark:shadow-none'
                     }`}
                   >
                     {isLoading === plan.id ? (
                       <Loader2 className="animate-spin" size={20} />
                     ) : (
                       <>Choose {plan.name}</>
                     )}
                   </button>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
