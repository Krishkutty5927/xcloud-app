package com.cloud.x.model

import dev.gitlive.firebase.firestore.Timestamp
import kotlinx.serialization.Serializable

@Serializable
data class Invitation(
    val id: String = "",
    val fileId: String = "",
    val fileName: String = "",
    val fileType: String = "",
    val fileSize: Long = 0,
    val senderId: String = "",
    val senderEmail: String = "",
    val senderName: String = "",
    val recipientEmail: String? = null,
    val recipientPhone: String? = null,
    val passcode: String? = null,
    val status: String = "PENDING", // PENDING, ACCEPTED, REJECTED
    val createdAt: Timestamp? = null,
    val expiresAt: Timestamp? = null,
    val rejectedAt: Timestamp? = null,
    val storagePath: String = "",
    val downloadUrl: String = ""
)
