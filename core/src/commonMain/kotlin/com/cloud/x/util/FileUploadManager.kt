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

    fun categorizeMimeType(mimeType: String, fileName: String = ""): String {
        val ext = fileName.substringAfterLast('.', "").lowercase()
        
        val videoExts = listOf(
            "mp4", "webm", "m4v",
            "mkv", "ts", "m2ts",
            "mov",
            "avi", "wmv",
            "flv", "f4v",
            "3gp", "3g2", "vob"
        )

        val docExts = listOf("docx", "doc", "odt", "rtf", "pages")
        val sheetExts = listOf("xlsx", "xls", "csv", "ods", "tsv")
        val slideExts = listOf("pptx", "ppt", "odp", "key")
        val ebookExts = listOf("epub", "mobi", "azw", "azw3")
        val textExts = listOf("txt", "md", "markdown", "log")

        return when {
            mimeType.startsWith("image/") -> "Image"
            mimeType.startsWith("video/") || videoExts.contains(ext) -> "Video"
            mimeType.startsWith("audio/") -> "Audio"
            mimeType.contains("zip") || ext == "zip" || ext == "rar" -> "ZIP"
            mimeType == "application/pdf" || ext == "pdf" -> "PDF"
            mimeType.startsWith("text/") || textExts.contains(ext) || mimeType == "application/json" || mimeType == "application/javascript" -> "Text"
            docExts.contains(ext) || sheetExts.contains(ext) || slideExts.contains(ext) || ebookExts.contains(ext) -> "Document"
            else -> "Document"
        }
    }
}
