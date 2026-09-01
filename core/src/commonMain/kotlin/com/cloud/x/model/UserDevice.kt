package com.cloud.x.model

import dev.gitlive.firebase.firestore.Timestamp
import kotlinx.serialization.Serializable

@Serializable
data class UserDevice(
    val deviceId: String = "",
    val name: String = "",
    val type: String = "", // Android, iOS, Windows, Web, Mac
    val lastActive: Timestamp? = null,
    val ip: String = "",
    val location: String = "",
    val isCurrent: Boolean = false
)
