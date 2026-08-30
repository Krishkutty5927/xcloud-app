# Material 3 and Compose
-keep class androidx.compose.material3.** { *; }
-dontwarn androidx.compose.material3.**

# Firebase
-keep class com.google.firebase.** { *; }
-dontwarn com.google.firebase.**

# Supabase (Kotlin Serialization)
-keepattributes *Annotation*, EnclosingMethod, Signature
-keepclassmembers class ** {
    @kotlinx.serialization.Serializable *;
}
-keep class kotlinx.serialization.json.** { *; }

# Coil (Image Loading)
-keep class coil3.** { *; }
-dontwarn coil3.**

# Keep models to avoid serialization issues
-keep class com.cloud.x.model.** { *; }

# Keep MainActivity and avoid it being stripped
-keep class com.cloud.x.MainActivity { *; }
-keep class com.cloud.x.VaultApplication { *; }
