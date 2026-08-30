"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, UserPlus, Globe, Copy, Check, Trash2, Loader2 } from 'lucide-react';
import { FileEntry } from '@/lib/upload-manager';
import { shareFileWithUser, removeCollaborator, togglePublicAccess } from '@/lib/share-manager';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/context/toast-context';
import { cn } from '@/lib/utils';

export const ShareFileModal = ({
  isOpen,
  onClose,
  file
}: {
  isOpen: boolean;
  onClose: () => void;
  file: FileEntry | null
}) => {
  const { user, userMetadata } = useAuth();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'viewer' | 'editor'>('viewer');
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsPublicCopied] = useState(false);

  if (!file) return null;

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !email.trim()) return;

    setIsLoading(true);
    try {
      await shareFileWithUser(user.uid, file.fileId, email, role);
      showToast(`Invited ${email}`, 'success');
      setEmail('');
    } catch (error: any) {
      showToast(error.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = async (collab: { email: string, role: 'viewer' | 'editor' }) => {
    if (!user) return;
    try {
      await removeCollaborator(user.uid, file.fileId, collab.email, collab.role);
      showToast('Collaborator removed', 'info');
    } catch (error: any) {
      showToast(error.message, 'error');
    }
  };

  const handleTogglePublic = async () => {
    if (!user) return;
    try {
      await togglePublicAccess(user.uid, file.fileId, !file.isPublic);
      showToast(file.isPublic ? 'Public access disabled' : 'Public access enabled', 'success');
    } catch (error: any) {
      showToast(error.message, 'error');
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(file.downloadUrl);
    setIsPublicCopied(true);
    setTimeout(() => setIsPublicCopied(false), 2000);
    showToast('Link copied to clipboard', 'success');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative w-full max-w-xl bg-surface rounded-[3rem] p-10 shadow-2xl border border-outline/10 overflow-hidden">

            <div className="absolute top-0 left-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl -ml-24 -mt-24" />

            <div className="flex justify-between items-center mb-8 relative z-10">
               <div className="flex items-center gap-4">
                  <div className="p-4 bg-primary-container text-on-primary-container rounded-3xl shadow-sm">
                    <UserPlus size={28} />
                  </div>
                  <div>
                    <h3 className="text-headline-small font-black text-on-surface">Share Vault</h3>
                    <p className="text-body-small text-on-surface-variant font-bold uppercase tracking-widest">Protocol: Multi-User Sync</p>
                  </div>
               </div>
               <button onClick={onClose} className="p-3 text-on-surface-variant hover:bg-surface-variant rounded-full transition-all active:scale-90">
                  <X size={24} />
               </button>
            </div>

            <form onSubmit={handleShare} className="space-y-4 mb-10 relative z-10">
               <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1 group">
                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors" size={20} />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Collaborator Email"
                      className="w-full pl-14 pr-4 py-4 bg-surface-variant/30 border border-outline/10 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 focus:bg-surface transition-all text-on-surface font-medium text-sm"
                    />
                  </div>
                  <div className="flex gap-3">
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as any)}
                      className="px-5 py-4 bg-surface-variant/50 border border-outline/10 rounded-2xl outline-none text-xs font-black uppercase tracking-widest text-primary focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                    >
                      <option value="viewer">Viewer</option>
                      <option value="editor">Editor</option>
                    </select>
                    <button
                      disabled={isLoading || !email}
                      className="px-8 bg-primary text-on-primary font-black rounded-2xl hover:shadow-lg shadow-primary/20 transition-all disabled:opacity-50 active:scale-95 uppercase tracking-widest text-[10px]"
                    >
                      {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Invite'}
                    </button>
                  </div>
               </div>
            </form>

            <div className="space-y-8 relative z-10">
               <div>
                  <h4 className="text-[10px] font-black text-outline uppercase tracking-[0.3em] mb-5 px-1">Active Nodes</h4>
                  <div className="space-y-3 max-h-56 overflow-y-auto pr-2 custom-scrollbar">
                     <div className="flex items-center justify-between p-5 bg-primary-container/10 rounded-3xl border border-primary/10">
                        <div className="flex items-center gap-4">
                           <div className="w-12 h-12 rounded-2xl bg-primary text-on-primary flex items-center justify-center text-lg font-black shadow-md">
                              {userMetadata?.name?.charAt(0) || 'U'}
                           </div>
                           <div className="min-w-0">
                              <p className="text-sm font-black text-on-surface truncate">You (Master)</p>
                              <p className="text-[10px] text-outline font-bold tracking-tight">{user?.email}</p>
                           </div>
                        </div>
                        <span className="text-[10px] font-black text-primary bg-primary-container px-3 py-1 rounded-full uppercase tracking-widest border border-primary/20">Admin</span>
                     </div>

                     {file.sharedWith?.map((collab, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-center justify-between p-5 bg-surface border border-outline/10 rounded-3xl group hover:border-primary/20 transition-all shadow-sm"
                        >
                           <div className="flex items-center gap-4 text-on-surface">
                              <div className="w-12 h-12 rounded-2xl bg-surface-variant flex items-center justify-center text-lg font-black uppercase border border-outline/5">{collab.email[0]}</div>
                              <div className="min-w-0">
                                 <p className="text-sm font-bold truncate">{collab.email}</p>
                                 <p className="text-[10px] text-outline font-black uppercase tracking-widest mt-1">{collab.role}</p>
                              </div>
                           </div>
                           <button
                             onClick={() => handleRemove(collab)}
                             className="p-3 text-outline hover:text-error hover:bg-error-container/20 rounded-2xl transition-all active:scale-75"
                           >
                              <Trash2 size={20} />
                           </button>
                        </motion.div>
                     ))}
                  </div>
               </div>

               <div className="pt-8 border-t border-outline/5">
                  <div className={cn(
                    "flex items-center justify-between p-6 rounded-[2rem] border transition-all",
                    file.isPublic
                      ? "bg-secondary-container text-on-secondary-container border-secondary/20 shadow-md"
                      : "bg-surface-variant/20 border-outline/5 text-on-surface-variant"
                  )}>
                     <div className="flex items-center gap-5">
                        <div className={cn(
                          "p-4 rounded-[1.25rem] transition-colors",
                          file.isPublic ? "bg-secondary text-on-secondary shadow-lg" : "bg-surface-variant text-outline"
                        )}>
                           <Globe size={24} />
                        </div>
                        <div>
                           <p className="text-sm font-black uppercase tracking-widest">Global Link Access</p>
                           <p className="text-[10px] font-bold opacity-60 mt-1">Permission: Public/Read-Only</p>
                        </div>
                     </div>
                     <div className="flex items-center gap-4">
                        {file.isPublic && (
                           <button
                             onClick={copyLink}
                             className="p-3 bg-white/20 hover:bg-white/40 rounded-2xl transition-all active:scale-90"
                             title="Copy Proxy URL"
                           >
                              {isCopied ? <Check size={20} /> : <Copy size={20} />}
                           </button>
                        )}
                        <button
                          onClick={handleTogglePublic}
                          className={cn(
                            "relative inline-flex h-8 w-14 items-center rounded-full transition-all shadow-inner",
                            file.isPublic ? 'bg-primary' : 'bg-outline/20'
                          )}
                        >
                           <span className={cn(
                             "inline-block h-6 w-6 transform rounded-full bg-white shadow-md transition-transform",
                             file.isPublic ? 'translate-x-7' : 'translate-x-1'
                           )} />
                        </button>
                     </div>
                  </div>
               </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
