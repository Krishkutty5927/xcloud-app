package com.cloud.x

import android.app.Activity
import android.net.Uri
import android.provider.OpenableColumns
import android.util.Log
import androidx.activity.ComponentActivity
import androidx.activity.result.contract.ActivityResultContracts

class FilePickerHelper(private val activity: ComponentActivity) {

    private var onFilePicked: ((String, String, Long, ByteArray) -> Unit)? = null
    private val TAG = "FilePickerHelper"

    private val pickFileLauncher = activity.registerForActivityResult(ActivityResultContracts.GetContent()) { uri: Uri? ->
        uri?.let { handlePickedFile(it) }
    }

    fun pickFile(onFilePicked: (String, String, Long, ByteArray) -> Unit) {
        this.onFilePicked = onFilePicked
        try {
            pickFileLauncher.launch("*/*")
        } catch (e: Exception) {
            Log.e(TAG, "Error launching file picker", e)
        }
    }

    fun pickImage(onImagePicked: (String, String, Long, ByteArray) -> Unit) {
        this.onFilePicked = onImagePicked
        try {
            pickFileLauncher.launch("image/*")
        } catch (e: Exception) {
            Log.e(TAG, "Error launching image picker", e)
        }
    }

    private fun handlePickedFile(uri: Uri) {
        val contentResolver = activity.contentResolver
        
        var name = "unknown_file"
        var size = 0L
        val type = contentResolver.getType(uri) ?: "application/octet-stream"

        try {
            contentResolver.query(uri, null, null, null, null)?.use { cursor ->
                if (cursor.moveToFirst()) {
                    val nameIndex = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME)
                    if (nameIndex != -1) {
                        name = cursor.getString(nameIndex) ?: name
                    }
                    val sizeIndex = cursor.getColumnIndex(OpenableColumns.SIZE)
                    if (sizeIndex != -1) {
                        size = cursor.getLong(sizeIndex)
                    }
                }
            }

            Log.d(TAG, "File picked: $name, type: $type, size: $size")

            // NOTE: Reading bytes into memory. Large files will crash with OutOfMemoryError.
            // For a production app, we should pass the Uri to Firebase Storage directly.
            val inputStream = contentResolver.openInputStream(uri)
            val bytes = inputStream?.readBytes() ?: byteArrayOf()
            inputStream?.close()

            if (bytes.isNotEmpty()) {
                onFilePicked?.invoke(name, type, size, bytes)
            } else {
                Log.e(TAG, "Read empty bytes from file")
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error handling picked file", e)
        }
    }
}
