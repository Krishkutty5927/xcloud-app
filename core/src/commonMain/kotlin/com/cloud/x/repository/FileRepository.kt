package com.cloud.x.repository

import com.cloud.x.model.FileEntry
import com.cloud.x.model.UserMetadata
import com.cloud.x.util.FileUploadManager
import com.cloud.x.util.SupabaseManager
import com.cloud.x.util.currentTimeMillis
import com.cloud.x.util.MetadataManager
import com.cloud.x.util.sanitizeFileName
import dev.gitlive.firebase.Firebase
import dev.gitlive.firebase.firestore.FieldValue
import dev.gitlive.firebase.firestore.firestore
import dev.gitlive.firebase.firestore.Timestamp
import io.github.jan.supabase.storage.storage
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.delay
import kotlin.time.Duration.Companion.milliseconds

class FileRepository {
    private val firestore = Firebase.firestore
    private val supabase = SupabaseManager.client
    private val activityRepository = UserActivityRepository()

    /**
     * Recursively updates the size of parent folders.
     */
    private suspend fun updateParentFolderSizes(userId: String, parentId: String, sizeDelta: Long) {
        if ((parentId.isEmpty()) || (parentId == "root")) return

        try {
            val parentRef = firestore.collection("users").document(userId)
                .collection("user_files").document(parentId)
            val parentSnap = parentRef.get()

            if (parentSnap.exists) {
                val data = parentSnap.data<FileEntry>()
                parentRef.update("fileSize" to FieldValue.increment(sizeDelta.toDouble()))

                // Continue recursion to next parent
                if (data.parentId.isNotEmpty() && data.parentId != "root") {
                    updateParentFolderSizes(userId, data.parentId, sizeDelta)
                }
            }
        } catch (e: Exception) {
            println("[SYS] Folder size sync failed: ${e.message}")
        }
    }

