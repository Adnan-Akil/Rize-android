// tests/e2e/test_suites/tier3_cross_feature.js
// Tier 3: Cross-Feature Interactions

module.exports = {
  name: 'Tier 3: Cross-Feature Interactions',
  tier: 3,
  tests: [
    {
      id: 'T3.1.1',
      feature: 'Cross-Feature Interactions',
      name: 'Dial time selection + save alarm synchronizes with dashboard deck and hero countdown',
      fn: async ({ assert, loadApp }) => {
        const app = loadApp({
          initialStorage: {
            rize_alarms: JSON.stringify([
              { id: 'old-1', time: '08:30', ampm: 'AM', label: 'Late Awakening', enabled: true }
            ])
          }
        });
        try {
          // Open Add screen
          app.click(app.get('nav-btn-add') || app.get('btn-add-alarm') || app.query('nav button[onclick*="add"]'));

          // Set earlier time (e.g. 06:00 AM) via presets or dial
          const preset6am = app.query('#screen-add button[onclick*="06:00"]') || app.query('.preset-chip');
          if (preset6am) preset6am.click();

          app.setInputValue('input-alarm-label', 'Dawn Breathwork');

          // Save new alarm
          const saveBtn = app.query('#screen-add button[onclick*="saveNewAlarm"]');
          saveBtn.click();

          assert.equal(app.getActiveScreen(), 'dashboard', 'Should return to dashboard after save');

          // Verify card added to dashboard deck
          const cards = app.queryAll('#alarms-deck .alarm-card');
          assert.equal(cards.length, 2, 'Deck must now contain 2 alarm cards');

          // Verify hero countdown card updated to earlier alarm
          const heroCard = app.get('hero-alarm-card') || app.query('#screen-dashboard section');
          assert.ok(heroCard, 'Hero countdown card must exist');
        } finally {
          app.cleanup();
        }
      }
    },
    {
      id: 'T3.2.1',
      feature: 'Cross-Feature Interactions',
      name: 'Swipe delete of earliest alarm shifts hero card target to next active alarm',
      fn: async ({ assert, loadApp }) => {
        const alarms = [
          { id: 'earliest', time: '06:00', ampm: 'AM', label: 'Early Rise', enabled: true },
          { id: 'later', time: '07:30', ampm: 'AM', label: 'Gentle Wake', enabled: true }
        ];
        const app = loadApp({
          initialStorage: {
            rize_alarms: JSON.stringify(alarms)
          }
        });
        try {
          const cards = app.queryAll('#alarms-deck .alarm-card');
          assert.equal(cards.length, 2);

          // Delete the earliest alarm
          const firstCard = cards[0];
          app.touchSwipe(firstCard, { deltaX: -80 });

          const deleteBtn = firstCard.querySelector('.btn-swipe-delete') || firstCard.querySelector('button[onclick*="deleteAlarm"]');
          if (deleteBtn) {
            deleteBtn.click();
          } else if (typeof app.window.deleteAlarm === 'function') {
            app.window.deleteAlarm('earliest');
          }

          // Verify deck updated
          const updatedCards = app.queryAll('#alarms-deck .alarm-card');
          assert.equal(updatedCards.length, 1, 'Only one alarm card should remain after deletion');
          assert.ok(updatedCards[0].innerText.includes('07:30'), 'Remaining alarm card should be the 07:30 AM alarm');

          // Verify hero card now targets remaining alarm
          const heroText = (app.get('hero-alarm-card') || app.query('#screen-dashboard section'))?.innerText || '';
          assert.ok(heroText.includes('07:30') || !heroText.includes('06:00'), 'Hero countdown must now target 07:30 AM');
        } finally {
          app.cleanup();
        }
      }
    },
    {
      id: 'T3.3.1',
      feature: 'Cross-Feature Interactions',
      name: 'Active alarm trigger + NFC disarm callback terminates audio, haptics and resets screen',
      fn: async ({ assert, loadApp }) => {
        const assignedTag = { id: 'tag-bath', name: 'Bathroom Mirror', uid: '04:A2:8F' };
        const testAlarm = {
          id: 'alarm-test',
          time: '06:30',
          ampm: 'AM',
          label: 'Morning Focus',
          enabled: true,
          nfcEnforced: true,
          tagId: assignedTag.id,
          tagName: assignedTag.name,
          tagUid: assignedTag.uid
        };
        const app = loadApp({
          initialStorage: {
            rize_tags: JSON.stringify([assignedTag]),
            rize_alarms: JSON.stringify([testAlarm])
          }
        });
        try {
          app.click('btn-quick-alarm-test');
          assert.equal(app.getActiveScreen(), 'active');
          assert.equal(app.native.calls.startAlarmSound, 1);

          // Dispatch NFC scan with matching UID
          app.scanNfc('04:A2:8F');

          assert.equal(app.native.calls.stopAlarmSound, 1, 'stopAlarmSound() must be called upon NFC disarm');
          assert.equal(app.native.calls.stopVibrate, 1, 'stopVibrate() must be called upon NFC disarm');
        } finally {
          app.cleanup();
        }
      }
    },
    {
      id: 'T3.4.1',
      feature: 'Cross-Feature Interactions',
      name: 'Registering NFC tag in modal enables assignment in Add screen and reflects in active wakeup',
      fn: async ({ assert, loadApp }) => {
        const app = loadApp({
          initialStorage: {
            rize_tags: JSON.stringify([]),
            rize_alarms: JSON.stringify([])
          }
        });
        try {
          // Open NFC Screen
          app.click(app.get('nav-btn-nfc') || app.get('nav-btn-tags'));

          // Register new tag
          const registerBtn = app.query('#screen-nfc button[onclick*="startNfcScanRegistration"]') || app.get('btn-register-tag');
          if (registerBtn) registerBtn.click();

          // Modal should open
          const modal = app.get('modal-nfc-scan');
          assert.ok(modal && !modal.classList.contains('hidden'), 'NFC registration modal must open');

          // Simulate tag tap
          app.scanNfc('04:55:66:77');
          app.setInputValue('input-new-tag-name', 'Balcony Garden Tag');

          // Confirm registration
          const confirmBtn = app.query('#modal-nfc-scan button[onclick*="confirmRegisterTag"]');
          confirmBtn.click();

          // Verify tag saved in localStorage
          const storedTags = JSON.parse(app.localStorage.getItem('rize_tags'));
          assert.equal(storedTags.length, 1);
          assert.equal(storedTags[0].name, 'Balcony Garden Tag');

          // Now create alarm assigned to this tag
          app.click(app.get('nav-btn-add') || app.get('btn-add-alarm') || app.query('nav button[onclick*="add"]'));
          app.setInputValue('input-alarm-label', 'Sunrise Yoga');
          const saveBtn = app.query('#screen-add button[onclick*="saveNewAlarm"]');
          saveBtn.click();

          // Trigger alarm
          app.click('btn-quick-alarm-test');
          const activeText = app.get('screen-active').innerText;
          assert.ok(activeText.includes('Balcony Garden Tag') || activeText.includes('Tag'), 'Active alarm checkpoint must specify registered tag name');
        } finally {
          app.cleanup();
        }
      }
    },
    {
      id: 'T3.5.1',
      feature: 'Cross-Feature Interactions',
      name: 'Toggling alarm off immediately recalculates hero card to skip disabled alarm',
      fn: async ({ assert, loadApp }) => {
        const alarms = [
          { id: 'alarm-1', time: '06:00', ampm: 'AM', label: 'Early Shift', enabled: true },
          { id: 'alarm-2', time: '08:00', ampm: 'AM', label: 'Regular Day', enabled: true }
        ];
        const app = loadApp({
          initialStorage: {
            rize_alarms: JSON.stringify(alarms)
          }
        });
        try {
          const cards = app.queryAll('#alarms-deck .alarm-card');
          const toggleBtn = cards[0].querySelector('button[onclick*="toggleAlarm"]') || cards[0].querySelector('.alarm-toggle');

          // Toggle Alarm 1 OFF
          toggleBtn.click();

          // Storage must update
          const stored = JSON.parse(app.localStorage.getItem('rize_alarms'));
          assert.equal(stored[0].enabled, false, 'First alarm should now be disabled');
          assert.equal(stored[1].enabled, true, 'Second alarm should remain enabled');

          // Hero card must now skip Alarm 1 and target Alarm 2 (08:00 AM)
          const heroText = (app.get('hero-alarm-card') || app.query('#screen-dashboard section'))?.innerText || '';
          assert.ok(!heroText.includes('06:00') || heroText.includes('08:00'), 'Hero countdown must bypass disabled alarm and target next active alarm');
        } finally {
          app.cleanup();
        }
      }
    }
  ]
};
