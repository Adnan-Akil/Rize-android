// tests/e2e/challenger_m2_verify.js
// Adversarial Challenger Verification Suite for Milestone 2

const assert = require('assert');
const {
  loadApp,
  readNativeThemesXml,
  readNativeColorsXml,
  readMainActivityKt,
  readRizeNativeInterfaceKt
} = require('./harness');

const results = [];

function test(name, fn) {
  try {
    fn();
    results.push({ name, status: 'PASS' });
    console.log(`✔ [PASS] ${name}`);
  } catch (err) {
    results.push({ name, status: 'FAIL', error: err.message, stack: err.stack });
    console.error(`✘ [FAIL] ${name}`);
    console.error(`  Error: ${err.message}`);
  }
}

console.log('========================================================================');
console.log('  CHALLENGER VERIFICATION — MILESTONE 2');
console.log('========================================================================');

// ========================================================================
// SECTION 1: JARGON, NEON & DARK THEME CHECK
// ========================================================================

test('HTML root and body must not have dark theme traces', () => {
  const app = loadApp();
  try {
    const htmlEl = app.document.documentElement;
    const bodyEl = app.document.body;
    assert.ok(!htmlEl.classList.contains('dark'), '<html> tag must not contain "dark" class');
    const bodyClass = bodyEl.className || '';
    assert.ok(!bodyClass.includes('dark:'), '<body> must not have dark: utility classes');
    assert.ok(bodyClass.includes('#F8F9FA') || bodyClass.includes('canvas'), '<body> must use calming canvas background');
  } finally {
    app.cleanup();
  }
});

test('No forbidden tactical jargon or neon hex codes anywhere in raw HTML / DOM', () => {
  const app = loadApp();
  try {
    const forbidden = [
      'SYS//',
      'SYS//06:30.AM',
      'TARGET ARMED',
      'STACK',
      'HARDWARE',
      'NFC ENFORCED',
      'NFC CORE',
      '00f2fe',
      '#00f2fe',
      'CYBERPUNK'
    ];

    const raw = app.rawHtml;
    for (const term of forbidden) {
      assert.ok(!raw.includes(term), `Forbidden term "${term}" must NOT appear in raw HTML`);
    }

    // Check visible text across all rendered screens
    const dashboard = app.get('screen-dashboard');
    assert.ok(dashboard, 'Dashboard screen must exist');
    const dashboardText = dashboard.innerText;
    for (const term of forbidden) {
      assert.ok(!dashboardText.includes(term), `Forbidden term "${term}" must NOT appear in Dashboard visible text`);
    }

    const nfcScreen = app.get('screen-nfc');
    assert.ok(nfcScreen, 'NFC screen must exist');
    const nfcText = nfcScreen.innerText;
    for (const term of forbidden) {
      assert.ok(!nfcText.includes(term), `Forbidden term "${term}" must NOT appear in NFC screen visible text`);
    }
  } finally {
    app.cleanup();
  }
});

test('Navigation shell must not have tactical jargon or neon styling', () => {
  const app = loadApp();
  try {
    const nav = app.query('nav');
    assert.ok(nav, 'Bottom navigation <nav> element must exist');
    const navText = nav.innerText;
    assert.ok(!navText.includes('HARDWARE'), 'Navigation must not mention "HARDWARE"');
    assert.ok(!navText.includes('Wakeup'), 'Navigation must not have obsolete "Wakeup" tab');
    assert.ok(!navText.includes('SYS'), 'Navigation must not contain "SYS"');

    const navClass = nav.className || '';
    assert.ok(!navClass.includes('00f2fe'), 'Navigation must not use neon cyan #00f2fe');
    assert.ok(navClass.includes('bg-white') || navClass.includes('#FFFFFF'), 'Navigation should use clean light background');
  } finally {
    app.cleanup();
  }
});

// ========================================================================
// SECTION 2: NAVIGATION SHELL SWITCHING & PLUS BUTTON
// ========================================================================

test('Initial state: Dashboard is active, other screens are hidden', () => {
  const app = loadApp();
  try {
    assert.strictEqual(app.getActiveScreen(), 'dashboard', 'Initial active screen should be dashboard');
    const btnAlarms = app.get('nav-btn-dashboard');
    const btnNfc = app.get('nav-btn-nfc');
    assert.ok(btnAlarms.classList.contains('text-[#3D7055]'), 'Alarms nav tab should have active sage color');
    assert.ok(btnNfc.classList.contains('text-[#64748B]'), 'NFC nav tab should have inactive slate color');
  } finally {
    app.cleanup();
  }
});

