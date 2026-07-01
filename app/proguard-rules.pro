# ProGuard rules for Rize

# Keep all receivers and services — AGP may strip them without this
-keep class com.rize.alarm.receiver.** { *; }
-keep class com.rize.alarm.service.** { *; }

# Keep Hilt-generated components
-keep class dagger.hilt.** { *; }
-keep class javax.inject.** { *; }

# Keep Room entities and DAOs
-keep class com.rize.alarm.data.** { *; }

# Keep NfcTagHandler and related classes
-keep class com.rize.alarm.nfc.** { *; }

# Kotlin coroutines
-keepclassmembers class kotlinx.coroutines.** { volatile <fields>; }

# WorkManager
-keep class androidx.work.** { *; }
