package com.rize.alarm.data.repository

import com.rize.alarm.data.local.AlarmDao
import com.rize.alarm.data.local.NfcTagDao
import com.rize.alarm.data.model.Alarm
import com.rize.alarm.data.model.NfcTag
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AlarmRepository @Inject constructor(
    private val alarmDao: AlarmDao
) {
    fun getAllAlarms(): Flow<List<Alarm>> = alarmDao.getAllAlarms()
    suspend fun getActiveAlarms(): List<Alarm> = alarmDao.getActiveAlarms()
    suspend fun getAlarmById(id: Int): Alarm? = alarmDao.getAlarmById(id)
    suspend fun insertAlarm(alarm: Alarm): Long = alarmDao.insertAlarm(alarm)
    suspend fun updateAlarm(alarm: Alarm) = alarmDao.updateAlarm(alarm)
    suspend fun deleteAlarm(alarm: Alarm) = alarmDao.deleteAlarm(alarm)
    suspend fun setAlarmActive(id: Int, isActive: Boolean) = alarmDao.setAlarmActive(id, isActive)
}

@Singleton
class NfcTagRepository @Inject constructor(
    private val nfcTagDao: NfcTagDao
) {
    fun getTagsForAlarm(alarmId: Int): Flow<List<NfcTag>> = nfcTagDao.getTagsForAlarm(alarmId)
    suspend fun getTagsForAlarmOnce(alarmId: Int): List<NfcTag> = nfcTagDao.getTagsForAlarmOnce(alarmId)
    suspend fun getTagByUid(uid: String): NfcTag? = nfcTagDao.getTagByUid(uid.uppercase())
    suspend fun insertTag(tag: NfcTag): Long = nfcTagDao.insertTag(tag.copy(uid = tag.uid.uppercase()))
    suspend fun updateTag(tag: NfcTag) = nfcTagDao.updateTag(tag)
    suspend fun deleteTag(tag: NfcTag) = nfcTagDao.deleteTag(tag)
}
