package com.rize.alarm.data.model

import androidx.room.Entity
import androidx.room.PrimaryKey
import java.time.DayOfWeek

/**
 * Represents a single alarm.
 *
 * Repeat days are stored as a bitmask (Sun=1, Mon=2, Tue=4, Wed=8, Thu=16, Fri=32, Sat=64).
 * triggerAtMillis is always recalculated fresh from (hour, minute, repeatDays) — never stored raw
 * for repeating alarms. See SOP Section 6.7.
 */
@Entity(tableName = "alarms")
data class Alarm(
    @PrimaryKey(autoGenerate = true)
    val id: Int = 0,
    val hour: Int,
    val minute: Int,
    val repeatDaysBitmask: Int = 0,       // 0 = one-time alarm
    val label: String = "",
    val nfcTagId: Int? = null,            // FK to NfcTag.id — null means no tag assigned yet
    val isActive: Boolean = true,
    val soundResName: String = "alarm_default",
    val createdAt: Long = System.currentTimeMillis()
)

/** Convenience: decode bitmask back to Set<DayOfWeek> */
fun Int.toDayOfWeekSet(): Set<DayOfWeek> {
    val days = mutableSetOf<DayOfWeek>()
    if (this and 1 != 0) days += DayOfWeek.SUNDAY
    if (this and 2 != 0) days += DayOfWeek.MONDAY
    if (this and 4 != 0) days += DayOfWeek.TUESDAY
    if (this and 8 != 0) days += DayOfWeek.WEDNESDAY
    if (this and 16 != 0) days += DayOfWeek.THURSDAY
    if (this and 32 != 0) days += DayOfWeek.FRIDAY
    if (this and 64 != 0) days += DayOfWeek.SATURDAY
    return days
}

/** Convenience: encode Set<DayOfWeek> to bitmask */
fun Set<DayOfWeek>.toBitmask(): Int {
    var mask = 0
    if (DayOfWeek.SUNDAY in this) mask = mask or 1
    if (DayOfWeek.MONDAY in this) mask = mask or 2
    if (DayOfWeek.TUESDAY in this) mask = mask or 4
    if (DayOfWeek.WEDNESDAY in this) mask = mask or 8
    if (DayOfWeek.THURSDAY in this) mask = mask or 16
    if (DayOfWeek.FRIDAY in this) mask = mask or 32
    if (DayOfWeek.SATURDAY in this) mask = mask or 64
    return mask
}
