// tests/test_challenger_m2.js
// Empirical Challenger verification suite for Milestone 2

const assert = require('assert');
const path = require('path');
const fs = require('fs');
const { loadApp, readMainActivityKt, readRizeNativeInterfaceKt } = require('./e2e/harness');

let passedCount = 0;
let failedCount = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✔ PASS: ${name}`);
    passedCount++;
  } catch (err) {
    console.error(`  ✘ FAIL: ${name}`);
    console.error(`    Error: ${err.message}`);
    failedCount++;
  }
}

async function runEmpiricalChallenge() {
  console.log('========================================================================');
  console.log('  CHALLENGER M2: EMPIRICAL VERIFICATION & STRESS HARNESS');
  console.log('========================================================================\n');

  console.log('▶ Suite 1: Bridge Contract Robustness (Simulated window.RizeNative)');
  
  test('Native.vibrate("click") calls window.RizeNative.vibrate with "click"', () => {
    const app = loadApp();
    try {
      const Native = app.window.eval('Native');
      Native.vibrate('click');
      assert.equal(app.native.calls.vibrate.length, 1);
      assert.equal(app.native.calls.vibrate[0].type, 'click');
    } finally {
      app.cleanup();
    }
  });

  test('Native.vibrate("tick") calls window.RizeNative.vibrate with "tick"', () => {
    const app = loadApp();
    try {
      const Native = app.window.eval('Native');
      Native.vibrate('tick');
      assert.equal(app.native.calls.vibrate.length, 1);
      assert.equal(app.native.calls.vibrate[0].type, 'tick');
    } finally {
      app.cleanup();
    }
  });

  test('Native.vibrate("success") calls window.RizeNative.vibrate with "success"', () => {
    const app = loadApp();
    try {
      const Native = app.window.eval('Native');
      Native.vibrate('success');
      assert.equal(app.native.calls.vibrate.length, 1);
      assert.equal(app.native.calls.vibrate[0].type, 'success');
    } finally {
      app.cleanup();
    }
  });

  test('Native.vibrate handles multiple sequential vibrations accurately', () => {
    const app = loadApp();
    try {
      const Native = app.window.eval('Native');
      Native.vibrate('click');
      Native.vibrate('tick');
      Native.vibrate('heavy_click');
      Native.vibrate('success');
      Native.vibrate('alarm_pulse');
      assert.equal(app.native.calls.vibrate.length, 5);
      assert.deepStrictEqual(
        app.native.calls.vibrate.map(c => c.type),
        ['click', 'tick', 'heavy_click', 'success', 'alarm_pulse']
      );
    } finally {
      app.cleanup();
    }
  });

  test('Native lifecycle methods (stopVibrate, startAlarmSound, stopAlarmSound, setScreenAwake)', () => {
    const app = loadApp();
    try {
      const Native = app.window.eval('Native');
      Native.stopVibrate();
      assert.equal(app.native.calls.stopVibrate, 1);

      Native.startAlarmSound();
      assert.equal(app.native.calls.startAlarmSound, 1);

      Native.stopAlarmSound();
      assert.equal(app.native.calls.stopAlarmSound, 1);

      Native.setScreenAwake(true);
      Native.setScreenAwake(false);
      assert.equal(app.native.calls.setScreenAwake.length, 2);
      assert.equal(app.native.calls.setScreenAwake[0].awake, true);
      assert.equal(app.native.calls.setScreenAwake[1].awake, false);
    } finally {
      app.cleanup();
    }
  });

  console.log('\n▶ Suite 2: Bridge Fallback Robustness (Null / Missing window.RizeNative)');

  test('Native.vibrate falls back to navigator.vibrate when window.RizeNative is null', () => {
    const app = loadApp();
    try {
      app.window.RizeNative = null;
      const Native = app.window.eval('Native');
      
      Native.vibrate('click');
      assert.equal(app.navigatorVibrations.length, 1);
      assert.equal(app.navigatorVibrations[0], 30);

      Native.vibrate('tick');
      assert.equal(app.navigatorVibrations.length, 2);
      assert.equal(app.navigatorVibrations[1], 30);

      Native.vibrate('success');
      assert.equal(app.navigatorVibrations.length, 3);
      assert.equal(app.navigatorVibrations[2], 30);

      Native.vibrate('alarm_pulse');
      assert.equal(app.navigatorVibrations.length, 4);
      assert.deepStrictEqual([...app.navigatorVibrations[3]], [300, 200, 300]);
    } finally {
      app.cleanup();
    }
  });

  test('Native.vibrate falls back safely when window.RizeNative is undefined', () => {
    const app = loadApp();
    try {
      delete app.window.RizeNative;
      const Native = app.window.eval('Native');
      
      Native.vibrate('click');
      assert.equal(app.navigatorVibrations.length, 1);
      assert.equal(app.navigatorVibrations[0], 30);
    } finally {
      app.cleanup();
    }
  });

  test('Native.vibrate does not throw when both window.RizeNative and navigator.vibrate are null/absent', () => {
    const app = loadApp();
    try {
      app.window.RizeNative = null;
      app.window.navigator.vibrate = null;
      const Native = app.window.eval('Native');

      assert.doesNotThrow(() => {
        Native.vibrate('click');
        Native.vibrate('tick');
        Native.vibrate('success');
        Native.vibrate('alarm_pulse');
      });
    } finally {
      app.cleanup();
    }
  });

  test('Native.stopVibrate / startAlarmSound / stopAlarmSound do not throw when window.RizeNative is null', () => {
    const app = loadApp();
    try {
      app.window.RizeNative = null;
      const Native = app.window.eval('Native');

      assert.doesNotThrow(() => {
        Native.stopVibrate();
        Native.startAlarmSound();
        Native.stopAlarmSound();
        Native.setScreenAwake(true);
      });
    } finally {
      app.cleanup();
    }
  });

  test('Native methods do not throw when window.RizeNative is an empty object without methods', () => {
    const app = loadApp();
    try {
      app.window.RizeNative = {};
      const Native = app.window.eval('Native');

      assert.doesNotThrow(() => {
        Native.vibrate('click');
        Native.stopVibrate();
        Native.startAlarmSound();
        Native.stopAlarmSound();
        Native.setScreenAwake(false);
      });
    } finally {
      app.cleanup();
    }
  });

  console.log('\n▶ Suite 3: Back Navigation Contract (window.handleBackNav)');

  test('handleBackNav returns false when on dashboard initially', () => {
    const app = loadApp();
    try {
      assert.equal(app.getActiveScreen(), 'dashboard');
      const handled = app.window.handleBackNav();
      assert.strictEqual(handled, false);
      assert.equal(app.getActiveScreen(), 'dashboard');
    } finally {
      app.cleanup();
    }
  });

  test('handleBackNav returns true from "add" screen and navigates to dashboard', () => {
    const app = loadApp();
    try {
      app.window.eval('showScreen("add")');
      assert.equal(app.getActiveScreen(), 'add');

      const handled = app.window.handleBackNav();
      assert.strictEqual(handled, true);
      assert.equal(app.getActiveScreen(), 'dashboard');

      // Subsequent call on dashboard should return false
      const handled2 = app.window.handleBackNav();
      assert.strictEqual(handled2, false);
      assert.equal(app.getActiveScreen(), 'dashboard');
    } finally {
      app.cleanup();
    }
  });

  test('handleBackNav returns true from "nfc" screen and navigates to dashboard', () => {
    const app = loadApp();
    try {
      app.window.eval('showScreen("nfc")');
      assert.equal(app.getActiveScreen(), 'nfc');

      const handled = app.window.handleBackNav();
      assert.strictEqual(handled, true);
      assert.equal(app.getActiveScreen(), 'dashboard');

      // Subsequent call on dashboard should return false
      const handled2 = app.window.handleBackNav();
      assert.strictEqual(handled2, false);
      assert.equal(app.getActiveScreen(), 'dashboard');
    } finally {
      app.cleanup();
    }
  });

  test('handleBackNav returns true from "active" screen and navigates to dashboard', () => {
    const app = loadApp();
    try {
      app.window.eval('showScreen("active")');
      assert.equal(app.getActiveScreen(), 'active');

      const handled = app.window.handleBackNav();
      assert.strictEqual(handled, true);
      assert.equal(app.getActiveScreen(), 'dashboard');

      // Subsequent call on dashboard should return false
      const handled2 = app.window.handleBackNav();
      assert.strictEqual(handled2, false);
      assert.equal(app.getActiveScreen(), 'dashboard');
    } finally {
      app.cleanup();
    }
  });

  test('Adversarial check: modal behavior during back navigation', () => {
    const app = loadApp();
    try {
      app.window.eval('showScreen("add")');
      app.window.eval('openSelectTagModal()');
      const modalSelect = app.get('modal-select-tag');
      assert.strictEqual(modalSelect.classList.contains('hidden'), false, 'Modal should be open');

      const handled = app.window.handleBackNav();
      assert.strictEqual(handled, true, 'handleBackNav should return true');
      assert.equal(app.getActiveScreen(), 'dashboard', 'Should return to dashboard');
      
      const modalStillVisible = !modalSelect.classList.contains('hidden');
      if (modalStillVisible) {
        console.log('    ℹ ADVERSARIAL OBSERVATION: modal-select-tag remained unhidden after back nav to dashboard.');
      }
    } finally {
      app.cleanup();
    }
  });

  test('Stress: 10 rapid back presses from non-dashboard screen', () => {
    const app = loadApp();
    try {
      app.window.eval('showScreen("add")');
      assert.equal(app.getActiveScreen(), 'add');

      const results = [];
      for (let i = 0; i < 10; i++) {
        results.push(app.window.handleBackNav());
      }

      assert.strictEqual(results[0], true, 'First press must handle back navigation');
      for (let i = 1; i < 10; i++) {
        assert.strictEqual(results[i], false, `Subsequent press #${i} on dashboard must return false`);
      }
      assert.equal(app.getActiveScreen(), 'dashboard');
    } finally {
      app.cleanup();
    }
  });

  test('Back nav updates bottom navigation tab highlighting', () => {
    const app = loadApp();
    try {
      // Go to NFC
      app.window.eval('showScreen("nfc")');
      const navNfc = app.get('nav-btn-nfc');
      const navDashboard = app.get('nav-btn-dashboard');
      assert.ok(navNfc.classList.contains('text-[#3D7055]'));

      // Press Back
      const handled = app.window.handleBackNav();
      assert.strictEqual(handled, true);
      assert.equal(app.getActiveScreen(), 'dashboard');

      // Verify dashboard nav tab is highlighted and NFC is not
      assert.ok(navDashboard.classList.contains('text-[#3D7055]'), 'Dashboard tab must be active color');
      assert.ok(!navNfc.classList.contains('text-[#3D7055]'), 'NFC tab must not be active color');
    } finally {
      app.cleanup();
    }
  });

  console.log('\n▶ Suite 4: Kotlin Native Implementation Verifications');

  test('MainActivity.kt invokes window.handleBackNav in onBackPressed / OnBackPressedCallback', () => {
    const mainKt = readMainActivityKt();
    assert.ok(
      mainKt.includes('window.handleBackNav ? window.handleBackNav() : false'),
      'MainActivity must evaluate window.handleBackNav'
    );
  });

  test('RizeNativeInterface.kt implements vibrate cases for "click", "tick", "success", "alarm_pulse"', () => {
    const kt = readRizeNativeInterfaceKt();
    assert.ok(kt.includes('"click"'), 'Must handle "click"');
    assert.ok(kt.includes('"tick"'), 'Must handle "tick"');
    assert.ok(kt.includes('"success"'), 'Must handle "success"');
    assert.ok(kt.includes('"alarm_pulse"'), 'Must handle "alarm_pulse"');
    assert.ok(kt.includes('"heavy_click"'), 'Must handle "heavy_click"');
    assert.ok(kt.includes('fun stopVibrate()'), 'Must implement stopVibrate');
  });

  console.log('\n========================================================================');
  console.log(`  RESULTS: ${passedCount} Passed, ${failedCount} Failed`);
  console.log('========================================================================\n');

  if (failedCount > 0) {
    process.exit(1);
  }
}

runEmpiricalChallenge().catch(err => {
  console.error('Fatal challenge runner error:', err);
  process.exit(1);
});
