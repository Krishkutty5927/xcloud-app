package com.cloud.x.model

import com.cloud.x.util.StorageQuotaManager
import kotlinx.serialization.Serializable

@Serializable
data class UserMetadata(
    val uid: String = "",
    val displayId: String = "",
    val email: String = "",
    val name: String = "",
    val profilePictureUrl: String = "",
    val phoneNumber: String = "",
    val dateOfBirth: String = "",
    val storageAvailable: Long = 5368709120L, // Default 5GB
    val storageUsed: Long = 0,
    val subscriptionPlan: String = "Free",
    val preferences: UserPreferences = UserPreferences()
) {
    @Serializable
    data class UserPreferences(
        val theme: String = "system",
        val notifications: NotificationPreferences = NotificationPreferences(),
        val security: SecurityPreferences = SecurityPreferences()
    )

    @Serializable
    data class NotificationPreferences(
        val emailAlerts: Boolean = true,
        val pushToasts: Boolean = true
    )

    @Serializable
    data class SecurityPreferences(
        val twoFactorEnabled: Boolean = false,
        val loginAlerts: Boolean = true
    )
    val storagePercentage: Float
        get() = StorageQuotaManager.calculateUsagePercentage(storageUsed, storageAvailable)

    @Serializable
    data class StorageBreakdown(
        val images: Long = 0,
        val videos: Long = 0,
        val documents: Long = 0,
        val audio: Long = 0,
        val others: Long = 0
    )

    val storageBreakdown: StorageBreakdown = StorageBreakdown()

    fun getFormattedStorageAvailable(): String = StorageQuotaManager.formatBytes(storageAvailable)
    fun getFormattedStorageUsed(): String = StorageQuotaManager.formatBytes(storageUsed)
}
