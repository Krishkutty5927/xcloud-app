package com.cloud.x

import android.content.Context
import android.util.Base64
import android.util.Log
import android.widget.Toast
import androidx.credentials.ClearCredentialStateRequest
import androidx.credentials.CredentialManager
import androidx.credentials.CustomCredential
import androidx.credentials.GetCredentialRequest
import androidx.credentials.GetCredentialResponse
import androidx.credentials.exceptions.ClearCredentialException
import androidx.credentials.exceptions.GetCredentialException
import com.google.android.libraries.identity.googleid.GetGoogleIdOption
import com.google.android.libraries.identity.googleid.GetSignInWithGoogleOption
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential.Companion.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import java.security.SecureRandom

class CredentialManagerHelper(private val context: Context) {
    private val credentialManager = CredentialManager.create(context)
    private val tag = "CredManagerHelper"

    fun launchGoogleSignIn(coroutineScope: CoroutineScope, onIdTokenReceived: (String) -> Unit) {
        Log.d(tag, "Launching Google Sign-In request...")
        
        val webClientId = context.getString(R.string.default_web_client_id)
        val nonce = generateSecureRandomNonce()

        // 1. GetGoogleIdOption for broader compatibility
        val googleIdOption = GetGoogleIdOption.Builder()
            .setFilterByAuthorizedAccounts(false)
            .setServerClientId(webClientId)
            .setNonce(nonce)
            .build()

        // 2. GetSignInWithGoogleOption specifically for explicit button click flows
        val signInWithGoogleOption = GetSignInWithGoogleOption.Builder(serverClientId = webClientId)
            .setNonce(nonce)
            .build()

        val request = GetCredentialRequest.Builder()
            .addCredentialOption(googleIdOption)
            .addCredentialOption(signInWithGoogleOption)
            .build()

        coroutineScope.launch(Dispatchers.Main) {
            try {
                Log.d(tag, "Calling getCredential...")
                val result = credentialManager.getCredential(context, request)
                Log.d(tag, "getCredential success!")
                handleSignIn(result, onIdTokenReceived)
            } catch (e: GetCredentialException) {
                val errorMsg = when (e.type) {
                    "android.credentials.GetCredentialException.TYPE_USER_CANCELED" -> "Sign-In cancelled"
                    "android.credentials.GetCredentialException.TYPE_INTERRUPTED" -> "Sign-In interrupted"
                    "android.credentials.GetCredentialException.TYPE_NO_CREDENTIAL" -> "No accounts found on device"
                    else -> e.message ?: "Authentication failed"
                }
                Log.e(tag, "GetCredentialException: Type=${e.type}, Message=${e.message}")
                Log.e(tag, Log.getStackTraceString(e))
                Toast.makeText(context, errorMsg, Toast.LENGTH_SHORT).show()
            } catch (e: Exception) {
                Log.e(tag, "Unknown error during sign in: ${e.message}", e)
                Toast.makeText(context, "An unexpected error occurred", Toast.LENGTH_SHORT).show()
            }
        }
    }

    private fun generateSecureRandomNonce(): String {
        val randomBytes = ByteArray(32)
        SecureRandom().nextBytes(randomBytes)
        return Base64.encodeToString(randomBytes, Base64.NO_WRAP or Base64.URL_SAFE or Base64.NO_PADDING)
    }

    private fun handleSignIn(result: GetCredentialResponse, onIdTokenReceived: (String) -> Unit) {
        val credential = result.credential
        if ((credential is CustomCredential) && (credential.type == TYPE_GOOGLE_ID_TOKEN_CREDENTIAL)) {
            try {
                val googleIdTokenCredential = GoogleIdTokenCredential.createFrom(credential.data)
                onIdTokenReceived(googleIdTokenCredential.idToken)
            } catch (e: Exception) {
                Log.e(tag, "Error parsing Google ID token: ${e.message}")
                Toast.makeText(context, "Error parsing login details", Toast.LENGTH_SHORT).show()
            }
        } else {
            Log.w(tag, "Credential is not of type Google ID!")
            Toast.makeText(context, "Unexpected login type", Toast.LENGTH_SHORT).show()
        }
    }

    fun signOut(onComplete: () -> Unit) {
        CoroutineScope(Dispatchers.Main).launch {
            try {
                credentialManager.clearCredentialState(ClearCredentialStateRequest())
                onComplete()
            } catch (e: ClearCredentialException) {
                Log.e(tag, "Couldn't clear user credentials: ${e.localizedMessage}")
            }
        }
    }
}
