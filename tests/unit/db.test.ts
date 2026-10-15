import { createDatabaseAdapter, InMemoryDatabaseAdapter } from "../../src/db/database";
import { createAlarmsRepository } from "../../src/db/alarmsRepository";
import { createNfcTagsRepository } from "../../src/db/nfcTagsRepository";
import { Alarm, NfcTag } from "../../src/db/schema";

describe("Offline-First Database Repositories", () => {
  let adapter: InMemoryDatabaseAdapter;
  let alarmsRepo: ReturnType<typeof createAlarmsRepository>;
  let nfcRepo: ReturnType<typeof createNfcTagsRepository>;

  beforeEach(async () => {
    adapter = new InMemoryDatabaseAdapter();
    await adapter.initialize();
    alarmsRepo = createAlarmsRepository(adapter);
    nfcRepo = createNfcTagsRepository(adapter);
  });

  describe("Alarms Repository", () => {
    it("creates, retrieves, toggles, and deletes alarms", async () => {
      const initialAlarms = await alarmsRepo.getAllAlarms();
      expect(initialAlarms).toHaveLength(0);

      const newAlarm: Alarm = {
        id: "alarm_1",
        time: "06:30",
        label: "Morning Focus",
        repeatDays: [1, 2, 3, 4, 5],
        isEnabled: true,
        tagId: "tag_mirror",
        ringtoneUri: null,
        vibrate: true,
        createdAt: Date.now(),
      };

      await alarmsRepo.createAlarm(newAlarm);
      const fetched = await alarmsRepo.getAlarmById("alarm_1");
      expect(fetched).not.toBeNull();
      expect(fetched?.label).toBe("Morning Focus");
      expect(fetched?.repeatDays).toEqual([1, 2, 3, 4, 5]);

      await alarmsRepo.toggleAlarm("alarm_1", false);
      const toggled = await alarmsRepo.getAlarmById("alarm_1");
      expect(toggled?.isEnabled).toBe(false);

      await alarmsRepo.deleteAlarm("alarm_1");
      const deleted = await alarmsRepo.getAlarmById("alarm_1");
      expect(deleted).toBeNull();
    });
  });

  describe("NFC Tags Repository", () => {
    it("registers and retrieves NFC checkpoint tags", async () => {
      const newTag: NfcTag = {
        id: "tag_mirror",
        name: "Bathroom Mirror",
        uid: "04:5A:B2:1C:89",
        location: "Master Bathroom",
        createdAt: Date.now(),
      };

      await nfcRepo.registerTag(newTag);
      const fetched = await nfcRepo.getTagById("tag_mirror");
      expect(fetched).not.toBeNull();
      expect(fetched?.name).toBe("Bathroom Mirror");
      expect(fetched?.uid).toBe("04:5A:B2:1C:89");

      const all = await nfcRepo.getAllTags();
      expect(all).toHaveLength(1);
    });
  });
});
