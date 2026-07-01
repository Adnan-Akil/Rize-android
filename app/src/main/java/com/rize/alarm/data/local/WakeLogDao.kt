package com.rize.alarm.data.local

import androidx.room.*
import com.rize.alarm.data.model.WakeLog
import com.rize.alarm.data.model.WeeklyBudget
import kotlinx.coroutines.flow.Flow

@Dao
interface WakeLogDao {

    @Query("SELECT * FROM wake_logs WHERE alarmId = :alarmId ORDER BY firedAt DESC")
    fun getLogsForAlarm(alarmId: Int): Flow<List<WakeLog>>

    @Query("SELECT * FROM wake_logs ORDER BY firedAt DESC LIMIT :limit")
    fun getRecentLogs(limit: Int = 30): Flow<List<WakeLog>>

    @Insert
    suspend fun insertLog(log: WakeLog): Long

    @Query("UPDATE wake_logs SET dismissedAt = :dismissedAt, dismissedByNfc = :byNfc, wasOnTime = :onTime WHERE id = :logId")
    suspend fun updateDismissal(logId: Int, dismissedAt: Long, byNfc: Boolean, onTime: Boolean)
}

@Dao
interface WeeklyBudgetDao {

    @Query("SELECT * FROM weekly_budget WHERE isoWeek = :isoWeek LIMIT 1")
    suspend fun getBudgetForWeek(isoWeek: String): WeeklyBudget?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertBudget(budget: WeeklyBudget)

    @Query("UPDATE weekly_budget SET usesRemaining = usesRemaining - 1 WHERE isoWeek = :isoWeek AND usesRemaining > 0")
    suspend fun decrementBudget(isoWeek: String)
}
