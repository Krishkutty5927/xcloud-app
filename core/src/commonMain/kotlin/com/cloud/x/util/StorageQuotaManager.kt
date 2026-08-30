package com.cloud.x.util

import kotlin.math.log
import kotlin.math.pow

enum class StoragePlan(val label: String, val limitBytes: Long) {
    FREE("Free Plan", 5L * 1024 * 1024 * 1024), // 5 GB
    PRO("Pro Plan", 100L * 1024 * 1024 * 1024) // 100 GB
}

object StorageQuotaManager {

    /**
     * Plan Limits: Provide helper methods to define storage caps based on subscription tiers
     */
    fun getLimitForPlan(planName: String): Long {
        return when (planName.uppercase()) {
            "PRO" -> StoragePlan.PRO.limitBytes
            else -> StoragePlan.FREE.limitBytes
        }
    }

    /**
     * Byte Formatter: Provide a clean formatting function to convert raw byte counts
     * into human-readable strings (B, KB, MB, GB, TB).
     */
    fun formatBytes(bytes: Long): String {
        if (bytes <= 0) return "0 B"
        val units = arrayOf("B", "KB", "MB", "GB", "TB")
        val digitGroups = (log(bytes.toDouble(), 1024.0)).toInt()
        val value = bytes / 1024.0.pow(digitGroups.toDouble())
        // Round to 2 decimal places
        val roundedValue = (value * 100).toInt() / 100.0
        return "$roundedValue ${units[digitGroups]}"
    }

    /**
     * Usage Percentage Calculator: Calculate the exact consumption ratio safely clamped
     * between 0f and 1f for rendering storage progress bars or indicators in the UI.
     */
    fun calculateUsagePercentage(used: Long, available: Long): Float {
        if (available <= 0) return 0f
        return (used.toFloat() / available).coerceIn(0f, 1f)
    }
}
