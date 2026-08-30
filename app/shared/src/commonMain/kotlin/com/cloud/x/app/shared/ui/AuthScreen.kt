package com.cloud.x.app.shared.ui

import androidx.compose.runtime.*
import com.cloud.x.app.shared.viewmodel.AuthViewModel

@Composable
fun AuthScreen(
    viewModel: AuthViewModel,
    onGoogleSignInClick: () -> Unit = {},
    onFacebookSignInClick: () -> Unit = {},
    onAppleSignInClick: () -> Unit = {}
) {
    var currentScreen by remember { mutableStateOf(AuthScreenType.Login) }

    when (currentScreen) {
        AuthScreenType.Login -> {
            LoginScreen(
                viewModel = viewModel,
                onNavigateToSignUp = { currentScreen = AuthScreenType.Signup },
                onNavigateToForgotPassword = { currentScreen = AuthScreenType.ForgotPassword },
                onGoogleSignInClick = onGoogleSignInClick,
                onFacebookSignInClick = onFacebookSignInClick,
                onAppleSignInClick = onAppleSignInClick
            )
        }
        AuthScreenType.Signup -> {
            SignupScreen(
                viewModel = viewModel,
                onNavigateToLogin = { currentScreen = AuthScreenType.Login },
                onGoogleSignInClick = onGoogleSignInClick,
                onFacebookSignInClick = onFacebookSignInClick,
                onAppleSignInClick = onAppleSignInClick
            )
        }
        AuthScreenType.ForgotPassword -> {
            ForgotPasswordScreen(
                viewModel = viewModel,
                onNavigateBack = { currentScreen = AuthScreenType.Login }
            )
        }
    }
}

enum class AuthScreenType {
    Login, Signup, ForgotPassword
}
