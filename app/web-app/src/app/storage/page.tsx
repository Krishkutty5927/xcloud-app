"use client";

import React from 'react';
import { useAuth } from '@/context/auth-context';
import { HardDrive, ShieldCheck, Zap, DownloadCloud, AlertTriangle } from 'lucide-react';
import { StorageWidget } from '@/components/dashboard/storage-widget';

export default function StoragePage() {
  const { userMetadata } = useAuth();

  if (!userMetadata) return null;

  return (
    <div className="p-10 max-w-7xl mx-auto space-y-10">
      <header className="space-y-3">
        <h1 className="text-display-small font-black text-on-surface flex items-center gap-3">
          <HardDrive className="text-primary" size={36} />
          Storage Management
        </h1>
        <p className="text-on-surface-variant font-medium">Detailed breakdown of your encrypted cloud vault.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-1">
          <StorageWidget />
        </div>

        <div className="lg:col-span-2 space-y-10">
          <div className="bg-surface border border-outline/10 rounded-[3rem] p-8 space-y-8 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary-container text-primary rounded-2xl flex items-center justify-center">
                <ShieldCheck size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black text-on-surface tracking-tight">Security Protocol</h3>
                <p className="text-sm text-on-surface-variant font-medium">All data is AES-256 encrypted before leaving your device.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 bg-surface-variant/20 rounded-3xl space-y-4 border border-outline/5">
                <Zap className="text-primary" size={24} />
                <h4 className="font-black text-on-surface uppercase tracking-widest text-[10px]">Auto-Optimization</h4>
                <p className="text-xs text-on-surface-variant font-medium leading-relaxed">
                  Smart caching and multi-region redundancy ensure your files are always available at maximum speed.
                </p>
              </div>

              <div className="p-6 bg-surface-variant/20 rounded-3xl space-y-4 border border-outline/5">
                <DownloadCloud className="text-primary" size={24} />
                <h4 className="font-black text-on-surface uppercase tracking-widest text-[10px]">Offline Access</h4>
                <p className="text-xs text-on-surface-variant font-medium leading-relaxed">
                  Mark critical files for offline access. They'll be synchronized to your device's local encrypted storage.
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-outline/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="text-amber-500" size={20} />
                <span className="text-sm font-bold text-on-surface-variant">Running low?</span>
              </div>
              <button className="px-6 py-3 bg-primary text-on-primary rounded-2xl text-xs font-black uppercase tracking-widest hover:shadow-lg transition-all active:scale-95">
                Upgrade Plan
              </button>
            </div>
          </div>

          <div className="p-8 bg-surface-variant/10 rounded-[3rem] border border-outline/10 border-dashed text-center">
            <h3 className="text-lg font-bold text-on-surface mb-2 text-primary">Clean Up Recommendations</h3>
            <p className="text-sm text-on-surface-variant font-medium max-w-sm mx-auto mb-6">
              We identified 4 large videos and 12 duplicates that could save you up to 1.2 GB.
            </p>
            <button className="text-primary font-black text-xs uppercase tracking-[0.2em] hover:underline">
              Analyze Vault
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
