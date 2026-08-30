package com.cloud.x.model

import dev.gitlive.firebase.firestore.Timestamp
import kotlinx.serialization.Serializable

@Serializable
data class UserActivity(
    val id: String = "",
    val type: String = "", // UPLOAD, DELETE, RESTORE, RENAME, SHARE, UPGRADE, LOGIN
    val fileName: String? = null,
    val details: String = "",
    val timestamp: Timestamp = Timestamp.now(),
    val isRead: Boolean = false
)
