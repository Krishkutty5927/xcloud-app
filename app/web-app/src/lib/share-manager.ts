import { doc, updateDoc, arrayUnion, arrayRemove, getDoc } from "firebase/firestore";
import { db } from "./firebase";
import { FileEntry } from "./upload-manager";
import { logActivity } from "./activity-manager";

/**
 * Shares a file/folder with another user by email.
 */
export const shareFileWithUser = async (userId: string, fileId: string, email: string, role: 'viewer' | 'editor') => {
  if (!email.trim()) throw new Error("Email is required");

  const fileRef = doc(db, 'users', userId, 'user_files', fileId);
  const snap = await getDoc(fileRef);
  const fileName = snap.exists() ? (snap.data() as FileEntry).fileName : 'File';

  await updateDoc(fileRef, {
    sharedWith: arrayUnion({ email: email.toLowerCase(), role }),
    sharedWithEmails: arrayUnion(email.toLowerCase())
  });

  // Log Activity
  await logActivity(userId, 'SHARE', `Shared with ${email}`, fileName);
};

/**
 * Removes a collaborator from a file/folder.
 */
export const removeCollaborator = async (userId: string, fileId: string, email: string, role: 'viewer' | 'editor') => {
  const fileRef = doc(db, 'users', userId, 'user_files', fileId);

  await updateDoc(fileRef, {
    sharedWith: arrayRemove({ email, role }),
    sharedWithEmails: arrayRemove(email)
  });
};

/**
 * Toggles public link access for a file.
 */
export const togglePublicAccess = async (userId: string, fileId: string, isPublic: boolean) => {
  const fileRef = doc(db, 'users', userId, 'user_files', fileId);
  await updateDoc(fileRef, { isPublic });
};

/**
 * Generates or retrieves a secure public share link for a file.
 */
export const generatePublicShareLink = async (userId: string, file: FileEntry) => {
  if (file.shareToken) {
    return file.shareToken;
  }

  const token = crypto.randomUUID();
  const fileRef = doc(db, 'users', userId, 'user_files', file.fileId);

  await updateDoc(fileRef, {
    shareToken: token,
    isPubliclyShared: true
  });

  return token;
};
