"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, UserPlus, Globe, Copy, Check, Trash2, Loader2, ShieldLock, Clock, Phone } from 'lucide-react';
import { FileEntry } from '@/lib/upload-manager';
import { shareFileWithUser, removeCollaborator, togglePublicAccess } from '@/lib/share-manager';
import { createInvitation } from '@/lib/invitation-manager';
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
  const [phone, setPhone] = useState('');
  const [shareType, setShareType] = useState<'email' | 'phone'>('email');
  const [passcode, setPasscode] = useState('');
  const [expiryHours, setExpiryHours] = useState('24');
  const [role, setRole] = useState<'viewer' | 'editor'>('viewer');
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsPublicCopied] = useState(false);

  if (!file) return null;

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !userMetadata) return;

    const recipientId = shareType === 'email' ? email.trim() : phone.trim();
    if (!recipientId) return;

    setIsLoading(true);
    try {
      // 1. Validation
      if (passcode && passcode.length !== 5) {
        throw new Error("Security passcode must be exactly 5 alphanumeric characters (A-Z, 0-9).");
      }

      if (shareType === 'phone' && !/^\+[1-9]\d{1,14}$/.test(phone)) {
        throw new Error("Invalid phone format. Use E.164 standard (e.g., +1234567890).");
      }

      // 2. Create Invitation
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + parseInt(expiryHours));

      await createInvitation(
        { id: user.uid, email: user.email!, name: userMetadata.name },
        file,
        { email: shareType === 'email' ? email : undefined, phone: shareType === 'phone' ? phone : undefined },
        { passcode: passcode || undefined, expiresAt }
      );

      showToast(`Invitation sent to ${recipientId}`, 'success');
      setEmail('');
      setPhone('');
      setPasscode('');
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

            <form onSubmit={handleShare} className="space-y-6 mb-10 relative z-10">
               <div className="flex bg-surface-variant/30 p-1 rounded-2xl w-fit mb-4">
                  <button
                    type="button"
                    onClick={() => setShareType('email')}
                    className={cn(
                      "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                      shareType === 'email' ? "bg-primary text-on-primary shadow-md" : "text-on-surface-variant hover:bg-surface-variant/50"
                    )}
                  >
                    Email
                  </button>
                  <button
                    type="button"
                    onClick={() => setShareType('phone')}
                    className={cn(
                      "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                      shareType === 'phone' ? "bg-primary text-on-primary shadow-md" : "text-on-surface-variant hover:bg-surface-variant/50"
                    )}
                  >
                    Phone
                  </button>
               </div>

               <div className="flex flex-col gap-4">
                  <div className="relative group">
                    {shareType === 'email' ? (
                      <>
                        <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors" size={20} />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="Recipient's Email"
                          className="w-full pl-14 pr-4 py-4 bg-surface-variant/30 border border-outline/10 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 focus:bg-surface transition-all text-on-surface font-medium text-sm"
                        />
                      </>
                    ) : (
                      <>
                        <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors" size={20} />
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+1234567890"
                          className="w-full pl-14 pr-4 py-4 bg-surface-variant/30 border border-outline/10 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 focus:bg-surface transition-all text-on-surface font-medium text-sm"
                        />
                      </>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="relative group">
                       <ShieldLock className="absolute left-5 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors" size={20} />
                       <input
                         type="text"
                         maxLength={5}
                         value={passcode}
                         onChange={(e) => setPasscode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                         placeholder="5-Char Passcode (Opt)"
                         className="w-full pl-14 pr-4 py-4 bg-surface-variant/30 border border-outline/10 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 focus:bg-surface transition-all text-on-surface font-black tracking-[0.2em] text-sm placeholder:tracking-normal placeholder:font-medium"
                       />
                    </div>
                    <div className="relative group">
                       <Clock className="absolute left-5 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors" size={20} />
                       <select
                         value={expiryHours}
                         onChange={(e) => setExpiryHours(e.target.value)}
                         className="w-full pl-14 pr-4 py-4 bg-surface-variant/30 border border-outline/10 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 focus:bg-surface transition-all text-on-surface font-bold text-sm appearance-none cursor-pointer"
                       >
                         <option value="1">Expire in 1 Hour</option>
                         <option value="24">Expire in 24 Hours</option>
                         <option value="168">Expire in 7 Days</option>
                         <option value="720">Expire in 30 Days</option>
                       </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || (shareType === 'email' ? !email : !phone)}
                    className="w-full py-4 bg-primary text-on-primary font-black rounded-2xl hover:shadow-lg shadow-primary/20 transition-all disabled:opacity-50 active:scale-95 uppercase tracking-widest text-xs flex items-center justify-center gap-3"
                  >
                    {isLoading ? <Loader2 className="animate-spin" size={20} /> : <><UserPlus size={18} /> Send Invitation</>}
                  </button>
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
