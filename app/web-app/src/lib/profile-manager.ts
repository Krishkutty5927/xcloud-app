import { doc, updateDoc } from "firebase/firestore";
import { supabase } from "./supabase";
import { db } from "./firebase";

/**
 * Uploads a custom profile picture to Supabase and updates Firestore.
 */
export const uploadAvatar = async (userId: string, file: File) => {
  if (!file.type.startsWith('image/')) throw new Error("File must be an image");
  if (file.size > 5 * 1024 * 1024) throw new Error("Image must be smaller than 5MB");

  const avatarId = `avatar_${Date.now()}`;
  const storagePath = `${userId}/${avatarId}`;

  // 1. Upload to Supabase Storage ('avatars' bucket)
  const { data, error } = await supabase.storage
    .from('avatars')
    .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: true
    });

  if (error) throw error;

  // 2. Get Public URL
  const { data: { publicUrl } } = supabase.storage
    .from('avatars')
    .getPublicUrl(storagePath);

  // 3. Sync to Firestore
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    profilePictureUrl: publicUrl
  });

  return publicUrl;
};
