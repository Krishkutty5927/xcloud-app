package com.cloud.x

import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.util.Log
import android.widget.Toast
import android.Manifest
import android.content.pm.PackageManager
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.IntentSenderRequest
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.content.ContextCompat
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import androidx.fragment.app.FragmentActivity
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import com.google.mlkit.vision.documentscanner.GmsDocumentScanning
import com.google.mlkit.vision.documentscanner.GmsDocumentScannerOptions
import com.google.mlkit.vision.documentscanner.GmsDocumentScannerOptions.RESULT_FORMAT_JPEG
import com.google.mlkit.vision.documentscanner.GmsDocumentScannerOptions.RESULT_FORMAT_PDF
import com.google.mlkit.vision.documentscanner.GmsDocumentScannerOptions.SCANNER_MODE_FULL
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.tooling.preview.Preview
import com.cloud.x.auth.AppleAuthHelper
import com.cloud.x.auth.FacebookAuthHelper
import com.cloud.x.util.FileUploadManager
import com.google.mlkit.vision.documentscanner.GmsDocumentScanningResult

class MainActivity : FragmentActivity() {
    private lateinit var credentialManagerHelper: CredentialManagerHelper
    private lateinit var filePickerHelper: FilePickerHelper
    private lateinit var facebookAuthHelper: FacebookAuthHelper
    private lateinit var appleAuthHelper: AppleAuthHelper
    private lateinit var biometricHelper: BiometricHelper
    private lateinit var notificationHelper: NotificationHelper

    private var deepLinkUrl by mutableStateOf<String?>(null)

    private val requestPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { isGranted: Boolean ->
        if (isGranted) {
            Log.d("MainActivity", "Notification permission granted")
        } else {
            Log.w("MainActivity", "Notification permission denied")
        }
    }

    private var onScanComplete: ((String, String, Long, ByteArray) -> Unit)? = null

