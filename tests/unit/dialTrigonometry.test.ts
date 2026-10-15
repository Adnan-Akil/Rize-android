import {
  coordinatesToAngle,
  angleToHour,
  angleToMinute,
  hourToAngle,
  minuteToAngle,
} from "../../src/utils/dialTrigonometry";

describe("Dial Trigonometry Calculations", () => {
  const center = { x: 150, y: 150 };
  const radius = 100;

  it("calculates 0 degrees at top (12 o'clock)", () => {
    const angle = coordinatesToAngle(center.x, center.y - radius, center.x, center.y);
    expect(Math.round(angle)).toBe(0);
    expect(angleToHour(angle)).toBe(12);
    expect(angleToMinute(angle)).toBe(0);
  });

  it("calculates 90 degrees at right (3 o'clock)", () => {
    const angle = coordinatesToAngle(center.x + radius, center.y, center.x, center.y);
    expect(Math.round(angle)).toBe(90);
    expect(angleToHour(angle)).toBe(3);
    expect(angleToMinute(angle)).toBe(15);
  });

  it("calculates 180 degrees at bottom (6 o'clock)", () => {
    const angle = coordinatesToAngle(center.x, center.y + radius, center.x, center.y);
    expect(Math.round(angle)).toBe(180);
    expect(angleToHour(angle)).toBe(6);
    expect(angleToMinute(angle)).toBe(30);
  });

  it("calculates 270 degrees at left (9 o'clock)", () => {
    const angle = coordinatesToAngle(center.x - radius, center.y, center.x, center.y);
    expect(Math.round(angle)).toBe(270);
    expect(angleToHour(angle)).toBe(9);
    expect(angleToMinute(angle)).toBe(45);
  });

  it("converts hours and minutes back to degrees", () => {
    expect(hourToAngle(12)).toBe(0);
    expect(hourToAngle(3)).toBe(90);
    expect(hourToAngle(6)).toBe(180);
    expect(hourToAngle(9)).toBe(270);

    expect(minuteToAngle(0)).toBe(0);
    expect(minuteToAngle(15)).toBe(90);
    expect(minuteToAngle(30)).toBe(180);
    expect(minuteToAngle(45)).toBe(270);
  });
});
