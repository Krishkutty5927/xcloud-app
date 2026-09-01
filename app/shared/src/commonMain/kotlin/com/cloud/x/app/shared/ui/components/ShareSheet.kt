package com.cloud.x.app.shared.ui.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.cloud.x.model.Collaborator
import com.cloud.x.model.FileEntry

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ShareSheet(
    file: FileEntry,
    onGenerateLink: (passcode: String?, expiryDays: Int?) -> Unit,
    onInviteUser: (email: String, phone: String?, passcode: String?, expiry: Int) -> Unit = { _, _, _, _ -> },
    onRemoveCollaborator: (Collaborator) -> Unit = {},
    onDismiss: () -> Unit
) {
    var email by remember { mutableStateOf("") }
    var passcode by remember { mutableStateOf("") }
    var usePasscode by remember { mutableStateOf(false) }
    var selectedExpiry by remember { mutableStateOf(7) }
    
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(16.dp)
            .padding(bottom = 32.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text("Share Vault", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Black)
                Text("Protocol: Multi-User Sync", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.outline)
            }
            IconButton(onClick = onDismiss) {
                Icon(Icons.Default.Close, null)
            }
        }

        Spacer(modifier = Modifier.height(24.dp))

        // Invite Section
        Card(
            shape = RoundedCornerShape(24.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.3f))
        ) {
            Column(modifier = Modifier.padding(16.dp).fillMaxWidth()) {
                OutlinedTextField(
                    value = email,
                    onValueChange = { email = it },
                    label = { Text("Recipient's Email") },
                    placeholder = { Text("user@vault.node") },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp),
                    leadingIcon = { Icon(Icons.Default.Mail, null) }
                )
                
                Spacer(modifier = Modifier.height(12.dp))

                Row(verticalAlignment = Alignment.CenterVertically) {
                    Checkbox(checked = usePasscode, onCheckedChange = { usePasscode = it })
                    Text("Secure with Passcode", style = MaterialTheme.typography.bodyMedium)
                }

                if (usePasscode) {
                    OutlinedTextField(
                        value = passcode,
                        onValueChange = { passcode = it.uppercase().take(5) },
                        label = { Text("5-Char Security Key") },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(16.dp),
                        leadingIcon = { Icon(Icons.Default.Lock, null) }
                    )
                }

                Spacer(modifier = Modifier.height(16.dp))
                
                Button(
                    onClick = { 
                        onInviteUser(email, null, if (usePasscode) passcode else null, selectedExpiry)
                        email = ""
                        passcode = ""
                    },
                    modifier = Modifier.fillMaxWidth(),
                    enabled = email.isNotEmpty(),
                    shape = RoundedCornerShape(16.dp)
                ) {
                    Icon(Icons.AutoMirrored.Filled.Send, null)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Send Invitation")
                }
            }
        }

        Spacer(modifier = Modifier.height(24.dp))

        // Active Nodes Section
        Text(
            "ACTIVE NODES", 
            style = MaterialTheme.typography.labelLarge, 
            fontWeight = FontWeight.Black,
            color = MaterialTheme.colorScheme.outline,
            modifier = Modifier.padding(horizontal = 8.dp)
        )
        
        Spacer(modifier = Modifier.height(8.dp))

        val collaborators = file.sharedWith ?: emptyList()
        
        if (collaborators.isEmpty()) {
            Text(
                "No other nodes connected to this file.", 
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.outline,
                modifier = Modifier.padding(16.dp)
            )
        } else {
            collaborators.forEach { collab ->
                ListItem(
                    headlineContent = { Text(collab.email, fontWeight = FontWeight.Bold) },
                    supportingContent = { Text(collab.role.uppercase(), style = MaterialTheme.typography.labelSmall) },
                    leadingContent = {
                        Surface(
                            modifier = Modifier.size(40.dp),
                            shape = CircleShape,
                            color = MaterialTheme.colorScheme.primaryContainer
                        ) {
                            Box(contentAlignment = Alignment.Center) {
                                Text(collab.email.take(1).uppercase(), fontWeight = FontWeight.Black)
                            }
                        }
                    },
                    trailingContent = {
                        IconButton(onClick = { onRemoveCollaborator(collab) }) {
                            Icon(Icons.Default.RemoveCircleOutline, null, tint = MaterialTheme.colorScheme.error)
                        }
                    }
                )
            }
        }

        Spacer(modifier = Modifier.height(24.dp))

        // Public Link Section
        Surface(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(24.dp),
            color = if (file.isShared) MaterialTheme.colorScheme.secondaryContainer.copy(alpha = 0.5f) else MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.2f),
            border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.1f))
        ) {
            Row(
                modifier = Modifier.padding(16.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.weight(1f)) {
                    Surface(
                        modifier = Modifier.size(48.dp),
                        shape = RoundedCornerShape(12.dp),
                        color = if (file.isShared) MaterialTheme.colorScheme.secondary else MaterialTheme.colorScheme.outline.copy(alpha = 0.2f)
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Icon(Icons.Default.Language, null, tint = Color.White)
                        }
                    }
                    Spacer(modifier = Modifier.width(16.dp))
                    Column {
                        Text("Global Link Access", style = MaterialTheme.typography.bodyLarge, fontWeight = FontWeight.Black)
                        Text("Permission: Public/Read-Only", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.outline)
                    }
                }
                
                Switch(
                    checked = file.isShared,
                    onCheckedChange = { onGenerateLink(null, 7) }
                )
            }
        }
    }
}
