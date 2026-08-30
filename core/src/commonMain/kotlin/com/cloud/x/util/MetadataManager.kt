package com.cloud.x.util

import com.cloud.x.model.FileEntry
import dev.gitlive.firebase.Firebase
import dev.gitlive.firebase.firestore.FieldValue
import dev.gitlive.firebase.firestore.firestore

object MetadataManager {
    private val firestore = Firebase.firestore

    /**
     * Recursively updates the size of parent folders.
     */
    suspend fun updateParentFolderSizes(userId: String, parentId: String, sizeDelta: Long) {
        if (parentId.isEmpty() || parentId == "root") return

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
}
