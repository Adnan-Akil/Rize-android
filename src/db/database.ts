import { SCHEMA_SQL } from "./schema";

export interface DatabaseAdapter {
  initialize(): Promise<void>;
  exec(sql: string): Promise<void>;
  run(sql: string, params?: any[]): Promise<void>;
  getAll<T = any>(sql: string, params?: any[]): Promise<T[]>;
  getFirst<T = any>(sql: string, params?: any[]): Promise<T | null>;
}

export class InMemoryDatabaseAdapter implements DatabaseAdapter {
  private alarms = new Map<string, any>();
  private nfcTags = new Map<string, any>();
  private wakeLogs = new Map<string, any>();

  async initialize(): Promise<void> {
    // In-memory initialized
  }

  async exec(sql: string): Promise<void> {
    // schema exec simulation
  }

  async run(sql: string, params: any[] = []): Promise<void> {
    const trimmed = sql.trim().toUpperCase();
    if (trimmed.startsWith("INSERT INTO ALARMS") || trimmed.startsWith("INSERT OR REPLACE INTO ALARMS")) {
      const [id, time, label, repeatDays, isEnabled, tagId, ringtoneUri, vibrate, createdAt] = params;
      this.alarms.set(id, {
        id,
        time,
        label,
        repeat_days: repeatDays,
        is_enabled: isEnabled,
        tag_id: tagId,
        ringtone_uri: ringtoneUri,
        vibrate,
        created_at: createdAt,
      });
    } else if (trimmed.startsWith("UPDATE ALARMS SET IS_ENABLED")) {
      const [isEnabled, id] = params;
      const existing = this.alarms.get(id);
      if (existing) {
        existing.is_enabled = isEnabled;
        this.alarms.set(id, existing);
      }
    } else if (trimmed.startsWith("DELETE FROM ALARMS WHERE ID")) {
      const [id] = params;
      this.alarms.delete(id);
    } else if (trimmed.startsWith("INSERT INTO NFC_TAGS") || trimmed.startsWith("INSERT OR REPLACE INTO NFC_TAGS")) {
      const [id, name, uid, location, createdAt] = params;
      this.nfcTags.set(id, {
        id,
        name,
        uid,
        location,
        created_at: createdAt,
      });
    } else if (trimmed.startsWith("DELETE FROM NFC_TAGS WHERE ID")) {
      const [id] = params;
      this.nfcTags.delete(id);
    }
  }

  async getAll<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    const trimmed = sql.trim().toUpperCase();
    if (trimmed.includes("FROM ALARMS")) {
      return Array.from(this.alarms.values()) as T[];
    }
    if (trimmed.includes("FROM NFC_TAGS")) {
      return Array.from(this.nfcTags.values()) as T[];
    }
    if (trimmed.includes("FROM WAKE_LOGS")) {
      return Array.from(this.wakeLogs.values()) as T[];
    }
    return [];
  }

  async getFirst<T = any>(sql: string, params: any[] = []): Promise<T | null> {
    const trimmed = sql.trim().toUpperCase();
    if (trimmed.includes("FROM ALARMS WHERE ID = ?")) {
      const [id] = params;
      return (this.alarms.get(id) as T) || null;
    }
    if (trimmed.includes("FROM NFC_TAGS WHERE ID = ?")) {
      const [id] = params;
      return (this.nfcTags.get(id) as T) || null;
    }
    if (trimmed.includes("FROM NFC_TAGS WHERE UID = ?")) {
      const [uid] = params;
      for (const tag of this.nfcTags.values()) {
        if (tag.uid === uid) return tag as T;
      }
      return null;
    }
    return null;
  }
}

export class SQLiteDatabaseAdapter implements DatabaseAdapter {
  private db: any = null;

  async initialize(): Promise<void> {
    const SQLite = require("expo-sqlite");
    this.db = await SQLite.openDatabaseAsync("rize.db");
    await this.db.execAsync(SCHEMA_SQL);
  }

  async exec(sql: string): Promise<void> {
    if (!this.db) await this.initialize();
    await this.db.execAsync(sql);
  }

  async run(sql: string, params: any[] = []): Promise<void> {
    if (!this.db) await this.initialize();
    await this.db.runAsync(sql, params);
  }

  async getAll<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    if (!this.db) await this.initialize();
    return await this.db.getAllAsync(sql, params);
  }

  async getFirst<T = any>(sql: string, params: any[] = []): Promise<T | null> {
    if (!this.db) await this.initialize();
    return await this.db.getFirstAsync(sql, params);
  }
}

let defaultAdapter: DatabaseAdapter | null = null;

export function getDatabaseAdapter(): DatabaseAdapter {
  if (!defaultAdapter) {
    defaultAdapter = new SQLiteDatabaseAdapter();
  }
  return defaultAdapter;
}

export function createDatabaseAdapter(inMemory = false): DatabaseAdapter {
  return inMemory ? new InMemoryDatabaseAdapter() : new SQLiteDatabaseAdapter();
}
