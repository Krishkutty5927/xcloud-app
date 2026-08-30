package com.cloud.x

import androidx.compose.ui.ExperimentalComposeUiApi
import androidx.compose.ui.window.ComposeViewport
import dev.gitlive.firebase.Firebase
import dev.gitlive.firebase.auth.FacebookAuthProvider
import dev.gitlive.firebase.auth.GoogleAuthProvider
import dev.gitlive.firebase.auth.OAuthProvider
import dev.gitlive.firebase.auth.auth
import kotlinx.coroutines.launch

@OptIn(ExperimentalComposeUiApi::class)
fun main() {
    ComposeViewport {
        App(
            onGoogleSignInClick = { scope, onToken ->
                scope.launch {
                    try {
                        val provider = GoogleAuthProvider()
                        Firebase.auth.signInWithPopup(provider)
                        onToken("web-flow-complete") 
                    } catch (e: Exception) {
                        println("Google Sign-In failed: ${e.message}")
                    }
                }
            },
            onFacebookSignInClick = { scope, onToken ->
                scope.launch {
                    try {
                        val provider = FacebookAuthProvider()
                        Firebase.auth.signInWithPopup(provider)
                        onToken("web-flow-complete")
                    } catch (e: Exception) {
                        println("Facebook Sign-In failed: ${e.message}")
                    }
                }
            },
            onAppleSignInClick = { scope, onToken ->
                scope.launch {
                    try {
                        val provider = OAuthProvider("apple.com")
                        Firebase.auth.signInWithPopup(provider)
                        onToken("web-flow-complete", "")
                    } catch (e: Exception) {
                        println("Apple Sign-In failed: ${e.message}")
                    }
                }
            }
        )
    }
}
