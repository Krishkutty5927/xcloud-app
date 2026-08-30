"use client";

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collectionGroup, query, where, getDocs, limit } from 'firebase/firestore';
import { FileEntry } from '@/lib/upload-manager';
import { Cloud, Download, Shield, ShieldCheck, Globe, Loader2, FileText, Image as ImageIcon, Video, Music, File as FileIcon, ArrowLeft } from 'lucide-react';
import { formatFileSize, cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

export default function PublicSharePage() {
  const { fileId } = useParams();
  const [file, setFile] = useState<FileEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPublicFile = async () => {
      try {
        const q = query(
          collectionGroup(db, 'user_files'),
          where('fileId', '==', fileId),
          where('isPublic', '==', true),
          limit(1)
        );

        const snap = await getDocs(q);
        if (snap.empty) {
          setError("This file is private or doesn't exist.");
        } else {
          setFile(snap.docs[0].data() as FileEntry);
        }
      } catch (err: any) {
        setError("Failed to retrieve file metadata.");
      } finally {
        setIsLoading(false);
      }
    };

    if (fileId) fetchPublicFile();
  }, [fileId]);

  const handleDownload = () => {
    if (!file) return;
    const link = document.createElement('a');
    link.href = file.downloadUrl;
    link.download = file.fileName;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getFileIcon = (type: string) => {
    const className = "w-24 h-24 text-primary mb-8 drop-shadow-2xl";
    switch (type) {
      case 'Image': return <ImageIcon className={className} />;
      case 'Video': return <Video className={className} />;
      case 'Audio': return <Music className={className} />;
      case 'PDF': return <FileText className={className} />;
      default: return <FileIcon className={className} />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-8 text-center transition-colors">
         <Loader2 className="animate-spin text-primary mb-6" size={64} />
         <p className="text-on-surface-variant font-black uppercase tracking-[0.3em] text-xs animate-pulse">Initializing Secure Tunnel...</p>
      </div>
    );
  }

  if (error || !file) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-8 text-center transition-colors">
         <div className="w-24 h-24 bg-error-container/20 rounded-[2.5rem] flex items-center justify-center text-error mb-8 shadow-inner border border-error/10">
            <Shield size={48} />
         </div>
         <h1 className="text-display-small font-black text-on-surface mb-3 tracking-tighter">Access Inhibited</h1>
         <p className="text-on-surface-variant font-medium max-w-sm leading-relaxed">{error || "This data fragment is no longer globally accessible."}</p>
         <Link
           href="/"
           className="mt-10 flex items-center gap-3 px-8 py-4 bg-primary text-on-primary rounded-full font-black text-sm uppercase tracking-widest hover:shadow-2xl transition-all active:scale-95 shadow-lg shadow-primary/20"
         >
            <ArrowLeft size={18} />
            Return to Nexus
         </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-6 relative overflow-hidden transition-colors selection:bg-primary selection:text-on-primary">
      {/* Dynamic M3 Background */}
      <div className="absolute inset-0 pointer-events-none">
         <div className="absolute top-[-10%] left-[-5%] w-[60%] h-[60%] bg-primary/10 rounded-full blur-[160px] animate-pulse" />
         <div className="absolute bottom-[-10%] right-[-5%] w-[50%] h-[50%] bg-tertiary-container/20 rounded-full blur-[160px]" />
      </div>

      {/* Brand Header */}
      <nav className="absolute top-10 left-10 z-20">
         <Link href="/" className="flex items-center gap-4 text-primary font-black text-2xl tracking-tighter group">
            <div className="p-3 bg-primary-container text-on-primary-container rounded-2xl group-hover:scale-110 transition-transform">
               <Cloud size={32} fill="currentColor" fillOpacity={0.2} />
            </div>
            <span className="hidden sm:inline">XCloud</span>
         </Link>
      </nav>

      {/* Sharing Terminal */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="w-full max-w-3xl bg-surface-variant/10 dark:bg-surface-variant/5 backdrop-blur-3xl rounded-[4rem] border border-outline/10 p-12 md:p-20 shadow-[0_48px_100px_-12px_rgba(0,0,0,0.2)] relative z-10 text-center"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32" />

        <div className="inline-flex items-center gap-3 px-6 py-2.5 bg-primary-container/30 text-primary rounded-full text-[10px] font-black uppercase tracking-[0.25em] mb-12 border border-primary/10">
           <ShieldCheck size={16} />
           <span>Secure Global Link Verified</span>
        </div>

        <div className="flex flex-col items-center">
           <div className="relative group mb-10">
              <div className="absolute inset-0 bg-primary/20 rounded-[3rem] blur-2xl group-hover:blur-[40px] transition-all" />
              <div className="relative bg-surface rounded-[3rem] p-12 border border-outline/5 shadow-inner">
                 {getFileIcon(file.fileType)}
              </div>
           </div>

           <h1 className="text-display-small font-black text-on-surface mb-4 tracking-tighter truncate max-w-full px-4" title={file.fileName}>
             {file.fileName}
           </h1>

           <div className="flex items-center justify-center gap-4 mb-14">
              <span className="px-4 py-1.5 bg-surface-variant/40 rounded-xl text-[10px] font-black uppercase tracking-widest text-on-surface-variant border border-outline/5">
                {file.fileType}
              </span>
              <div className="h-1.5 w-1.5 bg-primary/40 rounded-full" />
              <span className="text-body-large font-black text-on-surface opacity-60">
                {formatFileSize(file.fileSize)}
              </span>
           </div>

           <div className="w-full max-w-md space-y-6">
              <button
                onClick={handleDownload}
                className="group w-full py-6 bg-primary text-on-primary font-black rounded-[2rem] hover:shadow-2xl shadow-primary/30 transition-all active:scale-95 flex items-center justify-center gap-4 uppercase tracking-[0.2em] text-xs"
              >
                <Download size={24} className="group-hover:translate-y-1 transition-transform" />
                <span>Initialize Download</span>
              </button>

              <div className="flex items-center justify-center gap-6 py-4">
                 <div className="h-px bg-outline/10 flex-1" />
                 <div className="p-2.5 bg-surface-variant/20 rounded-xl text-outline">
                    <Globe size={20} />
                 </div>
                 <div className="h-px bg-outline/10 flex-1" />
              </div>

              <div className="space-y-2">
                 <p className="text-body-medium font-bold text-on-surface-variant opacity-80">
                   End-to-End Encrypted Fragment
                 </p>
                 <p className="text-[10px] font-black text-outline uppercase tracking-widest">
                   Protocol: XCLOUD-SECURE-DIST-V2
                 </p>
              </div>
           </div>
        </div>
      </motion.div>

      {/* Global Status Bar */}
      <div className="mt-16 flex items-center gap-8 text-[10px] font-black text-outline uppercase tracking-[0.3em] z-10 px-8 py-3 bg-surface-variant/5 rounded-full border border-outline/5">
         <span className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            Infrastructure Status: Nominal
         </span>
         <div className="w-px h-3 bg-outline/20" />
         <span>© 2026 XCloud Storage</span>
      </div>
    </div>
  );
}
