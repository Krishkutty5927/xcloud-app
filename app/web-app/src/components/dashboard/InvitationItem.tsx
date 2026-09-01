"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  File,
  Check,
  X,
  Clock,
  ShieldLock,
  Loader2,
  User,
  ArrowUpRight
} from 'lucide-react';
import { Invitation, acceptInvitation, rejectInvitation } from '@/lib/invitation-manager';
import { formatFileSize, cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/context/toast-context';

interface InvitationItemProps {
  invitation: Invitation;
}

export const InvitationItem = ({ invitation }: InvitationItemProps) => {
  const { user } = useAuth();
  const { showToast, hideToast } = useToast();
  const [isAccepting, setIsAccepting] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [showPasscodeField, setShowPasscodeInput] = useState(false);
  const [passcode, setPasscode] = useState('');

  const handleAccept = async () => {
    if (!user) return;

    if (invitation.passcode && !showPasscodeField) {
      setShowPasscodeInput(true);
      return;
    }

    setIsAccepting(true);
    const toastId = showToast("Authenticating access...", "loading");
    try {
      await acceptInvitation(invitation, user.uid, user.email!, passcode);
      hideToast(toastId);
      showToast("Access granted. Vault synchronized.", "success");
    } catch (err: any) {
      hideToast(toastId);
      showToast(err.message, "error");
      setPasscode('');
    } finally {
      setIsAccepting(false);
    }
  };

  const handleReject = async () => {
    setIsRejecting(true);
    const toastId = showToast("Rejecting transmission...", "loading");
    try {
      await rejectInvitation(invitation.id);
      hideToast(toastId);
      showToast("Invitation decommissioned", "info");
    } catch (err: any) {
      hideToast(toastId);
      showToast(err.message, "error");
    } finally {
      setIsRejecting(false);
    }
  };

  const isExpired = invitation.expiresAt && (invitation.expiresAt.seconds * 1000) < Date.now();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-surface border border-outline/10 rounded-[2.5rem] p-8 shadow-sm hover:shadow-md transition-all relative overflow-hidden group"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-700" />

      <div className="flex flex-col md:flex-row items-start md:items-center gap-8 relative z-10">
        <div className="w-20 h-20 bg-primary-container text-primary rounded-3xl flex items-center justify-center shadow-inner shrink-0">
          <File size={40} />
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-center gap-3">
             <h3 className="text-xl font-black text-on-surface truncate tracking-tight">{invitation.fileName}</h3>
             <span className={cn(
                "text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest",
                invitation.status === 'REJECTED' ? "bg-error-container text-error" : "bg-primary-container text-primary"
             )}>
                {invitation.status === 'REJECTED' ? 'Rejected' : invitation.fileType}
             </span>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
             <div className="flex items-center gap-2 text-on-surface-variant">
                <User size={14} className="text-primary" />
                <span className="text-xs font-bold">From: {invitation.senderName}</span>
             </div>
             <div className="flex items-center gap-2 text-on-surface-variant font-medium text-xs">
                <span className="opacity-60">Size:</span>
                <span>{formatFileSize(invitation.fileSize)}</span>
             </div>
             {invitation.expiresAt && (
               <div className={cn(
                 "flex items-center gap-2 text-xs font-bold",
                 isExpired ? "text-error" : "text-amber-600"
               )}>
                  <Clock size={14} />
                  <span>{isExpired ? 'Expired' : `Expires in ${formatDistanceToNow(invitation.expiresAt.seconds * 1000)}`}</span>
               </div>
             )}
          </div>
        </div>

        <div className="flex flex-col gap-3 w-full md:w-auto shrink-0">
          {showPasscodeField ? (
            <div className="flex flex-col gap-2">
               <div className="relative">
                  <ShieldLock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" />
                  <input
                    autoFocus
                    maxLength={5}
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value.toUpperCase())}
                    placeholder="ENTER 5-CHAR KEY"
                    className="w-full md:w-48 pl-10 pr-4 py-3 bg-primary-container/30 border border-primary/20 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 text-xs font-black tracking-[0.2em] text-primary placeholder:tracking-normal placeholder:font-bold"
                  />
               </div>
               <div className="flex gap-2">
                  <button
                    onClick={handleAccept}
                    disabled={isAccepting || passcode.length !== 5}
                    className="flex-1 py-3 bg-primary text-on-primary rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50"
                  >
                    {isAccepting ? <Loader2 className="animate-spin mx-auto" size={16} /> : 'Verify & Open'}
                  </button>
                  <button
                    onClick={() => setShowPasscodeInput(false)}
                    className="px-4 py-3 bg-surface-variant text-on-surface-variant rounded-xl text-[10px] font-black uppercase"
                  >
                    <X size={16} />
                  </button>
               </div>
            </div>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={handleAccept}
                disabled={isAccepting || isExpired}
                className="px-8 py-4 bg-primary text-on-primary font-black rounded-2xl hover:shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-30 uppercase tracking-widest text-[10px]"
              >
                {isAccepting ? <Loader2 className="animate-spin" size={18} /> : <><Check size={18} /> Accept Access</>}
              </button>
              <button
                onClick={handleReject}
                disabled={isRejecting}
                className="px-6 py-4 bg-surface-variant/50 text-on-surface-variant font-bold rounded-2xl hover:bg-error-container/20 hover:text-error transition-all active:scale-95 disabled:opacity-50"
              >
                {isRejecting ? <Loader2 className="animate-spin" size={18} /> : <X size={20} />}
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
