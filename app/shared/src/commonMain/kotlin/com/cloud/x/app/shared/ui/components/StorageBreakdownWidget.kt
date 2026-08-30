package com.cloud.x.app.shared.ui.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Cloud
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.cloud.x.model.UserMetadata
import com.cloud.x.util.StorageQuotaManager

@Composable
fun StorageBreakdownWidget(
    breakdown: UserMetadata.StorageBreakdown,
    totalUsed: Long,
    totalAvailable: Long,
    planName: String = "Free"
) {
    val usedPercentage = if (totalAvailable > 0) totalUsed.toFloat() / totalAvailable else 0f
    val usedFormatted = StorageQuotaManager.formatBytes(totalUsed)
    val availableFormatted = StorageQuotaManager.formatBytes(totalAvailable)
    
    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp),
        shape = RoundedCornerShape(32.dp),
        color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.3f),
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.1f))
    ) {
        Column(modifier = Modifier.padding(24.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    Icons.Default.Cloud, 
                    null, 
                    tint = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.size(20.dp)
                )
                Spacer(modifier = Modifier.width(12.dp))
                Column {
                    Text(
                        "$planName Vault", 
                        style = MaterialTheme.typography.labelLarge,
                        fontWeight = FontWeight.Black,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    Text(
                        "$usedFormatted of $availableFormatted",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        fontWeight = FontWeight.Bold
                    )
                }
                Spacer(modifier = Modifier.weight(1f))
                Text(
                    "${(usedPercentage * 100).toInt()}%", 
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Black,
                    color = MaterialTheme.colorScheme.primary
                )
            }
            
            Spacer(modifier = Modifier.height(24.dp))
            
            // Multi-color progress bar
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(10.dp)
                    .clip(CircleShape)
                    .background(MaterialTheme.colorScheme.surfaceVariant)
            ) {
                Row(modifier = Modifier.fillMaxSize()) {
                    if (totalUsed > 0) {
                        StorageSegment(breakdown.images, totalUsed, MaterialTheme.colorScheme.primary)
                        StorageSegment(breakdown.videos, totalUsed, MaterialTheme.colorScheme.tertiary)
                        StorageSegment(breakdown.audio, totalUsed, Color(0xFFFFB74D))
                        StorageSegment(breakdown.documents, totalUsed, Color(0xFF81C784))
                        StorageSegment(breakdown.others, totalUsed, MaterialTheme.colorScheme.outline)
                    }
                }
            }
            
            Spacer(modifier = Modifier.height(24.dp))
            
            // Legend
            FlowRow(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                LegendItem("Images", MaterialTheme.colorScheme.primary)
                LegendItem("Videos", MaterialTheme.colorScheme.tertiary)
                LegendItem("Audio", Color(0xFFFFB74D))
                LegendItem("Docs", Color(0xFF81C784))
                LegendItem("Other", MaterialTheme.colorScheme.outline)
            }
        }
    }
}

@Composable
private fun RowScope.StorageSegment(amount: Long, total: Long, color: Color) {
    if (amount > 0) {
        Box(
            modifier = Modifier
                .weight(amount.toFloat().coerceAtLeast(1f))
                .fillMaxHeight()
                .background(color)
        )
    }
}

@Composable
private fun LegendItem(label: String, color: Color) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        Box(modifier = Modifier.size(8.dp).clip(CircleShape).background(color))
        Spacer(modifier = Modifier.width(4.dp))
        Text(label, style = MaterialTheme.typography.labelSmall)
    }
}
