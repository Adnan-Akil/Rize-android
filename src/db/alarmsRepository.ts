import { DatabaseAdapter, getDatabaseAdapter } from "./database";
import { Alarm } from "./schema";

export function createAlarmsRepository(adapter?: DatabaseAdapter) {
  const db = adapter || getDatabaseAdapter();

  const mapRowToAlarm = (row: any): Alarm => ({
    id: row.id,
    time: row.time,
    label: row.label,
    repeatDays: typeof row.repeat_days === "string" ? JSON.parse(row.repeat_days) : row.repeat_days,
    isEnabled: Boolean(row.is_enabled),
    tagId: row.tag_id || null,
    ringtoneUri: row.ringtone_uri || null,
    vibrate: Boolean(row.vibrate),
    createdAt: row.created_at,
  });

  return {
    async getAllAlarms(): Promise<Alarm[]> {
      const rows = await db.getAll("SELECT * FROM alarms ORDER BY time ASC");
      return rows.map(mapRowToAlarm);
    },

    async getAlarmById(id: string): Promise<Alarm | null> {
      const row = await db.getFirst("SELECT * FROM alarms WHERE id = ?", [id]);
      return row ? mapRowToAlarm(row) : null;
    },

    async createAlarm(alarm: Alarm): Promise<void> {
      await db.run(
        `INSERT INTO alarms (id, time, label, repeat_days, is_enabled, tag_id, ringtone_uri, vibrate, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          alarm.id,
          alarm.time,
          alarm.label,
          JSON.stringify(alarm.repeatDays),
          alarm.isEnabled ? 1 : 0,
          alarm.tagId,
          alarm.ringtoneUri,
          alarm.vibrate ? 1 : 0,
          alarm.createdAt,
        ]
      );
    },

    async updateAlarm(alarm: Alarm): Promise<void> {
      await db.run(
        `INSERT OR REPLACE INTO alarms (id, time, label, repeat_days, is_enabled, tag_id, ringtone_uri, vibrate, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          alarm.id,
          alarm.time,
          alarm.label,
          JSON.stringify(alarm.repeatDays),
          alarm.isEnabled ? 1 : 0,
          alarm.tagId,
          alarm.ringtoneUri,
          alarm.vibrate ? 1 : 0,
          alarm.createdAt,
        ]
      );
    },

    async toggleAlarm(id: string, isEnabled: boolean): Promise<void> {
      await db.run("UPDATE alarms SET is_enabled = ? WHERE id = ?", [isEnabled ? 1 : 0, id]);
    },

    async deleteAlarm(id: string): Promise<void> {
      await db.run("DELETE FROM alarms WHERE id = ?", [id]);
    },
  };
}

export const alarmsRepository = createAlarmsRepository();
