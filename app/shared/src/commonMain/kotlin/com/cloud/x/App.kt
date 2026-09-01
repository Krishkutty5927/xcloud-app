package com.cloud.x

import androidx.compose.animation.*
import androidx.compose.animation.core.tween
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Fingerprint
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.cloud.x.app.shared.ui.AuthScreen
import com.cloud.x.app.shared.ui.DashboardScreen
import com.cloud.x.app.shared.ui.SplashScreen
import com.cloud.x.app.shared.viewmodel.AuthViewModel
import com.cloud.x.app.shared.viewmodel.DashboardViewModel
import com.cloud.x.app.shared.viewmodel.StorageViewModel
import com.cloud.x.repository.AuthRepository
import com.cloud.x.repository.FileRepository
import com.cloud.x.repository.TrashRepository
import com.cloud.x.repository.UserRepository
import com.cloud.x.util.FileUploadManager
import dev.gitlive.firebase.Firebase
import dev.gitlive.firebase.auth.auth
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

val XCloudShapes = Shapes(
    extraSmall = RoundedCornerShape(8.dp),
    small = RoundedCornerShape(12.dp),
    medium = RoundedCornerShape(20.dp),
    large = RoundedCornerShape(28.dp),
    extraLarge = RoundedCornerShape(32.dp)
)

val XCloudLightColors = lightColorScheme(
    primary = Color(0xFF005AC1),
    onPrimary = Color(0xFFFFFFFF),
    primaryContainer = Color(0xFFD8E2FF),
    onPrimaryContainer = Color(0xFF001A41),
    secondary = Color(0xFF575E71),
    onSecondary = Color(0xFFFFFFFF),
    secondaryContainer = Color(0xFFDBE2F9),
    onSecondaryContainer = Color(0xFF141B2C),
    tertiary = Color(0xFF715573),
    onTertiary = Color(0xFFFFFFFF),
    tertiaryContainer = Color(0xFFFBD7FC),
    onTertiaryContainer = Color(0xFF29132D),
    error = Color(0xFFBA1A1A),
    onError = Color(0xFFFFFFFF),
    errorContainer = Color(0xFFFFDAD6),
    onErrorContainer = Color(0xFF410002),
    surface = Color(0xFFFDFBFF),
    onSurface = Color(0xFF1B1B1F),
    surfaceVariant = Color(0xFFE1E2EC),
    onSurfaceVariant = Color(0xFF44474F),
    outline = Color(0xFF74777F)
)

val XCloudDarkColors = darkColorScheme(
    primary = Color(0xFFADC6FF),
    onPrimary = Color(0xFF002E69),
    primaryContainer = Color(0xFF004494),
    onPrimaryContainer = Color(0xFFD8E2FF),
    secondary = Color(0xFFBFC6DC),
    onSecondary = Color(0xFF293041),
    secondaryContainer = Color(0xFF3F4759),
    onSecondaryContainer = Color(0xFFDBE2F9),
    tertiary = Color(0xFFDFBBDF),
    onTertiary = Color(0xFF402843),
    tertiaryContainer = Color(0xFF583E5A),
    onTertiaryContainer = Color(0xFFFBD7FC),
    error = Color(0xFFFFB4AB),
    onError = Color(0xFF690005),
    errorContainer = Color(0xFF93000A),
    onErrorContainer = Color(0xFFFFDAD6),
    surface = Color(0xFF1B1B1F),
    onSurface = Color(0xFFE3E2E6),
    surfaceVariant = Color(0xFF44474F),
    onSurfaceVariant = Color(0xFFC4C6D0),
    outline = Color(0xFF8E9099)
)

