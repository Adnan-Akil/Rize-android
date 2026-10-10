// independent_audit_test.js
// Independent Victory Verification Suite for RIZE UI & R4 Radial Clock Dial Time Picker
const path = require('path');
const assert = require('assert');
const { loadApp, readMainActivityKt, readRizeNativeInterfaceKt, readNativeThemesXml, readNativeColorsXml } = require('../../../tests/e2e/harness');

async function runIndependentAudit() {
  console.log('='.repeat(70));
  console.log('  INDEPENDENT VICTORY AUDITOR VERIFICATION SUITE');
  console.log('='.repeat(70));

  let passed = 0;
  let total = 0;

  function test(name, fn) {
    total++;
    try {
      fn();
      console.log(`  ✔ [PASS] ${name}`);
      passed++;
    } catch (e) {
      console.log(`  ✘ [FAIL] ${name}: ${e.message}`);
      throw e;
    }
  }

  // 1. Android Chrome & Resources Audit
  test('Native: MainActivity configures light status bar and navigation bar', () => {
    const mainKt = readMainActivityKt();
    assert.ok(mainKt.includes('isAppearanceLightStatusBars = true'), 'Must enable light status bar icons');
    assert.ok(mainKt.includes('isAppearanceLightNavigationBars = true'), 'Must enable light navigation bar icons');
    assert.ok(mainKt.includes('#F8F9FA'), 'Must set status and nav bar background to #F8F9FA');
  });

  test('Native: RizeNativeInterface implements tick haptic pattern', () => {
    const nativeKt = readRizeNativeInterfaceKt();
    assert.ok(nativeKt.includes('"tick" ->'), 'Must implement tick vibration pattern');
    assert.ok(nativeKt.includes('setSystemBarTheme'), 'Must expose setSystemBarTheme');
  });

  test('Native: themes.xml and colors.xml define light palette tokens', () => {
    const themes = readNativeThemesXml();
    const colors = readNativeColorsXml();
    assert.ok(themes.includes('Theme.MaterialComponents.Light.NoActionBar'), 'Must use Light Material theme');
    assert.ok(themes.includes('@color/canvas_bg'), 'Must use canvas_bg');
    assert.ok(colors.includes('name="canvas_bg">#FFF8F9FA<') || colors.includes('#FFF8F9FA'), 'Must define canvas_bg as #FFF8F9FA');
    assert.ok(colors.includes('name="primary">#FF3D7055<') || colors.includes('#FF3D7055'), 'Must define primary as sage #3D7055');
  });

  // 2. DOM & Vocabulary Audit
  const app = loadApp();
  try {
    test('DOM: No military/cyberpunk jargon in rendered application', () => {
      const html = app.window.document.body.innerHTML;
      const forbidden = ['SYS//', 'TARGET ARMED', 'NFC ENFORCED', 'CYBERPUNK', 'NEON'];
      for (const word of forbidden) {
        assert.ok(!html.includes(word), `DOM must not contain forbidden tactical jargon: ${word}`);
      }
    });

    test('DOM: Header contains clean brand "RIZE"', () => {
      const header = app.query('header') || app.query('#screen-dashboard');
      assert.ok(header, 'Header must exist');
      assert.ok(header.innerText.includes('RIZE'), 'Header must contain brand RIZE');
    });

    // 3. R4 Radial Clock Dial Face Audit
    test('R4: Dial navigation and initial structure', () => {
      app.click(app.get('nav-btn-add') || app.query('#screen-dashboard button[onclick*="add"]'));
      assert.equal(app.getActiveScreen(), 'add');

      const dial = app.get('radial-clock-dial');
      assert.ok(dial, 'SVG radial clock dial must exist');

      const hand = app.get('dial-hand-line');
      const bead = app.get('dial-pointer-bead');
      const numbersGroup = app.get('dial-numbers-group');

      assert.ok(hand, 'Hand line must exist');
      assert.ok(bead, 'Pointer tip bead must exist');
      assert.ok(numbersGroup, 'Numbers group must exist');
    });

    test('R4: Dial hour angle resolution and haptic ticks', () => {
      const dial = app.get('radial-clock-dial');
      app.native.reset();

      // Drag from 12 o clock (0 deg) to 3 o clock (90 deg)
      app.touchDragDial(dial, { startAngle: 0, endAngle: 90 });

      const hourDisplay = app.get('input-hour');
      assert.equal(hourDisplay.innerText, '03', 'Hour display must resolve to 03');

      const tickCalls = app.native.calls.vibrate.filter(v => v.type === 'tick' || v.type === 'click');
      assert.ok(tickCalls.length > 0, 'Dragging clock hand must trigger tick haptics');
    });

    test('R4: Dial minute mode transition and angle resolution', () => {
      app.click('btn-mode-minute');

      const hourBtn = app.get('btn-mode-hour');
      const minBtn = app.get('btn-mode-minute');
      assert.ok(minBtn.className.includes('bg-[#3D7055]'), 'Minute button must be active');
      assert.ok(hourBtn.className.includes('text-[#64748B]'), 'Hour button must be inactive');

      const dial = app.get('radial-clock-dial');
      // Drag to 6 o clock (180 deg) -> 30 minutes
      app.touchDragDial(dial, { startAngle: 0, endAngle: 180 });

      const minDisplay = app.get('input-minute');
      assert.equal(minDisplay.innerText, '30', 'Minute display must resolve to 30');
    });

    test('R4: Morning presets correctly set time and update dial', () => {
      app.click('btn-mode-hour');
      const presets = app.queryAll('#screen-add .preset-chip');
      assert.ok(presets.length >= 4, 'Must have at least 4 morning presets');

      // Click 06:30 preset
      const p630 = presets.find(p => p.innerText.includes('06:30'));
      assert.ok(p630, '06:30 preset chip must exist');
      p630.click();

      const hourDisplay = app.get('input-hour');
      const minDisplay = app.get('input-minute');
      assert.equal(hourDisplay.innerText, '06', 'Preset 06:30 sets hour to 06');
      assert.equal(minDisplay.innerText, '30', 'Preset 06:30 sets minute to 30');
    });

    test('R4: AM/PM selector toggles state correctly', () => {
      const btnPm = app.get('btn-ampm-pm');
      btnPm.click();
      assert.ok(btnPm.className.includes('bg-[#3D7055]'), 'PM button must be active');

      const btnAm = app.get('btn-ampm-am');
      btnAm.click();
      assert.ok(btnAm.className.includes('bg-[#3D7055]'), 'AM button must be active');
    });

    // 4. Alarm Card & Active Sequence Integration
    test('Integration: Alarm save, dashboard countdown, and trigger disarm', () => {
      app.setInputValue('input-alarm-label', 'Dawn Meditation');
      const saveBtn = app.query('#screen-add button[onclick*="saveNewAlarm"]');
      saveBtn.click();
      assert.equal(app.getActiveScreen(), 'dashboard');

      // Verify card in deck
      const cards = app.queryAll('#alarms-deck .alarm-card');
      assert.ok(cards.length > 0, 'Alarms deck must display created card');

      // Test trigger active alarm
      app.click('btn-quick-alarm-test');
      assert.equal(app.getActiveScreen(), 'active');
      assert.ok(app.native.calls.startAlarmSound >= 1, 'startAlarmSound must be called');

      // Simulate NFC disarm
      app.scanNfc('04:A2:8F');
      assert.ok(app.native.calls.stopAlarmSound >= 1, 'stopAlarmSound must be called on disarm');
    });

  } finally {
    app.cleanup();
  }

  console.log('='.repeat(70));
  console.log(`  INDEPENDENT AUDIT RESULT: ${passed}/${total} PASSED (100%)`);
  console.log('='.repeat(70));
}

runIndependentAudit().catch(err => {
  console.error('Independent Audit Failed:', err);
  process.exit(1);
});
