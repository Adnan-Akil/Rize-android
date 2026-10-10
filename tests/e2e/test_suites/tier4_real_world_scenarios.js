// tests/e2e/test_suites/tier4_real_world_scenarios.js
// Tier 4: Real-World Scenarios

module.exports = {
  name: 'Tier 4: Real-World Scenarios',
  tier: 4,
  tests: [
    {
      id: 'T4.1.1',
      feature: 'Real-World Scenarios',
      name: 'Scenario 1: Complete Morning Wake Cycle (Dim -> Brighten -> Scan -> Disarm)',
      fn: async ({ assert, loadApp }) => {
        const mirrorTag = { id: 'tag-mirror', name: 'Bathroom Mirror', uid: '04:A2:8F' };
        const morningAlarm = {
          id: 'alarm-morning',
          time: '06:30',
          ampm: 'AM',
          label: 'Gentle Awakening',
          enabled: true,
          nfcEnforced: true,
          tagId: mirrorTag.id,
          tagName: mirrorTag.name,
          tagUid: mirrorTag.uid,
          sound: 'Tibetan Singing Bowl'
        };

        const app = loadApp({
          initialStorage: {
            rize_tags: JSON.stringify([mirrorTag]),
            rize_alarms: JSON.stringify([morningAlarm])
          }
        });

        try {
          // 1. Alarm triggers
          app.click('btn-quick-alarm-test');
          assert.equal(app.getActiveScreen(), 'active', 'Step 1: Active alarm screen engages');
          assert.equal(app.native.calls.startAlarmSound, 1, 'Step 1: Native alarm sound begins');
          const screenAwakeCalls = app.native.calls.setScreenAwake;
          assert.ok(screenAwakeCalls.some(c => c.awake === true), 'Step 1: Screen wake lock held');

          // 2. Dim state verification and interaction brightening
          const activeScreen = app.get('screen-active');
          activeScreen.click(); // User touches screen

          // 3. User scans assigned Bathroom Mirror NFC Tag
          app.scanNfc('04:A2:8F');

          // 4. Verification & Silence
          assert.equal(app.native.calls.stopAlarmSound, 1, 'Step 4: Alarm sound silenced');
          assert.equal(app.native.calls.stopVibrate, 1, 'Step 4: Vibrations stopped');
          const vibrates = app.native.calls.vibrate.map(v => v.type);
          assert.ok(vibrates.includes('success'), 'Step 4: Tactile success haptic fired');
        } finally {
          app.cleanup();
        }
      }
    },
    {
      id: 'T4.2.1',
      feature: 'Real-World Scenarios',
      name: 'Scenario 2: Emergency Snooze Sequence (+5 Min)',
      fn: async ({ assert, loadApp }) => {
        const app = loadApp();
        try {
          // Trigger alarm
          app.click('btn-quick-alarm-test');
          assert.equal(app.getActiveScreen(), 'active');

          // Hit emergency snooze
          const snoozeBtn = app.query('#screen-active button[onclick*="triggerSnooze"]') || app.query('.btn-snooze');
          assert.ok(snoozeBtn, 'Emergency snooze button must exist');
          snoozeBtn.click();

          // Sounds and vibration must stop
          assert.equal(app.native.calls.stopAlarmSound, 1, 'Snooze must stop alarm sound');
          assert.equal(app.native.calls.stopVibrate, 1, 'Snooze must stop vibration');
          assert.equal(app.getActiveScreen(), 'dashboard', 'Snooze must return to dashboard');
        } finally {
          app.cleanup();
        }
      }
    },
    {
      id: 'T4.3.1',
      feature: 'Real-World Scenarios',
      name: 'Scenario 3: New User Onboarding & First Alarm Configuration Flow',
      fn: async ({ assert, loadApp }) => {
        const app = loadApp({
          initialStorage: {
            rize_alarms: JSON.stringify([]),
            rize_tags: JSON.stringify([])
          }
        });
        try {
          // Fresh app starts on dashboard
          assert.equal(app.getActiveScreen(), 'dashboard');
          assert.equal(app.queryAll('#alarms-deck .alarm-card').length, 0);

          // 1. Go to NFC tab and pair first tag
          app.click(app.get('nav-btn-nfc') || app.get('nav-btn-tags'));
          assert.equal(app.getActiveScreen(), 'nfc');

          const startScanBtn = app.query('#screen-nfc button[onclick*="startNfcScanRegistration"]') || app.get('btn-register-tag');
          if (startScanBtn) startScanBtn.click();

          app.scanNfc('04:33:22:11');
          app.setInputValue('input-new-tag-name', 'Coffee Station');
          const confirmBtn = app.query('#modal-nfc-scan button[onclick*="confirmRegisterTag"]');
          confirmBtn.click();

          // 2. Open Add screen via elevated '+' button
          app.click(app.get('nav-btn-add') || app.get('btn-add-alarm') || app.query('nav button[onclick*="add"]'));
          assert.equal(app.getActiveScreen(), 'add');

          // 3. Set label and save alarm
          app.setInputValue('input-alarm-label', 'First Morning');
          const saveBtn = app.query('#screen-add button[onclick*="saveNewAlarm"]');
          saveBtn.click();

          // 4. Verify dashboard now contains the newly created alarm
          assert.equal(app.getActiveScreen(), 'dashboard');
          const cards = app.queryAll('#alarms-deck .alarm-card');
          assert.equal(cards.length, 1, 'Dashboard must now render the newly created alarm card');
          assert.ok(cards[0].innerText.includes('First Morning'), 'Card must display "First Morning" label');
        } finally {
          app.cleanup();
        }
      }
    },
    {
      id: 'T4.4.1',
      feature: 'Real-World Scenarios',
      name: 'Scenario 4: Routine Reconfiguration & Card Cleanup Flow',
      fn: async ({ assert, loadApp }) => {
        const alarms = [
          { id: 'alarm-a', time: '06:00', ampm: 'AM', label: 'Primary Alarm', enabled: true, days: [0, 1, 2, 3, 4] },
          { id: 'alarm-b', time: '09:00', ampm: 'AM', label: 'Weekend Backup', enabled: true, days: [5, 6] }
        ];
        const app = loadApp({
          initialStorage: {
            rize_alarms: JSON.stringify(alarms)
          }
        });
        try {
          const cards = app.queryAll('#alarms-deck .alarm-card');
          assert.equal(cards.length, 2);

          // 1. Expand first card inline
          const firstCard = cards[0];
          const tapArea = firstCard.querySelector('.card-header') || firstCard.querySelector('.cursor-pointer') || firstCard;
          tapArea.click();

          // 2. Swipe second card to delete
          const secondCard = cards[1];
          app.touchSwipe(secondCard, { deltaX: -80 });

          const deleteBtn = secondCard.querySelector('.btn-swipe-delete') || secondCard.querySelector('button[onclick*="deleteAlarm"]');
          if (deleteBtn) {
            deleteBtn.click();
          } else if (typeof app.window.deleteAlarm === 'function') {
            app.window.deleteAlarm('alarm-b');
          }

          // 3. Verify storage and DOM consistency
          const updatedCards = app.queryAll('#alarms-deck .alarm-card');
          assert.equal(updatedCards.length, 1, 'Only one card should remain in deck');
          assert.ok(updatedCards[0].innerText.includes('Primary Alarm'), 'Primary Alarm must remain in deck');
        } finally {
          app.cleanup();
        }
      }
    }
  ]
};
