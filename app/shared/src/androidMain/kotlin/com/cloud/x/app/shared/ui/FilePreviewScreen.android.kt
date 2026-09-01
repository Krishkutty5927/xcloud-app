package com.cloud.x.app.shared.ui

import android.app.Activity
import android.content.pm.ActivityInfo
import androidx.compose.animation.*
import androidx.compose.foundation.clickable
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.*
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.media3.common.MediaItem
import androidx.media3.common.PlaybackParameters
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.ui.AspectRatioFrameLayout
import androidx.media3.ui.PlayerView
import coil3.compose.AsyncImage
import com.cloud.x.model.FileEntry
import io.ktor.client.*
import io.ktor.client.request.*
import io.ktor.client.statement.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
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
            VideoPlayerPro(file)
        }
        file.fileType.contains("PDF", true) || 
        file.fileType.contains("Document", true) ||
        file.fileName.endsWith(".docx", true) ||
        file.fileName.endsWith(".doc", true) ||
        file.fileName.endsWith(".xlsx", true) ||
        file.fileName.endsWith(".xls", true) ||
        file.fileName.endsWith(".pptx", true) ||
        file.fileName.endsWith(".ppt", true) ||
        file.fileName.endsWith(".odt", true) ||
        file.fileName.endsWith(".rtf", true) -> {
            // PDF/Document Preview using WebView and Google Docs Viewer
            AndroidView(
                factory = {
                    WebView(it).apply {
                        webViewClient = WebViewClient()
                        settings.javaScriptEnabled = true
                        settings.loadWithOverviewMode = true
                        settings.useWideViewPort = true
                        val url = "https://docs.google.com/viewer?embedded=true&url=${file.downloadUrl}"
                        loadUrl(url)
                    }
                },
                modifier = Modifier.fillMaxSize()
            )
        }
        file.fileType.contains("Text", true) || 
        file.fileName.endsWith(".md", true) || 
        file.fileName.endsWith(".markdown", true) || 
        file.fileName.endsWith(".log", true) || 
        file.fileName.endsWith(".csv", true) || 
        file.fileName.endsWith(".tsv", true) -> {
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

@Composable
fun VideoPlayerPro(file: FileEntry) {
    val context = LocalContext.current
    val exoPlayer = remember {
        ExoPlayer.Builder(context).build().apply {
            setMediaItem(MediaItem.fromUri(file.downloadUrl))
            prepare()
            playWhenReady = true
        }
    }

    var isPlaying by remember { mutableStateOf(true) }
    var currentTime by remember { mutableStateOf(0L) }
    var duration by remember { mutableStateOf(0L) }
    var playbackSpeed by remember { mutableStateOf(1.0f) }
    var showControls by remember { mutableStateOf(true) }
    var resizeMode by remember { mutableStateOf(AspectRatioFrameLayout.RESIZE_MODE_FIT) }
    var isZapEnabled by remember { mutableStateOf(false) }
    var isLandscape by remember { mutableStateOf(false) }

    LaunchedEffect(isLandscape) {
        val activity = context as? Activity
        activity?.requestedOrientation = if (isLandscape) {
            ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE
        } else {
            ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED
        }
    }

    DisposableEffect(Unit) {
        onDispose { 
            exoPlayer.release() 
            (context as? Activity)?.requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED
        }
    }

    LaunchedEffect(exoPlayer) {
        while (true) {
            currentTime = exoPlayer.currentPosition
            duration = exoPlayer.duration.coerceAtLeast(0L)
            isPlaying = exoPlayer.isPlaying
            delay(500)
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.Black)
            .clickable { showControls = !showControls },
        contentAlignment = Alignment.Center
    ) {
        AndroidView(
            factory = {
                PlayerView(context).apply {
                    player = exoPlayer
                    useController = false
                    this.resizeMode = resizeMode
                }
            },
            update = {
                it.resizeMode = resizeMode
            },
            modifier = Modifier.fillMaxSize()
        )

        // Custom Controls
        AnimatedVisibility(
            visible = showControls,
            enter = fadeIn(),
            exit = fadeOut()
        ) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(Color.Black.copy(alpha = 0.4f))
            ) {
                // Top Bar
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .align(Alignment.TopCenter)
                        .padding(16.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        file.fileName,
                        color = Color.White,
                        style = MaterialTheme.typography.titleMedium,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                        modifier = Modifier.weight(1f)
                    )
                    
                    Row {
                        IconButton(onClick = { isLandscape = !isLandscape }) {
                            Icon(
                                if (isLandscape) Icons.Default.ScreenLockRotation else Icons.Default.ScreenRotation, 
                                null, 
                                tint = Color.White
                            )
                        }
                        IconButton(onClick = {
                            resizeMode = when (resizeMode) {
                                AspectRatioFrameLayout.RESIZE_MODE_FIT -> AspectRatioFrameLayout.RESIZE_MODE_FILL
                                AspectRatioFrameLayout.RESIZE_MODE_FILL -> AspectRatioFrameLayout.RESIZE_MODE_ZOOM
                                else -> AspectRatioFrameLayout.RESIZE_MODE_FIT
                            }
                        }) {
                            Icon(Icons.Default.AspectRatio, null, tint = Color.White)
                        }
                    }
                }

                // Center Controls
                Row(
                    modifier = Modifier.align(Alignment.Center),
                    horizontalArrangement = Arrangement.spacedBy(48.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    IconButton(onClick = { exoPlayer.seekTo(exoPlayer.currentPosition - 10000) }) {
                        Icon(Icons.Default.Replay10, null, tint = Color.White, modifier = Modifier.size(48.dp))
                    }

                    Surface(
                        onClick = { if (isPlaying) exoPlayer.pause() else exoPlayer.play() },
                        shape = CircleShape,
                        color = MaterialTheme.colorScheme.primary,
                        contentColor = MaterialTheme.colorScheme.onPrimary,
                        modifier = Modifier.size(72.dp)
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Icon(
                                if (isPlaying) Icons.Default.Pause else Icons.Default.PlayArrow,
                                null,
                                modifier = Modifier.size(40.dp)
                            )
                        }
                    }

                    IconButton(onClick = { exoPlayer.seekTo(exoPlayer.currentPosition + 10000) }) {
                        Icon(Icons.Default.Forward10, null, tint = Color.White, modifier = Modifier.size(48.dp))
                    }
                }

                // Bottom Controls
                Column(
                    modifier = Modifier
                        .align(Alignment.BottomCenter)
                        .padding(bottom = 24.dp)
                ) {
                    Slider(
                        value = if (duration > 0) currentTime.toFloat() / duration else 0f,
                        onValueChange = { exoPlayer.seekTo((it * duration).toLong()) },
                        modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp),
                        colors = SliderDefaults.colors(
                            thumbColor = MaterialTheme.colorScheme.primary,
                            activeTrackColor = MaterialTheme.colorScheme.primary
                        )
                    )

                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 24.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            "${formatTime(currentTime)} / ${formatTime(duration)}",
                            color = Color.White,
                            style = MaterialTheme.typography.labelMedium
                        )

                        Row(verticalAlignment = Alignment.CenterVertically) {
                            TextButton(onClick = {
                                playbackSpeed = when (playbackSpeed) {
                                    1.0f -> 1.5f
                                    1.5f -> 2.0f
                                    2.0f -> 0.5f
                                    else -> 1.0f
                                }
                                exoPlayer.playbackParameters = PlaybackParameters(playbackSpeed)
                            }) {
                                Text("${playbackSpeed}x", color = Color.White, fontWeight = FontWeight.Black)
                            }

                            IconButton(onClick = {
                                isZapEnabled = !isZapEnabled
                                exoPlayer.setSkipSilenceEnabled(isZapEnabled)
                            }) {
                                Icon(
                                    Icons.Default.Bolt,
                                    null,
                                    tint = if (isZapEnabled) MaterialTheme.colorScheme.primary else Color.White
                                )
                            }
                            
                            IconButton(onClick = { /* Volume logic or toggle */ }) {
                                Icon(Icons.AutoMirrored.Filled.VolumeUp, null, tint = Color.White)
                            }
                        }
                    }
                }
            }
        }
    }
}

private fun formatTime(ms: Long): String {
    val totalSeconds = ms / 1000
    val minutes = totalSeconds / 60
    val seconds = totalSeconds % 60
    return "%02d:%02d".format(minutes, seconds)
}

private fun getFileIcon(fileType: String): ImageVector {
    return when {
        fileType.contains("image", true) -> Icons.Default.Image
        fileType.contains("video", true) -> Icons.Default.Videocam
        fileType.contains("audio", true) -> Icons.Default.Audiotrack
        fileType.contains("PDF", true) -> Icons.Default.PictureAsPdf
        else -> Icons.AutoMirrored.Filled.InsertDriveFile
    }
}
