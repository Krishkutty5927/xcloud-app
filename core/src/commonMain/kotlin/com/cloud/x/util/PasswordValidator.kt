package com.cloud.x.util

object PasswordValidator {
    private val passwordRegex = Regex("^(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=!])(?!.* ).{8,}$")

    fun isValid(password: String): Boolean {
        return passwordRegex.matches(password)
    }
}
