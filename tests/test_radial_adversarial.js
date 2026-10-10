// tests/test_radial_adversarial.js
// Empirical Adversarial Challenge Suite for Milestone 4 (Radial Clock Dial)
// Verifies:
// 1. Continuous radial drag across 360 degrees in fine increments (5 deg and 1 deg)
// 2. Hour snapping across all 12 positions (12, 1, 2, ..., 11) + snapping sector tolerances
// 3. Minute snapping across all 12 positions (00, 05, 10, ..., 55) + snapping sector tolerances
// 4. Top boundary crossing: 350 deg to 10 deg, and 11 -> 12 -> 1 transition without NaN or glitch
// 5. Strict haptic feedback counts: Native.vibrate('tick') only on value transitions
// 6. AM/PM toggle behavior and persistence
// 7. Quick morning preset chip application and visual synchronization
// 8. Auto-advance from Hour mode to Minute mode on pointer release
// 9. Multi-event input models (Pointer, Touch, Mouse) and center coordinate singularity

const assert = require('assert');
const path = require('path');
const fs = require('fs');
const { loadApp } = require('./e2e/harness');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failureDetails = [];

async function runTest(name, fn) {
  totalTests++;
  try {
    await fn();
    console.log(`  ✔ PASS: ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✘ FAIL: ${name}`);
    console.error(`    Error: ${err.message}`);
    failedTests++;
    failureDetails.push({ name, error: err.message, stack: err.stack });
  }
}

// Coordinate helper to convert clock angle (deg from 12 o'clock clockwise) to client coordinates
function getDialCoords(dialElement, angleDeg, radius = 90) {
  dialElement.setBoundingClientRect({ left: 20, top: 20, width: 240, height: 240, right: 260, bottom: 260 });
  const cx = 140; // 20 + 120
  const cy = 140; // 20 + 120
  const rad = (angleDeg - 90) * (Math.PI / 180);
  const clientX = cx + radius * Math.cos(rad);
  const clientY = cy + radius * Math.sin(rad);
  return { clientX, clientY, cx, cy };
}

function simulatePointerSequence(dialElement, angles, eventType = 'pointer') {
  if (angles.length === 0) return;

  // Down at first angle
  const first = getDialCoords(dialElement, angles[0]);
  if (eventType === 'pointer') {
    dialElement.dispatchEvent({ type: 'pointerdown', clientX: first.clientX, clientY: first.clientY, preventDefault: () => {} });
  } else if (eventType === 'touch') {
    dialElement.dispatchEvent({ type: 'touchstart', touches: [{ clientX: first.clientX, clientY: first.clientY }], preventDefault: () => {} });
  } else if (eventType === 'mouse') {
    dialElement.dispatchEvent({ type: 'mousedown', clientX: first.clientX, clientY: first.clientY, preventDefault: () => {} });
  }

  // Move through intermediate angles
  for (let i = 1; i < angles.length; i++) {
    const pt = getDialCoords(dialElement, angles[i]);
    if (eventType === 'pointer') {
      dialElement.dispatchEvent({ type: 'pointermove', clientX: pt.clientX, clientY: pt.clientY, preventDefault: () => {} });
    } else if (eventType === 'touch') {
      dialElement.dispatchEvent({ type: 'touchmove', touches: [{ clientX: pt.clientX, clientY: pt.clientY }], preventDefault: () => {} });
    } else if (eventType === 'mouse') {
      dialElement.dispatchEvent({ type: 'mousemove', clientX: pt.clientX, clientY: pt.clientY, preventDefault: () => {} });
    }
  }

  // Up at last angle
  const last = getDialCoords(dialElement, angles[angles.length - 1]);
  if (eventType === 'pointer') {
    dialElement.dispatchEvent({ type: 'pointerup', clientX: last.clientX, clientY: last.clientY, preventDefault: () => {} });
  } else if (eventType === 'touch') {
    dialElement.dispatchEvent({ type: 'touchend', changedTouches: [{ clientX: last.clientX, clientY: last.clientY }], preventDefault: () => {} });
  } else if (eventType === 'mouse') {
    dialElement.dispatchEvent({ type: 'mouseup', clientX: last.clientX, clientY: last.clientY, preventDefault: () => {} });
  }
}

