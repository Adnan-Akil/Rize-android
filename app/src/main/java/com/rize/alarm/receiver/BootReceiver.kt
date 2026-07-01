package com.rize.alarm.receiver

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.WorkManager
import com.rize.alarm.service.RescheduleAlarmsWorker

/**
 * Fires on device boot (and quick-boot on Samsung devices).
 * AlarmManager is cleared on reboot — this re-queues all active alarms via WorkManager.
 * Must be declared with android:exported="true" in the manifest.
 */
class BootReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        val action = intent.action ?: return
        if (action != Intent.ACTION_BOOT_COMPLETED &&
            action != "android.intent.action.QUICKBOOT_POWERON" &&
            action != Intent.ACTION_MY_PACKAGE_REPLACED
        ) return

        // Delegate to WorkManager — do NOT run coroutines directly in a BroadcastReceiver
        val rescheduleRequest = OneTimeWorkRequestBuilder<RescheduleAlarmsWorker>().build()
        WorkManager.getInstance(context).enqueue(rescheduleRequest)
    }
}
