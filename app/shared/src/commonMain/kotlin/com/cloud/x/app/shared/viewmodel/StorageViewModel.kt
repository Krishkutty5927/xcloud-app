package com.cloud.x.app.shared.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.cloud.x.model.UserMetadata
import com.cloud.x.repository.AuthRepository
import com.cloud.x.repository.UserRepository
import com.cloud.x.util.StorageQuotaManager
import dev.gitlive.firebase.Firebase
import dev.gitlive.firebase.auth.auth
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch

@OptIn(ExperimentalCoroutinesApi::class)
class StorageViewModel(
    private val authRepository: AuthRepository,
    private val userRepository: UserRepository
) : ViewModel() {

    private val _userMetadata = MutableStateFlow<UserMetadata?>(null)
    val userMetadata: StateFlow<UserMetadata?> = _userMetadata.asStateFlow()

    private val _isUpdating = MutableStateFlow(false)
    val isUpdating: StateFlow<Boolean> = _isUpdating.asStateFlow()

    init {
        observeUserMetadata()
    }

    private fun observeUserMetadata() {
        viewModelScope.launch {
            Firebase.auth.authStateChanged.flatMapLatest { user ->
                if (user != null) {
                    userRepository.observeUserMetadata(user.uid)
                        .catch { e -> println("[STORAGE] Metadata sync failed: ${e.message}") }
                } else {
                    flowOf(null)
                }
            }.collect {
                _userMetadata.value = it
            }
        }
    }

    /**
     * Expose dynamic formatters and progress calculations for UI
     */
    fun getFormattedUsage(): String {
        return _userMetadata.value?.getFormattedStorageUsed() ?: "0 B"
    }

    fun getFormattedLimit(): String {
        return _userMetadata.value?.getFormattedStorageAvailable() ?: "5 GB"
    }

    fun getUsageProgress(): Float {
        val metadata = _userMetadata.value ?: return 0f
        return StorageQuotaManager.calculateUsagePercentage(metadata.storageUsed, metadata.storageAvailable)
    }

    fun getRemainingStorageLabel(): String {
        val metadata = _userMetadata.value ?: return ""
        val remaining = metadata.storageAvailable - metadata.storageUsed
        return "${StorageQuotaManager.formatBytes(remaining)} remaining"
    }

    fun updatePreference(path: String, value: Any) {
        val user = authRepository.getCurrentUser() ?: return
        viewModelScope.launch {
            userRepository.updatePreference(user.uid, path, value)
        }
    }

    fun updateProfile(updates: Map<String, Any>, onComplete: (Boolean) -> Unit = {}) {
        val user = authRepository.getCurrentUser() ?: return
        viewModelScope.launch {
            _isUpdating.value = true
            try {
                val result = userRepository.updateProfile(user.uid, updates)
                onComplete(result.isSuccess)
            } finally {
                _isUpdating.value = false
            }
        }
    }

    fun uploadAvatar(fileName: String, data: ByteArray, onComplete: (Boolean) -> Unit = {}) {
        val user = authRepository.getCurrentUser() ?: return
        viewModelScope.launch {
            _isUpdating.value = true
            try {
                val result = userRepository.uploadAvatar(user.uid, fileName, data)
                onComplete(result.isSuccess)
            } finally {
                _isUpdating.value = false
            }
        }
    }
}
