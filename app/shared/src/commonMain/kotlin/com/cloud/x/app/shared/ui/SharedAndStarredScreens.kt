package com.cloud.x.app.shared.ui

import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.cloud.x.model.FileEntry
import com.cloud.x.model.Invitation

@Composable
fun SharedScreen(
    files: List<FileEntry>,
    sentInvitations: List<Invitation>,
    receivedInvitations: List<Invitation>,
    onFileClick: (FileEntry) -> Unit,
    onShare: (FileEntry) -> Unit = {},
    onMoreClick: (FileEntry) -> Unit = {},
    onRevokeInvite: (Invitation) -> Unit = {},
    onAcceptInvite: (Invitation) -> Unit = {},
    contentPadding: PaddingValues = PaddingValues(0.dp)
) {
    var selectedTab by remember { mutableStateOf(0) }
    val tabs = listOf("With me", "By me", "Invitations")

    Column(modifier = Modifier.fillMaxSize()) {
        TabRow(
            selectedTabIndex = selectedTab,
            containerColor = MaterialTheme.colorScheme.surface,
            contentColor = MaterialTheme.colorScheme.primary,
            divider = {}
        ) {
            tabs.forEachIndexed { index, title ->
                Tab(
                    selected = selectedTab == index,
                    onClick = { selectedTab = index },
                    text = { Text(title, style = MaterialTheme.typography.labelLarge, fontWeight = FontWeight.Bold) }
                )
            }
        }

        Box(modifier = Modifier.fillMaxSize()) {
            when (selectedTab) {
                0 -> {
                    if (files.isEmpty()) {
                        EmptyState(
                            icon = Icons.Default.People,
                            title = "No Shared Nodes",
                            description = "Files others have shared with you will appear here after verification."
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
                1 -> {
                    if (sentInvitations.isEmpty()) {
                        EmptyState(
                            icon = Icons.Default.CloudUpload,
                            title = "No Outgoing Nodes",
                            description = "Files you share with others will be logged here."
                        )
                    } else {
                        LazyColumn(
                            modifier = Modifier.fillMaxSize(),
                            contentPadding = contentPadding
                        ) {
                            items(sentInvitations) { invite ->
                                OutgoingInviteItem(invite, onRevoke = { onRevokeInvite(invite) })
                            }
                        }
                    }
                }
                2 -> {
                    if (receivedInvitations.isEmpty()) {
                        EmptyState(
                            icon = Icons.Default.Mail,
                            title = "No Pending Invites",
                            description = "Incoming share requests awaiting your authorization."
                        )
                    } else {
                        LazyColumn(
                            modifier = Modifier.fillMaxSize(),
                            contentPadding = contentPadding
                        ) {
                            items(receivedInvitations) { invite ->
                                InvitationListItem(invite, onAccept = { onAcceptInvite(invite) })
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun OutgoingInviteItem(invite: Invitation, onRevoke: () -> Unit) {
    ListItem(
        headlineContent = { Text(invite.fileName, fontWeight = FontWeight.Bold, maxLines = 1, overflow = TextOverflow.Ellipsis) },
        supportingContent = {
            Column {
                Text("To: ${invite.recipientEmail ?: invite.recipientPhone}", style = MaterialTheme.typography.labelSmall)
                Text(
                    invite.status,
                    color = if (invite.status == "PENDING") Color(0xFFFFA000) else Color(0xFF4CAF50),
                    style = MaterialTheme.typography.labelSmall,
                    fontWeight = FontWeight.Black
                )
            }
        },
        leadingContent = {
            Surface(
                modifier = Modifier.size(40.dp),
                shape = RoundedCornerShape(12.dp),
                color = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.5f)
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Icon(Icons.Default.FilePresent, null, tint = MaterialTheme.colorScheme.primary)
                }
            }
        },
        trailingContent = {
            IconButton(onClick = onRevoke) {
                Icon(Icons.Default.Block, "Revoke", tint = MaterialTheme.colorScheme.error)
            }
        }
    )
}

@Composable
fun InvitationListItem(invite: Invitation, onAccept: () -> Unit) {
    ListItem(
        headlineContent = { Text(invite.fileName, fontWeight = FontWeight.Bold) },
        supportingContent = { Text("From: ${invite.senderName}", style = MaterialTheme.typography.labelSmall) },
        leadingContent = {
            Surface(
                modifier = Modifier.size(40.dp),
                shape = RoundedCornerShape(12.dp),
                color = MaterialTheme.colorScheme.secondaryContainer.copy(alpha = 0.5f)
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Icon(Icons.Default.MarkEmailUnread, null, tint = MaterialTheme.colorScheme.secondary)
                }
            }
        },
        trailingContent = {
            Button(onClick = onAccept, shape = RoundedCornerShape(8.dp)) {
                Text("Verify")
            }
        }
    )
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
