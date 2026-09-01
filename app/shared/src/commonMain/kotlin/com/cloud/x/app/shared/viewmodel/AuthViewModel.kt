package com.cloud.x.app.shared.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.cloud.x.repository.AuthRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

class AuthViewModel(private val authRepository: AuthRepository) : ViewModel() {

    private val _authState = MutableStateFlow<AuthState>(AuthState.Idle)
    val authState: StateFlow<AuthState> = _authState

    fun signUp(email: String, name: String, password: String) {
        _authState.value = AuthState.Loading
        viewModelScope.launch {
            authRepository.signUp(email, name, password)
                .onSuccess { _authState.value = AuthState.Authenticated }
                .onFailure { _authState.value = AuthState.Error(it.message ?: "Signup failed") }
        }
    }

    fun signIn(email: String, password: String) {
        _authState.value = AuthState.Loading
        viewModelScope.launch {
            authRepository.login(email, password)
                .onSuccess { _authState.value = AuthState.Authenticated }
                .onFailure { _authState.value = AuthState.Error(it.message ?: "Signin failed") }
        }
    }

    fun forgotPassword(email: String) {
        _authState.value = AuthState.Loading
        viewModelScope.launch {
            authRepository.resetPassword(email)
                .onSuccess { _authState.value = AuthState.Idle } // Or a new state
                .onFailure { _authState.value = AuthState.Error(it.message ?: "Reset failed") }
        }
    }

    fun onGoogleSignInResult(idToken: String) {
        _authState.value = AuthState.Loading
        viewModelScope.launch {
            authRepository.signInWithGoogle(idToken)
                .onSuccess { _authState.value = AuthState.Authenticated }
                .onFailure { _authState.value = AuthState.Error(it.message ?: "Google Sign-In failed") }
        }
    }

    fun onSignInError(message: String) {
        _authState.value = AuthState.Error(message)
    }

    fun onFacebookSignInResult(accessToken: String) {
        _authState.value = AuthState.Loading
        viewModelScope.launch {
            authRepository.signInWithFacebook(accessToken)
                .onSuccess { _authState.value = AuthState.Authenticated }
                .onFailure { _authState.value = AuthState.Error(it.message ?: "Facebook Sign-In failed") }
        }
    }

    fun onAppleSignInResult(idToken: String, rawNonce: String) {
        _authState.value = AuthState.Loading
        viewModelScope.launch {
            authRepository.signInWithApple(idToken, rawNonce)
                .onSuccess { _authState.value = AuthState.Authenticated }
                .onFailure { _authState.value = AuthState.Error(it.message ?: "Apple Sign-In failed") }
        }
    }
}

sealed class AuthState {
    object Idle : AuthState()
    object Loading : AuthState()
    object Authenticated : AuthState()
    data class Error(val message: String) : AuthState()
}
