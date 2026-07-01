package com.rize.alarm.data.model

import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey

/**
 * Represents a registered NFC tag.
 * The uid is stored uppercase hex (e.g., "A3B2C1D0") — always normalize before storing.
 * Multiple tags can be assigned to one alarm (any tag dismisses it).
 */
@Entity(
    tableName = "nfc_tags",
    foreignKeys = [
        ForeignKey(
            entity = Alarm::class,
            parentColumns = ["id"],
            childColumns = ["alarmId"],
            onDelete = ForeignKey.SET_NULL
        )
    ],
    indices = [Index("alarmId")]
)
data class NfcTag(
    @PrimaryKey(autoGenerate = true)
    val id: Int = 0,
    val uid: String,                 // Uppercase hex UID — e.g., "A3B2C1D0"
    val name: String = "My Tag",     // User-given name, e.g., "Bathroom mirror"
    val alarmId: Int? = null,
    val registeredAt: Long = System.currentTimeMillis()
)