test('Navigation switching: Clicking NFC nav button switches to NFC screen', () => {
  const app = loadApp();
  try {
    app.click('nav-btn-nfc');
    assert.strictEqual(app.getActiveScreen(), 'nfc', 'Active screen should be nfc after clicking nav-btn-nfc');
    
    const screenDashboard = app.get('screen-dashboard');
    const screenNfc = app.get('screen-nfc');
    assert.ok(screenDashboard.classList.contains('hidden'), 'Dashboard screen must have "hidden" class');
    assert.ok(!screenNfc.classList.contains('hidden'), 'NFC screen must NOT have "hidden" class');

    const btnAlarms = app.get('nav-btn-dashboard');
    const btnNfc = app.get('nav-btn-nfc');
    assert.ok(btnNfc.classList.contains('text-[#3D7055]'), 'NFC nav tab should have active sage color');
    assert.ok(btnAlarms.classList.contains('text-[#64748B]'), 'Alarms nav tab should have inactive slate color');
  } finally {
    app.cleanup();
  }
});

test('Navigation switching: Clicking Alarms nav button from NFC screen switches back to Dashboard', () => {
  const app = loadApp();
  try {
    app.click('nav-btn-nfc');
    assert.strictEqual(app.getActiveScreen(), 'nfc');
    
    app.click('nav-btn-dashboard');
    assert.strictEqual(app.getActiveScreen(), 'dashboard', 'Active screen should be dashboard after clicking nav-btn-dashboard');

    const screenDashboard = app.get('screen-dashboard');
    const screenNfc = app.get('screen-nfc');
    assert.ok(!screenDashboard.classList.contains('hidden'), 'Dashboard screen must NOT have "hidden" class');
    assert.ok(screenNfc.classList.contains('hidden'), 'NFC screen must have "hidden" class');

    const btnAlarms = app.get('nav-btn-dashboard');
    const btnNfc = app.get('nav-btn-nfc');
    assert.ok(btnAlarms.classList.contains('text-[#3D7055]'), 'Alarms nav tab should have active sage color');
    assert.ok(btnNfc.classList.contains('text-[#64748B]'), 'NFC nav tab should have inactive slate color');
  } finally {
    app.cleanup();
  }
});

test('Navigation switching: Clicking "+" button from Dashboard transitions to Add screen', () => {
  const app = loadApp();
  try {
    app.click('nav-btn-add');
    assert.strictEqual(app.getActiveScreen(), 'add', 'Active screen should be add after clicking nav-btn-add');

    const screenAdd = app.get('screen-add');
    const screenDashboard = app.get('screen-dashboard');
    assert.ok(!screenAdd.classList.contains('hidden'), 'Add screen must NOT have "hidden" class');
    assert.ok(screenDashboard.classList.contains('hidden'), 'Dashboard screen must have "hidden" class');
  } finally {
    app.cleanup();
  }
});

test('Navigation switching: Clicking "+" button from NFC screen transitions to Add screen', () => {
  const app = loadApp();
  try {
    app.click('nav-btn-nfc');
    assert.strictEqual(app.getActiveScreen(), 'nfc');

    app.click('nav-btn-add');
    assert.strictEqual(app.getActiveScreen(), 'add', 'Active screen should be add after clicking nav-btn-add from NFC screen');

    const screenAdd = app.get('screen-add');
    const screenNfc = app.get('screen-nfc');
    assert.ok(!screenAdd.classList.contains('hidden'), 'Add screen must NOT have "hidden" class');
    assert.ok(screenNfc.classList.contains('hidden'), 'NFC screen must have "hidden" class');
  } finally {
    app.cleanup();
  }
});

test('Add screen back/cancel navigation returns to Dashboard cleanly', () => {
  const app = loadApp();
  try {
    app.click('nav-btn-add');
    assert.strictEqual(app.getActiveScreen(), 'add');

    // Simulate clicking Cancel button in Add header
    const cancelBtn = app.query('#screen-add header button');
    assert.ok(cancelBtn, 'Cancel button must exist in Add screen header');
    cancelBtn.click();
    assert.strictEqual(app.getActiveScreen(), 'dashboard', 'Clicking Cancel must return to dashboard');

    // Test with handleBackNav
    app.click('nav-btn-add');
    assert.strictEqual(app.getActiveScreen(), 'add');
    const handled = app.pressBack();
    assert.strictEqual(handled, true, 'handleBackNav should return true when on Add screen');
    assert.strictEqual(app.getActiveScreen(), 'dashboard', 'handleBackNav should return to dashboard');
  } finally {
    app.cleanup();
  }
});

