"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/context/toast-context';
import { useSearch } from '@/context/search-context';
import { useDropzone } from 'react-dropzone';
import {
  Plus,
  Loader2,
  Cloud,
  Grid,
  List as ListIcon,
  ChevronRight,
  FolderPlus,
  ShieldCheck,
  Star
} from 'lucide-react';
import { moveToTrash } from '@/lib/trash-manager';
import { updateFileName, createFolder, updateLastOpened } from '@/lib/file-manager';
import { generatePublicShareLink } from '@/lib/share-manager';
import { collection, query, where, onSnapshot, doc, updateDoc, collectionGroup, writeBatch, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { uploadFile, FileEntry } from '@/lib/upload-manager';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { StorageWidget } from './storage-widget';
import { cn } from '@/lib/utils';
import { FileItem } from './FileItem';
import { BatchActionBar } from './BatchActionBar';

const ShareFileModal = dynamic(() => import('./ShareFileModal').then(mod => mod.ShareFileModal));
const MoveToFolderModal = dynamic(() => import('./MoveToFolderModal').then(mod => mod.MoveToFolderModal));
const MediaPreviewer = dynamic(() => import('./MediaPreviewer').then(mod => mod.MediaPreviewer));
const FileInfoPanel = dynamic(() => import('./FileInfoPanel').then(mod => mod.FileInfoPanel));

export const XCloudDashboard = ({ filter = 'all' }: { filter?: 'all' | 'starred' | 'shared' | 'files' }) => {
  const { user, userMetadata } = useAuth();
  const { showToast, hideToast } = useToast();
  const { searchQuery } = useSearch();

  const [files, setFiles] = useState<FileEntry[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [editingFile, setEditingFile] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [selectedFileForShare, setSelectedFileForShare] = useState<FileEntry | null>(null);

  const [selectedFileForInfo, setSelectedFileForInfo] = useState<FileEntry | null>(null);
  const [previewFile, setPreviewFile] = useState<FileEntry | null>(null);
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);

  // Folder Lock State
  const [unlockedFolderIds, setUnlockedFolderIds] = useState<string[]>([]);
  const [isUnlockModalOpen, setIsUnlockModalOpen] = useState(false);
  const [folderToUnlock, setFolderToUnlock] = useState<FileEntry | null>(null);
  const [pinInput, setPinInput] = useState('');

  // Shared View Sub-Filter
  const [sharedSubFilter, setSharedSubFilter] = useState<'with_me' | 'by_me' | 'invitations'>('with_me');

  // Reset state when sub-filter changes
  useEffect(() => {
    if (filter === 'shared') {
      setIsLoading(true);
      setFiles([]);
    }
  }, [sharedSubFilter, filter]);

  // Folder and Navigation State
  const [currentFolderId, setCurrentFolderId] = useState('root');
  const [breadcrumbs, setBreadcrumbs] = useState<{ id: string, name: string }[]>([{ id: 'root', name: 'My Drive' }]);

  useEffect(() => {
    if (!user) return;

    let q;

    if (filter === 'shared') {
      if (!user.email) return;

      if (sharedSubFilter === 'with_me' || sharedSubFilter === 'invitations') {
        q = query(
          collectionGroup(db, 'user_files'),
          where('sharedWithEmails', 'array-contains', user.email.toLowerCase()),
          where('isDeleted', '==', false)
        );
      } else {
        // "You shared" - Query own files
        q = query(
          collection(db, 'users', user.uid, 'user_files'),
          where('isDeleted', '==', false)
        );
      }
    } else if (filter === 'all') {
      // "Home" - Show Recently Opened/Uploaded across all folders
      q = query(
        collection(db, 'users', user.uid, 'user_files'),
        where('isDeleted', '==', false),
        orderBy('uploadTimestamp', 'desc'),
        limit(12)
      );
    } else {
      q = query(
        collection(db, 'users', user.uid, 'user_files'),
        where('isDeleted', '==', false)
      );

      if (filter === 'starred') {
        q = query(q, where('isStarred', '==', true));
      } else if (filter === 'files' && !searchQuery) {
        q = query(q, where('parentId', '==', currentFolderId));
      }
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let docs = snapshot.docs.map(doc => doc.data() as FileEntry);

      if (filter === 'shared' && sharedSubFilter === 'by_me') {
        // Client-side filter for shared files (Firestore doesn't support logical OR for complex queries easily)
        docs = docs.filter(f => f.isPubliclyShared || (f.sharedWithEmails && f.sharedWithEmails.length > 0));
      }

      if (filter === 'shared' && sharedSubFilter === 'invitations') {
        // Placeholder for invitations logic - maybe filter by a 'pending' status if added later
        // For now, let's say Invitations are files shared with user in the last 48 hours
        const twoDaysAgo = Date.now() - (48 * 60 * 60 * 1000);
        docs = docs.filter(f => (f.uploadTimestamp?.seconds * 1000) > twoDaysAgo);
      }

      if (filter === 'all') {
        // Filter out folders from "Recently Opened" view to keep it clean
        docs = docs.filter(f => f.fileType !== 'Folder');
      }

      if (searchQuery) {
        docs = docs.filter(f => f.fileName.toLowerCase().includes(searchQuery.toLowerCase()));
      }

      docs.sort((a, b) => {
        if (filter === 'all') {
          const timeA = a.lastOpenedTimestamp?.seconds || a.uploadTimestamp?.seconds || 0;
          const timeB = b.lastOpenedTimestamp?.seconds || b.uploadTimestamp?.seconds || 0;
          return timeB - timeA;
        }

        if (a.fileType === 'Folder' && b.fileType !== 'Folder') return -1;
        if (a.fileType !== 'Folder' && b.fileType === 'Folder') return 1;
        const timeA = a.uploadTimestamp?.seconds || 0;
        const timeB = b.uploadTimestamp?.seconds || 0;
        return timeB - timeA;
      });

      setFiles(docs);
      setIsLoading(false);
    }, (error) => {
      console.error("[DASHBOARD] Sync Error:", error);
      showToast("Sync failed. Check your connection.", "error");
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user, filter, currentFolderId, searchQuery, showToast, sharedSubFilter]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!user || !userMetadata) return;

    for (const file of acceptedFiles) {
      const tempId = Math.random().toString(36).substring(7);
      const toastId = showToast(`Uploading ${file.name}...`, 'loading');
      setUploadingFiles(prev => ({ ...prev, [tempId]: 1 }));

      try {
        await uploadFile(
          user.uid,
          file,
          userMetadata.storageUsed,
          userMetadata.storageAvailable,
          (progress) => {
            setUploadingFiles(prev => ({ ...prev, [tempId]: progress }));
          },
          currentFolderId
        );
        hideToast(toastId);
        showToast(`${file.name} uploaded successfully`, 'success');
      } catch (error: any) {
        hideToast(toastId);
        showToast(error.message, 'error');
      } finally {
        setTimeout(() => {
          setUploadingFiles(prev => {
            const next = { ...prev };
            delete next[tempId];
            return next;
          });
        }, 1500);
      }
    }
  }, [user, userMetadata, showToast, hideToast, currentFolderId]);

  const handleCreateFolder = useCallback(async () => {
    const folderName = prompt("Enter folder name:");
    if (!folderName || !user) return;

    const toastId = showToast('Creating folder...', 'loading');
    try {
      await createFolder(user.uid, folderName, currentFolderId);
      hideToast(toastId);
      showToast(`Folder "${folderName}" created`, 'success');
    } catch (error: any) {
      hideToast(toastId);
      showToast(error.message, 'error');
    }
  }, [user, currentFolderId, showToast, hideToast]);

  const navigateToFolder = useCallback((folder: FileEntry) => {
    setCurrentFolderId(folder.fileId);
    setBreadcrumbs(prev => [...prev, { id: folder.fileId, name: folder.fileName }]);
  }, []);

  const navigateToBreadcrumb = useCallback((index: number) => {
    const target = breadcrumbs[index];
    setCurrentFolderId(target.id);
    setBreadcrumbs(breadcrumbs.slice(0, index + 1));
  }, [breadcrumbs]);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    noClick: true,
    noKeyboard: true
  });

  const toggleStar = useCallback(async (file: FileEntry) => {
    if (!user) return;
    const ref = doc(db, 'users', user.uid, 'user_files', file.fileId);
    await updateDoc(ref, { isStarred: !file.isStarred });
  }, [user]);

  const toggleLock = useCallback(async (file: FileEntry) => {
    if (!user) return;
    const ref = doc(db, 'users', user.uid, 'user_files', file.fileId);
    await updateDoc(ref, { isLocked: !file.isLocked });
    showToast(file.isLocked ? "Folder decrypted" : "Folder locked with AES-256", "success");
  }, [user, showToast]);

  const handleUnlock = useCallback(() => {
    // For now, use the first 4 digits of the user's displayId as the PIN
    const expectedPin = userMetadata?.displayId?.substring(0, 4) || '1234';

    if (pinInput === expectedPin) {
      if (folderToUnlock) {
        setUnlockedFolderIds(prev => [...prev, folderToUnlock.fileId]);
        navigateToFolder(folderToUnlock);
      }
      setIsUnlockModalOpen(false);
      setPinInput('');
      setFolderToUnlock(null);
      showToast("Access granted", "success");
    } else {
      showToast("Invalid security key", "error");
      setPinInput('');
    }
  }, [pinInput, userMetadata, folderToUnlock, navigateToFolder, showToast]);

  const handleMoveToTrash = useCallback(async (file: FileEntry) => {
    if (!user) return;
    try {
      await moveToTrash(user.uid, file.fileId);
      showToast(`"${file.fileName}" moved to trash`, 'success');
    } catch (error: any) {
      showToast(error.message, 'error');
    }
  }, [user, showToast]);

  const handleRename = useCallback(async (fileId: string) => {
    if (!user || !newName.trim()) return;
    const toastId = showToast('Renaming...', 'loading');
    try {
      await updateFileName(user.uid, fileId, newName);
      hideToast(toastId);
      showToast('File renamed', 'success');
      setEditingFile(null);
    } catch (error: any) {
      hideToast(toastId);
      showToast(error.message, 'error');
    }
  }, [user, newName, showToast, hideToast]);

  const handleDownload = useCallback((file: FileEntry) => {
    if (user) updateLastOpened(user.uid, file.fileId);
    const link = document.createElement('a');
    link.href = file.downloadUrl;
    link.download = file.fileName;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Downloading ${file.fileName}...`, 'info');
  }, [showToast]);

  const handleShareFile = useCallback(async (file: FileEntry) => {
    if (!user) return;
    try {
      const token = await generatePublicShareLink(user.uid, file);
      const shareUrl = `${window.location.origin}/#shared/${token}`;
      await navigator.clipboard.writeText(shareUrl);
      showToast("Secure unique share link copied to clipboard!", "success");
    } catch (error: any) {
      console.error("[SHARE] Error:", error);
      showToast("Failed to generate share link", "error");
    }
  }, [user, showToast]);

  const toggleSelection = useCallback((e: React.MouseEvent, fileId: string) => {
    e.stopPropagation();
    setSelectedFileIds(prev =>
      prev.includes(fileId) ? prev.filter(id => id !== fileId) : [...prev, fileId]
    );
  }, []);

  const handleBatchDelete = useCallback(async () => {
    if (!user || selectedFileIds.length === 0) return;
    if (!confirm(`Move ${selectedFileIds.length} items to trash?`)) return;

    const toastId = showToast('Moving to trash...', 'loading');
    try {
      for (const id of selectedFileIds) {
        await moveToTrash(user.uid, id);
      }
      showToast('Items moved to trash', 'success');
      setSelectedFileIds([]);
    } catch (error: any) {
      showToast(error.message, 'error');
    }
  }, [user, selectedFileIds, showToast]);

  const handleBatchStar = useCallback(async () => {
    if (!user || selectedFileIds.length === 0) return;
    try {
      const batch = writeBatch(db);
      selectedFileIds.forEach(id => {
        const ref = doc(db, 'users', user.uid, 'user_files', id);
        batch.update(ref, { isStarred: true });
      });
      await batch.commit();
      showToast('Items starred', 'success');
      setSelectedFileIds([]);
    } catch (error: any) {
      showToast(error.message, 'error');
    }
  }, [user, selectedFileIds, showToast]);

  const handleFileClick = useCallback((e: React.MouseEvent, file: FileEntry) => {
    if (e.shiftKey || selectedFileIds.length > 0) {
      toggleSelection(e, file.fileId);
    } else if (file.fileType === 'Folder') {
      if (file.isLocked && !unlockedFolderIds.includes(file.fileId)) {
        setFolderToUnlock(file);
        setIsUnlockModalOpen(true);
      } else {
        navigateToFolder(file);
      }
    } else {
      setSelectedFileForInfo(file);
    }
  }, [selectedFileIds, toggleSelection, navigateToFolder, unlockedFolderIds]);

  if (!user) return null;

  return (
    <div {...getRootProps()} className="min-h-screen relative bg-surface transition-colors">
      <input {...getInputProps()} />

      {isShareModalOpen && (
        <ShareFileModal
          isOpen={isShareModalOpen}
          onClose={() => {
            setIsShareModalOpen(false);
            setSelectedFileForShare(null);
          }}
          file={selectedFileForShare}
        />
      )}

      {previewFile && (
        <MediaPreviewer
          file={previewFile}
          isOpen={!!previewFile}
          onClose={() => setPreviewFile(null)}
        />
      )}

      {selectedFileForInfo && (
        <FileInfoPanel
          file={selectedFileForInfo}
          isOpen={!!selectedFileForInfo}
          onClose={() => setSelectedFileForInfo(null)}
          onRename={(file) => {
            setEditingFile(file.fileId);
            setNewName(file.fileName);
            setSelectedFileForInfo(null);
          }}
          onShare={handleShareFile}
          onDownload={handleDownload}
          onDelete={handleMoveToTrash}
          onToggleLock={toggleLock}
        />
      )}

      {isUnlockModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsUnlockModalOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-md" />
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-sm bg-surface rounded-[2.5rem] p-10 shadow-2xl border border-outline/10 text-center">
            <div className="w-20 h-20 bg-primary-container text-primary rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner">
               <Lock size={40} />
            </div>
            <h3 className="text-2xl font-black text-on-surface mb-2">Encrypted Vault</h3>
            <p className="text-on-surface-variant text-sm font-medium mb-8 leading-relaxed">Enter the first 4 digits of your Vault ID to decrypt this folder.</p>

            <input
              type="password"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
              autoFocus
              maxLength={4}
              placeholder="••••"
              className="w-full bg-surface-variant/40 border-none rounded-2xl py-5 text-center text-3xl tracking-[1em] font-black focus:ring-2 focus:ring-primary/20 outline-none mb-6 transition-all"
            />

            <div className="flex flex-col gap-3">
              <button
                onClick={handleUnlock}
                className="w-full py-4 bg-primary text-on-primary font-black rounded-2xl transition-all active:scale-95 shadow-lg shadow-primary/20 uppercase tracking-widest text-xs"
              >
                Unlock Folder
              </button>
              <button
                onClick={() => setIsUnlockModalOpen(false)}
                className="w-full py-4 bg-surface-variant/50 text-on-surface-variant font-black rounded-2xl transition-all active:scale-95 uppercase tracking-widest text-xs"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {isMoveModalOpen && (
        <MoveToFolderModal
          isOpen={isMoveModalOpen}
          onClose={() => setIsMoveModalOpen(false)}
          selectedFileIds={selectedFileIds}
        />
      )}

      <BatchActionBar
        selectedCount={selectedFileIds.length}
        onClearSelection={() => setSelectedFileIds([])}
        onBatchStar={handleBatchStar}
        onBatchMove={() => setIsMoveModalOpen(true)}
        onBatchDelete={handleBatchDelete}
      />

      <div className="p-10 max-w-7xl mx-auto min-h-full flex flex-col gap-10">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-3">
            <h1 className="text-display-small font-black text-on-surface flex items-center gap-3">
              {filter === 'starred' ? <Star className="text-primary fill-primary" /> : <Cloud className="text-primary" />}
              {filter === 'starred' ? 'Favourites' :
               filter === 'shared' ? (sharedSubFilter === 'with_me' ? 'Shared with you' : sharedSubFilter === 'by_me' ? 'You shared' : 'Invitations') :
               filter === 'all' ? 'Recently Opened' : 'My Drive'}
            </h1>

            {filter === 'shared' && (
              <div className="flex bg-surface-variant/30 p-1 rounded-2xl w-fit">
                <button
                  onClick={() => setSharedSubFilter('by_me')}
                  className={cn(
                    "px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                    sharedSubFilter === 'by_me'
                      ? "bg-primary text-on-primary shadow-lg"
                      : "text-on-surface-variant hover:bg-surface-variant/50"
                  )}
                >
                  You shared
                </button>
                <button
                  onClick={() => setSharedSubFilter('with_me')}
                  className={cn(
                    "px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                    sharedSubFilter === 'with_me'
                      ? "bg-primary text-on-primary shadow-lg"
                      : "text-on-surface-variant hover:bg-surface-variant/50"
                  )}
                >
                  Shared with you
                </button>
                <button
                  onClick={() => setSharedSubFilter('invitations')}
                  className={cn(
                    "px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                    sharedSubFilter === 'invitations'
                      ? "bg-primary text-on-primary shadow-lg"
                      : "text-on-surface-variant hover:bg-surface-variant/50"
                  )}
                >
                  Invitations
                </button>
              </div>
            )}

            {filter === 'files' && !searchQuery && (
              <nav className="flex items-center gap-1.5 px-1">
                {breadcrumbs.map((crumb, index) => (
                  <React.Fragment key={crumb.id}>
                    {index > 0 && <ChevronRight size={16} className="text-outline/40" />}
                    <button
                      onClick={() => navigateToBreadcrumb(index)}
                      className={cn(
                        "text-sm font-bold transition-all px-2 py-1 rounded-lg",
                        index === breadcrumbs.length - 1
                          ? "text-primary bg-primary-container/20"
                          : "text-on-surface-variant hover:bg-surface-variant/50"
                      )}
                    >
                      {crumb.name}
                    </button>
                  </React.Fragment>
                ))}
              </nav>
            )}
          </div>

          <div className="flex items-center gap-3">
             {filter === 'files' && (
               <button
                 onClick={handleCreateFolder}
                 className="flex items-center gap-3 px-6 py-3.5 bg-surface text-on-surface-variant border border-outline/20 rounded-2xl text-sm font-black hover:bg-surface-variant/30 transition-all active:scale-95"
               >
                 <FolderPlus size={20} className="text-primary" />
                 <span>New Folder</span>
               </button>
             )}

             <div className="flex bg-surface-variant/30 p-1.5 rounded-2xl">
                <button
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    "p-2.5 rounded-xl transition-all",
                    viewMode === 'grid' ? "bg-surface text-primary shadow-md" : "text-on-surface-variant hover:bg-surface-variant/50"
                  )}
                >
                  <Grid size={20} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={cn(
                    "p-2.5 rounded-xl transition-all",
                    viewMode === 'list' ? "bg-surface text-primary shadow-md" : "text-on-surface-variant hover:bg-surface-variant/50"
                  )}
                >
                  <ListIcon size={20} />
                </button>
             </div>

             {(filter === 'all' || filter === 'files') && (
               <button
                  onClick={open}
                  className="bg-primary text-on-primary px-8 py-4 rounded-[1.5rem] font-black flex items-center gap-3 shadow-xl shadow-primary/20 transition-all hover:shadow-2xl active:scale-95"
                >
                  <Plus size={24} />
                  <span>Upload</span>
                </button>
             )}
          </div>
        </header>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-1">
          <div className="space-y-8 lg:col-span-1">

            <AnimatePresence>
              {Object.keys(uploadingFiles).length > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-primary-container text-on-primary-container rounded-[2rem] p-6 border border-primary/10 shadow-lg"
                >
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-label-large font-black flex items-center gap-3">
                      <Loader2 className="animate-spin text-primary" size={18} />
                      Syncing {Object.keys(uploadingFiles).length} Files...
                    </h3>
                  </div>
                  <div className="space-y-4">
                    {Object.entries(uploadingFiles).map(([id, progress]) => (
                        <div key={id} className="space-y-2">
                          <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest opacity-60">
                             <span className="flex items-center gap-2 text-primary">
                                Transferring to Supabase
                             </span>
                             <span>{Math.round(progress)}%</span>
                          </div>
                          <div className="w-full bg-on-primary-container/10 rounded-full h-2 overflow-hidden">
                            <motion.div
                              className="bg-primary h-full"
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.max(2, progress)}%` }}
                              transition={{ duration: 0.4 }}
                            />
                          </div>
                        </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className={`relative transition-all duration-300 min-h-[600px] ${isDragActive ? 'scale-[0.98]' : ''}`}>
              {isLoading ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="animate-spin text-primary" size={48} />
                </div>
              ) : files.length === 0 && !isDragActive ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-16 bg-surface-variant/10 border-2 border-dashed border-outline/10 rounded-[3rem]">
                  <div className="w-24 h-24 bg-primary-container text-primary rounded-[2rem] flex items-center justify-center mb-8 shadow-inner">
                    {filter === 'starred' ? <Star size={48} /> : <Cloud size={48} />}
                  </div>
                  <h2 className="text-headline-small font-black text-on-surface mb-3">
                    {filter === 'starred' ? 'Empty Favourites' :
                     filter === 'all' ? 'No Recent Activity' : 'Cloud Empty'}
                  </h2>
                  <p className="text-on-surface-variant font-medium max-w-sm mx-auto leading-relaxed">
                    {filter === 'starred'
                      ? 'Star your most critical encrypted files to access them instantly from this vault.'
                      : filter === 'all'
                      ? 'Your recently opened or uploaded files will appear here for rapid access.'
                      : 'Your secure workspace is ready. Drop files here to encrypt and store them globally.'}
                  </p>
                </div>
              ) : (
                <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6" : "space-y-3"}>
                  {files.map((file) => (
                    <FileItem
                      key={file.fileId}
                      file={file}
                      viewMode={viewMode}
                      isSelected={selectedFileIds.includes(file.fileId)}
                      isActive={selectedFileForInfo?.fileId === file.fileId}
                      editingFile={editingFile}
                      newName={newName}
                      onNewNameChange={setNewName}
                      onRenameSubmit={handleRename}
                      onCancelRename={() => setEditingFile(null)}
                      onToggleSelection={toggleSelection}
                      onClick={(e) => handleFileClick(e, file)}
                      onDoubleClick={() => {
                        if (file.fileType !== 'Folder') {
                          if (user) updateLastOpened(user.uid, file.fileId);
                          setPreviewFile(file);
                        }
                      }}
                      onToggleStar={toggleStar}
                      onDownload={handleDownload}
                      onShare={handleShareFile}
                      onDelete={handleMoveToTrash}
                    />
                  ))}
                </div>
              )}

              <AnimatePresence>
                {isDragActive && (
                  <motion.div
                    initial={{ opacity: 0, scale: 1.05 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.05 }}
                    className="absolute inset-0 bg-primary/95 backdrop-blur-md z-50 rounded-[3rem] flex items-center justify-center text-on-primary p-16 text-center shadow-2xl border-4 border-white/20"
                  >
                     <div className="space-y-6">
                        <div className="w-32 h-32 bg-white/10 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-inner animate-pulse">
                           <Cloud size={64} fill="currentColor" fillOpacity={0.4} />
                        </div>
                        <h2 className="text-5xl font-black tracking-tighter">Ready to Encrypt</h2>
                        <p className="text-on-primary/70 text-xl font-medium max-w-sm">Release to instantly sync your data with AES-256 protection.</p>
                     </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
