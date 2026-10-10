// Stress test for handleDialPointer trigonometry in app/src/main/assets/index.html

function computeDialAngle(dx, dy) {
  let rad = Math.atan2(dy, dx) + Math.PI / 2;
  if (rad < 0) rad += 2 * Math.PI;
  const deg = (rad * 180 / Math.PI) % 360;
  return deg;
}

function resolveHour(deg) {
  let hour = Math.round(deg / 30) % 12;
  if (hour === 0) hour = 12;
  return hour;
}

function resolveMinute(deg) {
  return (Math.round(deg / 30) * 5) % 60;
}

console.log('--- 1. Testing Hour Angle Snapping ---');
const hourTests = [
  { dx: 0, dy: -100, expected: 12, name: '12 o clock (top)' },
  { dx: 50, dy: -86.6, expected: 1, name: '1 o clock (30 deg)' },
  { dx: 86.6, dy: -50, expected: 2, name: '2 o clock (60 deg)' },
  { dx: 100, dy: 0, expected: 3, name: '3 o clock (90 deg)' },
  { dx: 86.6, dy: 50, expected: 4, name: '4 o clock (120 deg)' },
  { dx: 50, dy: 86.6, expected: 5, name: '5 o clock (150 deg)' },
  { dx: 0, dy: 100, expected: 6, name: '6 o clock (180 deg)' },
  { dx: -50, dy: 86.6, expected: 7, name: '7 o clock (210 deg)' },
  { dx: -86.6, dy: 50, expected: 8, name: '8 o clock (240 deg)' },
  { dx: -100, dy: 0, expected: 9, name: '9 o clock (270 deg)' },
  { dx: -86.6, dy: -50, expected: 10, name: '10 o clock (300 deg)' },
  { dx: -50, dy: -86.6, expected: 11, name: '11 o clock (330 deg)' }
];

let hourPass = 0;
for (const t of hourTests) {
  const deg = computeDialAngle(t.dx, t.dy);
  const hour = resolveHour(deg);
  if (hour === t.expected) {
    hourPass++;
  } else {
    console.error(`FAIL: ${t.name}: expected ${t.expected}, got ${hour} (deg: ${deg})`);
  }
}
console.log(`Hour tests: ${hourPass}/${hourTests.length} passed.`);

console.log('--- 2. Testing Minute Angle Snapping ---');
const minTests = [
  { dx: 0, dy: -100, expected: 0, name: '00 min (top)' },
  { dx: 50, dy: -86.6, expected: 5, name: '05 min (30 deg)' },
  { dx: 86.6, dy: -50, expected: 10, name: '10 min (60 deg)' },
  { dx: 100, dy: 0, expected: 15, name: '15 min (90 deg)' },
  { dx: 86.6, dy: 50, expected: 20, name: '20 min (120 deg)' },
  { dx: 50, dy: 86.6, expected: 25, name: '25 min (150 deg)' },
  { dx: 0, dy: 100, expected: 30, name: '30 min (180 deg)' },
  { dx: -50, dy: 86.6, expected: 35, name: '35 min (210 deg)' },
  { dx: -86.6, dy: 50, expected: 40, name: '40 min (240 deg)' },
  { dx: -100, dy: 0, expected: 45, name: '45 min (270 deg)' },
  { dx: -86.6, dy: -50, expected: 50, name: '50 min (300 deg)' },
  { dx: -50, dy: -86.6, expected: 55, name: '55 min (330 deg)' }
];

let minPass = 0;
for (const t of minTests) {
  const deg = computeDialAngle(t.dx, t.dy);
  const min = resolveMinute(deg);
  if (min === t.expected) {
    minPass++;
  } else {
    console.error(`FAIL: ${t.name}: expected ${t.expected}, got ${min} (deg: ${deg})`);
  }
}
console.log(`Minute tests: ${minPass}/${minTests.length} passed.`);

console.log('--- 3. Boundary & Extreme Values ---');
// Center touch: dx=0, dy=0
const centerDeg = computeDialAngle(0, 0);
console.log(`Center (0,0) angle: ${centerDeg} -> Hour: ${resolveHour(centerDeg)}, Min: ${resolveMinute(centerDeg)}`);

// Far coordinates (e.g. 5000px off screen)
const farDeg = computeDialAngle(5000, 5000);
console.log(`Far (5000, 5000) angle: ${farDeg} -> Hour: ${resolveHour(farDeg)}, Min: ${resolveMinute(farDeg)}`);
