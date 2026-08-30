package com.cloud.x.util

import com.cloud.x.model.FileEntry
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

object OfflineManager {
    private val _cachedFiles = MutableStateFlow<Set<String>>(emptySet())
    val cachedFiles: StateFlow<Set<String>> = _cachedFiles.asStateFlow()

    fun isFileCached(fileId: String): Boolean = _cachedFiles.value.contains(fileId)

    suspend fun downloadForOffline(file: FileEntry) {
        // Simulate download delay
        delay(1000)
        _cachedFiles.value = _cachedFiles.value + file.fileId
    }

    suspend fun removeFromOffline(fileId: String) {
        _cachedFiles.value = _cachedFiles.value - fileId
    }
}
