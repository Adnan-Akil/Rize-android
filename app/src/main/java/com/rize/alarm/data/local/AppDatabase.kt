package com.rize.alarm.data.local

import androidx.room.Database
import androidx.room.RoomDatabase
import com.rize.alarm.data.model.Alarm
import com.rize.alarm.data.model.NfcTag
import com.rize.alarm.data.model.WakeLog
import com.rize.alarm.data.model.WeeklyBudget

@Database(
    entities = [Alarm::class, NfcTag::class, WakeLog::class, WeeklyBudget::class],
    version = 1,
    exportSchema = false
)
abstract class AppDatabase : RoomDatabase() {
    abstract fun alarmDao(): AlarmDao
    abstract fun nfcTagDao(): NfcTagDao
    abstract fun wakeLogDao(): WakeLogDao
    abstract fun weeklyBudgetDao(): WeeklyBudgetDao

    companion object {
        const val DATABASE_NAME = "rize_db"
    }
}
