import { db } from "./firebase";
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  serverTimestamp,
  getDoc,
  query,
  where,
  getDocs,
  Timestamp,
  arrayUnion
} from "firebase/firestore";
import { FileEntry } from "./upload-manager";
import { logActivity } from "./activity-manager";

export interface Invitation {
  id: string;
  fileId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  senderId: string;
  senderEmail: string;
  senderName: string;
  recipientEmail: string | null;
  recipientPhone: string | null;
  passcode: string | null; // Optional 5-char alphanumeric
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  createdAt: any;
  expiresAt?: any;
  rejectedAt?: any;
  storagePath: string;
  downloadUrl: string;
}

/**
 * Creates a new sharing invitation.
 */
export const createInvitation = async (
  sender: { id: string, email: string, name: string },
  file: FileEntry,
  recipient: { email?: string, phone?: string },
  options: { passcode?: string, expiresAt?: Date }
) => {
  const id = `invite_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  const inviteRef = doc(db, 'invitations', id);

  const invitation: Invitation = {
    id,
    fileId: file.fileId,
    fileName: file.fileName,
    fileType: file.fileType,
    fileSize: file.fileSize,
    senderId: sender.id,
    senderEmail: sender.email,
    senderName: sender.name,
    recipientEmail: recipient.email?.toLowerCase() || null,
    recipientPhone: recipient.phone || null,
    passcode: options.passcode?.toUpperCase() || null,
    status: 'PENDING',
    createdAt: serverTimestamp(),
    expiresAt: options.expiresAt ? Timestamp.fromDate(options.expiresAt) : null,
    storagePath: file.storagePath,
    downloadUrl: file.downloadUrl
  };

  await setDoc(inviteRef, invitation);

  // Also update the file's shared state
  const fileRef = doc(db, 'users', sender.id, 'user_files', file.fileId);
  await updateDoc(fileRef, {
    isShared: true,
    invitationId: id
  });

  await logActivity(sender.id, 'SHARE', `Sent invitation for ${file.fileName}`, file.fileName);
  return id;
};

/**
 * Accepts an invitation.
 */
export const acceptInvitation = async (
  invitation: Invitation,
  recipientId: string,
  recipientEmail: string,
  inputPasscode?: string
) => {
  if (invitation.passcode && invitation.passcode !== inputPasscode?.toUpperCase()) {
    throw new Error("Invalid security passcode");
  }

  const inviteRef = doc(db, 'invitations', invitation.id);
  await updateDoc(inviteRef, {
    status: 'ACCEPTED',
    acceptedAt: serverTimestamp()
  });

  // Grant access to the file
  const fileRef = doc(db, 'users', invitation.senderId, 'user_files', invitation.fileId);
  await updateDoc(fileRef, {
    sharedWithEmails: arrayUnion(recipientEmail.toLowerCase()),
    sharedWith: arrayUnion({ email: recipientEmail.toLowerCase(), role: 'viewer' })
  });

  await logActivity(recipientId, 'SHARE', `Accepted invitation for ${invitation.fileName}`, invitation.fileName);
};

/**
 * Rejects an invitation.
 */
export const rejectInvitation = async (invitationId: string) => {
  const inviteRef = doc(db, 'invitations', invitationId);
  await updateDoc(inviteRef, {
    status: 'REJECTED',
    rejectedAt: serverTimestamp()
  });
};
