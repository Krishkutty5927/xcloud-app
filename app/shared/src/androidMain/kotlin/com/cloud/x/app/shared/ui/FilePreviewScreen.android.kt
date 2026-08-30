package com.cloud.x.app.shared.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.media3.common.MediaItem
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.ui.PlayerView
import coil3.compose.AsyncImage
import com.cloud.x.model.FileEntry
import io.ktor.client.*
import io.ktor.client.request.*
import io.ktor.client.statement.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import android.webkit.WebView
import android.webkit.WebViewClient

@Composable
actual fun PreviewContent(file: FileEntry) {
    val context = LocalContext.current
    
    when {
        file.fileType.contains("image", true) -> {
            AsyncImage(
                model = file.downloadUrl,
                contentDescription = file.fileName,
                modifier = Modifier.fillMaxSize()
            )
        }
        file.fileType.contains("video", true) || file.fileType.contains("audio", true) -> {
            val exoPlayer = remember {
                ExoPlayer.Builder(context).build().apply {
                    setMediaItem(MediaItem.fromUri(file.downloadUrl))
                    prepare()
                    playWhenReady = true
                }
            }
            
            DisposableEffect(Unit) {
                onDispose { exoPlayer.release() }
            }
            
            AndroidView(
                factory = {
                    PlayerView(context).apply {
                        player = exoPlayer
                    }
                },
                modifier = Modifier.fillMaxSize()
            )
        }
        file.fileType.contains("PDF", true) || file.fileType.contains("Document", true) -> {
            // PDF/Document Preview using WebView and Google Docs Viewer
            AndroidView(
                factory = {
                    WebView(it).apply {
                        webViewClient = WebViewClient()
                        settings.javaScriptEnabled = true
                        val url = "https://docs.google.com/viewer?embedded=true&url=${file.downloadUrl}"
                        loadUrl(url)
                    }
                },
                modifier = Modifier.fillMaxSize()
            )
        }
        file.fileType.contains("Text", true) -> {
            var textContent by remember { mutableStateOf<String?>(null) }
            var isLoading by remember { mutableStateOf(true) }

            LaunchedEffect(file.downloadUrl) {
                withContext(Dispatchers.IO) {
                    try {
                        val client = HttpClient()
                        val response = client.get(file.downloadUrl)
                        textContent = response.bodyAsText()
                    } catch (e: Exception) {
                        textContent = "Failed to load content: ${e.message}"
                    } finally {
                        isLoading = false
                    }
                }
            }

            if (isLoading) {
                CircularProgressIndicator(color = Color.White)
            } else {
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .verticalScroll(rememberScrollState())
                        .padding(16.dp)
                ) {
                    Text(
                        textContent ?: "",
                        color = Color.White,
                        style = MaterialTheme.typography.bodyMedium
                    )
                }
            }
        }
        else -> {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Icon(
                    imageVector = getFileIcon(file.fileType),
                    contentDescription = null,
                    modifier = Modifier.size(64.dp),
                    tint = Color.White.copy(alpha = 0.5f)
                )
                Spacer(modifier = Modifier.height(16.dp))
                Text(
                    "Preview not available for this file type",
                    color = Color.White
                )
            }
        }
    }
}
