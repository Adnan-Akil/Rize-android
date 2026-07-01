package com.rize.alarm.receiver

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import com.rize.alarm.service.AlarmForegroundService
import dagger.hilt.android.AndroidEntryPoint

/**
 * Triggered by AlarmManager when an alarm fires.
 * Starts AlarmForegroundService immediately — no heavy work here to avoid ANR.
 */
@AndroidEntryPoint
class AlarmReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        val alarmId = intent.getIntExtra(EXTRA_ALARM_ID, -1)
        if (alarmId == -1) return

        val serviceIntent = Intent(context, AlarmForegroundService::class.java).apply {
            putExtra(EXTRA_ALARM_ID, alarmId)
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.startForegroundService(serviceIntent)
        } else {
            context.startService(serviceIntent)
        }
    }

    companion object {
        const val EXTRA_ALARM_ID = "extra_alarm_id"
    }
}
