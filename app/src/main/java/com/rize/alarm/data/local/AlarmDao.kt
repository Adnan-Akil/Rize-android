package com.rize.alarm.data.local

import androidx.room.*
import com.rize.alarm.data.model.Alarm
import kotlinx.coroutines.flow.Flow

@Dao
interface AlarmDao {

    @Query("SELECT * FROM alarms ORDER BY hour ASC, minute ASC")
    fun getAllAlarms(): Flow<List<Alarm>>

    @Query("SELECT * FROM alarms WHERE isActive = 1")
    suspend fun getActiveAlarms(): List<Alarm>

    @Query("SELECT * FROM alarms WHERE id = :id")
    suspend fun getAlarmById(id: Int): Alarm?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAlarm(alarm: Alarm): Long

    @Update
    suspend fun updateAlarm(alarm: Alarm)

    @Delete
    suspend fun deleteAlarm(alarm: Alarm)

    @Query("UPDATE alarms SET isActive = :isActive WHERE id = :id")
    suspend fun setAlarmActive(id: Int, isActive: Boolean)

    @Query("UPDATE alarms SET nfcTagId = :tagId WHERE id = :alarmId")
    suspend fun assignTagToAlarm(alarmId: Int, tagId: Int)
}
