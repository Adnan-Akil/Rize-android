package com.rize.alarm.presentation.alarm

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.rize.alarm.data.model.Alarm
import com.rize.alarm.data.repository.AlarmRepository
import com.rize.alarm.domain.usecase.ScheduleAlarmUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class AlarmViewModel @Inject constructor(
    private val repository: AlarmRepository,
    private val scheduleAlarmUseCase: ScheduleAlarmUseCase
) : ViewModel() {

    val alarms: StateFlow<List<Alarm>> = repository.getAllAlarms()
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000),
            initialValue = emptyList()
        )

    fun toggleAlarm(alarm: Alarm) {
        viewModelScope.launch {
            val updated = alarm.copy(isActive = !alarm.isActive)
            repository.updateAlarm(updated)
            if (updated.isActive) {
                scheduleAlarmUseCase(updated)
            } else {
                scheduleAlarmUseCase.cancel(updated.id)
            }
        }
    }

    fun deleteAlarm(alarm: Alarm) {
        viewModelScope.launch {
            scheduleAlarmUseCase.cancel(alarm.id)
            repository.deleteAlarm(alarm)
        }
    }
}
