package com.rize.alarm.data.local

import androidx.room.*
import com.rize.alarm.data.model.NfcTag
import kotlinx.coroutines.flow.Flow

@Dao
interface NfcTagDao {

    @Query("SELECT * FROM nfc_tags WHERE alarmId = :alarmId")
    fun getTagsForAlarm(alarmId: Int): Flow<List<NfcTag>>

    @Query("SELECT * FROM nfc_tags WHERE alarmId = :alarmId")
    suspend fun getTagsForAlarmOnce(alarmId: Int): List<NfcTag>

    @Query("SELECT * FROM nfc_tags WHERE uid = :uid LIMIT 1")
    suspend fun getTagByUid(uid: String): NfcTag?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertTag(tag: NfcTag): Long

    @Update
    suspend fun updateTag(tag: NfcTag)

    @Delete
    suspend fun deleteTag(tag: NfcTag)

    @Query("DELETE FROM nfc_tags WHERE alarmId = :alarmId")
    suspend fun deleteTagsForAlarm(alarmId: Int)
}
