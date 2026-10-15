export function coordinatesToAngle(
  x: number,
  y: number,
  centerX: number,
  centerY: number
): number {
  const dx = x - centerX;
  const dy = y - centerY;
  // atan2 returns angle in radians from positive X axis (-PI to +PI)
  const rad = Math.atan2(dy, dx);
  // Convert to degrees and shift so top (negative Y) is 0 degrees clockwise
  const deg = (rad * (180 / Math.PI) + 90 + 360) % 360;
  return deg;
}

export function angleToHour(angleDeg: number): number {
  const normalized = (angleDeg % 360 + 360) % 360;
  let hour = Math.round(normalized / 30) % 12;
  return hour === 0 ? 12 : hour;
}

export function angleToMinute(angleDeg: number): number {
  const normalized = (angleDeg % 360 + 360) % 360;
  return Math.round(normalized / 6) % 60;
}

export function hourToAngle(hour: number): number {
  return ((hour % 12) * 30);
}

export function minuteToAngle(minute: number): number {
  return (minute % 60) * 6;
}
