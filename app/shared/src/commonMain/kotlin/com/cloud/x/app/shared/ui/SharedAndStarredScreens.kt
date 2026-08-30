package com.cloud.x.app.shared.ui

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.People
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.cloud.x.model.FileEntry

@Composable
fun SharedScreen(
    files: List<FileEntry>,
    onFileClick: (FileEntry) -> Unit,
    onShare: (FileEntry) -> Unit = {},
    onMoreClick: (FileEntry) -> Unit = {},
    contentPadding: PaddingValues = PaddingValues(0.dp)
) {
    if (files.isEmpty()) {
        EmptyState(
            icon = Icons.Default.People,
            title = "Shared with me",
            description = "Files and folders others have shared with you will appear here."
        )
    } else {
        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = contentPadding
        ) {
            item {
                Text(
                    "Shared Items",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Black,
                    modifier = Modifier.padding(horizontal = 20.dp, vertical = 16.dp)
                )
            }
            items(files) { file ->
                FileListItem(
                    file = file,
                    onClick = { onFileClick(file) },
                    onShare = { onShare(file) },
                    onDelete = { onMoreClick(file) },
                    isSharedView = true
                )
            }
        }
    }
}

@Composable
fun StarredScreen(
    files: List<FileEntry>,
    onFileClick: (FileEntry) -> Unit,
    onShare: (FileEntry) -> Unit = {},
    onMoreClick: (FileEntry) -> Unit = {},
    contentPadding: PaddingValues = PaddingValues(0.dp)
) {
    if (files.isEmpty()) {
        EmptyState(
            icon = Icons.Default.Star,
            title = "Starred",
            description = "Add stars to things you want to find easily later."
        )
    } else {
        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = contentPadding
        ) {
            items(files) { file ->
                FileListItem(
                    file = file,
                    onClick = { onFileClick(file) },
                    onShare = { onShare(file) },
                    onDelete = { onMoreClick(file) },
                    isSharedView = true
                )
            }
        }
    }
}

@Composable
fun EmptyState(icon: ImageVector, title: String, description: String) {
    Column(
        modifier = Modifier.fillMaxSize().padding(32.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Icon(
            imageVector = icon,
            contentDescription = null,
            modifier = Modifier.size(80.dp),
            tint = MaterialTheme.colorScheme.primary.copy(alpha = 0.5f)
        )
        Spacer(modifier = Modifier.height(16.dp))
        Text(title, style = MaterialTheme.typography.headlineSmall)
        Spacer(modifier = Modifier.height(8.dp))
        Text(
            description,
            style = MaterialTheme.typography.bodyMedium,
            color = Color.Gray,
            textAlign = TextAlign.Center
        )
    }
}
