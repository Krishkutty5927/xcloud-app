package com.cloud.x.auth

import android.content.Intent
import androidx.fragment.app.FragmentActivity
import com.facebook.CallbackManager
import com.facebook.FacebookCallback
import com.facebook.FacebookException
import com.facebook.login.LoginManager
import com.facebook.login.LoginResult

class FacebookAuthHelper(private val activity: FragmentActivity) {
    private val callbackManager = CallbackManager.Factory.create()
    private var onSuccess: ((String) -> Unit)? = null
    private var onCancel: (() -> Unit)? = null
    private var onError: ((Exception) -> Unit)? = null

    fun registerCallback(
        onSuccess: (String) -> Unit,
        onCancelAction: () -> Unit,
        onError: (Exception) -> Unit
    ) {
        this.onSuccess = onSuccess
        this.onCancel = onCancelAction
        this.onError = onError

        LoginManager.getInstance().registerCallback(callbackManager, object : FacebookCallback<LoginResult> {
            override fun onSuccess(result: LoginResult) {
                onSuccess(result.accessToken.token)
            }

            override fun onCancel() {
                onCancelAction()
            }

            override fun onError(error: FacebookException) {
                onError(error)
            }
        })
    }

    fun launchLogin() {
        LoginManager.getInstance().logInWithReadPermissions(activity, listOf("public_profile", "email"))
    }

    fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        callbackManager.onActivityResult(requestCode, resultCode, data)
    }
}
