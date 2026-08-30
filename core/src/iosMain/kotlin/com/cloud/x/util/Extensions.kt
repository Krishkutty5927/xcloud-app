package com.cloud.x.util

import dev.gitlive.firebase.storage.Data
import kotlinx.cinterop.BetaInteropApi
import kotlinx.cinterop.ExperimentalForeignApi
import kotlinx.cinterop.addressOf
import kotlinx.cinterop.usePinned
import platform.Foundation.NSData
import platform.Foundation.NSDate
import platform.Foundation.create
import platform.posix.time

@OptIn(ExperimentalForeignApi::class, BetaInteropApi::class)
actual fun ByteArray.toData(): Data {
    val nsData = usePinned {
        NSData.create(bytes = it.addressOf(0), length = size.toULong())
    }
    return Data(nsData)
}

@OptIn(ExperimentalForeignApi::class)
actual fun currentTimeMillis(): Long = time(null) * 1000L
