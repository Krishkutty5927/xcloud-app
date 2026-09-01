"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Folder, Check, Loader2, Home } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc } from 'firebase/firestore';
import { FileEntry } from '@/lib/upload-manager';
import { moveFiles } from '@/lib/file-manager';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/context/toast-context';
import { cn } from '@/lib/utils';

export const MoveToFolderModal = ({
  isOpen,
  onClose,
  selectedFileIds
}: {
  isOpen: boolean;
  onClose: () => void;
  selectedFileIds: string[]
}) => {
  const { user } = useAuth();
  const { showToast, hideToast } = useToast();
  const [folders, setFolders] = useState<FileEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [targetFolderId, setTargetFolderId] = useState('root');
  const [isMoving, setIsMoving] = useState(false);

  useEffect(() => {
    const fetchFolders = async () => {
      if (!user) return;
      try {
        const q = query(
          collection(db, 'users', user.uid, 'user_files'),
          where('fileType', '==', 'Folder'),
          where('isDeleted', '==', false)
        );
        const snap = await getDocs(q);
        setFolders(snap.docs.map(doc => doc.data() as FileEntry));
      } catch (err: any) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen) fetchFolders();
  }, [isOpen, user]);

  const handleMove = async () => {
    if (!user || selectedFileIds.length === 0) return;
    setIsMoving(true);
    const toastId = showToast(`Relocating ${selectedFileIds.length} items...`, 'loading');

    try {
      await moveFiles(user.uid, selectedFileIds, targetFolderId);
      hideToast(toastId);
      showToast('Items relocated successfully', 'success');
      onClose();
    } catch (error: any) {
      hideToast(toastId);
      showToast(error.message, 'error');
    } finally {
      setIsMoving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative w-full max-w-md bg-surface rounded-[2.5rem] p-8 shadow-2xl border border-outline/10 overflow-hidden">

            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16" />

            <div className="flex justify-between items-center mb-8 relative z-10">
               <h3 className="text-headline-small font-black text-on-surface">Relocate</h3>
               <button onClick={onClose} className="p-3 hover:bg-surface-variant rounded-full text-on-surface-variant transition-all active:scale-90"><X size={24} /></button>
            </div>

            <div className="space-y-6 relative z-10">
               <div className="max-h-72 overflow-y-auto pr-2 custom-scrollbar space-y-2 px-1">
                  <button
                    onClick={() => setTargetFolderId('root')}
                    className={cn(
                      "w-full flex items-center justify-between p-5 rounded-2xl border transition-all active:scale-[0.98]",
                      targetFolderId === 'root'
                        ? "bg-primary-container text-on-primary-container border-primary/20 shadow-md"
                        : "bg-surface-variant/20 border-outline/5 text-on-surface-variant hover:bg-surface-variant/40"
                    )}
                  >
                     <div className="flex items-center gap-4">
                        <Home size={22} className={targetFolderId === 'root' ? 'text-primary' : 'text-outline'} />
                        <span className="font-black text-sm uppercase tracking-widest">Base Vault</span>
                     </div>
                     {targetFolderId === 'root' && <Check size={20} className="text-primary" />}
                  </button>

                  {isLoading ? (
                    <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" size={32} /></div>
                  ) : folders.filter(f => !selectedFileIds.includes(f.fileId)).map(folder => (
                    <button
                      key={folder.fileId}
                      onClick={() => setTargetFolderId(folder.fileId)}
                      className={cn(
                        "w-full flex items-center justify-between p-5 rounded-2xl border transition-all active:scale-[0.98]",
                        targetFolderId === folder.fileId
                          ? "bg-primary-container text-on-primary-container border-primary/20 shadow-md"
                          : "bg-surface-variant/20 border-outline/5 text-on-surface-variant hover:bg-surface-variant/40"
                      )}
                    >
                       <div className="flex items-center gap-4">
                          <Folder size={22} className={targetFolderId === folder.fileId ? 'text-primary' : 'text-primary/40'} />
                          <span className="font-bold text-sm truncate">{folder.fileName}</span>
                       </div>
                       {targetFolderId === folder.fileId && <Check size={20} className="text-primary" />}
                    </button>
                  ))}
               </div>

               <button
                 onClick={handleMove}
                 disabled={isMoving}
                 className="w-full py-5 bg-primary text-on-primary font-black rounded-3xl hover:shadow-2xl shadow-primary/20 transition-all flex items-center justify-center gap-3 disabled:opacity-50 mt-6 uppercase tracking-[0.2em] text-xs"
               >
                 {isMoving ? <Loader2 className="animate-spin" size={20} /> : 'Confirm Relocation'}
               </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
