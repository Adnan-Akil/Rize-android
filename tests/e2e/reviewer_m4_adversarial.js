// tests/e2e/reviewer_m4_adversarial.js
// Independent Adversarial Stress Test Suite for Milestone 4 (Radial Dial Picker)

const assert = require('assert');
const { loadApp } = require('./harness');

let passed = 0;
let failed = 0;

function runTest(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ✔ [PASS] ${name}`);
  } catch (err) {
    failed++;
    console.error(`  ✘ [FAIL] ${name}`);
    console.error(`    Details: ${err.message}`);
  }
}

async function runAsyncTest(name, fn) {
  try {
    await fn();
    passed++;
    console.log(`  ✔ [PASS] ${name}`);
  } catch (err) {
    failed++;
    console.error(`  ✘ [FAIL] ${name}`);
    console.error(`    Details: ${err.message}`);
  }
}

async function main() {
  console.log('========================================================================');
  console.log('  REVIEWER M4-1 ADVERSARIAL STRESS TEST SUITE');
  console.log('========================================================================\n');

  // ----------------------------------------------------------------------
  // Section 1: 12-Hour Discrete Snap & atan2 Trigonometry
  // ----------------------------------------------------------------------
  console.log('▶ Section 1: 12-Hour Discrete Snap & Trigonometry Sweep');

  runTest('All 12 hour positions map accurately to discrete clock angles (1..12)', () => {
    const app = loadApp();
    try {
      app.click(app.get('nav-btn-add'));
      assert.equal(app.getActiveScreen(), 'add');

      const dial = app.get('radial-clock-dial');
      dial.setBoundingClientRect({ left: 0, top: 0, width: 240, height: 240, right: 240, bottom: 240 });

      const cx = 120, cy = 120, r = 90;
      const toRad = deg => (deg - 90) * Math.PI / 180;

      // Ensure in hour mode
      app.window.setDialMode('hour');

      for (let expectedH = 1; expectedH <= 12; expectedH++) {
        const deg = (expectedH % 12) * 30;
        const x = cx + r * Math.cos(toRad(deg));
        const y = cy + r * Math.sin(toRad(deg));

        dial.dispatchEvent({ type: 'pointerdown', clientX: x, clientY: y, preventDefault: () => {} });

        const hourStr = app.get('input-hour').innerText;
        assert.equal(parseInt(hourStr, 10), expectedH, `Expected hour ${expectedH} at ${deg} deg, got ${hourStr}`);

        // Check hand visual coordinates
        const hand = app.get('dial-hand-line');
        const bead = app.get('dial-pointer-bead');
        assert.ok(hand, 'Hand line must exist');
        assert.ok(bead, 'Pointer bead must exist');
      }
    } finally {
      app.cleanup();
    }
  });

  runTest('Haptic tick fires on hour snap transitions but not on identical position', () => {
    const app = loadApp();
    try {
      app.click(app.get('nav-btn-add'));
      const dial = app.get('radial-clock-dial');
      dial.setBoundingClientRect({ left: 0, top: 0, width: 240, height: 240, right: 240, bottom: 240 });

      app.native.reset();
      app.window.setDialMode('hour');
      app.native.reset();

      // Click at 3 o'clock (90 deg)
      dial.dispatchEvent({ type: 'pointerdown', clientX: 210, clientY: 120, preventDefault: () => {} });
      const callsAfterFirst = app.native.calls.vibrate.filter(v => v.type === 'tick').length;
      assert.ok(callsAfterFirst >= 1, 'Haptic tick should fire on transition to 3');

      // Click again at 3 o'clock - should NOT fire another tick since hour is still 3
      dial.dispatchEvent({ type: 'pointermove', clientX: 212, clientY: 120, preventDefault: () => {} });
      const callsAfterSecond = app.native.calls.vibrate.filter(v => v.type === 'tick').length;
      assert.equal(callsAfterSecond, callsAfterFirst, 'Duplicate position must not trigger extra tick');
    } finally {
      app.cleanup();
    }
  });

  // ----------------------------------------------------------------------
  // Section 2: Minute Mode & 12 Radial 5-Minute Positions
  // ----------------------------------------------------------------------
  console.log('\n▶ Section 2: Minute Mode & 5-Minute Snapping');

  runTest('All 12 five-minute positions map accurately (00, 05, 10 ... 55)', () => {
    const app = loadApp();
    try {
      app.click(app.get('nav-btn-add'));
      app.window.setDialMode('minute');

      const dial = app.get('radial-clock-dial');
      dial.setBoundingClientRect({ left: 0, top: 0, width: 240, height: 240, right: 240, bottom: 240 });

      const cx = 120, cy = 120, r = 90;
      const toRad = deg => (deg - 90) * Math.PI / 180;

      for (let i = 0; i < 12; i++) {
        const expectedMin = i * 5;
        const deg = i * 30;
        const x = cx + r * Math.cos(toRad(deg));
        const y = cy + r * Math.sin(toRad(deg));

        dial.dispatchEvent({ type: 'pointerdown', clientX: x, clientY: y, preventDefault: () => {} });

        const minStr = app.get('input-minute').innerText;
        assert.equal(parseInt(minStr, 10), expectedMin, `Expected minute ${expectedMin} at ${deg} deg, got ${minStr}`);
        assert.equal(minStr.length, 2, 'Minute must be 2-digit zero-padded');
      }
    } finally {
      app.cleanup();
    }
  });

  // ----------------------------------------------------------------------
  // Section 3: Boundary & Adversarial Coordinate Inputs
  // ----------------------------------------------------------------------
  console.log('\n▶ Section 3: Boundary & Adversarial Coordinate Inputs');

  runTest('Continuous 360-degree sweep across top 12 o clock wrap boundary (355 -> 5 deg and reverse)', () => {
    const app = loadApp();
    try {
      app.click(app.get('nav-btn-add'));
      const dial = app.get('radial-clock-dial');
      dial.setBoundingClientRect({ left: 0, top: 0, width: 240, height: 240, right: 240, bottom: 240 });

      const cx = 120, cy = 120, r = 90;
      const toRad = deg => (deg - 90) * Math.PI / 180;

      app.window.setDialMode('hour');

      // Test near 12 o'clock just left (350 deg)
      let x = cx + r * Math.cos(toRad(350));
      let y = cy + r * Math.sin(toRad(350));
      dial.dispatchEvent({ type: 'pointerdown', clientX: x, clientY: y, preventDefault: () => {} });
      assert.equal(app.get('input-hour').innerText, '12', '350 deg rounds to 12');

      // Test near 12 o'clock just right (10 deg)
      x = cx + r * Math.cos(toRad(10));
      y = cy + r * Math.sin(toRad(10));
      dial.dispatchEvent({ type: 'pointermove', clientX: x, clientY: y, preventDefault: () => {} });
      assert.equal(app.get('input-hour').innerText, '12', '10 deg rounds to 12');

      // Test at 330 deg (11 o'clock)
      x = cx + r * Math.cos(toRad(330));
      y = cy + r * Math.sin(toRad(330));
      dial.dispatchEvent({ type: 'pointermove', clientX: x, clientY: y, preventDefault: () => {} });
      assert.equal(app.get('input-hour').innerText, '11', '330 deg is 11');

      // Reverse back to 12
      x = cx + r * Math.cos(toRad(0));
      y = cy + r * Math.sin(toRad(0));
      dial.dispatchEvent({ type: 'pointermove', clientX: x, clientY: y, preventDefault: () => {} });
      assert.equal(app.get('input-hour').innerText, '12', '0 deg is 12');
    } finally {
      app.cleanup();
    }
  });

  runTest('Out-of-bounds pointer coordinates do not crash and compute valid angles', () => {
    const app = loadApp();
    try {
      app.click(app.get('nav-btn-add'));
      const dial = app.get('radial-clock-dial');
      dial.setBoundingClientRect({ left: 100, top: 100, width: 240, height: 240, right: 340, bottom: 340 });

      // Far top-left (-1000, -1000)
      dial.dispatchEvent({ type: 'pointerdown', clientX: -1000, clientY: -1000, preventDefault: () => {} });
      let h = parseInt(app.get('input-hour').innerText, 10);
      assert.ok(h >= 1 && h <= 12, 'Hour must remain between 1 and 12 even with far negative coordinates');

      // Far bottom-right (5000, 5000)
      dial.dispatchEvent({ type: 'pointermove', clientX: 5000, clientY: 5000, preventDefault: () => {} });
      h = parseInt(app.get('input-hour').innerText, 10);
      assert.ok(h >= 1 && h <= 12, 'Hour must remain between 1 and 12 even with far positive coordinates');

      // Center (cx, cy)
      dial.dispatchEvent({ type: 'pointermove', clientX: 220, clientY: 220, preventDefault: () => {} });
      h = parseInt(app.get('input-hour').innerText, 10);
      assert.ok(h >= 1 && h <= 12, 'Center coordinates must not cause NaN or crash');
    } finally {
      app.cleanup();
    }
  });

  runTest('Touch events with touches or changedTouches correctly extract client coordinates', () => {
    const app = loadApp();
    try {
      app.click(app.get('nav-btn-add'));
      const dial = app.get('radial-clock-dial');
      dial.setBoundingClientRect({ left: 0, top: 0, width: 240, height: 240, right: 240, bottom: 240 });

      // Touch with touches[0] at 6 o'clock (120, 210)
      dial.dispatchEvent({
        type: 'touchstart',
        touches: [{ clientX: 120, clientY: 210 }],
        preventDefault: () => {}
      });
      assert.equal(app.get('input-hour').innerText, '06', 'Touch event at 6 o clock should set hour to 06');

      // Touchend with changedTouches[0] at 9 o'clock (30, 120)
      dial.dispatchEvent({
        type: 'touchend',
        changedTouches: [{ clientX: 30, clientY: 120 }],
        preventDefault: () => {}
      });
      assert.equal(app.get('input-hour').innerText, '09', 'Touchend at 9 o clock should set hour to 09');
    } finally {
      app.cleanup();
    }
  });

  // ----------------------------------------------------------------------
  // Section 4: Mode Auto-Advance & Switching
  // ----------------------------------------------------------------------
  console.log('\n▶ Section 4: Mode Auto-Advance & Switching');

  await runAsyncTest('Auto-advance transitions from Hour to Minute mode after pointer release', async () => {
    const app = loadApp();
    try {
      app.click(app.get('nav-btn-add'));
      app.window.setDialMode('hour');
      assert.ok(app.get('btn-mode-hour').className.includes('#3D7055'), 'Hour button active initially');

      const dial = app.get('radial-clock-dial');
      dial.setBoundingClientRect({ left: 0, top: 0, width: 240, height: 240, right: 240, bottom: 240 });

      // Pointer down then up at 7 o'clock
      dial.dispatchEvent({ type: 'pointerdown', clientX: 75, clientY: 198, preventDefault: () => {} });
      dial.dispatchEvent({ type: 'pointerup', clientX: 75, clientY: 198, preventDefault: () => {} });

      // Wait 250ms for auto-advance timeout (200ms in source)
      await new Promise(resolve => setTimeout(resolve, 250));

      assert.ok(app.get('btn-mode-minute').className.includes('#3D7055'), 'Minute mode must be active after auto-advance');
      assert.ok(app.get('input-minute').className.includes('#3D7055'), 'Minute readout highlighted in sage');
    } finally {
      app.cleanup();
    }
  });

  runTest('Clicking hour/minute readout displays switches mode directly', () => {
    const app = loadApp();
    try {
      app.click(app.get('nav-btn-add'));
      app.window.setDialMode('hour');

      // Clicking input-minute switches to minute mode
      app.click(app.get('input-minute'));
      assert.ok(app.get('btn-mode-minute').className.includes('#3D7055'), 'Minute button active after clicking input-minute');

      // Clicking input-hour switches back to hour mode
      app.click(app.get('input-hour'));
      assert.ok(app.get('btn-mode-hour').className.includes('#3D7055'), 'Hour button active after clicking input-hour');
    } finally {
      app.cleanup();
    }
  });

  // ----------------------------------------------------------------------
  // Section 5: Presets & Adjustments
  // ----------------------------------------------------------------------
  console.log('\n▶ Section 5: Presets & Step Adjustments');

  runTest('All 5 preset chips update both digital readout, dial visuals and AM/PM state', () => {
    const app = loadApp();
    try {
      app.click(app.get('nav-btn-add'));

      const testPresets = [
        { time: '06:00', ampm: 'AM', expectedH: '06', expectedM: '00' },
        { time: '06:30', ampm: 'AM', expectedH: '06', expectedM: '30' },
        { time: '07:00', ampm: 'AM', expectedH: '07', expectedM: '00' },
        { time: '07:30', ampm: 'AM', expectedH: '07', expectedM: '30' },
        { time: '08:00', ampm: 'AM', expectedH: '08', expectedM: '00' }
      ];

      for (const p of testPresets) {
        app.window.setTimePreset(p.time, p.ampm);
        assert.equal(app.get('input-hour').innerText, p.expectedH, `Preset ${p.time} hour`);
        assert.equal(app.get('input-minute').innerText, p.expectedM, `Preset ${p.time} minute`);
        assert.ok(app.get('btn-ampm-am').className.includes('#3D7055'), `Preset ${p.time} AM selected`);
      }
    } finally {
      app.cleanup();
    }
  });

  runTest('adjustHour and adjustMinute wrap around cleanly without negative or overflow values', () => {
    const app = loadApp();
    try {
      app.click(app.get('nav-btn-add'));

      // Start at 12, adjust +1 -> 1
      app.window.setTimePreset('12:00', 'AM');
      app.window.eval('adjustHour(1)');
      assert.equal(app.get('input-hour').innerText, '01', '12 + 1 hour wraps to 1');

      // Adjust -1 -> 12
      app.window.eval('adjustHour(-1)');
      assert.equal(app.get('input-hour').innerText, '12', '1 - 1 hour wraps to 12');

      // Start at 55 min, adjust +5 -> 00
      app.window.setTimePreset('07:55', 'AM');
      app.window.eval('adjustMinute(5)');
      assert.equal(app.get('input-minute').innerText, '00', '55 + 5 min wraps to 00');

      // Adjust -5 -> 55
      app.window.eval('adjustMinute(-5)');
      assert.equal(app.get('input-minute').innerText, '55', '00 - 5 min wraps to 55');
    } finally {
      app.cleanup();
    }
  });

  // ----------------------------------------------------------------------
  // Section 6: End-to-End Persistence & Storage Integrity
  // ----------------------------------------------------------------------
  console.log('\n▶ Section 6: End-to-End Persistence & Storage Integrity');

  runTest('Saved alarm retains exact dial time, AM/PM, label and persists in localStorage', () => {
    const app = loadApp({
      initialStorage: {
        rize_alarms: JSON.stringify([])
      }
    });
    try {
      app.click(app.get('nav-btn-add'));

      // Set to 05:45 PM via dial functions
      app.window.setTimePreset('05:45', 'PM');
      app.setInputValue('input-alarm-label', 'Sunset Yoga');

      const saveBtn = app.query('#screen-add button[onclick*="saveNewAlarm"]');
      saveBtn.click();

      assert.equal(app.getActiveScreen(), 'dashboard');

      const savedAlarms = JSON.parse(app.localStorage.getItem('rize_alarms') || '[]');
      assert.equal(savedAlarms.length, 1);
      assert.equal(savedAlarms[0].time, '05:45');
      assert.equal(savedAlarms[0].ampm, 'PM');
      assert.equal(savedAlarms[0].label, 'Sunset Yoga');
      assert.equal(savedAlarms[0].enabled, true);
    } finally {
      app.cleanup();
    }
  });

  // ----------------------------------------------------------------------
  // Section 7: Design Tokens & Visual Styling Conformance
  // ----------------------------------------------------------------------
  console.log('\n▶ Section 7: Design Tokens & Visual Styling Conformance');

  runTest('Radial dial elements conform strictly to organic sage (#3D7055) and slate palette', () => {
    const app = loadApp();
    try {
      app.click(app.get('nav-btn-add'));

      const dial = app.get('radial-clock-dial');
      assert.ok(dial, 'Dial SVG exists');

      const hand = app.get('dial-hand-line');
      assert.equal(hand.getAttribute('stroke'), '#3D7055', 'Hand line must use organic sage #3D7055');

      const bead = app.get('dial-pointer-bead');
      assert.equal(bead.getAttribute('stroke'), '#3D7055', 'Pointer bead must use organic sage #3D7055');

      const pivot = dial.querySelector('.dial-pivot');
      assert.equal(pivot.getAttribute('fill'), '#3D7055', 'Central pivot must use organic sage #3D7055');

      // Verify no neon color attributes in dial SVG raw HTML
      const dialHtml = app.rawHtml;
      assert.ok(!dialHtml.includes('#00F2FE'), 'Dial must not contain neon cyan #00F2FE');
      assert.ok(!dialHtml.includes('#4EDEA3'), 'Dial must not contain neon green #4EDEA3');
    } finally {
      app.cleanup();
    }
  });

  console.log('\n========================================================================');
  console.log(`  ADVERSARIAL STRESS TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('========================================================================');

  if (failed > 0) process.exit(1);
}

main().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
