package com.cloud.x.util

import dev.gitlive.firebase.storage.Data

expect fun ByteArray.toData(): Data

expect fun currentTimeMillis(): Long

fun String.sanitizeFileName(): String {
    return this.replace(" ", "_")
        .replace(Regex("[^a-zA-Z0-9._-]"), "")
}
