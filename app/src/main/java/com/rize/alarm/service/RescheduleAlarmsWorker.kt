package com.rize.alarm.service

import android.content.Context
import androidx.hilt.work.HiltWorker
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.rize.alarm.data.repository.AlarmRepository
import com.rize.alarm.domain.usecase.ScheduleAlarmUseCase
import dagger.assisted.Assisted
import dagger.assisted.AssistedInject

/**
 * Reschedules all active alarms after device reboot or app update.
 * AlarmManager is cleared on reboot — this reads from Room and re-registers each alarm.
 * Run via WorkManager from BootReceiver so it can use coroutines safely.
 */
@HiltWorker
class RescheduleAlarmsWorker @AssistedInject constructor(
    @Assisted context: Context,
    @Assisted params: WorkerParameters,
    private val alarmRepository: AlarmRepository,
    private val scheduleAlarmUseCase: ScheduleAlarmUseCase
) : CoroutineWorker(context, params) {

    override suspend fun doWork(): Result {
        return try {
            val now = System.currentTimeMillis()
            val activeAlarms = alarmRepository.getActiveAlarms()

            activeAlarms.forEach { alarm ->
                val nextTrigger = scheduleAlarmUseCase.nextTriggerMillis(alarm)
                if (nextTrigger > now) {
                    scheduleAlarmUseCase(alarm)
                }
            }

            Result.success()
        } catch (e: Exception) {
            // Retry once on failure — if it fails again, give up to avoid battery drain
            Result.retry()
        }
    }
}