@Composable
fun App(
    deepLink: String? = null,
    onGoogleSignInClick: (coroutineScope: CoroutineScope, onIdTokenReceived: (String) -> Unit, onError: (String) -> Unit) -> Unit = { _, _, _ -> },
    onFacebookSignInClick: (coroutineScope: CoroutineScope, onTokenReceived: (String) -> Unit, onError: (String) -> Unit) -> Unit = { _, _, _ -> },
    onAppleSignInClick: (coroutineScope: CoroutineScope, onIdTokenReceived: (String, String) -> Unit, onError: (String) -> Unit) -> Unit = { _, _, _ -> },
    onSignOutClick: (coroutineScope: CoroutineScope, onComplete: () -> Unit) -> Unit = { _, onComplete -> onComplete() },
    onPickFileClick: (onFilePicked: (String, String, Long, ByteArray) -> Unit) -> Unit = { _ -> },
    onPickAvatarClick: (onAvatarPicked: (String, String, Long, ByteArray) -> Unit) -> Unit = { _ -> },
    onScanClick: (onScanComplete: (String, String, Long, ByteArray) -> Unit) -> Unit = { _ -> },
    onBiometricAuthClick: (title: String, subtitle: String, onSuccess: () -> Unit, onError: (String) -> Unit) -> Unit = { _, _, _, _ -> },
    onUploadStatusChange: (FileUploadManager.UploadStatus) -> Unit = { _ -> }
) {
    val authRepository = remember { AuthRepository() }
    val userRepository = remember { UserRepository() }
    val fileRepository = remember { FileRepository() }
    val trashRepository = remember { TrashRepository() }
    
    val authViewModel = remember { AuthViewModel(authRepository) }
    val dashboardViewModel = remember {
        DashboardViewModel(authRepository, userRepository, fileRepository, trashRepository)
    }
    val storageViewModel = remember {
        StorageViewModel(authRepository, userRepository)
    }

    var user by remember { mutableStateOf(Firebase.auth.currentUser) }
    var isDarkTheme by remember { mutableStateOf(false) } 
    var isLocked by remember { mutableStateOf(false) }
    var hasAuthenticatedSession by remember { mutableStateOf(false) }
    var isInitializing by remember { mutableStateOf(true) }
    var showSignOutConfirm by remember { mutableStateOf(false) }
    
    val scope = rememberCoroutineScope()

    // Minimum splash duration
    LaunchedEffect(Unit) {
        delay(800)
        if (user == null) {
            isInitializing = false
        }
    }

    // Sync theme and biometric lock status
    val userMetadata by storageViewModel.userMetadata.collectAsState()
    
    LaunchedEffect(user, userMetadata) {
        val currentMetadata = userMetadata
        if (user != null && currentMetadata != null) {
            // Sync theme
            isDarkTheme = when(currentMetadata.preferences.theme) {
                "dark" -> true
                "light" -> false
                else -> false
            }
            
            // Handle Biometric Lock
            if (currentMetadata.preferences.security.twoFactorEnabled && !hasAuthenticatedSession) {
                isLocked = true
                onBiometricAuthClick(
                    "Vault Locked",
                    "Authenticate to access your encrypted files",
                    { 
                        isLocked = false
                        hasAuthenticatedSession = true
                        isInitializing = false
                    },
                    { _ -> 
                        isInitializing = false
                    }
                )
            } else {
                isLocked = false
                isInitializing = false
            }
        } else if (user == null) {
            isInitializing = false
            isLocked = false
        }
    }

    // Simple session listener
    LaunchedEffect(Unit) {
        Firebase.auth.authStateChanged.collect {
            user = it
        }
    }

    MaterialTheme(
        colorScheme = if (isDarkTheme) XCloudDarkColors else XCloudLightColors,
        shapes = XCloudShapes
    ) {
        Surface(
            modifier = Modifier.fillMaxSize(),
            color = MaterialTheme.colorScheme.background
        ) {
            AnimatedContent(
                targetState = Triple(isInitializing, user == null, isLocked),
                transitionSpec = {
                    fadeIn(animationSpec = tween(500)) togetherWith fadeOut(animationSpec = tween(500))
                },
                label = "AppScreenTransition"
            ) { state ->
                val (initializing, loggedOut, locked) = state
                when {
                    initializing -> SplashScreen()
                    loggedOut -> AuthScreen(
                        viewModel = authViewModel,
                        onGoogleSignInClick = {
                            onGoogleSignInClick(scope, { idToken ->
                                authViewModel.onGoogleSignInResult(idToken)
                            }, { error ->
                                authViewModel.onSignInError(error)
                            })
                        },
                        onFacebookSignInClick = {
                            onFacebookSignInClick(scope, { accessToken ->
                                authViewModel.onFacebookSignInResult(accessToken)
                            }, { error ->
                                authViewModel.onSignInError(error)
                            })
                        },
                        onAppleSignInClick = {
                            onAppleSignInClick(scope, { idToken, nonce ->
                                authViewModel.onAppleSignInResult(idToken, nonce)
                            }, { error ->
                                authViewModel.onSignInError(error)
                            })
                        }
                    )
                    locked -> {
                        // Vault Locked Screen
                        Box(
                            modifier = Modifier.fillMaxSize(),
                            contentAlignment = Alignment.Center
                        ) {
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                Surface(
                                    modifier = Modifier.size(100.dp),
                                    shape = CircleShape,
                                    color = MaterialTheme.colorScheme.primaryContainer
                                ) {
                                    Icon(
                                        Icons.Default.Fingerprint,
                                        null,
                                        modifier = Modifier.padding(24.dp).size(48.dp),
                                        tint = MaterialTheme.colorScheme.primary
                                    )
                                }
                                Spacer(modifier = Modifier.height(24.dp))
                                Text("Vault Locked", style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Black)
                                Text(
                                    "Biometric authentication required",
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                                Spacer(modifier = Modifier.height(48.dp))
                                Button(
                                    onClick = {
                                        onBiometricAuthClick(
                                            "Vault Locked",
                                            "Authenticate to access your encrypted files",
                                            { 
                                                isLocked = false
                                                hasAuthenticatedSession = true
                                            },
                                            { _ -> }
                                        )
                                    },
                                    shape = RoundedCornerShape(16.dp)
                                ) {
                                    Text("Unlock Vault")
                                }
                            }
                        }
                    }
                    else -> DashboardScreen(
                        viewModel = dashboardViewModel,
                        storageViewModel = storageViewModel,
                        isDarkTheme = isDarkTheme,
                        onThemeToggle = { isDarkTheme = !isDarkTheme },
                        onSignOutClick = {
                            showSignOutConfirm = true
                        },
                        onPickFileClick = onPickFileClick,
                        onPickAvatarClick = onPickAvatarClick,
                        onScanClick = onScanClick,
                        onUploadStatusChange = onUploadStatusChange,
                        onBiometricAuthClick = onBiometricAuthClick
                    )
                }
            }
        }

        if (showSignOutConfirm) {
            AlertDialog(
                onDismissRequest = { showSignOutConfirm = false },
                title = { 
                    Box(modifier = Modifier.fillMaxWidth(), contentAlignment = Alignment.Center) {
                        Text("Terminate Session?", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Black)
                    }
                },
                text = { 
                    Text(
                        "You are about to disconnect from your secure vault. All active transfers will be suspended.",
                        textAlign = TextAlign.Center,
                        modifier = Modifier.fillMaxWidth()
                    )
                },
                confirmButton = {
                    Column(modifier = Modifier.fillMaxWidth(), horizontalAlignment = Alignment.CenterHorizontally) {
                        Button(
                            onClick = {
                                showSignOutConfirm = false
                                onSignOutClick(scope) {
                                    scope.launch {
                                        authRepository.logout()
                                    }
                                }
                            },
                            modifier = Modifier.fillMaxWidth().height(56.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.error),
                            shape = RoundedCornerShape(16.dp)
                        ) {
                            Text("Terminate Access", fontWeight = FontWeight.Black, color = Color.White)
                        }
                        Spacer(modifier = Modifier.height(8.dp))
                        TextButton(
                            onClick = { showSignOutConfirm = false },
                            modifier = Modifier.fillMaxWidth().height(56.dp)
                        ) {
                            Text("Maintain Connection", fontWeight = FontWeight.Bold)
                        }
                    }
                },
                shape = RoundedCornerShape(32.dp),
                containerColor = MaterialTheme.colorScheme.surface,
                tonalElevation = 8.dp
            )
        }
    }
}
