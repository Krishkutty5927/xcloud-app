package com.cloud.x.app.shared.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.cloud.x.model.FileEntry
import com.cloud.x.model.UserActivity
import com.cloud.x.model.UserMetadata
import com.cloud.x.repository.UserActivityRepository
import com.cloud.x.repository.AuthRepository
import com.cloud.x.repository.FileRepository
import com.cloud.x.repository.TrashRepository
import com.cloud.x.repository.UserRepository
import com.cloud.x.util.FileUploadManager
import com.cloud.x.util.OfflineManager
import com.cloud.x.util.StorageQuotaManager
import com.cloud.x.util.currentTimeMillis
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch

class DashboardViewModel(
    private val authRepository: AuthRepository,
    private val userRepository: UserRepository,
    private val fileRepository: FileRepository,
    private val trashRepository: TrashRepository
) : ViewModel() {

    private val uploadManager = FileUploadManager(fileRepository)
    private val activityRepository = UserActivityRepository()
    
    val offlineFiles = OfflineManager.cachedFiles

    private val _userMetadata = MutableStateFlow<UserMetadata?>(null)
    val userMetadata: StateFlow<UserMetadata?> = _userMetadata.asStateFlow()

    private val _files = MutableStateFlow<List<FileEntry>>(emptyList())
    val files: StateFlow<List<FileEntry>> = _files.asStateFlow()

    private val _trashFiles = MutableStateFlow<List<FileEntry>>(emptyList())
    val trashFiles: StateFlow<List<FileEntry>> = _trashFiles.asStateFlow()

    private val _activities = MutableStateFlow<List<UserActivity>>(emptyList())
    val activities: StateFlow<List<UserActivity>> = _activities.asStateFlow()

    private val _searchQuery = MutableStateFlow("")
    val searchQuery = _searchQuery.asStateFlow()

    private val _currentFolderId = MutableStateFlow("root")
    val currentFolderId = _currentFolderId.asStateFlow()

    private val _breadcrumbs = MutableStateFlow(listOf(Breadcrumb("root", "My Cloud")))
    val breadcrumbs = _breadcrumbs.asStateFlow()

    private val _selectedCategory = MutableStateFlow("All")
    val selectedCategory = _selectedCategory.asStateFlow()

    val starredFiles = _files.map { list ->
        list.filter { it.isStarred && !it.isDeleted }
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val sharedFiles = _files.map { list ->
        list.filter { it.isShared && !it.isDeleted }
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val filteredFiles = combine(_files, _searchQuery, _selectedCategory, _currentFolderId) { files, query, category, folderId ->
        files.filter { file ->
            val matchesQuery = file.fileName.contains(query, ignoreCase = true)
            val matchesCategory = if (category == "All") true else {
                file.fileType.contains(category, ignoreCase = true)
            }
            val matchesFolder = if (query.isNotEmpty()) true else file.parentId == folderId
            
            matchesQuery && matchesCategory && matchesFolder && !file.isDeleted
        }.sortedWith { a, b ->
            // Folders first
            if (a.fileType == "Folder" && b.fileType != "Folder") -1
            else if (a.fileType != "Folder" && b.fileType == "Folder") 1
            else b.uploadTimestamp.seconds.compareTo(a.uploadTimestamp.seconds)
        }
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    data class Breadcrumb(val id: String, val name: String)

    fun navigateToFolder(folder: FileEntry) {
        // Update last opened for folder
        updateLastOpened(folder)
        
        _currentFolderId.value = folder.fileId
        val current = _breadcrumbs.value.toMutableList()
        current.add(Breadcrumb(folder.fileId, folder.fileName))
        _breadcrumbs.value = current
    }

    fun onFileClick(file: FileEntry) {
        updateLastOpened(file)
    }

    private fun updateLastOpened(file: FileEntry) {
        val user = authRepository.getCurrentUser() ?: return
        viewModelScope.launch {
            fileRepository.updateLastOpened(user.uid, file.fileId)
        }
    }

    fun navigateToBreadcrumb(index: Int) {
        val target = _breadcrumbs.value[index]
        _currentFolderId.value = target.id
        _breadcrumbs.value = _breadcrumbs.value.take(index + 1)
    }

    val storageBreakdown = _files.map { fileList ->
        val breakdown = UserMetadata.StorageBreakdown()
        var images = 0L
        var videos = 0L
        var audio = 0L
        var documents = 0L
        var others = 0L

        fileList.filter { !it.isDeleted }.forEach { file ->
            when {
                file.fileType.contains("image", true) -> images += file.fileSize
                file.fileType.contains("video", true) -> videos += file.fileSize
                file.fileType.contains("audio", true) -> audio += file.fileSize
                file.fileType.contains("pdf", true) || file.fileType.contains("doc", true) -> documents += file.fileSize
                else -> others += file.fileSize
            }
        }
        UserMetadata.StorageBreakdown(images, videos, documents, audio, others)
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), UserMetadata.StorageBreakdown())

    private val _uploadStatus = MutableStateFlow<FileUploadManager.UploadStatus?>(null)
    val uploadStatus: StateFlow<FileUploadManager.UploadStatus?> = _uploadStatus.asStateFlow()

    private val _isRefreshing = MutableStateFlow(false)
    val isRefreshing = _isRefreshing.asStateFlow()

    init {
        loadData()
    }

    fun refresh() {
        viewModelScope.launch {
            _isRefreshing.value = true
            loadData()
            // Simulate a small delay for better UX if data is already cached
            delay(500)
            _isRefreshing.value = false
        }
    }

    private fun loadData() {
        val user = authRepository.getCurrentUser() ?: return
        viewModelScope.launch {
            userRepository.observeUserMetadata(user.uid).collectLatest {
                _userMetadata.value = it ?: UserMetadata(uid = user.uid, email = user.email ?: "")
            }
        }
        viewModelScope.launch {
            fileRepository.getFiles(user.uid).collectLatest {
                _files.value = it.sortedByDescending { f -> f.uploadTimestamp.seconds }
            }
        }
        viewModelScope.launch {
            trashRepository.getTrashFiles(user.uid).collectLatest {
                _trashFiles.value = it.sortedByDescending { f -> f.deletedTimestamp?.seconds ?: 0L }
            }
        }
        viewModelScope.launch {
            activityRepository.getRecentActivities(user.uid).collectLatest {
                _activities.value = it
            }
        }
    }

    fun uploadFile(name: String, mimeType: String, size: Long, data: ByteArray) {
        val user = authRepository.getCurrentUser() ?: return
        val metadata = _userMetadata.value ?: UserMetadata(uid = user.uid)

        viewModelScope.launch {
            uploadManager.uploadFile(user.uid, metadata, name, mimeType, size, data).collect { status ->
                _uploadStatus.value = status
            }
        }
    }

    fun deleteFile(file: FileEntry) {
        val user = authRepository.getCurrentUser() ?: return
        viewModelScope.launch {
            trashRepository.moveToTrash(user.uid, file.fileId)
        }
    }

    fun markActivitiesAsRead() {
        val user = authRepository.getCurrentUser() ?: return
        viewModelScope.launch {
            activityRepository.markAllAsRead(user.uid, _activities.value)
        }
    }

    fun deletePermanently(file: FileEntry) {
        val user = authRepository.getCurrentUser() ?: return
        viewModelScope.launch {
            trashRepository.permanentlyDelete(user.uid, file)
        }
    }

    fun restoreFromTrash(file: FileEntry) {
        val user = authRepository.getCurrentUser() ?: return
        viewModelScope.launch {
            trashRepository.restoreFromTrash(user.uid, file.fileId)
        }
    }

    fun renameFile(file: FileEntry, newName: String) {
        val user = authRepository.getCurrentUser() ?: return
        viewModelScope.launch {
            fileRepository.renameFile(user.uid, file.fileId, newName)
        }
    }

    fun moveFile(file: FileEntry, targetFolderId: String) {
        val user = authRepository.getCurrentUser() ?: return
        viewModelScope.launch {
            // Reusing rename structure for parentId update
            fileRepository.moveFile(user.uid, file.fileId, targetFolderId)
        }
    }

    fun onSearchQueryChange(query: String) {
        _searchQuery.value = query
    }

    fun onCategorySelect(category: String) {
        _selectedCategory.value = category
    }

    fun toggleStar(file: FileEntry) {
        val user = authRepository.getCurrentUser() ?: return
        viewModelScope.launch {
            fileRepository.toggleStar(user.uid, file.fileId, !file.isStarred)
        }
    }

    fun toggleOffline(file: FileEntry) {
        viewModelScope.launch {
            if (file.isOffline) {
                OfflineManager.removeFromOffline(file.fileId)
            } else {
                OfflineManager.downloadForOffline(file)
            }
            // Update Firestore to sync across devices
            val user = authRepository.getCurrentUser() ?: return@launch
            firestoreUpdateOfflineStatus(user.uid, file.fileId, !file.isOffline)
        }
    }

    private suspend fun firestoreUpdateOfflineStatus(userId: String, fileId: String, status: Boolean) {
        // This is just to keep the 'isOffline' flag in sync across devices
        // The actual file is local to the device
        fileRepository.toggleOfflineFlag(userId, fileId, status)
    }

    fun generateShareLink(file: FileEntry, passcode: String?, expiryDays: Int?) {
        val user = authRepository.getCurrentUser() ?: return
        viewModelScope.launch {
            fileRepository.generateShareLink(user.uid, file.fileId, passcode, expiryDays)
        }
    }
}
