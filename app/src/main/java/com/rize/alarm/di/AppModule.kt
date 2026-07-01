package com.rize.alarm.di

import android.content.Context
import androidx.room.Room
import com.rize.alarm.data.local.AlarmDao
import com.rize.alarm.data.local.AppDatabase
import com.rize.alarm.data.local.NfcTagDao
import com.rize.alarm.data.local.WakeLogDao
import com.rize.alarm.data.local.WeeklyBudgetDao
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object AppModule {

    @Provides
    @Singleton
    fun provideAppDatabase(@ApplicationContext context: Context): AppDatabase =
        Room.databaseBuilder(
            context,
            AppDatabase::class.java,
            AppDatabase.DATABASE_NAME
        ).build()

    @Provides
    fun provideAlarmDao(db: AppDatabase): AlarmDao = db.alarmDao()

    @Provides
    fun provideNfcTagDao(db: AppDatabase): NfcTagDao = db.nfcTagDao()

    @Provides
    fun provideWakeLogDao(db: AppDatabase): WakeLogDao = db.wakeLogDao()

    @Provides
    fun provideWeeklyBudgetDao(db: AppDatabase): WeeklyBudgetDao = db.weeklyBudgetDao()
}
