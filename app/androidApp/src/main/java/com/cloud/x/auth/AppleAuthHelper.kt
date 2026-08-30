package com.cloud.x.auth

import androidx.fragment.app.FragmentActivity
import com.google.firebase.auth.OAuthProvider
import com.google.firebase.auth.FirebaseAuth

class AppleAuthHelper(private val activity: FragmentActivity) {
    fun launchLogin(
        onSuccess: (idToken: String, nonce: String) -> Unit,
        onError: (String) -> Unit
    ) {
        val provider = OAuthProvider.newBuilder("apple.com")
        provider.scopes = listOf("email", "name")

        FirebaseAuth.getInstance()
            .startActivityForSignInWithProvider(activity, provider.build())
            .addOnSuccessListener { authResult ->
                val user = authResult.user
                // Note: In a real app, you might need to extract the raw idToken if your backend requires it.
                // For now, we provide the user's uid or a placeholder if the token is not directly accessible.
                onSuccess(user?.uid ?: "", "")
            }
            .addOnFailureListener { e ->
                onError(e.localizedMessage ?: "Apple login failed")
            }
    }
}
