package com.rize.alarm.service

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Intent
import android.media.AudioAttributes
import android.media.AudioManager
import android.media.MediaPlayer
import android.os.IBinder
import android.os.PowerManager
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import androidx.core.app.NotificationCompat
import com.rize.alarm.R
import com.rize.alarm.receiver.AlarmReceiver
import kotlinx.coroutines.*

/**
 * Foreground service that plays the alarm audio and holds a WakeLock.
 * START_STICKY ensures the OS restarts this service if it's killed.
 * Volume escalates from 30% to 100% over 60 seconds.
 */
class AlarmForegroundService : Service() {

    private var wakeLock: PowerManager.WakeLock? = null
    private var mediaPlayer: MediaPlayer? = null
    private val serviceScope = CoroutineScope(Dispatchers.Main + SupervisorJob())
    private var currentAlarmId: Int = -1

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        currentAlarmId = intent?.getIntExtra(AlarmReceiver.EXTRA_ALARM_ID, -1) ?: -1

        createNotificationChannel()
        startForeground(NOTIFICATION_ID, buildNotification())
        acquireWakeLock()
        startAlarmAudio()
        startVibration()

        return START_STICKY
    }

    override fun onDestroy() {
        serviceScope.cancel()
        stopAlarmAudio()
        releaseWakeLock()
        super.onDestroy()
    }

    // ——— Audio ———

    private fun startAlarmAudio() {
        val alarmUri = android.media.RingtoneManager.getDefaultUri(
            android.media.RingtoneManager.TYPE_ALARM
        ) ?: android.media.RingtoneManager.getDefaultUri(
            android.media.RingtoneManager.TYPE_RINGTONE  // fallback if no alarm tone set
        )

        mediaPlayer = MediaPlayer().apply {
            setDataSource(applicationContext, alarmUri)
            setAudioAttributes(
                AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_ALARM)
                    .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                    .build()
            )
            isLooping = true
            prepare()
            setVolume(0.3f, 0.3f)
            start()
        }

        serviceScope.launch { escalateVolume() }
    }

    private suspend fun escalateVolume() {
        val steps = 70  // 30% -> 100% = 70 steps
        val intervalMs = 60_000L / steps
        var currentVolume = 0.3f
        repeat(steps) {
            delay(intervalMs)
            currentVolume = minOf(1.0f, currentVolume + 0.01f)
            mediaPlayer?.setVolume(currentVolume, currentVolume)
        }
    }

    private fun stopAlarmAudio() {
        mediaPlayer?.stop()
        mediaPlayer?.release()
        mediaPlayer = null
    }

    // ——— Vibration ———

    private fun startVibration() {
        val pattern = longArrayOf(0, 500, 500)
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.S) {
            val vibratorManager = getSystemService(VibratorManager::class.java)
            vibratorManager.defaultVibrator.vibrate(
                VibrationEffect.createWaveform(pattern, 0)
            )
        } else {
            @Suppress("DEPRECATION")
            val vibrator = getSystemService(Vibrator::class.java)
            vibrator.vibrate(VibrationEffect.createWaveform(pattern, 0))
        }
    }

    // ——— WakeLock ———

    private fun acquireWakeLock() {
        val pm = getSystemService(PowerManager::class.java)
        wakeLock = pm.newWakeLock(
            PowerManager.PARTIAL_WAKE_LOCK,
            "Rize::AlarmWakeLock"
        ).apply {
            acquire(10 * 60 * 1000L) // 10 min safety ceiling
        }
    }

    private fun releaseWakeLock() {
        wakeLock?.let { if (it.isHeld) it.release() }
        wakeLock = null
    }

    // ——— Notification ———

    private fun createNotificationChannel() {
        val channel = NotificationChannel(
            CHANNEL_ID,
            "Rize Alarm",
            NotificationManager.IMPORTANCE_HIGH
        ).apply {
            description = "Active alarm notification"
            setBypassDnd(true)
            lockscreenVisibility = android.app.Notification.VISIBILITY_PUBLIC
        }
        getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
    }

    private fun buildNotification() = NotificationCompat.Builder(this, CHANNEL_ID)
        .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
        .setContentTitle("Rize")
        .setContentText("Walk to your NFC tag to dismiss")
        .setPriority(NotificationCompat.PRIORITY_MAX)
        .setCategory(NotificationCompat.CATEGORY_ALARM)
        .setOngoing(true)          // not dismissible by swipe
        .setAutoCancel(false)
        .build()

    companion object {
        const val NOTIFICATION_ID = 1001
        const val CHANNEL_ID = "rize_alarm_channel"

        fun stop(context: android.content.Context) {
            context.stopService(Intent(context, AlarmForegroundService::class.java))
        }
    }
}
