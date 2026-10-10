// Verify all 360 degrees map to valid hours (1-12) and valid minutes (0-55 in steps of 5)
function computeDialAngle(deg) {
  return deg % 360;
}

function resolveHour(deg) {
  let hour = Math.round(deg / 30) % 12;
  if (hour === 0) hour = 12;
  return hour;
}

function resolveMinute(deg) {
  return (Math.round(deg / 30) * 5) % 60;
}

let hourHistogram = {};
let minHistogram = {};

for (let deg = 0; deg < 360; deg++) {
  const h = resolveHour(deg);
  const m = resolveMinute(deg);

  if (h < 1 || h > 12) throw new Error(`Invalid hour: ${h} at deg ${deg}`);
  if (m < 0 || m > 55 || m % 5 !== 0) throw new Error(`Invalid min: ${m} at deg ${deg}`);

  hourHistogram[h] = (hourHistogram[h] || 0) + 1;
  minHistogram[m] = (minHistogram[m] || 0) + 1;
}

console.log('Continuous 360-degree sweep: All degrees map to valid hours and minutes.');
console.log('Hour sector distribution (degrees per hour):', hourHistogram);
console.log('Minute sector distribution (degrees per 5-min step):', minHistogram);