test('NFC screen back navigation returns to Dashboard cleanly', () => {
  const app = loadApp();
  try {
    app.click('nav-btn-nfc');
    assert.strictEqual(app.getActiveScreen(), 'nfc');

    const backBtn = app.query('#screen-nfc header button');
    assert.ok(backBtn, 'Back button must exist in NFC screen header');
    backBtn.click();
    assert.strictEqual(app.getActiveScreen(), 'dashboard', 'Clicking Back button on NFC screen must return to dashboard');

    // Test with handleBackNav
    app.click('nav-btn-nfc');
    assert.strictEqual(app.getActiveScreen(), 'nfc');
    const handled = app.pressBack();
    assert.strictEqual(handled, true, 'handleBackNav should return true when on NFC screen');
    assert.strictEqual(app.getActiveScreen(), 'dashboard', 'handleBackNav should return to dashboard');
  } finally {
    app.cleanup();
  }
});

test('Physical back button returns false on Dashboard allowing Android activity exit', () => {
  const app = loadApp();
  try {
    assert.strictEqual(app.getActiveScreen(), 'dashboard');
    const handled = app.pressBack();
    assert.strictEqual(handled, false, 'handleBackNav should return false when on Dashboard to allow exit');
  } finally {
    app.cleanup();
  }
});

test('Stress testing rapid navigation transitions (100 transitions)', () => {
  const app = loadApp();
  try {
    const screensSequence = [
      { id: 'nav-btn-nfc', expected: 'nfc' },
      { id: 'nav-btn-dashboard', expected: 'dashboard' },
      { id: 'nav-btn-add', expected: 'add' },
      { id: 'nav-btn-dashboard', expected: 'dashboard' },
      { id: 'nav-btn-add', expected: 'add' },
      { id: 'nav-btn-nfc', expected: 'nfc' }
    ];

    for (let i = 0; i < 20; i++) {
      for (const step of screensSequence) {
        app.click(step.id);
        assert.strictEqual(app.getActiveScreen(), step.expected, `Failed transition to ${step.expected} at loop ${i}`);
      }
    }

    // Verify final state consistency
    assert.strictEqual(app.getActiveScreen(), 'nfc');
    app.click('nav-btn-dashboard');
    assert.strictEqual(app.getActiveScreen(), 'dashboard');

    // Check that deck rendered properly without crashes
    const alarmsDeck = app.get('alarms-deck');
    assert.ok(alarmsDeck, 'Alarms deck must exist after rapid navigation');
    const cards = app.queryAll('#alarms-deck .alarm-card');
    assert.ok(cards.length > 0, 'Alarms must be rendered properly after stress test');
  } finally {
    app.cleanup();
  }
});

test('Native vibration feedback triggers on navigation tab transitions', () => {
  const app = loadApp();
  try {
    const initialVibCount = app.native.calls.vibrate.length;
    app.click('nav-btn-nfc');
    assert.ok(app.native.calls.vibrate.length > initialVibCount, 'Navigation switch should trigger native vibration');
    assert.strictEqual(app.native.calls.vibrate[app.native.calls.vibrate.length - 1].type, 'click', 'Vibration pattern must be "click"');
  } finally {
    app.cleanup();
  }
});

// ========================================================================
// SECTION 3: ANDROID SYSTEM CHROME AND NATIVE INTEGRATION
// ========================================================================

test('Native MainActivity.kt sets light status/nav bar and dark icons', () => {
  const kt = readMainActivityKt();
  assert.ok(kt.includes('isAppearanceLightStatusBars = true'), 'Status bar must use dark icons');
  assert.ok(kt.includes('isAppearanceLightNavigationBars = true'), 'Navigation bar must use dark icons');
  assert.ok(kt.includes('#F8F9FA') || kt.includes('canvas'), 'System bar color should match canvas (#F8F9FA)');
});

test('Native themes.xml and colors.xml define light material theme with canvas color', () => {
  const themes = readNativeThemesXml();
  const colors = readNativeColorsXml();
  assert.ok(themes.includes('Theme.MaterialComponents.Light.NoActionBar'), 'themes.xml must use Light theme parent');
  assert.ok(colors.includes('#F8F9FA') || colors.includes('#FFF8F9FA'), 'colors.xml must define #F8F9FA canvas color');
  assert.ok(colors.includes('#3D7055') || colors.includes('#FF3D7055'), 'colors.xml must define #3D7055 sage color');
});

// ========================================================================
// SUMMARY
// ========================================================================

console.log('========================================================================');
const total = results.length;
const passed = results.filter(r => r.status === 'PASS').length;
const failed = results.filter(r => r.status === 'FAIL').length;
console.log(`TOTAL: ${total} | PASSED: ${passed} | FAILED: ${failed}`);
console.log('========================================================================');

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
