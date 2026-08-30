package com.cloud.x.util

import dev.gitlive.firebase.storage.Data

expect fun ByteArray.toData(): Data

expect fun currentTimeMillis(): Long
