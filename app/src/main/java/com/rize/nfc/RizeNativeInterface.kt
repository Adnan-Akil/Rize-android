package com.rize.nfc

import android.content.Context
import android.content.Intent
import android.media.AudioAttributes
import android.media.AudioManager
import android.media.Ringtone
import android.media.RingtoneManager
import android.nfc.NfcAdapter
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.provider.Settings
import android.webkit.JavascriptInterface

class RizeNativeInterface(private val activity: MainActivity) {

    private val vibrator: Vibrator? by lazy {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            val vibratorManager = activity.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as? VibratorManager
            vibratorManager?.defaultVibrator
        } else {
            @Suppress("DEPRECATION")
            activity.getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
        }
    }

    private var alarmRingtone: Ringtone? = null

    @JavascriptInterface
    fun isNfcAvailable(): Boolean {
        val adapter = NfcAdapter.getDefaultAdapter(activity)
        return adapter != null
    }

    @JavascriptInterface
    fun isNfcEnabled(): Boolean {
        val adapter = NfcAdapter.getDefaultAdapter(activity)
        return adapter?.isEnabled == true
    }

    @JavascriptInterface
    fun openNfcSettings() {
        try {
            activity.startActivity(Intent(Settings.ACTION_NFC_SETTINGS))
        } catch (e: Exception) {
            activity.startActivity(Intent(Settings.ACTION_SETTINGS))
        }
    }

    @JavascriptInterface
    fun vibrate(type: String) {
        activity.runOnUiThread {
            when (type) {
                "click" -> {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                        vibrator?.vibrate(VibrationEffect.createPredefined(VibrationEffect.EFFECT_CLICK))
                    } else {
                        @Suppress("DEPRECATION")
                        vibrator?.vibrate(20)
                    }
                }
                "tick" -> {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                        vibrator?.vibrate(VibrationEffect.createPredefined(VibrationEffect.EFFECT_TICK))
                    } else {
                        @Suppress("DEPRECATION")
                        vibrator?.vibrate(10)
                    }
                }
                "heavy_click" -> {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                        vibrator?.vibrate(VibrationEffect.createPredefined(VibrationEffect.EFFECT_HEAVY_CLICK))
                    } else {
                        @Suppress("DEPRECATION")
                        vibrator?.vibrate(50)
                    }
                }
                "success" -> {
                    val timings = longArrayOf(0, 40, 60, 40)
                    val amplitudes = intArrayOf(0, 255, 0, 255)
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                        vibrator?.vibrate(VibrationEffect.createWaveform(timings, amplitudes, -1))
                    } else {
                        @Suppress("DEPRECATION")
                        vibrator?.vibrate(timings, -1)
                    }
                }
                "alarm_pulse" -> {
                    val timings = longArrayOf(0, 300, 200, 300)
                    val amplitudes = intArrayOf(0, 255, 0, 255)
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                        vibrator?.vibrate(VibrationEffect.createWaveform(timings, amplitudes, 0))
                    } else {
                        @Suppress("DEPRECATION")
                        vibrator?.vibrate(timings, 0)
                    }
                }
                else -> {
                    @Suppress("DEPRECATION")
                    vibrator?.vibrate(30)
                }
            }
        }
    }

    @JavascriptInterface
    fun stopVibrate() {
        activity.runOnUiThread {
            vibrator?.cancel()
        }
    }

    @JavascriptInterface
    fun startAlarmSound() {
        activity.runOnUiThread {
            try {
                if (alarmRingtone == null) {
                    var alertUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM)
                    if (alertUri == null) {
                        alertUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)
                    }
                    alarmRingtone = RingtoneManager.getRingtone(activity.applicationContext, alertUri)?.apply {
                        audioAttributes = AudioAttributes.Builder()
                            .setUsage(AudioAttributes.USAGE_ALARM)
                            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                            .build()
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                            isLooping = true
                        }
                    }
                }
                if (alarmRingtone?.isPlaying == false) {
                    alarmRingtone?.play()
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    @JavascriptInterface
    fun stopAlarmSound() {
        activity.runOnUiThread {
            try {
                alarmRingtone?.stop()
                alarmRingtone = null
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    @JavascriptInterface
    fun setScreenAwake(awake: Boolean) {
        activity.runOnUiThread {
            activity.setKeepScreenOn(awake)
        }
    }

    @JavascriptInterface
    fun setSystemBarTheme(isLight: Boolean, colorHex: String) {
        activity.setSystemBarTheme(isLight, colorHex)
    }
}
