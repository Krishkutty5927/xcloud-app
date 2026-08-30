package com.cloud.x.repository

import com.cloud.x.model.UserMetadata
import dev.gitlive.firebase.Firebase
import dev.gitlive.firebase.auth.auth
import dev.gitlive.firebase.auth.OAuthProvider
import dev.gitlive.firebase.auth.GoogleAuthProvider
import dev.gitlive.firebase.auth.FacebookAuthProvider
import dev.gitlive.firebase.auth.EmailAuthProvider
import dev.gitlive.firebase.auth.FirebaseUser
import dev.gitlive.firebase.firestore.firestore
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlin.random.Random

class AuthRepository {
    private val auth = Firebase.auth
    private val firestore = Firebase.firestore

    suspend fun login(email: String, password: String): Result<FirebaseUser?> {
        return try {
            auth.signInWithEmailAndPassword(email, password)
            // Perform sync in background to speed up login response
            // We use GlobalScope or a custom scope here because we want it to persist 
            // even if the calling scope is cancelled immediately after login
            CoroutineScope(Dispatchers.Default).launch {
                syncUserProfile(auth.currentUser)
            }
            Result.success(auth.currentUser)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun signUp(email: String, name: String, password: String): Result<FirebaseUser?> {
        return try {
            auth.createUserWithEmailAndPassword(email, password)
            syncUserProfile(auth.currentUser, initialName = name)
            Result.success(auth.currentUser)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun signInWithApple(idToken: String, rawNonce: String): Result<FirebaseUser?> {
        return try {
            val credential = OAuthProvider.credential("apple.com", idToken = idToken, rawNonce = rawNonce)
            auth.signInWithCredential(credential)
            syncUserProfile(auth.currentUser)
            Result.success(auth.currentUser)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun signInWithGoogle(idToken: String): Result<FirebaseUser?> {
        return try {
            val credential = GoogleAuthProvider.credential(idToken = idToken, accessToken = null)
            auth.signInWithCredential(credential)
            syncUserProfile(auth.currentUser)
            Result.success(auth.currentUser)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun signInWithFacebook(accessToken: String): Result<FirebaseUser?> {
        return try {
            val credential = FacebookAuthProvider.credential(accessToken)
            auth.signInWithCredential(credential)
            syncUserProfile(auth.currentUser)
            Result.success(auth.currentUser)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun resetPassword(email: String): Result<Unit> {
        return try {
            auth.sendPasswordResetEmail(email)
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun updatePassword(currentPass: String, newPass: String): Result<Unit> {
        val user = auth.currentUser ?: return Result.failure(Exception("Not authenticated"))
        return try {
            val email = user.email ?: return Result.failure(Exception("Email not found"))
            val credential = EmailAuthProvider.credential(email, currentPass)
            user.reauthenticate(credential)
            user.updatePassword(newPass)
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    private suspend fun syncUserProfile(user: FirebaseUser?, initialName: String? = null) {
        user ?: return
        try {
            val docRef = firestore.collection("users").document(user.uid)
            val snapshot = docRef.get()
            
            var currentMetadata: UserMetadata? = null
            if (snapshot.exists) {
                currentMetadata = snapshot.data<UserMetadata>()
            }
            
            var bestName = initialName ?: user.displayName ?: ""
            var bestPhoto = user.photoURL ?: ""
            var bestPhone = user.phoneNumber ?: ""
            
            if (bestName.isEmpty() || bestPhoto.isEmpty() || bestPhone.isEmpty()) {
                user.providerData.forEach { profile ->
                    if (bestName.isEmpty() && !profile.displayName.isNullOrEmpty()) {
                        bestName = profile.displayName!!
                    }
                    if (bestPhoto.isEmpty() && !profile.photoURL.isNullOrEmpty()) {
                        bestPhoto = profile.photoURL!!
                    }
                    if (bestPhone.isEmpty() && !profile.phoneNumber.isNullOrEmpty()) {
                        bestPhone = profile.phoneNumber!!
                    }
                }
            }

            if (currentMetadata == null) {
                val randomId = (1000000000L + (Random.nextDouble() * 9000000000L).toLong()).toString()
                val metadata = UserMetadata(
                    uid = user.uid,
                    displayId = randomId,
                    email = user.email ?: "",
                    name = bestName,
                    profilePictureUrl = bestPhoto,
                    phoneNumber = bestPhone,
                    storageAvailable = 5368709120L, // 5GB
                    storageUsed = 0,
                    subscriptionPlan = "Free",
                )
                docRef.set(metadata)
            } else {
                val updates = mutableMapOf<String, Any?>()
                
                if (currentMetadata.displayId.isEmpty()) {
                    val randomId = (1000000000L + (Random.nextDouble() * 9000000000L).toLong()).toString()
                    updates["displayId"] = randomId
                }
                if (currentMetadata.name.isEmpty() && bestName.isNotEmpty()) {
                    updates["name"] = bestName
                }
                if (currentMetadata.profilePictureUrl.isEmpty() && bestPhoto.isNotEmpty()) {
                    updates["profilePictureUrl"] = bestPhoto
                }
                if (currentMetadata.phoneNumber.isEmpty() && bestPhone.isNotEmpty()) {
                    updates["phoneNumber"] = bestPhone
                }

                if (updates.isNotEmpty()) {
                    docRef.update(updates)
                }
            }
        } catch (e: Exception) {
            println("[AUTH] Sync failed: ${e.message}")
        }
    }

    fun getCurrentUser(): FirebaseUser? = auth.currentUser

    suspend fun logout() {
        auth.signOut()
    }
}
