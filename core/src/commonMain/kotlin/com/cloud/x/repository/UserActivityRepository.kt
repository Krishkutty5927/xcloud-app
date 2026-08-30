package com.cloud.x.repository

import com.cloud.x.model.UserActivity
import com.cloud.x.util.currentTimeMillis
import dev.gitlive.firebase.Firebase
import dev.gitlive.firebase.firestore.Direction
import dev.gitlive.firebase.firestore.firestore
import dev.gitlive.firebase.firestore.Timestamp
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

class UserActivityRepository {
    private val firestore = Firebase.firestore

    suspend fun logActivity(userId: String, type: String, details: String, fileName: String? = null) {
        try {
            val activityRef = firestore.collection("users").document(userId).collection("activities")
            val actId = "act_${currentTimeMillis()}"
            val userActivity = UserActivity(
                id = actId,
                type = type,
                details = details,
                fileName = fileName,
                timestamp = Timestamp.now(),
                isRead = false
            )
            activityRef.document(actId).set(userActivity)
        } catch (e: Exception) {
            println("[ACTIVITY] Failed to log activity: ${e.message}")
        }
    }

    fun getRecentActivities(userId: String, limit: Int = 10): Flow<List<UserActivity>> {
        val col = firestore.collection("users").document(userId).collection("activities")
        return col
            .orderBy("timestamp", Direction.DESCENDING)
            .limit(limit.toLong())
            .snapshots()
            .map { snapshot ->
                snapshot.documents.map { doc -> doc.data<UserActivity>() }
            }
    }

    suspend fun markAllAsRead(userId: String, activities: List<UserActivity>) {
        try {
            val activityCol = firestore.collection("users").document(userId).collection("activities")
            activities.forEach { activity ->
                if (!activity.isRead) {
                    activityCol.document(activity.id).update("isRead" to true)
                }
            }
        } catch (e: Exception) {
            println("[ACTIVITY] Failed to mark as read: ${e.message}")
        }
    }
}
