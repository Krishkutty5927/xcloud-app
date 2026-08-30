package com.cloud.x.util

import com.cloud.x.model.FileEntry
import com.cloud.x.model.UserMetadata
import com.cloud.x.repository.FileRepository
import dev.gitlive.firebase.Firebase
import dev.gitlive.firebase.storage.storage
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow

class FileUploadManager(private val fileRepository: FileRepository) {

    sealed class UploadStatus {
        data class Progress(val fileName: String, val percentage: Float) : UploadStatus()
        data class Success(val file: FileEntry) : UploadStatus()
        data class Error(val fileName: String, val message: String) : UploadStatus()
    }

    fun uploadFile(
        userId: String,
        userMetadata: UserMetadata,
        name: String,
        mimeType: String,
        size: Long,
        data: ByteArray
    ): Flow<UploadStatus> = fileRepository.uploadFileWithQuotaCheck(userId, userMetadata, name, mimeType, size, data)

    fun categorizeMimeType(mimeType: String): String {
        return when {
            mimeType.startsWith("image/") -> "Image"
            mimeType.startsWith("video/") -> "Video"
            mimeType.startsWith("audio/") -> "Audio"
            mimeType.contains("zip") -> "ZIP"
            mimeType == "application/pdf" -> "Document (PDF)"
            else -> "Document"
        }
    }
}