    private val scannerLauncher = registerForActivityResult(
        ActivityResultContracts.StartIntentSenderForResult()
    ) { result ->
        if (result.resultCode == RESULT_OK) {
            val scanResult = GmsDocumentScanningResult.fromActivityResultIntent(result.data)
            scanResult?.pdf?.let { pdf ->
                val uri = pdf.uri
                val inputStream = contentResolver.openInputStream(uri)
                val bytes = inputStream?.readBytes()
                if (bytes != null) {
                    onScanComplete?.invoke("Scan_${System.currentTimeMillis()}.pdf", "application/pdf", bytes.size.toLong(), bytes)
                }
            } ?: scanResult?.pages?.firstOrNull()?.let { page ->
                val uri = page.imageUri
                val inputStream = contentResolver.openInputStream(uri)
                val bytes = inputStream?.readBytes()
                if (bytes != null) {
                    onScanComplete?.invoke("Scan_${System.currentTimeMillis()}.jpg", "image/jpeg", bytes.size.toLong(), bytes)
                }
            }
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        val splashScreen = installSplashScreen()
        // Keep the system splash screen on-screen until the activity is ready
        // and Compose starts rendering.
        var isReady = false
        splashScreen.setKeepOnScreenCondition { !isReady }
        
        try {
            Log.d("MainActivity", "Pre-onCreate")
            enableEdgeToEdge()
            if (Build.VERSION.SDK_INT >= 29) {
                window.isNavigationBarContrastEnforced = false
            }
            super.onCreate(savedInstanceState)
            
            checkNotificationPermission()
            Log.d("MainActivity", "Starting onCreate")

            initHelpers()

            handleIntent(intent)

            Log.d("MainActivity", "Setting content")
            setContent {
                SideEffect { isReady = true }
                App(
                    deepLink = deepLinkUrl,
                    onGoogleSignInClick = { scope, onToken ->
                        credentialManagerHelper.launchGoogleSignIn(scope, onToken)
                    },
                    onFacebookSignInClick = { _, onToken ->
                        facebookAuthHelper.registerCallback(
                            onSuccess = { onToken(it) },
                            onCancelAction = { /* Handle cancel */ },
                            onError = { /* Handle error */ }
                        )
                        facebookAuthHelper.launchLogin()
                    },
                    onAppleSignInClick = { _, onToken ->
                        appleAuthHelper.launchLogin(
                            onSuccess = { idToken, nonce -> onToken(idToken, nonce) },
                            onError = { /* Handle error */ }
                        )
                    },
                    onSignOutClick = { _, onComplete ->
                        credentialManagerHelper.signOut(onComplete)
                    },
                    onPickFileClick = { onFilePicked ->
                        filePickerHelper.pickFile(onFilePicked)
                    },
                    onPickAvatarClick = { onAvatarPicked ->
                        filePickerHelper.pickImage(onAvatarPicked)
                    },
                    onScanClick = { onComplete ->
                        this@MainActivity.onScanComplete = onComplete
                        val options = GmsDocumentScannerOptions.Builder()
                            .setGalleryImportAllowed(false)
                            .setPageLimit(5)
                            .setResultFormats(RESULT_FORMAT_JPEG, RESULT_FORMAT_PDF)
                            .setScannerMode(SCANNER_MODE_FULL)
                            .build()

                        Toast.makeText(this@MainActivity, "Initializing Scanner...", Toast.LENGTH_SHORT).show()
                        GmsDocumentScanning.getClient(options)
                            .getStartScanIntent(this@MainActivity)
                            .addOnSuccessListener { intentSender ->
                                scannerLauncher.launch(IntentSenderRequest.Builder(intentSender).build())
                            }
                            .addOnFailureListener { e ->
                                Toast.makeText(this@MainActivity, "Scanner failed: ${e.message}", Toast.LENGTH_SHORT).show()
                            }
                    },
                    onBiometricAuthClick = { title, subtitle, onSuccess, onError ->
                        if (biometricHelper.isBiometricAvailable()) {
                            biometricHelper.showBiometricPrompt(title, subtitle, onSuccess, onError)
                        } else {
                            onError("Biometrics not available on this device")
                        }
                    },
                    onUploadStatusChange = { status ->
                        when (status) {
                            is FileUploadManager.UploadStatus.Progress -> {
                                notificationHelper.showUploadProgress(
                                    status.fileName,
                                    (status.percentage * 100).toInt()
                                )
                            }
                            is FileUploadManager.UploadStatus.Success -> {
                                notificationHelper.showUploadSuccess(status.file.fileName)
                            }
                            is FileUploadManager.UploadStatus.Error -> {
                                notificationHelper.showUploadFailed(status.fileName, status.message)
                            }
                        }
                    }
                )
            }
            Log.d("MainActivity", "Content set successfully")
        } catch (e: Throwable) {
            Log.e("MainActivity", "CRITICAL CRASH", e)
            Toast.makeText(this, "Fatal Error: ${e.localizedMessage}", Toast.LENGTH_LONG).show()
        }
    }

    private fun initHelpers() {
        try {
            credentialManagerHelper = CredentialManagerHelper(this)
            filePickerHelper = FilePickerHelper(this)
            facebookAuthHelper = FacebookAuthHelper(this)
            appleAuthHelper = AppleAuthHelper(this)
            biometricHelper = BiometricHelper(this)
            notificationHelper = NotificationHelper(this)
        } catch (e: Throwable) {
            Log.e("MainActivity", "Helper init failed", e)
            throw e
        }
    }

    @Deprecated("Use Activity Result API instead")
    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        @Suppress("DEPRECATION")
        super.onActivityResult(requestCode, resultCode, data)
        facebookAuthHelper.onActivityResult(requestCode, resultCode, data)
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        handleIntent(intent)
    }

    private fun handleIntent(intent: Intent?) {
        intent?.data?.let { uri ->
            deepLinkUrl = uri.toString()
        }
    }

    private fun checkNotificationPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) != 
                PackageManager.PERMISSION_GRANTED) {
                requestPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
            }
        }
    }
}

@Preview
@Composable
fun AppAndroidPreview() {
    App()
}
