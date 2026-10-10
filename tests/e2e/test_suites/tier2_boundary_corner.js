// tests/e2e/test_suites/tier2_boundary_corner.js
// Tier 2: Boundary & Corner Cases

module.exports = {
  name: 'Tier 2: Boundary & Corner Cases',
  tier: 2,
  tests: [
    {
      id: 'T2.1.1',
      feature: 'Boundary & Corner Cases',
      name: 'Empty alarms storage renders serene empty state without crashing',
      fn: async ({ assert, loadApp }) => {
        const app = loadApp({
          initialStorage: {
            rize_alarms: JSON.stringify([]),
            rize_tags: JSON.stringify([])
          }
        });
        try {
          const cardsDeck = app.get('alarms-deck');
          assert.ok(cardsDeck, 'Alarms deck element must exist');
          const cards = cardsDeck.querySelectorAll('.alarm-card');
          assert.equal(cards.length, 0, 'Deck must contain 0 cards when storage is empty');

          // Hero card must handle empty state peacefully
          const heroText = (app.get('hero-alarm-card') || app.query('#screen-dashboard section'))?.innerText || '';
          assert.ok(
            !heroText.includes('NaN') && !heroText.includes('undefined'),
            'Hero card must not display NaN or undefined when no alarms are configured'
          );
        } finally {
          app.cleanup();
        }
      }
    },
    {
      id: 'T2.1.2',
      feature: 'Boundary & Corner Cases',
      name: 'Empty NFC tags storage renders tag screen cleanly and allows alarm creation without tag',
      fn: async ({ assert, loadApp }) => {
        const app = loadApp({
          initialStorage: {
            rize_tags: JSON.stringify([])
          }
        });
        try {
          // Navigate to NFC screen
          app.click(app.get('nav-btn-nfc') || app.get('nav-btn-tags'));
          assert.equal(app.getActiveScreen(), 'nfc', 'Must navigate to NFC screen');

          const tagsDeck = app.get('nfc-tags-deck');
          assert.ok(tagsDeck, 'NFC tags deck must exist');
          const renderedTags = tagsDeck.querySelectorAll('.tag-card');
          assert.equal(renderedTags.length, 0, 'No tag cards should render on empty tag list');

          // Open Add Alarm screen with 0 tags
          app.click(app.get('nav-btn-add') || app.get('btn-add-alarm') || app.query('nav button[onclick*="add"]'));
          assert.equal(app.getActiveScreen(), 'add', 'Add screen should open even when tag list is empty');
        } finally {
          app.cleanup();
        }
      }
    },
    {
      id: 'T2.2.1',
      feature: 'Boundary & Corner Cases',
      name: 'Hour boundary 12 AM (Midnight) correctly formatted',
      fn: async ({ assert, loadApp }) => {
        const midnightAlarm = {
          id: 'alarm-midnight',
          time: '12:00',
          ampm: 'AM',
          label: 'Midnight Stargaze',
          enabled: true,
          days: [0, 1, 2, 3, 4, 5, 6],
          nfcEnforced: false,
          tagId: null,
          sound: 'Tibetan Bowl'
        };
        const app = loadApp({
          initialStorage: {
            rize_alarms: JSON.stringify([midnightAlarm])
          }
        });
        try {
          const cards = app.queryAll('#alarms-deck .alarm-card');
          assert.equal(cards.length, 1, 'Must render midnight alarm card');
          const cardText = cards[0].innerText;
          assert.ok(cardText.includes('12:00') && cardText.includes('AM'), 'Must display 12:00 AM accurately');
        } finally {
          app.cleanup();
        }
      }
    },
    {
      id: 'T2.2.2',
      feature: 'Boundary & Corner Cases',
      name: 'Hour boundary 12 PM (Noon) correctly formatted',
      fn: async ({ assert, loadApp }) => {
        const noonAlarm = {
          id: 'alarm-noon',
          time: '12:00',
          ampm: 'PM',
          label: 'Midday Meditation',
          enabled: true,
          days: [0, 1, 2, 3, 4, 5, 6],
          nfcEnforced: false,
          tagId: null,
          sound: 'Tibetan Bowl'
        };
        const app = loadApp({
          initialStorage: {
            rize_alarms: JSON.stringify([noonAlarm])
          }
        });
        try {
          const cards = app.queryAll('#alarms-deck .alarm-card');
          assert.equal(cards.length, 1, 'Must render noon alarm card');
          const cardText = cards[0].innerText;
          assert.ok(cardText.includes('12:00') && cardText.includes('PM'), 'Must display 12:00 PM accurately');
        } finally {
          app.cleanup();
        }
      }
    },
    {
      id: 'T2.3.1',
      feature: 'Boundary & Corner Cases',
      name: 'Minute boundary values (00, 05, 55) render with two-digit padding',
      fn: async ({ assert, loadApp }) => {
        const paddedAlarms = [
          { id: 'a1', time: '06:00', ampm: 'AM', label: 'Early Light', enabled: true },
          { id: 'a2', time: '06:05', ampm: 'AM', label: 'Gentle Pulse', enabled: true },
          { id: 'a3', time: '06:55', ampm: 'AM', label: 'Daybreak', enabled: true }
        ];
        const app = loadApp({
          initialStorage: {
            rize_alarms: JSON.stringify(paddedAlarms)
          }
        });
        try {
          const cards = app.queryAll('#alarms-deck .alarm-card');
          assert.equal(cards.length, 3, 'Must render all 3 boundary minute alarms');
          assert.ok(cards[0].innerText.includes('06:00'), 'Time 06:00 must have padded minutes');
          assert.ok(cards[1].innerText.includes('06:05'), 'Time 06:05 must have padded minutes');
          assert.ok(cards[2].innerText.includes('06:55'), 'Time 06:55 must have padded minutes');
        } finally {
          app.cleanup();
        }
      }
    },
    {
      id: 'T2.4.1',
      feature: 'Boundary & Corner Cases',
      name: 'Rapid toggling stress maintains memory and localStorage synchronization',
      fn: async ({ assert, loadApp }) => {
        const testAlarm = { id: 'toggle-test', time: '07:00', ampm: 'AM', label: 'Toggle Test', enabled: true };
        const app = loadApp({
          initialStorage: {
            rize_alarms: JSON.stringify([testAlarm])
          }
        });
        try {
          const getToggleBtn = () => app.query('#alarms-deck .alarm-card button[onclick*="toggleAlarm"]') || app.query('.alarm-toggle');

          // Rapidly toggle 5 times
          for (let i = 0; i < 5; i++) {
            getToggleBtn().click();
          }

          // Expected: started true, after 5 toggles -> false
          const stored = JSON.parse(app.localStorage.getItem('rize_alarms'));
          assert.equal(stored[0].enabled, false, 'After 5 rapid toggles, alarm should be disabled');
          assert.equal(app.native.calls.vibrate.length, 5, 'Every toggle action must trigger tactile haptic vibration');
        } finally {
          app.cleanup();
        }
      }
    },
    {
      id: 'T2.5.1',
      feature: 'Boundary & Corner Cases',
      name: 'Orphaned tagId or missing NFC tag handles gracefully without null reference exception',
      fn: async ({ assert, loadApp }) => {
        const orphanAlarm = {
          id: 'alarm-orphan',
          time: '08:00',
          ampm: 'AM',
          label: 'Orphan Tag Alarm',
          enabled: true,
          nfcEnforced: true,
          tagId: 'non-existent-tag-999',
          tagName: 'Missing Tag'
        };
        const app = loadApp({
          initialStorage: {
            rize_alarms: JSON.stringify([orphanAlarm]),
            rize_tags: JSON.stringify([])
          }
        });
        try {
          const cards = app.queryAll('#alarms-deck .alarm-card');
          assert.equal(cards.length, 1, 'Orphaned tag alarm card must render without crashing');

          // Trigger wakeup
          app.click('btn-quick-alarm-test');
          assert.equal(app.getActiveScreen(), 'active', 'Active alarm screen must engage normally');
        } finally {
          app.cleanup();
        }
      }
    },
    {
      id: 'T2.6.1',
      feature: 'Boundary & Corner Cases',
      name: 'Suspended AudioContext state is handled properly and resumed on user interaction',
      fn: async ({ assert, loadApp }) => {
        const app = loadApp({ audioContextSuspended: true });
        try {
          app.click('btn-quick-alarm-test');
          // Verify audio contexts created and resumed
          const ctx = app.audioContexts[0];
          assert.ok(ctx, 'AudioContext should have been instantiated for alarm tone');
          assert.equal(ctx.state, 'running', 'AudioContext must be resumed upon alarm trigger');
        } finally {
          app.cleanup();
        }
      }
    },
    {
      id: 'T2.7.1',
      feature: 'Boundary & Corner Cases',
      name: 'Physical back button (window.handleBackNav) returns to dashboard from Add screen',
      fn: async ({ assert, loadApp }) => {
        const app = loadApp();
        try {
          app.click(app.get('nav-btn-add') || app.get('btn-add-alarm') || app.query('nav button[onclick*="add"]'));
          assert.equal(app.getActiveScreen(), 'add');

          const handled = app.pressBack();
          assert.equal(handled, true, 'handleBackNav() must return true when navigating back from Add screen');
          assert.equal(app.getActiveScreen(), 'dashboard', 'Screen must return to dashboard');
        } finally {
          app.cleanup();
        }
      }
    },
    {
      id: 'T2.7.2',
      feature: 'Boundary & Corner Cases',
      name: 'Physical back button (window.handleBackNav) returns false on dashboard to permit activity exit',
      fn: async ({ assert, loadApp }) => {
        const app = loadApp();
        try {
          assert.equal(app.getActiveScreen(), 'dashboard');
          const handled = app.pressBack();
          assert.equal(handled, false, 'handleBackNav() must return false on dashboard so Android can handle activity back');
        } finally {
          app.cleanup();
        }
      }
    },
    {
      id: 'T2.8.1',
      feature: 'Boundary & Corner Cases',
      name: 'Empty alarm label input provides peaceful default fallback name',
      fn: async ({ assert, loadApp }) => {
        const app = loadApp();
        try {
          app.click(app.get('nav-btn-add') || app.get('btn-add-alarm') || app.query('nav button[onclick*="add"]'));
          app.setInputValue('input-alarm-label', '');

          const saveBtn = app.query('#screen-add button[onclick*="saveNewAlarm"]');
          saveBtn.click();

          const stored = JSON.parse(app.localStorage.getItem('rize_alarms'));
          assert.ok(stored.length > 0, 'New alarm must be saved');
          const savedLabel = stored[0].label;
          assert.ok(savedLabel && savedLabel.length > 0, 'Alarm saved with empty label must have pleasant default name');
        } finally {
          app.cleanup();
        }
      }
    },
    {
      id: 'T2.9.1',
      feature: 'Boundary & Corner Cases',
      name: 'NFC tag UID scan matching is case-insensitive',
      fn: async ({ assert, loadApp }) => {
        const tagWithUpper = { id: 't1', name: 'Desk Checkpoint', uid: '04:A2:8F' };
        const alarmWithTag = { id: 'a1', time: '06:30', ampm: 'AM', label: 'Focus', enabled: true, nfcEnforced: true, tagUid: '04:A2:8F', tagName: 'Desk Checkpoint' };
        const app = loadApp({
          initialStorage: {
            rize_tags: JSON.stringify([tagWithUpper]),
            rize_alarms: JSON.stringify([alarmWithTag])
          }
        });
        try {
          app.click('btn-quick-alarm-test');
          assert.equal(app.getActiveScreen(), 'active');

          // Scan with lowercase UID
          app.scanNfc('04:a2:8f');

          assert.equal(app.native.calls.stopAlarmSound, 1, 'Scanning lowercase UID should successfully match and disarm alarm');
        } finally {
          app.cleanup();
        }
      }
    },
    {
      id: 'T2.10.1',
      feature: 'Boundary & Corner Cases',
      name: 'Large alarm deck (15 alarms) renders smoothly without DOM errors',
      fn: async ({ assert, loadApp }) => {
        const manyAlarms = Array.from({ length: 15 }, (_, i) => ({
          id: `alarm-${i}`,
          time: `0${Math.floor(i / 2) + 6}:${(i % 2) * 30 || '00'}`,
          ampm: 'AM',
          label: `Routine #${i + 1}`,
          enabled: i % 2 === 0
        }));
        const app = loadApp({
          initialStorage: {
            rize_alarms: JSON.stringify(manyAlarms)
          }
        });
        try {
          const cards = app.queryAll('#alarms-deck .alarm-card');
          assert.equal(cards.length, 15, 'All 15 alarm cards must render in dashboard deck');
        } finally {
          app.cleanup();
        }
      }
    }
  ]
};
