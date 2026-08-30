package com.cloud.x.util

import dev.gitlive.firebase.storage.Data
import org.khronos.webgl.Uint8Array
import kotlin.js.Date

actual fun ByteArray.toData(): Data = Data(this.asDynamic() as Uint8Array)

actual fun currentTimeMillis(): Long = Date.now().toLong()
