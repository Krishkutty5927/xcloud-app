import { doc, updateDoc, setDoc, getDoc, increment, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

/**
 * Recursively updates the size of parent folders.
 */
export const updateParentFolderSizes = async (userId: string, parentId: string, sizeDelta: number) => {
  if (!parentId || parentId === 'root') return;

  try {
    const parentRef = doc(db, 'users', userId, 'user_files', parentId);
    const parentSnap = await getDoc(parentRef);

    if (parentSnap.exists()) {
      const data = parentSnap.data();
      await updateDoc(parentRef, {
        fileSize: increment(sizeDelta)
      });

      // Continue recursion to next parent
      if (data.parentId && data.parentId !== 'root') {
        await updateParentFolderSizes(userId, data.parentId, sizeDelta);
      }
    }
  } catch (err) {
    console.error("[SYS] Folder size sync failed:", err);
  }
};

/**
 * Updates the file name in Firestore.
 */
export const updateFileName = async (userId: string, fileId: string, newName: string) => {
  if (!newName.trim()) throw new Error("Filename cannot be empty");

  const fileRef = doc(db, 'users', userId, 'user_files', fileId);
  await updateDoc(fileRef, {
    fileName: newName.trim()
  });
};

/**
 * Creates a new folder in Firestore.
 */
export const createFolder = async (userId: string, folderName: string, parentId: string = 'root') => {
  if (!folderName.trim()) throw new Error("Folder name cannot be empty");

  const folderId = `folder_${Date.now()}`;
  const folderRef = doc(db, 'users', userId, 'user_files', folderId);

  await setDoc(folderRef, {
    fileId: folderId,
    fileName: folderName.trim(),
    fileType: 'Folder',
    fileSize: 0,
    downloadUrl: '',
    uploadTimestamp: serverTimestamp(),
    ownerId: userId,
    parentId,
    isDeleted: false,
    isStarred: false,
  });

  return folderId;
};
