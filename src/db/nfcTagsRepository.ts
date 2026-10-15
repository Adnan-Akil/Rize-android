import { DatabaseAdapter, getDatabaseAdapter } from "./database";
import { NfcTag } from "./schema";

export function createNfcTagsRepository(adapter?: DatabaseAdapter) {
  const db = adapter || getDatabaseAdapter();

  const mapRowToTag = (row: any): NfcTag => ({
    id: row.id,
    name: row.name,
    uid: row.uid,
    location: row.location || null,
    createdAt: row.created_at,
  });

  return {
    async getAllTags(): Promise<NfcTag[]> {
      const rows = await db.getAll("SELECT * FROM nfc_tags ORDER BY name ASC");
      return rows.map(mapRowToTag);
    },

    async getTagById(id: string): Promise<NfcTag | null> {
      const row = await db.getFirst("SELECT * FROM nfc_tags WHERE id = ?", [id]);
      return row ? mapRowToTag(row) : null;
    },

    async getTagByUid(uid: string): Promise<NfcTag | null> {
      const row = await db.getFirst("SELECT * FROM nfc_tags WHERE uid = ?", [uid]);
      return row ? mapRowToTag(row) : null;
    },

    async registerTag(tag: NfcTag): Promise<void> {
      await db.run(
        `INSERT OR REPLACE INTO nfc_tags (id, name, uid, location, created_at)
         VALUES (?, ?, ?, ?, ?)`,
        [tag.id, tag.name, tag.uid, tag.location, tag.createdAt]
      );
    },

    async deleteTag(id: string): Promise<void> {
      await db.run("DELETE FROM nfc_tags WHERE id = ?", [id]);
    },
  };
}

export const nfcTagsRepository = createNfcTagsRepository();