    suspend fun saveFileMetadata(userId: String, fileEntry: FileEntry): Result<Unit> {
        return try {
            firestore.collection("users").document(userId)
                .collection("user_files").document(fileEntry.fileId).set(fileEntry)
            
            firestore.collection("users").document(userId)
                .update("storageUsed" to FieldValue.increment(fileEntry.fileSize.toDouble()))
            
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun moveToTrash(userId: String, fileId: String): Result<Unit> {
        return try {
            val userRef = firestore.collection("users").document(userId)
            val fileRef = userRef.collection("user_files").document(fileId)
            val trashRef = userRef.collection("trash_files").document(fileId)

            val fileSnapshot = fileRef.get()
            if (!fileSnapshot.exists) return Result.failure(Exception("File not found"))

            val fileData = fileSnapshot.data<FileEntry>()
            val trashData = fileData.copy(
                isDeleted = true,
                deletedTimestamp = Timestamp.now(),
            )

            val batch = firestore.batch()
            batch.set(trashRef, trashData)
            batch.delete(fileRef)
            batch.update(userRef, "storageUsed" to FieldValue.increment(-fileData.fileSize.toDouble()))
            
            batch.commit()

            // Update parent folder sizes
            if (fileData.parentId.isNotEmpty() && fileData.parentId != "root") {
                MetadataManager.updateParentFolderSizes(userId, fileData.parentId, -fileData.fileSize)
            }

            // Log Activity
            activityRepository.logActivity(userId, "DELETE", "Moved to trash", fileData.fileName)

            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun restoreFromTrash(userId: String, fileId: String): Result<Unit> {
        return try {
            val userRef = firestore.collection("users").document(userId)
            val fileRef = userRef.collection("user_files").document(fileId)
            val trashRef = userRef.collection("trash_files").document(fileId)

            val trashSnapshot = trashRef.get()
            if (!trashSnapshot.exists) return Result.failure(Exception("File not found in trash"))

            val trashData = trashSnapshot.data<FileEntry>()
            val fileData = trashData.copy(
                isDeleted = false,
                deletedTimestamp = null
            )

            val batch = firestore.batch()
            batch.set(fileRef, fileData)
            batch.delete(trashRef)
            batch.update(userRef, "storageUsed" to FieldValue.increment(trashData.fileSize.toDouble()))

            batch.commit()

            // Update parent folder sizes
            if (fileData.parentId.isNotEmpty() && fileData.parentId != "root") {
                MetadataManager.updateParentFolderSizes(userId, fileData.parentId, fileData.fileSize)
            }

            // Log Activity
            activityRepository.logActivity(userId, "RESTORE", "Restored from trash", fileData.fileName)

            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    fun uploadFileWithQuotaCheck(
        userId: String,
        userMetadata: UserMetadata,
        name: String,
        mimeType: String,
        size: Long,
        data: ByteArray,
        parentId: String = "root"
    ): Flow<FileUploadManager.UploadStatus> = flow {
        try {
            emit(FileUploadManager.UploadStatus.Progress(name, 0.05f))
            
            if (userId.isEmpty()) {
                emit(FileUploadManager.UploadStatus.Error(name, "User ID is missing. Please sign in again."))
                return@flow
            }
            
            // 1. Project Global Limit (450MB)
            if (size > 450 * 1024 * 1024) {
                emit(FileUploadManager.UploadStatus.Error(name, "File exceeds the 450MB project limit."))
                return@flow
            }

            // 2. Quota Validation
            if (userMetadata.storageUsed + size > userMetadata.storageAvailable) {
                emit(FileUploadManager.UploadStatus.Error(name, "Storage limit exceeded. Please upgrade your plan."))
                return@flow
            }

            val fileId = "file_${currentTimeMillis()}_${(0..999).random()}"
            val category = categorizeMimeType(mimeType)
            val cleanName = name.sanitizeFileName()
            
            // Align with web app pathing: userId/fileId-fileName
            val storagePath = "$userId/$fileId-$cleanName"
            val bucket = supabase.storage["files"]

            // 3. Upload to Supabase
            emit(FileUploadManager.UploadStatus.Progress(name, 0.15f))
            
            try {
                bucket.upload(path = storagePath, data = data) {
                    upsert = false
                }
            } catch (e: Exception) {
                emit(FileUploadManager.UploadStatus.Error(name, "Supabase Storage error: ${e.message}"))
                return@flow
            }
            
            emit(FileUploadManager.UploadStatus.Progress(name, 0.80f))

            val downloadUrl = try {
                bucket.publicUrl(storagePath)
            } catch (e: Exception) {
                emit(FileUploadManager.UploadStatus.Error(name, "Failed to get public URL: ${e.message}"))
                return@flow
            }
            
            // 4. Save Metadata to Firestore
            val fileEntry = FileEntry(
                fileId = fileId,
                fileName = name,
                fileType = category,
                fileSize = size,
                downloadUrl = downloadUrl,
                uploadTimestamp = Timestamp.now(),
                ownerId = userId,
                storagePath = storagePath,
                parentId = parentId
            )

            try {
                val userRef = firestore.collection("users").document(userId)
                userRef.collection("user_files").document(fileId).set(fileEntry)
                userRef.update("storageUsed" to FieldValue.increment(size.toDouble()))

                // 5. Update parent folder sizes recursively
                if (parentId != "root") {
                    updateParentFolderSizes(userId, parentId, size)
                }

                // 6. Log Activity
                activityRepository.logActivity(userId, "UPLOAD", "Successfully uploaded $name", name)

            } catch (e: Exception) {
                emit(FileUploadManager.UploadStatus.Error(name, "Firestore metadata error: ${e.message}"))
                return@flow
            }

            emit(FileUploadManager.UploadStatus.Progress(name, 1.0f))
            emit(FileUploadManager.UploadStatus.Success(fileEntry))

        } catch (e: Exception) {
            emit(FileUploadManager.UploadStatus.Error(name, "Unexpected upload error: ${e.message}"))
        }
    }

    private fun categorizeMimeType(mimeType: String): String {
        return when {
            mimeType.startsWith("image/") -> "Image"
            mimeType.startsWith("video/") -> "Video"
            mimeType.startsWith("audio/") -> "Audio"
            mimeType.contains("zip") -> "ZIP"
            mimeType == "application/pdf" -> "PDF"
            mimeType.startsWith("text/") || mimeType == "application/json" || mimeType == "application/javascript" -> "Text"
            else -> "Document"
        }
    }

    suspend fun deletePermanently(userId: String, file: FileEntry): Result<Unit> {
        return try {
            // 1. Delete from Supabase Storage
            val path = file.storagePath.ifEmpty { "$userId/${file.fileId}-${file.fileName}" }
            supabase.storage["files"].delete(path)

            // 2. Delete from Firestore
            firestore.collection("users").document(userId)
                .collection("user_files").document(file.fileId).delete()

            // 3. Decrement storageUsed counter
            firestore.collection("users").document(userId)
                .update("storageUsed" to FieldValue.increment(-file.fileSize.toDouble()))

            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun renameFile(userId: String, fileId: String, newName: String): Result<Unit> {
        return try {
            firestore.collection("users").document(userId)
                .collection("user_files").document(fileId).update("fileName" to newName)
            
            activityRepository.logActivity(userId, "RENAME", "Renamed file to $newName", newName)
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun updateLastOpened(userId: String, fileId: String): Result<Unit> {
        return try {
            firestore.collection("users").document(userId)
                .collection("user_files").document(fileId).update("lastOpenedTimestamp" to Timestamp.now())
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun moveFile(userId: String, fileId: String, targetFolderId: String): Result<Unit> {
        return try {
            val fileRef = firestore.collection("users").document(userId)
                .collection("user_files").document(fileId)
            
            val fileSnap = fileRef.get()
            if (!fileSnap.exists) return Result.failure(Exception("File not found"))
            
            val fileData = fileSnap.data<FileEntry>()
            val oldParentId = fileData.parentId
            
            // 1. Update the parentId of the file
            fileRef.update("parentId" to targetFolderId)
            
            // 2. Adjust parent folder sizes recursively
            if (oldParentId != targetFolderId) {
                // Remove from old parent
                if (oldParentId != "root") {
                    MetadataManager.updateParentFolderSizes(userId, oldParentId, -fileData.fileSize)
                }
                // Add to new parent
                if (targetFolderId != "root") {
                    MetadataManager.updateParentFolderSizes(userId, targetFolderId, fileData.fileSize)
                }
            }

            activityRepository.logActivity(userId, "MOVE", "Relocated to another folder", fileData.fileName)
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun toggleStar(userId: String, fileId: String, isStarred: Boolean): Result<Unit> {
        return try {
            firestore.collection("users").document(userId)
                .collection("user_files").document(fileId).update("isStarred" to isStarred)
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun toggleOfflineFlag(userId: String, fileId: String, isOffline: Boolean): Result<Unit> {
        return try {
            firestore.collection("users").document(userId)
                .collection("user_files").document(fileId).update("isOffline" to isOffline)
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun generateShareLink(
        userId: String,
        fileId: String,
        passcode: String?,
        expiryDays: Int?
    ): Result<String> {
        return try {
            val shareId = "share_${currentTimeMillis()}_${fileId.take(5)}"
            val expiryTimestamp = expiryDays?.let { Timestamp(currentTimeMillis() / 1000 + it * 24 * 60 * 60, 0) }
            
            firestore.collection("users").document(userId)
                .collection("user_files").document(fileId).update(
                    "isShared" to true,
                    "shareId" to shareId,
                    "passcode" to passcode,
                    "expiryTimestamp" to expiryTimestamp
                )
            
            // In a real app, this would be a deep link URL
            Result.success("https://xcloud.app/share/$shareId")
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    fun getFiles(userId: String): Flow<List<FileEntry>> {
        return firestore.collection("users").document(userId)
            .collection("user_files").snapshots().map { snapshot ->
                snapshot.documents.map { it.data<FileEntry>() }
            }
    }

    fun getActiveFiles(userId: String): Flow<List<FileEntry>> {
        return firestore.collection("users").document(userId)
            .collection("user_files")
            .where { "isDeleted" equalTo false }
            .snapshots()
            .map { snapshot -> snapshot.documents.map { it.data<FileEntry>() } }
    }

    fun getTrashFiles(userId: String): Flow<List<FileEntry>> {
        return firestore.collection("users").document(userId)
            .collection("user_files")
            .where { "isDeleted" equalTo true }
            .snapshots()
            .map { snapshot -> snapshot.documents.map { it.data<FileEntry>() } }
    }
}
