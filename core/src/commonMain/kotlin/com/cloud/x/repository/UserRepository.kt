package com.cloud.x.repository

import com.cloud.x.model.UserMetadata
import com.cloud.x.util.SupabaseManager
import com.cloud.x.util.currentTimeMillis
import dev.gitlive.firebase.Firebase
import dev.gitlive.firebase.firestore.firestore
import io.github.jan.supabase.storage.storage
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

class UserRepository {
    private val firestore = Firebase.firestore

    suspend fun getUserMetadata(userId: String): Result<UserMetadata?> {
        return try {
            val doc = firestore.collection("users").document(userId).get()
            Result.success(doc.data())
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    fun observeUserMetadata(userId: String): Flow<UserMetadata?> {
        return firestore.collection("users").document(userId).snapshots().map { it.data() }
    }

    suspend fun updatePreference(userId: String, path: String, value: Any): Result<Unit> {
        return try {
            firestore.collection("users").document(userId).update(path to value)
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun updateProfile(userId: String, updates: Map<String, Any>): Result<Unit> {
        return try {
            val docRef = firestore.collection("users").document(userId)
            val fields = updates.toList().toTypedArray()
            docRef.update(*fields)
            Result.success(Unit)
        } catch (e: Exception) {
            println("[USER] Profile update failed: ${e.message}")
            Result.failure(e)
        }
    }

    suspend fun uploadAvatar(userId: String, fileName: String, data: ByteArray): Result<String> {
        return try {
            val bucket = SupabaseManager.client.storage["avatars"]
            val avatarId = "avatar_${currentTimeMillis()}"
            val storagePath = "$userId/$avatarId-$fileName"

            // 1. Upload to Supabase
            bucket.upload(path = storagePath, data = data) {
                upsert = true
            }

            // 2. Get Public URL
            val publicUrl = bucket.publicUrl(storagePath)

            // 3. Update Firestore
            updatePreference(userId, "profilePictureUrl", publicUrl)

            Result.success(publicUrl)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
