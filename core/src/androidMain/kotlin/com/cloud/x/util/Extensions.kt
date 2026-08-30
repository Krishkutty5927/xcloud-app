package com.cloud.x.util

import dev.gitlive.firebase.storage.Data

actual fun ByteArray.toData(): Data = Data(this)

actual fun currentTimeMillis(): Long = System.currentTimeMillis()
