package com.rize.alarm.data.model

import androidx.room.Entity
import androidx.room.PrimaryKey

/**
 * Logs each alarm event — fired time, dismissed time, and whether dismissed via NFC on time.
 * Powers the stats screen: streaks, average dismiss time, calendar heatmap.
 */
@Entity(tableName = "wake_logs")
data class WakeLog(
    @PrimaryKey(autoGenerate = true)
    val id: Int = 0,
    val alarmId: Int,
    val firedAt: Long,             // epoch millis when alarm started ringing
    val dismissedAt: Long? = null, // null if alarm was not yet dismissed
    val dismissedByNfc: Boolean = false,
    val wasOnTime: Boolean = false  // true if dismissed within 5 min of alarm time
)

/**
 * Tracks the weekly snooze/cancel budget.
 * Key is the ISO week string e.g., "2026-W27".
 * usesRemaining starts at 1, decrements on each use, hidden at 0.
 */
@Entity(tableName = "weekly_budget")
data class WeeklyBudget(
    @PrimaryKey
    val isoWeek: String,            // e.g., "2026-W27"
    val usesRemaining: Int = 1
)
