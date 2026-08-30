package com.cloud.x.app.shared.ui.components

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ContentCopy
import androidx.compose.material.icons.filled.Share
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.cloud.x.model.FileEntry

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ShareSheet(
    file: FileEntry,
    onGenerateLink: (passcode: String?, expiryDays: Int?) -> Unit,
    onDismiss: () -> Unit
) {
    var passcode by remember { mutableStateOf("") }
    var usePasscode by remember { mutableStateOf(false) }
    var selectedExpiry by remember { mutableStateOf(7) } // 7 days default
    
    Column(modifier = Modifier.padding(16.dp).fillMaxWidth()) {
        Text("Share \"${file.fileName}\"", style = MaterialTheme.typography.titleLarge)
        Spacer(modifier = Modifier.height(16.dp))
        
        if (file.isShared && file.shareId != null) {
            val shareUrl = "https://xcloud.app/share/${file.shareId}"
            OutlinedTextField(
                value = shareUrl,
                onValueChange = {},
                readOnly = true,
                label = { Text("Public Link") },
                modifier = Modifier.fillMaxWidth(),
                trailingIcon = {
                    IconButton(onClick = { /* Copy to clipboard */ }) {
                        Icon(Icons.Default.ContentCopy, "Copy")
                    }
                }
            )
            Spacer(modifier = Modifier.height(16.dp))
            Button(
                onClick = { /* Launch system share intent */ },
                modifier = Modifier.fillMaxWidth()
            ) {
                Icon(Icons.Default.Share, null)
                Spacer(modifier = Modifier.width(8.dp))
                Text("Share with other apps")
            }
        } else {
            Text("Link Settings", style = MaterialTheme.typography.titleSmall)
            Spacer(modifier = Modifier.height(8.dp))
            
            Row(verticalAlignment = Alignment.CenterVertically) {
                Checkbox(checked = usePasscode, onCheckedChange = { usePasscode = it })
                Text("Protect with passcode")
            }
            
            if (usePasscode) {
                OutlinedTextField(
                    value = passcode,
                    onValueChange = { passcode = it },
                    label = { Text("Passcode") },
                    modifier = Modifier.fillMaxWidth()
                )
            }
            
            Spacer(modifier = Modifier.height(16.dp))
            Text("Expiry", style = MaterialTheme.typography.labelMedium)
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                listOf(1, 7, 30).forEach { days ->
                    FilterChip(
                        selected = selectedExpiry == days,
                        onClick = { selectedExpiry = days },
                        label = { Text("$days Days") }
                    )
                }
            }
            
            Spacer(modifier = Modifier.height(24.dp))
            Button(
                onClick = { onGenerateLink(if (usePasscode) passcode else null, selectedExpiry) },
                modifier = Modifier.fillMaxWidth()
            ) {
                Text("Generate Public Link")
            }
        }
        
        Spacer(modifier = Modifier.height(16.dp))
        TextButton(onClick = onDismiss, modifier = Modifier.align(Alignment.CenterHorizontally)) {
            Text("Close")
        }
    }
}
