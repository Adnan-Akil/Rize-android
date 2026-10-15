import {
  formatDisplayTime,
  calculateNextOccurrence,
  formatRemainingDuration,
} from "../../src/features/alarms/timeUtils";

describe("Time & Alarm Utilities", () => {
  describe("formatDisplayTime", () => {
    it("formats 24h morning time correctly to 12h", () => {
      const res = formatDisplayTime("06:30");
      expect(res.hours).toBe("06");
      expect(res.minutes).toBe("30");
      expect(res.period).toBe("AM");
      expect(res.timeString).toBe("06:30 AM");
    });

    it("formats 24h evening time correctly to 12h", () => {
      const res = formatDisplayTime("18:45");
      expect(res.hours).toBe("06");
      expect(res.minutes).toBe("45");
      expect(res.period).toBe("PM");
      expect(res.timeString).toBe("06:45 PM");
    });

    it("formats midnight 00:00 correctly", () => {
      const res = formatDisplayTime("00:00");
      expect(res.hours).toBe("12");
      expect(res.minutes).toBe("00");
      expect(res.period).toBe("AM");
    });

    it("formats noon 12:00 correctly", () => {
      const res = formatDisplayTime("12:00");
      expect(res.hours).toBe("12");
      expect(res.minutes).toBe("00");
      expect(res.period).toBe("PM");
    });
  });

  describe("calculateNextOccurrence", () => {
    it("schedules for later today if time has not passed", () => {
      // Wednesday Oct 14, 2026, 05:00:00
      const now = new Date(2026, 9, 14, 5, 0, 0);
      const next = calculateNextOccurrence("06:30", [], now);
      expect(next.getDate()).toBe(14);
      expect(next.getHours()).toBe(6);
      expect(next.getMinutes()).toBe(30);
    });

    it("schedules for tomorrow if time has already passed today (no repeat days)", () => {
      // Wednesday Oct 14, 2026, 08:00:00
      const now = new Date(2026, 9, 14, 8, 0, 0);
      const next = calculateNextOccurrence("06:30", [], now);
      expect(next.getDate()).toBe(15);
      expect(next.getHours()).toBe(6);
      expect(next.getMinutes()).toBe(30);
    });

    it("schedules for next matching day of the week (repeat days)", () => {
      // Wednesday Oct 14, 2026 (day = 3)
      // Repeat on Friday (day = 5)
      const now = new Date(2026, 9, 14, 8, 0, 0);
      const next = calculateNextOccurrence("06:30", [5], now);
      expect(next.getDate()).toBe(16); // Friday Oct 16
      expect(next.getDay()).toBe(5);
      expect(next.getHours()).toBe(6);
      expect(next.getMinutes()).toBe(30);
    });
  });

  describe("formatRemainingDuration", () => {
    it("formats duration with hours and minutes", () => {
      const now = new Date(2026, 9, 14, 6, 0, 0);
      const target = new Date(2026, 9, 14, 8, 45, 0);
      expect(formatRemainingDuration(target, now)).toBe("2h 45m");
    });

    it("formats duration with only minutes if under 1 hour", () => {
      const now = new Date(2026, 9, 14, 6, 0, 0);
      const target = new Date(2026, 9, 14, 6, 25, 0);
      expect(formatRemainingDuration(target, now)).toBe("25m");
    });

    it("formats duration as < 1m if less than 60 seconds remain", () => {
      const now = new Date(2026, 9, 14, 6, 0, 0);
      const target = new Date(2026, 9, 14, 6, 0, 40);
      expect(formatRemainingDuration(target, now)).toBe("< 1m");
    });
  });
});