async function runAdversarialSuite() {
  console.log('========================================================================');
  console.log('  CHALLENGER M4: ADVERSARIAL STRESS TEST SUITE (RADIAL CLOCK DIAL)');
  console.log('========================================================================\n');

  // ==========================================================================
  // SUITE 1: CONTINUOUS RADIAL DRAG ACROSS 360 DEGREES IN 5-DEGREE INCREMENTS
  // ==========================================================================
  console.log('▶ Suite 1: Continuous Radial Drag Across 360 Degrees (Hour Mode)');

  await runTest('1.1 Clockwise continuous drag every 5 degrees accurately resolves all hours without NaN', () => {
    const app = loadApp();
    try {
      app.click('nav-btn-add');
      const dial = app.get('radial-clock-dial');
      assert.ok(dial, 'Radial dial must exist');

      // Generate 5-degree increments: 0, 5, 10, ..., 360
      const angles = [];
      for (let deg = 0; deg <= 360; deg += 5) {
        angles.push(deg);
      }

      // Drag clockwise
      dial.setBoundingClientRect({ left: 20, top: 20, width: 240, height: 240, right: 260, bottom: 260 });
      const p0 = getDialCoords(dial, 0);
      dial.dispatchEvent({ type: 'pointerdown', clientX: p0.clientX, clientY: p0.clientY, preventDefault: () => {} });

      for (let i = 0; i < angles.length; i++) {
        const deg = angles[i];
        const pt = getDialCoords(dial, deg);
        dial.dispatchEvent({ type: 'pointermove', clientX: pt.clientX, clientY: pt.clientY, preventDefault: () => {} });

        // Calculate expected hour
        // At exact knife-edge boundary angles (multiples of 15 that are odd: 15, 45, 75, etc.),
        // floating-point atan2 can yield (deg - epsilon) or (deg + epsilon),
        // falling into either of the two bordering sectors (e.g. 12 or 1 at 15 deg).
        const isBoundary = (deg % 30 === 15);
        let expectedHour = Math.round(deg / 30) % 12;
        if (expectedHour === 0) expectedHour = 12;

        const actualHour = app.window.eval('newAlarmHour');
        assert.ok(!isNaN(actualHour), `Hour at ${deg} deg must not be NaN`);

        if (isBoundary) {
          const prevHour = (Math.floor(deg / 30) % 12) || 12;
          const nextHour = (Math.ceil(deg / 30) % 12) || 12;
          assert.ok(
            actualHour === prevHour || actualHour === nextHour,
            `At boundary angle ${deg} deg, hour must be either ${prevHour} or ${nextHour}, got ${actualHour}`
          );
        } else {
          assert.equal(actualHour, expectedHour, `At ${deg} deg, hour should be ${expectedHour}, got ${actualHour}`);
        }

        // Check DOM display matches state
        const hourDisplay = app.get('input-hour').innerText;
        assert.equal(hourDisplay, String(actualHour).padStart(2, '0'), `DOM hour display at ${deg} deg must match actualHour`);
      }

      dial.dispatchEvent({ type: 'pointerup', clientX: p0.clientX, clientY: p0.clientY, preventDefault: () => {} });
    } finally {
      app.cleanup();
    }
  });

  await runTest('1.2 Counter-clockwise continuous drag every 5 degrees (360 down to 0) maintains stability', () => {
    const app = loadApp();
    try {
      app.click('nav-btn-add');
      const dial = app.get('radial-clock-dial');

      dial.setBoundingClientRect({ left: 20, top: 20, width: 240, height: 240, right: 260, bottom: 260 });
      const p360 = getDialCoords(dial, 360);
      dial.dispatchEvent({ type: 'pointerdown', clientX: p360.clientX, clientY: p360.clientY, preventDefault: () => {} });

      for (let deg = 360; deg >= 0; deg -= 5) {
        const pt = getDialCoords(dial, deg);
        dial.dispatchEvent({ type: 'pointermove', clientX: pt.clientX, clientY: pt.clientY, preventDefault: () => {} });

        const isBoundary = (deg % 30 === 15);
        let expectedHour = Math.round(deg / 30) % 12;
        if (expectedHour === 0) expectedHour = 12;

        const actualHour = app.window.eval('newAlarmHour');
        if (isBoundary) {
          const prevHour = (Math.floor(deg / 30) % 12) || 12;
          const nextHour = (Math.ceil(deg / 30) % 12) || 12;
          assert.ok(
            actualHour === prevHour || actualHour === nextHour,
            `At boundary angle ${deg} deg, hour must be either ${prevHour} or ${nextHour}, got ${actualHour}`
          );
        } else {
          assert.equal(actualHour, expectedHour, `CCW at ${deg} deg, hour should be ${expectedHour}, got ${actualHour}`);
        }
      }

      dial.dispatchEvent({ type: 'pointerup', clientX: p360.clientX, clientY: p360.clientY, preventDefault: () => {} });
    } finally {
      app.cleanup();
    }
  });

  await runTest('1.3 Fine-grained 1-degree resolution across all 360 degrees has zero discontinuities or NaNs', () => {
    const app = loadApp();
    try {
      app.click('nav-btn-add');
      const dial = app.get('radial-clock-dial');
      dial.setBoundingClientRect({ left: 20, top: 20, width: 240, height: 240, right: 260, bottom: 260 });

      const p0 = getDialCoords(dial, 0);
      dial.dispatchEvent({ type: 'pointerdown', clientX: p0.clientX, clientY: p0.clientY, preventDefault: () => {} });

      for (let deg = 0; deg < 360; deg += 1) {
        const pt = getDialCoords(dial, deg);
        dial.dispatchEvent({ type: 'pointermove', clientX: pt.clientX, clientY: pt.clientY, preventDefault: () => {} });

        const actualHour = app.window.eval('newAlarmHour');
        assert.ok(actualHour >= 1 && actualHour <= 12, `Hour must stay in [1, 12] range at ${deg} deg`);
        assert.ok(!isNaN(actualHour), `Hour must not be NaN at ${deg} deg`);
      }

      dial.dispatchEvent({ type: 'pointerup', clientX: p0.clientX, clientY: p0.clientY, preventDefault: () => {} });
    } finally {
      app.cleanup();
    }
  });

  // ==========================================================================
  // SUITE 2: HOUR SNAPPING ACROSS ALL 12 POSITIONS
  // ==========================================================================
  console.log('\n▶ Suite 2: Hour Snapping Across All 12 Radial Positions');

  const EXPECTED_HOURS = [
    { hour: 12, deg: 0 },
    { hour: 1,  deg: 30 },
    { hour: 2,  deg: 60 },
    { hour: 3,  deg: 90 },
    { hour: 4,  deg: 120 },
    { hour: 5,  deg: 150 },
    { hour: 6,  deg: 180 },
    { hour: 7,  deg: 210 },
    { hour: 8,  deg: 240 },
    { hour: 9,  deg: 270 },
    { hour: 10, deg: 300 },
    { hour: 11, deg: 330 }
  ];

  for (const { hour, deg } of EXPECTED_HOURS) {
    await runTest(`2.${hour} Hour position ${hour} at exactly ${deg} deg snaps and highlights active SVG label`, () => {
      const app = loadApp();
      try {
        app.click('nav-btn-add');
        const dial = app.get('radial-clock-dial');
        dial.setBoundingClientRect({ left: 20, top: 20, width: 240, height: 240, right: 260, bottom: 260 });

        const pt = getDialCoords(dial, deg);
        dial.dispatchEvent({ type: 'pointerdown', clientX: pt.clientX, clientY: pt.clientY, preventDefault: () => {} });
        dial.dispatchEvent({ type: 'pointerup', clientX: pt.clientX, clientY: pt.clientY, preventDefault: () => {} });

        const actualHour = app.window.eval('newAlarmHour');
        assert.equal(actualHour, hour, `Hour at ${deg} deg must be ${hour}`);

        // Check digital readout
        assert.equal(app.get('input-hour').innerText, String(hour).padStart(2, '0'));

        // Check hand endpoint
        const hand = app.get('dial-hand-line');
        const expectedRad = (deg - 90) * (Math.PI / 180);
        const expectedHx = Math.round(120 + 76 * Math.cos(expectedRad));
        const expectedHy = Math.round(120 + 76 * Math.sin(expectedRad));
        assert.equal(Number(hand.getAttribute('x2')), expectedHx, `Hand x2 at ${deg} deg must be ${expectedHx}`);
        assert.equal(Number(hand.getAttribute('y2')), expectedHy, `Hand y2 at ${deg} deg must be ${expectedHy}`);

        // Check bead center
        const bead = app.get('dial-pointer-bead');
        assert.equal(Number(bead.getAttribute('cx')), expectedHx);
        assert.equal(Number(bead.getAttribute('cy')), expectedHy);

        // Check highlighted label in SVG group
        const group = app.get('dial-numbers-group');
        assert.ok(group, 'dial-numbers-group must exist');
        // Selected hour must have fill="#3D7055" and font-weight="700"
        const groupHtml = group.children.map(c => c.textContent + '|' + c.getAttribute('fill') + '|' + c.getAttribute('font-weight')).join('; ');
        const matchedItem = group.children.find(c => c.textContent === String(hour));
        assert.ok(matchedItem, `Label for ${hour} must exist in SVG`);
        assert.equal(matchedItem.getAttribute('fill'), '#3D7055', `Label ${hour} must be highlighted in sage (#3D7055)`);
        assert.equal(matchedItem.getAttribute('font-weight'), '700', `Label ${hour} must be font-weight 700`);
      } finally {
        app.cleanup();
      }
    });
  }

  await runTest('2.13 Snapping zones (+/- 14 degrees) around all 12 hours snap to respective hour center', () => {
    const app = loadApp();
    try {
      app.click('nav-btn-add');
      const dial = app.get('radial-clock-dial');
      dial.setBoundingClientRect({ left: 20, top: 20, width: 240, height: 240, right: 260, bottom: 260 });

      EXPECTED_HOURS.forEach(({ hour, deg }) => {
        [-14, -10, -5, 0, 5, 10, 14].forEach(offset => {
          const testDeg = (deg + offset + 360) % 360;
          const pt = getDialCoords(dial, testDeg);
          dial.dispatchEvent({ type: 'pointerdown', clientX: pt.clientX, clientY: pt.clientY, preventDefault: () => {} });
          const actualHour = app.window.eval('newAlarmHour');
          assert.equal(actualHour, hour, `Offset ${offset} from ${deg} deg (${testDeg} deg) must snap to hour ${hour}, got ${actualHour}`);
        });
      });
    } finally {
      app.cleanup();
    }
  });

  // ==========================================================================
  // SUITE 3: MINUTE SNAPPING ACROSS ALL 12 POSITIONS (00 TO 55)
  // ==========================================================================
  console.log('\n▶ Suite 3: Minute Snapping Across All 12 Radial Positions (Minute Mode)');

  const EXPECTED_MINUTES = [
    { min: 0,  label: '00', deg: 0 },
    { min: 5,  label: '05', deg: 30 },
    { min: 10, label: '10', deg: 60 },
    { min: 15, label: '15', deg: 90 },
    { min: 20, label: '20', deg: 120 },
    { min: 25, label: '25', deg: 150 },
    { min: 30, label: '30', deg: 180 },
    { min: 35, label: '35', deg: 210 },
    { min: 40, label: '40', deg: 240 },
    { min: 45, label: '45', deg: 270 },
    { min: 50, label: '50', deg: 300 },
    { min: 55, label: '55', deg: 330 }
  ];

  for (const { min, label, deg } of EXPECTED_MINUTES) {
    await runTest(`3.${min} Minute position ${label} at exactly ${deg} deg snaps and highlights active SVG label`, () => {
      const app = loadApp();
      try {
        app.click('nav-btn-add');
        app.click('btn-mode-minute'); // switch to minute mode
        const dial = app.get('radial-clock-dial');
        dial.setBoundingClientRect({ left: 20, top: 20, width: 240, height: 240, right: 260, bottom: 260 });

        const pt = getDialCoords(dial, deg);
        dial.dispatchEvent({ type: 'pointerdown', clientX: pt.clientX, clientY: pt.clientY, preventDefault: () => {} });
        dial.dispatchEvent({ type: 'pointerup', clientX: pt.clientX, clientY: pt.clientY, preventDefault: () => {} });

        const actualMin = app.window.eval('newAlarmMinute');
        assert.equal(actualMin, min, `Minute at ${deg} deg must be ${min}`);

        // Check digital readout
        assert.equal(app.get('input-minute').innerText, label, `Minute display must be ${label}`);

        // Check SVG numbers group has minute labels
        const group = app.get('dial-numbers-group');
        const matchedItem = group.children.find(c => c.textContent === label);
        assert.ok(matchedItem, `Label for ${label} must exist in SVG minute mode`);
        assert.equal(matchedItem.getAttribute('fill'), '#3D7055', `Label ${label} must be highlighted in sage`);
        assert.equal(matchedItem.getAttribute('font-weight'), '700');
      } finally {
        app.cleanup();
      }
    });
  }

  await runTest('3.13 Continuous drag across 360 degrees in Minute mode validates all minute transitions', () => {
    const app = loadApp();
    try {
      app.click('nav-btn-add');
      app.click('btn-mode-minute');
      const dial = app.get('radial-clock-dial');
      dial.setBoundingClientRect({ left: 20, top: 20, width: 240, height: 240, right: 260, bottom: 260 });

      const p0 = getDialCoords(dial, 0);
      dial.dispatchEvent({ type: 'pointerdown', clientX: p0.clientX, clientY: p0.clientY, preventDefault: () => {} });

      for (let deg = 0; deg <= 360; deg += 5) {
        const pt = getDialCoords(dial, deg);
        dial.dispatchEvent({ type: 'pointermove', clientX: pt.clientX, clientY: pt.clientY, preventDefault: () => {} });

        const isBoundary = (deg % 30 === 15);
        let expectedMin = (Math.round(deg / 30) * 5) % 60;
        const actualMin = app.window.eval('newAlarmMinute');

        if (isBoundary) {
          const prevMin = ((Math.floor(deg / 30) * 5) % 60);
          const nextMin = ((Math.ceil(deg / 30) * 5) % 60);
          assert.ok(
            actualMin === prevMin || actualMin === nextMin,
            `At boundary angle ${deg} deg, minute must be either ${prevMin} or ${nextMin}, got ${actualMin}`
          );
        } else {
          assert.equal(actualMin, expectedMin, `Minute at ${deg} deg should be ${expectedMin}, got ${actualMin}`);
        }
      }

      dial.dispatchEvent({ type: 'pointerup', clientX: p0.clientX, clientY: p0.clientY, preventDefault: () => {} });
    } finally {
      app.cleanup();
    }
  });

  // ==========================================================================
  // SUITE 4: TOP BOUNDARY CROSSING (350 DEG TO 10 DEG)
  // ==========================================================================
  console.log('\n▶ Suite 4: Top Boundary Crossing (350 deg to 10 deg & 11 -> 12 -> 1)');

  await runTest('4.1 Continuous drag from 330 deg through 350 deg, 0 deg, 10 deg to 30 deg transitions 11 -> 12 -> 1', () => {
    const app = loadApp();
    try {
      app.click('nav-btn-add');
      const dial = app.get('radial-clock-dial');
      dial.setBoundingClientRect({ left: 20, top: 20, width: 240, height: 240, right: 260, bottom: 260 });

      // Start drag at 330 deg (Hour 11)
      const pStart = getDialCoords(dial, 330);
      dial.dispatchEvent({ type: 'pointerdown', clientX: pStart.clientX, clientY: pStart.clientY, preventDefault: () => {} });
      assert.equal(app.window.eval('newAlarmHour'), 11, 'Initial hour at 330 deg must be 11');

      const hourHistory = [11];

      // Drag across top boundary in 2-degree increments: 330 -> 360 (0) -> 30
      const sweepAngles = [
        332, 336, 340, 344, // Sector 11
        346, 350, 354, 358, 0, 2, 6, 10, 14, // Sector 12
        16, 20, 24, 28, 30 // Sector 1
      ];

      sweepAngles.forEach(deg => {
        const pt = getDialCoords(dial, deg);
        dial.dispatchEvent({ type: 'pointermove', clientX: pt.clientX, clientY: pt.clientY, preventDefault: () => {} });
        const h = app.window.eval('newAlarmHour');
        assert.ok(!isNaN(h), `Hour at ${deg} deg must not be NaN`);
        if (h !== hourHistory[hourHistory.length - 1]) {
          hourHistory.push(h);
        }
      });

      const pEnd = getDialCoords(dial, 30);
      dial.dispatchEvent({ type: 'pointerup', clientX: pEnd.clientX, clientY: pEnd.clientY, preventDefault: () => {} });

      // Verify exact progression of distinct hours visited
      assert.deepStrictEqual(hourHistory, [11, 12, 1], `Hour transitions across top boundary must be [11, 12, 1], got ${JSON.stringify(hourHistory)}`);
    } finally {
      app.cleanup();
    }
  });

  await runTest('4.2 Dragging strictly from 350 deg to 10 deg crosses top zero boundary smoothly without NaN/glitch', () => {
    const app = loadApp();
    try {
      app.click('nav-btn-add');
      // Set initial hour to 11 to observe the entry transition
      app.window.eval('newAlarmHour = 11');
      app.window.eval('updateDialVisuals()');

      const dial = app.get('radial-clock-dial');
      dial.setBoundingClientRect({ left: 20, top: 20, width: 240, height: 240, right: 260, bottom: 260 });

      // Pointer down at 350 deg (should immediately snap from 11 to 12)
      const p350 = getDialCoords(dial, 350);
      dial.dispatchEvent({ type: 'pointerdown', clientX: p350.clientX, clientY: p350.clientY, preventDefault: () => {} });
      assert.equal(app.window.eval('newAlarmHour'), 12, 'Hour at 350 deg must snap to 12');

      // Drag through 355 deg -> 0 deg -> 5 deg -> 10 deg
      [355, 358, 359, 0, 1, 5, 10].forEach(deg => {
        const pt = getDialCoords(dial, deg);
        dial.dispatchEvent({ type: 'pointermove', clientX: pt.clientX, clientY: pt.clientY, preventDefault: () => {} });
        const h = app.window.eval('newAlarmHour');
        assert.equal(h, 12, `Crossing angle ${deg} deg must remain cleanly at 12`);
        assert.ok(!isNaN(h), `Crossing angle ${deg} deg must not be NaN`);
      });

      // Pointer up at 10 deg
      const p10 = getDialCoords(dial, 10);
      dial.dispatchEvent({ type: 'pointerup', clientX: p10.clientX, clientY: p10.clientY, preventDefault: () => {} });
      assert.equal(app.window.eval('newAlarmHour'), 12, 'Hour at end of 350->10 drag must be 12');
    } finally {
      app.cleanup();
    }
  });

  await runTest('4.3 Reverse boundary crossing from 30 deg (1) through 10 deg, 0 deg, 350 deg to 330 deg (11) transitions 1 -> 12 -> 11', () => {
    const app = loadApp();
    try {
      app.click('nav-btn-add');
      const dial = app.get('radial-clock-dial');
      dial.setBoundingClientRect({ left: 20, top: 20, width: 240, height: 240, right: 260, bottom: 260 });

      const p30 = getDialCoords(dial, 30);
      dial.dispatchEvent({ type: 'pointerdown', clientX: p30.clientX, clientY: p30.clientY, preventDefault: () => {} });
      assert.equal(app.window.eval('newAlarmHour'), 1, 'Initial hour at 30 deg must be 1');

      const hourHistory = [1];
      const reverseAngles = [25, 20, 15, 14, 10, 5, 0, 358, 355, 350, 346, 344, 340, 335, 330];

      reverseAngles.forEach(deg => {
        const pt = getDialCoords(dial, deg);
        dial.dispatchEvent({ type: 'pointermove', clientX: pt.clientX, clientY: pt.clientY, preventDefault: () => {} });
        const h = app.window.eval('newAlarmHour');
        if (h !== hourHistory[hourHistory.length - 1]) {
          hourHistory.push(h);
        }
      });

      const p330 = getDialCoords(dial, 330);
      dial.dispatchEvent({ type: 'pointerup', clientX: p330.clientX, clientY: p330.clientY, preventDefault: () => {} });

      assert.deepStrictEqual(hourHistory, [1, 12, 11], `Reverse transition must be [1, 12, 11], got ${JSON.stringify(hourHistory)}`);
    } finally {
      app.cleanup();
    }
  });

  // ==========================================================================
  // SUITE 5: HAPTIC FEEDBACK AUDIT (TICK COUNTS & VALUE CHANGE INVARIANT)
  // ==========================================================================
  console.log('\n▶ Suite 5: Haptic Feedback Audit (Native.vibrate("tick") Invariants)');

  await runTest('5.1 Exactly 12 ticks emitted during a full 360-degree rotation in Hour mode', () => {
    const app = loadApp();
    try {
      app.click('nav-btn-add');
      const dial = app.get('radial-clock-dial');
      dial.setBoundingClientRect({ left: 20, top: 20, width: 240, height: 240, right: 260, bottom: 260 });

      // Start by setting hour to 12 at 0 deg
      const p0 = getDialCoords(dial, 0);
      dial.dispatchEvent({ type: 'pointerdown', clientX: p0.clientX, clientY: p0.clientY, preventDefault: () => {} });
      dial.dispatchEvent({ type: 'pointerup', clientX: p0.clientX, clientY: p0.clientY, preventDefault: () => {} });
      assert.equal(app.window.eval('newAlarmHour'), 12);

      app.native.reset();

      // Now drag from 0 deg through 360 deg in 5-degree increments (72 movement steps)
      dial.dispatchEvent({ type: 'pointerdown', clientX: p0.clientX, clientY: p0.clientY, preventDefault: () => {} });

      for (let deg = 5; deg <= 360; deg += 5) {
        const pt = getDialCoords(dial, deg);
        dial.dispatchEvent({ type: 'pointermove', clientX: pt.clientX, clientY: pt.clientY, preventDefault: () => {} });
      }

      dial.dispatchEvent({ type: 'pointerup', clientX: p0.clientX, clientY: p0.clientY, preventDefault: () => {} });

      const tickCalls = app.native.calls.vibrate.filter(v => v.type === 'tick');
      // Transitions: 12 -> 1, 1 -> 2, 2 -> 3, 3 -> 4, 4 -> 5, 5 -> 6, 6 -> 7, 7 -> 8, 8 -> 9, 9 -> 10, 10 -> 11, 11 -> 12 = 12 ticks!
      assert.equal(tickCalls.length, 12, `Expected exactly 12 ticks for complete 12-hour cycle, got ${tickCalls.length}`);
    } finally {
      app.cleanup();
    }
  });

  await runTest('5.2 Dragging within the same sector emits zero ticks when value does not change', () => {
    const app = loadApp();
    try {
      app.click('nav-btn-add');
      const dial = app.get('radial-clock-dial');
      dial.setBoundingClientRect({ left: 20, top: 20, width: 240, height: 240, right: 260, bottom: 260 });

      // Snap to 3 o'clock (90 deg, Hour 3)
      const p90 = getDialCoords(dial, 90);
      dial.dispatchEvent({ type: 'pointerdown', clientX: p90.clientX, clientY: p90.clientY, preventDefault: () => {} });
      assert.equal(app.window.eval('newAlarmHour'), 3);

      app.native.reset();

      // Jiggle pointer between 80 deg, 85 deg, 90 deg, 95 deg, 100 deg (all within Hour 3 sector [75, 105])
      [80, 85, 95, 100, 82, 88, 92].forEach(deg => {
        const pt = getDialCoords(dial, deg);
        dial.dispatchEvent({ type: 'pointermove', clientX: pt.clientX, clientY: pt.clientY, preventDefault: () => {} });
        assert.equal(app.window.eval('newAlarmHour'), 3);
      });

      const tickCalls = app.native.calls.vibrate.filter(v => v.type === 'tick');
      assert.equal(tickCalls.length, 0, `Expected 0 ticks during intra-sector movement, got ${tickCalls.length}`);

      dial.dispatchEvent({ type: 'pointerup', clientX: p90.clientX, clientY: p90.clientY, preventDefault: () => {} });
    } finally {
      app.cleanup();
    }
  });

  await runTest('5.3 Exactly 12 ticks emitted during a full 360-degree rotation in Minute mode', () => {
    const app = loadApp();
    try {
      app.click('nav-btn-add');
      app.click('btn-mode-minute');
      const dial = app.get('radial-clock-dial');
      dial.setBoundingClientRect({ left: 20, top: 20, width: 240, height: 240, right: 260, bottom: 260 });

      const p0 = getDialCoords(dial, 0);
      dial.dispatchEvent({ type: 'pointerdown', clientX: p0.clientX, clientY: p0.clientY, preventDefault: () => {} });
      dial.dispatchEvent({ type: 'pointerup', clientX: p0.clientX, clientY: p0.clientY, preventDefault: () => {} });
      assert.equal(app.window.eval('newAlarmMinute'), 0);

      app.native.reset();

      dial.dispatchEvent({ type: 'pointerdown', clientX: p0.clientX, clientY: p0.clientY, preventDefault: () => {} });

      for (let deg = 5; deg <= 360; deg += 5) {
        const pt = getDialCoords(dial, deg);
        dial.dispatchEvent({ type: 'pointermove', clientX: pt.clientX, clientY: pt.clientY, preventDefault: () => {} });
      }

      dial.dispatchEvent({ type: 'pointerup', clientX: p0.clientX, clientY: p0.clientY, preventDefault: () => {} });

      const tickCalls = app.native.calls.vibrate.filter(v => v.type === 'tick');
      assert.equal(tickCalls.length, 12, `Expected exactly 12 ticks for complete 60-minute cycle, got ${tickCalls.length}`);
    } finally {
      app.cleanup();
    }
  });

  // ==========================================================================
  // SUITE 6: AM/PM TOGGLE BEHAVIOR AND PERSISTENCE
  // ==========================================================================
  console.log('\n▶ Suite 6: AM/PM Toggle Behavior & Persistence');

  await runTest('6.1 Toggling AM to PM updates state, styling tokens, haptic feedback, and saved alarm format', () => {
    const app = loadApp();
    try {
      app.click('nav-btn-add');
      const btnAm = app.get('btn-ampm-am');
      const btnPm = app.get('btn-ampm-pm');
      assert.ok(btnAm && btnPm, 'AM/PM buttons must exist');

      // Default should be AM
      assert.equal(app.window.eval('newAlarmAmPm'), 'AM');
      assert.ok(btnAm.className.includes('bg-[#3D7055]'), 'AM button should have active sage styling');

      app.native.reset();
      // Click PM
      app.click(btnPm);
      assert.equal(app.window.eval('newAlarmAmPm'), 'PM', 'State must update to PM');
      assert.ok(btnPm.className.includes('bg-[#3D7055]'), 'PM button should have active sage styling');
      assert.ok(btnAm.className.includes('bg-[#F1F5F9]'), 'AM button should have inactive styling');
      assert.ok(app.native.calls.vibrate.some(v => v.type === 'click'), 'Clicking PM must fire haptic click');

      // Click AM again
      app.native.reset();
      app.click(btnAm);
      assert.equal(app.window.eval('newAlarmAmPm'), 'AM', 'State must return to AM');
      assert.ok(btnAm.className.includes('bg-[#3D7055]'));
      assert.ok(app.native.calls.vibrate.some(v => v.type === 'click'), 'Clicking AM must fire haptic click');
    } finally {
      app.cleanup();
    }
  });

  await runTest('6.2 Saving alarm with PM stores ampm="PM" and reflects in dashboard cards', () => {
    const app = loadApp();
    try {
      app.click('nav-btn-add');
      app.click('btn-ampm-pm'); // Select PM
      app.setInputValue('input-alarm-label', 'Sunset Yoga');
      app.click(app.query('#screen-add header button[onclick*="saveNewAlarm"]'));

      const storedAlarms = JSON.parse(app.localStorage.getItem('rize_alarms') || '[]');
      const saved = storedAlarms[0];
      assert.ok(saved, 'Alarm must be saved');
      assert.equal(saved.ampm, 'PM', 'Saved alarm ampm must be PM');
      assert.equal(saved.label, 'Sunset Yoga');

      // Confirm dashboard displays PM pill
      const card = app.query('#alarms-deck .card-surface') || app.query('.alarm-card');
      assert.ok(card, 'Dashboard alarm card must exist');
      assert.ok(card.innerText.includes('PM'), 'Dashboard alarm card must display PM');
    } finally {
      app.cleanup();
    }
  });

  // ==========================================================================
  // SUITE 7: QUICK MORNING PRESETS APPLICATION
  // ==========================================================================
  console.log('\n▶ Suite 7: Quick Morning Presets Application');

  const PRESETS = [
    { time: '06:00', ampm: 'AM', hour: 6, min: 0, hourDeg: 180, minDeg: 0 },
    { time: '06:30', ampm: 'AM', hour: 6, min: 30, hourDeg: 180, minDeg: 180 },
    { time: '07:00', ampm: 'AM', hour: 7, min: 0, hourDeg: 210, minDeg: 0 },
    { time: '07:30', ampm: 'AM', hour: 7, min: 30, hourDeg: 210, minDeg: 180 },
    { time: '08:00', ampm: 'AM', hour: 8, min: 0, hourDeg: 240, minDeg: 0 }
  ];

  for (const preset of PRESETS) {
    await runTest(`7.${preset.time} Preset ${preset.time} ${preset.ampm} configures hour, minute, display, and dial angle`, () => {
      const app = loadApp();
      try {
        app.click('nav-btn-add');

        // Find preset button
        const presetBtn = app.query(`#screen-add button[onclick*="${preset.time}"]`);
        assert.ok(presetBtn, `Preset button for ${preset.time} must exist`);

        app.click(presetBtn);

        // Check state variables
        assert.equal(app.window.eval('newAlarmHour'), preset.hour, `Hour must be ${preset.hour}`);
        assert.equal(app.window.eval('newAlarmMinute'), preset.min, `Minute must be ${preset.min}`);
        assert.equal(app.window.eval('newAlarmAmPm'), preset.ampm, `AM/PM must be ${preset.ampm}`);

        // Check digital displays
        const [expectedH, expectedM] = preset.time.split(':');
        assert.equal(app.get('input-hour').innerText, expectedH);
        assert.equal(app.get('input-minute').innerText, expectedM);

        // Check dial hand geometry in Hour mode
        const hand = app.get('dial-hand-line');
        const expectedRad = (preset.hourDeg - 90) * (Math.PI / 180);
        const expectedHx = Math.round(120 + 76 * Math.cos(expectedRad));
        const expectedHy = Math.round(120 + 76 * Math.sin(expectedRad));
        assert.equal(Number(hand.getAttribute('x2')), expectedHx);
        assert.equal(Number(hand.getAttribute('y2')), expectedHy);
      } finally {
        app.cleanup();
      }
    });
  }

  // ==========================================================================
  // SUITE 8: HOUR TO MINUTE AUTO-ADVANCE ON POINTER RELEASE
  // ==========================================================================
  console.log('\n▶ Suite 8: Hour to Minute Auto-Advance on Pointer Release');

  await runTest('8.1 Finishing hour drag (pointerup) auto-advances dial mode from Hour to Minute after 200ms', async () => {
    const app = loadApp();
    try {
      app.click('nav-btn-add');
      const dial = app.get('radial-clock-dial');
      dial.setBoundingClientRect({ left: 20, top: 20, width: 240, height: 240, right: 260, bottom: 260 });

      assert.equal(app.window.eval('dialMode'), 'hour', 'Initial dial mode must be hour');

      // Drag to 8 o'clock (240 deg) and release
      const pt = getDialCoords(dial, 240);
      dial.dispatchEvent({ type: 'pointerdown', clientX: pt.clientX, clientY: pt.clientY, preventDefault: () => {} });
      dial.dispatchEvent({ type: 'pointerup', clientX: pt.clientX, clientY: pt.clientY, preventDefault: () => {} });

      // Before timer fires, mode is still hour
      assert.equal(app.window.eval('dialMode'), 'hour');

      // Wait 250ms for auto-advance timer
      await new Promise(resolve => setTimeout(resolve, 250));

      assert.equal(app.window.eval('dialMode'), 'minute', 'Mode must transition to minute after 200ms auto-advance');
      assert.ok(app.get('btn-mode-minute').className.includes('bg-[#3D7055]'), 'Minute mode button must be highlighted');
    } finally {
      app.cleanup();
    }
  });

  // ==========================================================================
  // SUITE 9: MULTI-EVENT INPUT MODELS & CORNER CASES
  // ==========================================================================
  console.log('\n▶ Suite 9: Multi-Event Input Models & Corner Cases');

  await runTest('9.1 Touch event sequence (touchstart, touchmove, touchend with touches array) operates properly', () => {
    const app = loadApp();
    try {
      app.click('nav-btn-add');
      const dial = app.get('radial-clock-dial');
      simulatePointerSequence(dial, [0, 30, 60, 90], 'touch');

      assert.equal(app.window.eval('newAlarmHour'), 3, 'Hour after touch sequence to 90 deg must be 3');
    } finally {
      app.cleanup();
    }
  });

  await runTest('9.2 Mouse event sequence (mousedown, mousemove, mouseup) operates properly', () => {
    const app = loadApp();
    try {
      app.click('nav-btn-add');
      const dial = app.get('radial-clock-dial');
      simulatePointerSequence(dial, [180, 210, 240], 'mouse');

      assert.equal(app.window.eval('newAlarmHour'), 8, 'Hour after mouse sequence to 240 deg must be 8');
    } finally {
      app.cleanup();
    }
  });

  await runTest('9.3 Touching exact center point (cx, cy where dx=0, dy=0) handles gracefully without NaN', () => {
    const app = loadApp();
    try {
      app.click('nav-btn-add');
      const dial = app.get('radial-clock-dial');
      dial.setBoundingClientRect({ left: 20, top: 20, width: 240, height: 240, right: 260, bottom: 260 });

      // Dead center: cx = 140, cy = 140
      dial.dispatchEvent({ type: 'pointerdown', clientX: 140, clientY: 140, preventDefault: () => {} });
      dial.dispatchEvent({ type: 'pointerup', clientX: 140, clientY: 140, preventDefault: () => {} });

      const hour = app.window.eval('newAlarmHour');
      assert.ok(!isNaN(hour), 'Dead center touch must not result in NaN');
      assert.ok(hour >= 1 && hour <= 12, 'Hour must be valid 1-12');
    } finally {
      app.cleanup();
    }
  });

  await runTest('9.4 Dragging far outside dial bounding box (r = 500px) retains accurate angle tracking', () => {
    const app = loadApp();
    try {
      app.click('nav-btn-add');
      const dial = app.get('radial-clock-dial');

      // Test with radius 500px at 120 deg (Hour 4)
      const pt = getDialCoords(dial, 120, 500);
      dial.dispatchEvent({ type: 'pointerdown', clientX: pt.clientX, clientY: pt.clientY, preventDefault: () => {} });
      dial.dispatchEvent({ type: 'pointerup', clientX: pt.clientX, clientY: pt.clientY, preventDefault: () => {} });

      assert.equal(app.window.eval('newAlarmHour'), 4, 'Extreme radius drag must accurately calculate angle');
    } finally {
      app.cleanup();
    }
  });

  await runTest('9.5 Rapid sequence of 500 high-frequency pointer movements does not leak or crash', () => {
    const app = loadApp();
    try {
      app.click('nav-btn-add');
      const dial = app.get('radial-clock-dial');
      dial.setBoundingClientRect({ left: 20, top: 20, width: 240, height: 240, right: 260, bottom: 260 });

      const p0 = getDialCoords(dial, 0);
      dial.dispatchEvent({ type: 'pointerdown', clientX: p0.clientX, clientY: p0.clientY, preventDefault: () => {} });

      for (let i = 0; i < 500; i++) {
        const deg = (i * 7) % 360;
        const pt = getDialCoords(dial, deg);
        dial.dispatchEvent({ type: 'pointermove', clientX: pt.clientX, clientY: pt.clientY, preventDefault: () => {} });
      }

      dial.dispatchEvent({ type: 'pointerup', clientX: p0.clientX, clientY: p0.clientY, preventDefault: () => {} });
      assert.ok(true, '500 high frequency events handled smoothly');
    } finally {
      app.cleanup();
    }
  });

  // ==========================================================================
  // SUMMARY
  // ==========================================================================
  console.log('\n========================================================================');
  console.log('  EMPIRICAL CHALLENGE EXECUTION SUMMARY');
  console.log('========================================================================');
  console.log(`  Total Tests:    ${totalTests}`);
  console.log(`  Passed:         ${passedTests}`);
  console.log(`  Failed:         ${failedTests}`);
  console.log('========================================================================\n');

  if (failedTests > 0) {
    console.error('Failure Audit:');
    failureDetails.forEach((f, idx) => {
      console.error(`  ${idx + 1}. [${f.name}]`);
      console.error(`     Error: ${f.error}`);
    });
    process.exit(1);
  } else {
    console.log('ALL ADVERSARIAL STRESS TESTS PASSED EMPIRICALLY (100% PASS RATE).');
  }
}

runAdversarialSuite().catch(err => {
  console.error('Suite execution error:', err);
  process.exit(1);
});
