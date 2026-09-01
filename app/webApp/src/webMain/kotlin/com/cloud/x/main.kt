package com.cloud.x

import androidx.compose.ui.ExperimentalComposeUiApi
import androidx.compose.ui.window.ComposeViewport
import dev.gitlive.firebase.Firebase
import dev.gitlive.firebase.auth.OAuthProvider
import dev.gitlive.firebase.auth.auth
import kotlinx.coroutines.launch
import kotlinx.coroutines.CoroutineScope

@OptIn(ExperimentalComposeUiApi::class)
fun main() {
    ComposeViewport {
        App(
            onGoogleSignInClick = { scope, onToken, onError ->
                scope.launch {
                    try {
                        val provider = OAuthProvider("google.com")
                        val result = Firebase.auth.signInWithPopup(provider)
                        val user = result.user
                        val token = user?.getIdToken(false)
                        if (token != null) {
                            onToken(token)
                        } else {
                            onError("Failed to retrieve ID token")
                        }
                    } catch (e: Exception) {
                        onError(e.message ?: "Google Sign-In failed")
                    }
                }
            },
            onFacebookSignInClick = { scope, onToken, onError ->
                scope.launch {
                    try {
                        val provider = OAuthProvider("facebook.com")
                        val result = Firebase.auth.signInWithPopup(provider)
                        val user = result.user
                        val token = user?.getIdToken(false)
                        if (token != null) {
                            onToken(token)
                        } else {
                            onError("Failed to retrieve Facebook token")
                        }
                    } catch (e: Exception) {
                        onError(e.message ?: "Facebook Sign-In failed")
                    }
                }
            },
            onAppleSignInClick = { scope, onToken, onError ->
                scope.launch {
                    try {
                        val provider = OAuthProvider("apple.com")
                        val result = Firebase.auth.signInWithPopup(provider)
                        val user = result.user
                        val token = user?.getIdToken(false)
                        if (token != null) {
                            onToken(token, "") 
                        } else {
                            onError("Failed to retrieve Apple token")
                        }
                    } catch (e: Exception) {
                        onError(e.message ?: "Apple Sign-In failed")
                    }
                }
            }
        )
    }
}
