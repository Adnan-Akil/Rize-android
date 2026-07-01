package com.rize.alarm.domain.usecase

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import android.provider.Settings
import com.rize.alarm.data.model.Alarm
import com.rize.alarm.data.model.toDayOfWeekSet
import com.rize.alarm.receiver.AlarmReceiver
import dagger.hilt.android.qualifiers.ApplicationContext
import java.time.DayOfWeek
import java.time.LocalDateTime
import java.time.ZoneId
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class ScheduleAlarmUseCase @Inject constructor(
    @ApplicationContext private val context: Context
) {

    private val alarmManager = context.getSystemService(AlarmManager::class.java)

    /**
     * Schedules the alarm via AlarmManager.setAlarmClock().
     * Returns false if the SCHEDULE_EXACT_ALARM permission is missing (API 31+).
     * Caller should redirect user to Settings if false is returned.
     */
    operator fun invoke(alarm: Alarm): Boolean {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            if (!alarmManager.canScheduleExactAlarms()) {
                val intent = Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM).apply {
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK
                }
                context.startActivity(intent)
                return false
            }
        }

        val triggerAt = nextTriggerMillis(alarm)
        val pendingIntent = buildSchedulePendingIntent(alarm.id)
        val alarmClockInfo = AlarmManager.AlarmClockInfo(triggerAt, pendingIntent)
        alarmManager.setAlarmClock(alarmClockInfo, pendingIntent)
        return true
    }

    fun cancel(alarmId: Int) {
        val pendingIntent = buildCancelPendingIntent(alarmId)
        pendingIntent?.let { alarmManager.cancel(it) }
    }

    private fun buildSchedulePendingIntent(alarmId: Int): PendingIntent {
        val intent = Intent(context, AlarmReceiver::class.java).apply {
            putExtra(AlarmReceiver.EXTRA_ALARM_ID, alarmId)
        }
        return PendingIntent.getBroadcast(
            context,
            alarmId,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
    }

    private fun buildCancelPendingIntent(alarmId: Int): PendingIntent? {
        val intent = Intent(context, AlarmReceiver::class.java)
        return PendingIntent.getBroadcast(
            context,
            alarmId,
            intent,
            PendingIntent.FLAG_NO_CREATE or PendingIntent.FLAG_IMMUTABLE
        )
    }

    /**
     * Calculates the next trigger epoch millis from (hour, minute, repeatDays).
     * Never stores raw epoch for repeating alarms — always recalculate. See SOP 6.7.
     */
    fun nextTriggerMillis(alarm: Alarm): Long {
        val now = LocalDateTime.now()
        var candidate = now
            .withHour(alarm.hour)
            .withMinute(alarm.minute)
            .withSecond(0)
            .withNano(0)

        // If the time has already passed today, start from tomorrow
        if (!candidate.isAfter(now)) {
            candidate = candidate.plusDays(1)
        }

        // For repeating alarms, advance to the next matching day
        val repeatDays = alarm.repeatDaysBitmask.toDayOfWeekSet()
        if (repeatDays.isNotEmpty()) {
            var attempts = 0
            while (candidate.dayOfWeek !in repeatDays && attempts < 8) {
                candidate = candidate.plusDays(1)
                attempts++
            }
        }

        return candidate.atZone(ZoneId.systemDefault()).toInstant().toEpochMilli()
    }
}
