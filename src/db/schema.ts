export interface Alarm {
  id: string;
  time: string;           // "06:30" (24-hour format)
  label: string;
  repeatDays: number[];   // [1, 2, 3, 4, 5] (Monday=1, Sunday=7)
  isEnabled: boolean;
  tagId: string | null;   // Foreign key to NfcTag.id
  ringtoneUri: string | null;
  vibrate: boolean;
  createdAt: number;
}

export interface NfcTag {
  id: string;
  name: string;           // e.g. "Bathroom Mirror"
  uid: string;            // Hardware serial hex e.g. "04:5A:B2:1C:89"
  location: string | null;
  createdAt: number;
}

export interface WakeLog {
  id: string;
  alarmId: string;
  scheduledTime: string;
  dismissedAt: number;
  method: "nfc" | "snooze";
}

export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS alarms (
  id TEXT PRIMARY KEY,
  time TEXT NOT NULL,
  label TEXT NOT NULL,
  repeat_days TEXT NOT NULL,
  is_enabled INTEGER NOT NULL DEFAULT 1,
  tag_id TEXT,
  ringtone_uri TEXT,
  vibrate INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS nfc_tags (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  uid TEXT UNIQUE NOT NULL,
  location TEXT,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS wake_logs (
  id TEXT PRIMARY KEY,
  alarm_id TEXT NOT NULL,
  scheduled_time TEXT NOT NULL,
  dismissed_at INTEGER NOT NULL,
  method TEXT NOT NULL
);
`;
