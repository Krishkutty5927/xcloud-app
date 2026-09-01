"use client";

import React, { useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/context/toast-context';
import {
  Settings,
  User,
  Shield,
  Bell,
  HardDrive,
  ChevronRight,
  ToggleLeft,
  ToggleRight,
  Mail,
  Smartphone,
  Save,
  X,
  Camera,
  Calendar,
  Phone,
  Moon,
  Sun,
  Globe,
  Loader2,
  Cloud,
  Lock,
  Eye,
  EyeOff,
  AlertTriangle,
  Unlock
} from 'lucide-react';
import { formatFileSize, cn } from '@/lib/utils';
import { uploadAvatar } from '@/lib/profile-manager';
import { doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential, sendPasswordResetEmail } from 'firebase/auth';
import { motion, AnimatePresence } from 'framer-motion';
import pkg from '../../../package.json';

export default function SettingsPage() {
  const { user, userMetadata, theme, resolvedTheme, setTheme } = useAuth();
  const { showToast, hideToast } = useToast();
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [editName, setEditName] = useState(userMetadata?.name || '');
  const [editPhone, setEditPhone] = useState(userMetadata?.phoneNumber || '');
  const [editDOB, setEditDOB] = useState(userMetadata?.dateOfBirth || '');

  // Password Change State
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const avatarInputRef = React.useRef<HTMLInputElement>(null);

  // Passcode Setup State
  const [isPasscodeSetupOpen, setIsPasscodeSetupOpen] = useState(false);
  const [newPasscode, setNewPasscode] = useState('');
  const [confirmPasscode, setConfirmPasscode] = useState('');

  if (!user || !userMetadata) return null;

  const used = userMetadata.storageUsed || 0;
  const available = userMetadata.storageAvailable || 5368709120;
  const percentage = Math.min(100, Math.round((used / available) * 100));

  const updatePreference = async (path: string, value: any) => {
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        [`preferences.${path}`]: value
      });
      showToast('Preference updated', 'success');
    } catch (error: any) {
      showToast(error.message, 'error');
    }
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) return;
    setIsSaving(true);
    const toastId = showToast('Saving profile...', 'loading');
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        name: editName.trim(),
        phoneNumber: editPhone.trim(),
        dateOfBirth: editDOB.trim()
      });
      showToast('Profile updated', 'success');
      setIsEditProfileOpen(false);
    } catch (error: any) {
      showToast(error.message, 'error');
    } finally {
      hideToast(toastId);
      setIsSaving(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setIsSaving(true);
    const toastId = showToast('Uploading image...', 'loading');
    try {
      await uploadAvatar(user.uid, file);
      showToast('Avatar updated', 'success');
    } catch (error: any) {
      showToast(error.message, 'error');
    } finally {
      hideToast(toastId);
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      showToast('All fields are required', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('New passwords do not match', 'error');
      return;
    }
    if (newPassword.length < 8) {
      showToast('Password must be at least 8 characters', 'error');
      return;
    }

    setIsSaving(true);
    const toastId = showToast('Updating security keys...', 'loading');
    try {
      // Re-authenticate user
      const credential = EmailAuthProvider.credential(user.email!, currentPassword);
      await reauthenticateWithCredential(user, credential);

      // Update password
      await updatePassword(user, newPassword);

      showToast('Master access key updated successfully', 'success');
      setIsChangePasswordOpen(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.error("Password change failed:", error);
      const msg = error.code === 'auth/wrong-password' ? 'Invalid current access key' : error.message;
      showToast(msg, 'error');
    } finally {
      hideToast(toastId);
      setIsSaving(false);
    }
  };

  const handleSavePasscode = async () => {
    if (newPasscode.length < 6 || newPasscode.length > 15 || !/^\d+$/.test(newPasscode)) {
      showToast('Passcode must be 6-15 digits', 'error');
      return;
    }
    if (newPasscode !== confirmPasscode) {
      showToast('Passcodes do not match', 'error');
      return;
    }

    setIsSaving(true);
    const toastId = showToast('Configuring vault lock...', 'loading');
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        'preferences.security.passcode': newPasscode,
        'preferences.security.passcodeEnabled': true
      });
      showToast('Passcode lock enabled', 'success');
      setIsPasscodeSetupOpen(false);
      setNewPasscode('');
      setConfirmPasscode('');
    } catch (error: any) {
      showToast(error.message, 'error');
    } finally {
      hideToast(toastId);
      setIsSaving(false);
    }
  };

  return (
    <div className="p-10 max-w-5xl mx-auto min-h-full flex flex-col gap-10 bg-surface transition-colors">
      {/* Edit Profile Modal */}
      <AnimatePresence>
        {isEditProfileOpen && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsEditProfileOpen(false)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-md bg-surface rounded-[2.5rem] p-8 shadow-2xl border border-outline/10">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-headline-small font-black text-on-surface">Profile Settings</h3>
                <button onClick={() => setIsEditProfileOpen(false)} className="p-2 hover:bg-surface-variant rounded-full text-on-surface-variant"><X size={20} /></button>
              </div>
              <div className="space-y-8">
                <div className="flex justify-center">
                  <input
                    type="file"
                    ref={avatarInputRef}
                    onChange={handleAvatarChange}
                    className="hidden"
                    accept="image/*"
                  />
                  <div
                    onClick={() => avatarInputRef.current?.click()}
                    className="relative group cursor-pointer"
                  >
                    {userMetadata.profilePictureUrl ? (
                      <img src={userMetadata.profilePictureUrl} className="w-28 h-24 rounded-3xl border-4 border-surface shadow-xl object-cover" />
                    ) : (
                      <div className="w-28 h-24 rounded-3xl bg-primary-container text-on-primary-container flex items-center justify-center text-4xl font-black shadow-xl">{userMetadata.name.charAt(0)}</div>
                    )}
                    <div className="absolute inset-0 bg-primary/40 rounded-3xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                      <Camera className="text-on-primary" size={28} />
                    </div>
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-label-large font-black text-primary uppercase tracking-widest px-1">User ID</label>
                    <div className="w-full px-5 py-4 bg-surface-variant/30 border border-outline/10 rounded-2xl text-on-surface-variant font-mono text-sm shadow-inner">
                      {userMetadata.displayId}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-label-large font-black text-primary uppercase tracking-widest px-1">Display Name</label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Your name"
                      className="w-full px-5 py-4 bg-surface-variant/50 border border-outline/20 rounded-2xl outline-none focus:ring-2 focus:ring-primary focus:bg-surface transition-all text-on-surface font-bold shadow-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-label-large font-black text-primary uppercase tracking-widest px-1">Phone</label>
                      <input
                        type="tel"
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        placeholder="+1..."
                        className="w-full px-5 py-4 bg-surface-variant/50 border border-outline/20 rounded-2xl outline-none focus:ring-2 focus:ring-primary focus:bg-surface transition-all text-on-surface font-bold shadow-sm text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-label-large font-black text-primary uppercase tracking-widest px-1">Birth Date</label>
                      <input
                        type="text"
                        value={editDOB}
                        onChange={(e) => setEditDOB(e.target.value)}
                        placeholder="YYYY-MM-DD"
                        className="w-full px-5 py-4 bg-surface-variant/50 border border-outline/20 rounded-2xl outline-none focus:ring-2 focus:ring-primary focus:bg-surface transition-all text-on-surface font-bold shadow-sm text-sm"
                      />
                    </div>
                  </div>
                  <div className="space-y-2 opacity-60">
                    <label className="text-label-large font-black text-outline uppercase tracking-widest px-1">Email (Immutable)</label>
                    <div className="w-full px-5 py-4 bg-surface-variant/20 border border-outline/5 rounded-2xl text-on-surface-variant text-sm font-medium">
                      {user.email}
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="w-full py-4 bg-primary text-on-primary font-black rounded-3xl hover:shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="animate-spin" size={20} /> : <><Save size={20} /> Update Profile</>}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isChangePasswordOpen && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsChangePasswordOpen(false)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-md bg-surface rounded-[2.5rem] p-8 shadow-2xl border border-outline/10 overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -mr-16 -mt-16" />

              <div className="flex justify-between items-center mb-8 relative z-10">
                <div className="flex items-center gap-3">
                   <div className="p-2 bg-primary-container text-on-primary-container rounded-xl">
                      <Lock size={20} />
                   </div>
                   <h3 className="text-xl font-black text-on-surface">Change Password</h3>
                </div>
                <button onClick={() => setIsChangePasswordOpen(false)} className="p-2 hover:bg-surface-variant rounded-full text-on-surface-variant"><X size={20} /></button>
              </div>

              <div className="space-y-6 relative z-10">
                <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 flex gap-4">
                   <AlertTriangle className="text-primary shrink-0" size={18} />
                   <p className="text-[10px] font-bold text-primary uppercase leading-relaxed tracking-wider">Re-authentication is required to change your vault password.</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-primary uppercase tracking-[0.2em] px-1">Current Password</label>
                    <div className="relative">
                       <input
                        type={showPasswords ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter current password"
                        className="w-full px-5 py-4 bg-surface-variant/30 border border-outline/10 rounded-2xl outline-none focus:ring-2 focus:ring-primary focus:bg-surface transition-all text-on-surface font-medium"
                      />
                      <button onClick={() => setShowPasswords(!showPasswords)} className="absolute right-4 top-1/2 -translate-y-1/2 text-outline/50 hover:text-primary transition-colors">
                         {showPasswords ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-primary uppercase tracking-[0.2em] px-1">New Password</label>
                    <input
                      type={showPasswords ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 8 characters"
                      className="w-full px-5 py-4 bg-surface-variant/30 border border-outline/10 rounded-2xl outline-none focus:ring-2 focus:ring-primary focus:bg-surface transition-all text-on-surface font-medium"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-primary uppercase tracking-[0.2em] px-1">Confirm New Password</label>
                    <input
                      type={showPasswords ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Verify new password"
                      className="w-full px-5 py-4 bg-surface-variant/30 border border-outline/10 rounded-2xl outline-none focus:ring-2 focus:ring-primary focus:bg-surface transition-all text-on-surface font-medium"
                    />
                  </div>
                </div>

                <button
                  onClick={handleChangePassword}
                  disabled={isSaving}
                  className="w-full py-5 bg-primary text-on-primary font-black rounded-3xl hover:shadow-2xl shadow-primary/20 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="animate-spin" size={20} /> : "Update Password"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Passcode Setup Modal */}
      <AnimatePresence>
        {isPasscodeSetupOpen && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsPasscodeSetupOpen(false)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-sm bg-surface rounded-[2.5rem] p-8 shadow-2xl border border-outline/10">
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                   <div className="p-2 bg-primary-container text-on-primary-container rounded-xl">
                      <Lock size={20} />
                   </div>
                   <h3 className="text-xl font-black text-on-surface">Setup Passcode</h3>
                </div>
                <button onClick={() => setIsPasscodeSetupOpen(false)} className="p-2 hover:bg-surface-variant rounded-full text-on-surface-variant"><X size={20} /></button>
              </div>

              <div className="space-y-6">
                <p className="text-xs text-on-surface-variant font-medium leading-relaxed">Enter a 6-15 digit number to secure your vault. You'll need this every time you open XCloud.</p>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-primary uppercase tracking-[0.2em] px-1">New Passcode</label>
                    <input
                      type="password"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={newPasscode}
                      onChange={(e) => setNewPasscode(e.target.value.replace(/\D/g, '').slice(0, 15))}
                      placeholder="6-15 digits"
                      className="w-full px-5 py-4 bg-surface-variant/30 border border-outline/10 rounded-2xl outline-none focus:ring-2 focus:ring-primary focus:bg-surface transition-all text-on-surface font-black tracking-[0.5em] text-center"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-primary uppercase tracking-[0.2em] px-1">Confirm Passcode</label>
                    <input
                      type="password"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={confirmPasscode}
                      onChange={(e) => setConfirmPasscode(e.target.value.replace(/\D/g, '').slice(0, 15))}
                      placeholder="Verify digits"
                      className="w-full px-5 py-4 bg-surface-variant/30 border border-outline/10 rounded-2xl outline-none focus:ring-2 focus:ring-primary focus:bg-surface transition-all text-on-surface font-black tracking-[0.5em] text-center"
                    />
                  </div>
                </div>

                <button
                  onClick={handleSavePasscode}
                  disabled={isSaving}
                  className="w-full py-5 bg-primary text-on-primary font-black rounded-3xl hover:shadow-2xl shadow-primary/20 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="animate-spin" size={20} /> : "Enable Vault Lock"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <header className="space-y-2">
        <h1 className="text-display-small font-black text-on-surface tracking-tighter text-primary">Vault Settings</h1>
        <p className="text-on-surface-variant text-sm font-medium">
          Configure your identity, security protocols, and visual preferences.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-8 pb-20">
        {/* Profile Section */}
        <section className="bg-surface-variant/10 border border-outline/5 rounded-[3rem] p-10 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32 group-hover:scale-110 transition-transform duration-1000" />

          <div className="flex items-center justify-between mb-10 relative z-10">
            <div className="flex items-center gap-5">
              <div className="p-4 bg-primary-container text-on-primary-container rounded-3xl shadow-sm">
                <User size={28} />
              </div>
              <div>
                <h2 className="text-headline-small font-black text-on-surface">Identity</h2>
                <p className="text-body-small text-on-surface-variant font-bold uppercase tracking-widest">Public profile data</p>
              </div>
            </div>
            <button
              onClick={() => {
                setEditName(userMetadata.name);
                setIsEditProfileOpen(true);
              }}
              className="px-6 py-3 bg-primary/10 text-primary rounded-2xl text-sm font-black hover:bg-primary hover:text-on-primary transition-all active:scale-90"
            >
              Edit Profile
            </button>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-10 p-8 bg-surface rounded-[2.5rem] border border-outline/10 shadow-inner relative z-10">
            <div className="relative group">
               {userMetadata?.profilePictureUrl ? (
                 <img src={userMetadata.profilePictureUrl} className="w-32 h-28 rounded-[2rem] border-4 border-surface shadow-2xl object-cover" alt="Profile" />
               ) : (
                 <div className="w-32 h-28 rounded-[2rem] bg-primary-container text-on-primary-container flex items-center justify-center text-5xl font-black shadow-2xl">
                   {userMetadata?.name?.charAt(0)}
                 </div>
               )}
            </div>
            <div className="text-center md:text-left space-y-2 flex-1">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <p className="font-black text-on-surface text-3xl tracking-tight">{userMetadata?.name}</p>
                <span className="w-fit text-[10px] font-mono bg-surface-variant px-3 py-1.5 rounded-full text-on-surface-variant font-bold border border-outline/10">ID: {userMetadata.displayId}</span>
              </div>
              <p className="text-on-surface-variant font-bold text-sm opacity-70">{user.email}</p>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-4">
                <span className="text-[10px] font-black text-on-primary bg-primary px-3 py-1 rounded-full uppercase tracking-widest shadow-md">
                   {userMetadata?.provider?.split('.')[0] || 'Direct'} Verified
                </span>
                {userMetadata.phoneNumber && (
                  <span className="text-[10px] font-black text-on-surface-variant bg-surface-variant px-3 py-1 rounded-full flex items-center gap-2 uppercase tracking-widest border border-outline/5">
                    <Phone size={10} className="text-primary" /> {userMetadata.phoneNumber}
                  </span>
                )}
                {userMetadata.dateOfBirth && (
                  <span className="text-[10px] font-black text-on-surface-variant bg-surface-variant px-3 py-1 rounded-full flex items-center gap-2 uppercase tracking-widest border border-outline/5">
                    <Calendar size={10} className="text-primary" /> {userMetadata.dateOfBirth}
                  </span>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Cloud Storage Section */}
        <section className="bg-surface-variant/10 border border-outline/5 rounded-[3rem] p-10 shadow-sm">
          <div className="flex items-center gap-5 mb-10">
            <div className="p-4 bg-secondary-container text-on-secondary-container rounded-3xl shadow-sm">
              <HardDrive size={28} />
            </div>
            <div>
              <h2 className="text-headline-small font-black text-on-surface">Data Vault</h2>
              <p className="text-body-small text-on-surface-variant font-bold uppercase tracking-widest">Storage infrastructure</p>
            </div>
          </div>

          <div className="bg-surface p-8 rounded-[2.5rem] border border-outline/10 space-y-8">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-label-large font-black text-primary uppercase tracking-widest mb-1">Quota Usage</p>
                <div className="flex items-baseline gap-3">
                   <p className="text-4xl font-black text-on-surface tracking-tighter">{(used / (1024 * 1024)).toFixed(1)} MB</p>
                   <p className="text-sm text-on-surface-variant font-bold opacity-60">of {(available / (1024 * 1024 * 1024)).toFixed(0)} GB utilized</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-primary">{percentage}%</span>
              </div>
            </div>

            <div className="w-full bg-surface-variant rounded-full h-5 overflow-hidden p-1 shadow-inner">
              <motion.div
                className="bg-primary h-full rounded-full shadow-[0_0_15px_rgba(var(--md-sys-color-primary-rgb),0.3)]"
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 1, ease: "circOut" }}
              />
            </div>

            <div className="p-4 bg-primary-container/20 rounded-2xl border border-primary/5 flex items-center gap-4">
               <Shield className="text-primary" size={20} />
               <p className="text-xs font-bold text-on-primary-container opacity-80">Encryption: AES-256-GCM Hardware accelerated</p>
            </div>
          </div>
        </section>

        {/* Preferences Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           {/* Appearance Section */}
           <div className="bg-surface-variant/10 border border-outline/5 rounded-[3rem] p-10 shadow-sm">
              <div className="flex items-center gap-5 mb-10">
                <div className="p-4 bg-tertiary-container text-on-tertiary-container rounded-3xl shadow-sm">
                  {resolvedTheme === 'dark' ? <Moon size={28} /> : <Sun size={28} />}
                </div>
                <div>
                  <h3 className="text-headline-small font-black text-on-surface">Visuals</h3>
                  <p className="text-body-small text-on-surface-variant font-bold uppercase tracking-widest">Interface styling</p>
                </div>
              </div>
              <div className="space-y-6">
                <div className="grid grid-cols-3 gap-2 p-1.5 bg-surface-variant/40 rounded-[1.5rem] border border-outline/5">
                   {['light', 'dark', 'system'].map((t) => (
                     <button
                       key={t}
                       onClick={() => setTheme(t as any)}
                       className={cn(
                         "py-3 px-4 rounded-xl text-xs font-black transition-all capitalize tracking-widest",
                         theme === t
                           ? "bg-surface text-primary shadow-lg scale-105"
                           : "text-on-surface-variant hover:bg-surface/50"
                       )}
                     >
                       {t}
                     </button>
                   ))}
                </div>
                <div className="p-5 bg-surface rounded-2xl border border-outline/5 flex items-center gap-4">
                   {theme === 'system' ? <Globe className="text-primary" size={18} /> : theme === 'dark' ? <Moon className="text-primary" size={18} /> : <Sun className="text-primary" size={18} />}
                   <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">
                     {theme === 'system' ? "Linked to global system UI state" : `Locked to ${theme} interface mode`}
                   </p>
                </div>
              </div>
           </div>

           {/* Security Section */}
           <div className="bg-surface-variant/10 border border-outline/5 rounded-[3rem] p-10 shadow-sm">
              <div className="flex items-center gap-5 mb-10">
                <div className="p-4 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-3xl shadow-sm">
                  <Shield size={28} />
                </div>
                <div>
                  <h3 className="text-headline-small font-black text-on-surface">Security</h3>
                  <p className="text-body-small text-on-surface-variant font-bold uppercase tracking-widest">Protocols & Alerts</p>
                </div>
              </div>
              <div className="space-y-3">
                {[
                  {
                    id: 'security.passcodeEnabled',
                    label: 'Passcode Lock',
                    icon: userMetadata.preferences?.security?.passcodeEnabled ? Lock : Unlock,
                    enabled: userMetadata.preferences?.security?.passcodeEnabled,
                    description: '6-15 digit secure vault access',
                    type: 'action',
                    onClick: () => {
                      if (userMetadata.preferences?.security?.passcodeEnabled) {
                        updatePreference('security.passcodeEnabled', false);
                      } else {
                        setIsPasscodeSetupOpen(true);
                      }
                    }
                  },
                  { id: 'security.loginAlerts', label: 'Access Alerts', icon: Shield, enabled: userMetadata.preferences?.security?.loginAlerts, description: 'Notify on unauthorized access', type: 'toggle' },
                  { id: 'notifications.emailAlerts', label: 'Email Security', icon: Mail, enabled: userMetadata.preferences?.notifications?.emailAlerts, description: 'Security updates via email', type: 'toggle' },
                  { id: 'notifications.pushToasts', label: 'Live Feedback', icon: Bell, enabled: userMetadata.preferences?.notifications?.pushToasts, description: 'Real-time interface notifications', type: 'toggle' },
                  {
                    id: 'password.change',
                    label: 'Change Password',
                    icon: Lock,
                    description: 'Update vault access key',
                    type: 'action',
                    onClick: () => setIsChangePasswordOpen(true)
                  }
                ].map((item) => (
                  <div
                    key={item.id}
                    onClick={() => item.type === 'action' && item.onClick?.()}
                    className={cn(
                      "flex items-center justify-between p-4 bg-surface rounded-2xl border border-outline/5 group hover:border-primary/20 transition-all",
                      item.type === 'action' && "cursor-pointer active:scale-[0.98]"
                    )}
                  >
                     <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-sm",
                          item.type === 'action'
                            ? "bg-primary/5 text-primary group-hover:bg-primary group-hover:text-on-primary"
                            : "bg-surface-variant/30 text-on-surface-variant group-hover:text-primary"
                        )}>
                           <item.icon size={20} />
                        </div>
                        <div>
                           <span className="text-sm font-bold text-on-surface block leading-none mb-1">{item.label}</span>
                           <span className="text-[10px] font-medium text-on-surface-variant opacity-60 uppercase tracking-wider">{item.description}</span>
                        </div>
                     </div>

                     {item.type === 'toggle' ? (
                       <button
                         onClick={(e) => {
                           e.stopPropagation();
                           if (item.id === 'security.twoFactorEnabled') {
                             handleToggleBiometric(item.id, item.enabled || false);
                           } else {
                             updatePreference(item.id, !item.enabled);
                           }
                         }}
                         className="transition-transform active:scale-90"
                       >
                          {item.enabled
                            ? <ToggleRight className="text-primary" size={36} />
                            : <ToggleLeft className="text-outline/30" size={36} />
                          }
                       </button>
                     ) : (
                       <ChevronRight size={20} className="text-primary opacity-40 group-hover:opacity-100 transition-opacity" />
                     )}
                  </div>
                ))}

                {/* Forgotten Password Helper Link */}
                <button
                  onClick={async () => {
                    try {
                      await sendPasswordResetEmail(auth, user.email!);
                      showToast('Reset protocol initiated. Check your email.', 'success');
                    } catch (err: any) {
                      showToast(err.message, 'error');
                    }
                  }}
                  className="w-full flex items-center justify-center px-6 py-2 text-[10px] font-black text-outline hover:text-primary uppercase tracking-[0.2em] transition-colors"
                >
                  Forgotten current password? Trigger Reset
                </button>
              </div>
           </div>
        </div>

        <section className="bg-error/5 border border-error/20 rounded-[3rem] p-10 mt-8 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden group">
           <div className="absolute inset-0 bg-error/5 opacity-0 group-hover:opacity-100 transition-opacity" />
           <div className="space-y-2 text-center md:text-left relative z-10">
              <h3 className="text-headline-small font-black text-error">Decommission Vault</h3>
              <p className="text-sm text-error/70 font-bold uppercase tracking-widest">Permanent account termination</p>
              <p className="text-xs text-on-surface-variant max-w-sm mt-2 font-medium">All encrypted data will be scrubbed from multi-region storage nodes instantly.</p>
           </div>
           <button className="px-10 py-5 bg-error text-on-error font-black rounded-3xl hover:shadow-2xl shadow-error/20 transition-all active:scale-95 relative z-10 uppercase tracking-widest text-xs">
              Destroy Account
           </button>
        </section>

        {/* Version Tracking Display */}
        <div className="flex flex-col items-center justify-center pt-10 pb-4 opacity-30 select-none">
           <div className="flex items-center gap-2 mb-1">
              <Cloud size={14} className="text-primary" />
              <span className="text-[10px] font-black uppercase tracking-[0.4em]">XCloud Platform</span>
           </div>
           <p className="text-[10px] font-bold uppercase tracking-widest">
              Production Build v{pkg.version} • Nexus-1 Core
           </p>
        </div>
      </div>
    </div>
  );
}
