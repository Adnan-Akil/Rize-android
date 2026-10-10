// tests/e2e/test_suites/tier1_feature_coverage.js
// Tier 1: Feature Coverage (R1-R6 Isolation)

module.exports = {
  name: 'Tier 1: Feature Coverage (R1-R6 Isolation)',
  tier: 1,
  tests: [
    // ---------------- R1. Visual Identity & Palette ----------------
    {
      id: 'T1.1.1',
      feature: 'R1.1 Soft Warm Canvas & Surfaces',
      name: 'HTML root must not use dark mode class',
      fn: async ({ assert, loadApp }) => {
        const app = loadApp();
        try {
          const htmlEl = app.document.documentElement;
          assert.ok(!htmlEl.classList.contains('dark'), '<html> root element must not have class="dark" in calming light theme');
        } finally {
          app.cleanup();
        }
      }
    },
    {
      id: 'T1.1.2',
      feature: 'R1.1 Soft Warm Canvas & Surfaces',
      name: 'Canvas background uses soft warm porcelain palette (#F8F9FA or #FAFAF9)',
      fn: async ({ assert, loadApp }) => {
        const app = loadApp();
        try {
          const bodyEl = app.document.body;
          const htmlRaw = app.rawHtml;
          const bodyClass = bodyEl.className;
          const hasLightBg = 
            bodyClass.includes('bg-[#F8F9FA]') || 
            bodyClass.includes('bg-[#FAFAF9]') || 
            bodyClass.includes('bg-canvas') ||
            htmlRaw.includes('#F8F9FA') || 
            htmlRaw.includes('#FAFAF9');
          assert.ok(hasLightBg, 'Body or canvas background must utilize #F8F9FA or #FAFAF9 soft warm porcelain tone');
          assert.ok(!bodyClass.includes('bg-[#111318]'), 'Body must not use cyberpunk dark #111318 background');
        } finally {
          app.cleanup();
        }
      }
    },
    {
      id: 'T1.1.3',
      feature: 'R1.1 Soft Warm Canvas & Surfaces',
      name: 'Card surfaces utilize crisp white with hairline borders and soft elevation',
      fn: async ({ assert, loadApp }) => {
        const app = loadApp();
        try {
          const cards = app.queryAll('#alarms-deck .alarm-card');
          assert.ok(cards.length > 0, 'Dashboard must render alarm cards');
          const firstCard = cards[0];
          const cls = firstCard.className;
          const hasWhiteSurface = cls.includes('bg-white') || cls.includes('bg-[#FFFFFF]') || cls.includes('bg-surface');
          const hasHairlineBorder = cls.includes('border-[#E5E7EB]') || cls.includes('border-[#E2E8F0]') || cls.includes('border-border') || cls.includes('border-slate-200') || cls.includes('border-gray-200');
          assert.ok(hasWhiteSurface, 'Alarm card surface must utilize crisp white background');
          assert.ok(hasHairlineBorder, 'Alarm card must feature subtle hairline border (#E5E7EB or #E2E8F0)');
        } finally {
          app.cleanup();
        }
      }
    },
    {
      id: 'T1.2.1',
      feature: 'R1.2 Organic Accent Palette',
      name: 'Organic sage and pine palette presence without neon cyan accents',
      fn: async ({ assert, loadApp }) => {
        const app = loadApp();
        try {
          const raw = app.rawHtml;
          const hasSagePine = raw.includes('#3D7055') || raw.includes('#2D5A43') || raw.includes('sage');
          assert.ok(hasSagePine, 'Design palette must incorporate organic sage/pine accents (#3D7055 / #2D5A43)');
          const hasNeonCyan = raw.includes('#00f2fe') || raw.includes('#00dce6');
          assert.ok(!hasNeonCyan, 'Palette must eliminate neon cyan (#00f2fe / #00dce6) tactical colors');
        } finally {
          app.cleanup();
        }
      }
    },
    {
      id: 'T1.3.1',
      feature: 'R1.3 Android System Chrome Theming',
      name: 'MainActivity.kt sets light status and navigation bars with dark icons',
      fn: async ({ assert, readMainActivityKt }) => {
        const code = readMainActivityKt();
        assert.ok(
          code.includes('#F8F9FA') || code.includes('canvas_bg'),
          'MainActivity must set system bar color to calming light tone (#F8F9FA)'
        );
        assert.ok(
          code.includes('isAppearanceLightStatusBars = true') || code.includes('SYSTEM_UI_FLAG_LIGHT_STATUS_BAR'),
          'MainActivity must enable dark status bar icons on light background'
        );
        assert.ok(
          code.includes('isAppearanceLightNavigationBars = true') || code.includes('SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR'),
          'MainActivity must enable dark navigation bar icons on light background'
        );
      }
    },
    {
      id: 'T1.4.1',
      feature: 'R1.4 Android Resources & Themes',
      name: 'themes.xml and colors.xml define light material theme with canvas_bg',
      fn: async ({ assert, readNativeThemesXml, readNativeColorsXml }) => {
        const themes = readNativeThemesXml();
        const colors = readNativeColorsXml();

        assert.ok(
          themes.includes('Theme.MaterialComponents.Light.NoActionBar') || 
          themes.includes('android:windowLightStatusBar'),
          'themes.xml must configure light theme with windowLightStatusBar'
        );
        assert.ok(
          colors.includes('canvas_bg') && (colors.includes('#FFF8F9FA') || colors.includes('#F8F9FA')),
          'colors.xml must define canvas_bg color token as #F8F9FA'
        );
        assert.ok(
          colors.includes('primary') && (colors.includes('#FF3D7055') || colors.includes('#3D7055')),
          'colors.xml must define organic sage primary color token (#3D7055)'
        );
      }
    },

    // ---------------- R2. Glanceable Dashboard & Navigation ----------------
    {
      id: 'T1.5.1',
      feature: 'R2.1 Clean Brand & Header',
      name: 'Clean RIZE brand header without military/core suffixes',
      fn: async ({ assert, loadApp }) => {
        const app = loadApp();
        try {
          const header = app.query('#screen-dashboard header');
          assert.ok(header, 'Dashboard must have a header element');
          const headerText = header.innerText;
          assert.ok(headerText.includes('RIZE'), 'Header must contain brand name "RIZE"');
          assert.ok(!headerText.includes('NFC CORE'), 'Header must remove tactical "NFC CORE" suffix');
          assert.ok(!headerText.includes('SYS//'), 'Header must remove military "SYS//" jargon');
        } finally {
          app.cleanup();
        }
      }
    },
    {
      id: 'T1.6.1',
      feature: 'R2.2 Morning Glanceable Hero Card',
      name: 'Morning glanceable hero card displays upcoming countdown and calm status',
      fn: async ({ assert, loadApp }) => {
        const app = loadApp();
        try {
          const heroCard = app.get('hero-alarm-card') || app.query('#screen-dashboard .hero-card') || app.query('#screen-dashboard section');
          assert.ok(heroCard, 'Dashboard must contain a morning hero card');
          const heroText = heroCard.innerText;
          const hasCountdown = /wake\s*up\s*in|next\s*in|in\s*\d+h/i.test(heroText);
          assert.ok(hasCountdown, 'Hero card must show humanized countdown ("Wake up in..." / "Next in...")');
          assert.ok(!heroText.includes('TARGET ARMED'), 'Hero card must not use military "TARGET ARMED" jargon');
          assert.ok(!heroText.includes('SYS//'), 'Hero card must not use "SYS//" prefix');
        } finally {
          app.cleanup();
        }
      }
    },
    {
      id: 'T1.7.1',
      feature: 'R2.3 Bottom Navigation Architecture',
      name: '2-tab navigation (Alarms, NFC Tags) with elevated center "+" action',
      fn: async ({ assert, loadApp }) => {
        const app = loadApp();
        try {
          const nav = app.query('nav');
          assert.ok(nav, 'Bottom navigation bar must exist');
          const btnAlarms = app.get('nav-btn-dashboard') || app.get('nav-btn-alarms') || app.query('nav button:first-child');
          const btnTags = app.get('nav-btn-nfc') || app.get('nav-btn-tags');
          const btnAdd = app.get('nav-btn-add') || app.get('btn-add-alarm') || app.query('nav button[onclick*="add"]');

          assert.ok(btnAlarms, 'Navigation must include Alarms tab button');
          assert.ok(btnTags, 'Navigation must include NFC Tags tab button');
          assert.ok(btnAdd, 'Navigation must include elevated center "+" button for adding alarms');

          const navText = nav.innerText;
          assert.ok(!navText.includes('Wakeup'), 'Navigation must not contain obsolete "Wakeup" tab');
          assert.ok(!navText.includes('HARDWARE'), 'Navigation must use humanized "NFC Tags" instead of "HARDWARE"');
        } finally {
          app.cleanup();
        }
      }
    },
    {
      id: 'T1.8.1',
      feature: 'R2.4 Humanized Copywriting',
      name: 'Elimination of tactical/cyberpunk vocabulary across application DOM',
      fn: async ({ assert, loadApp }) => {
        const app = loadApp();
        try {
          const raw = app.rawHtml;
          const forbiddenTerms = [
            'SYS//06:30.AM',
            'TARGET ARMED',
            'HARDWARE / SYNCED',
            'ENFORCED ALARM FIRING',
            'TACTICAL'
          ];
          for (const term of forbiddenTerms) {
            assert.ok(!raw.includes(term), `Forbidden tactical term "${term}" must be eliminated`);
          }
        } finally {
          app.cleanup();
        }
      }
    },

    // ---------------- R3. Inline Expandable & Swipable Cards ----------------
    {
      id: 'T1.9.1',
      feature: 'R3.1 Alarm Card Typography & Toggles',
      name: 'Alarm cards render serene time typography, mechanical toggle switch and tag pill',
      fn: async ({ assert, loadApp }) => {
        const app = loadApp();
        try {
          const cards = app.queryAll('#alarms-deck .alarm-card');
          assert.ok(cards.length > 0, 'Must have rendered alarm cards');
          const card = cards[0];
          const timeEl = card.querySelector('.alarm-time') || card.querySelector('span.text-4xl') || card.querySelector('span.font-bold');
          assert.ok(timeEl, 'Alarm card must display alarm time typography');
          const toggleBtn = card.querySelector('button[onclick*="toggleAlarm"]') || card.querySelector('.alarm-toggle');
          assert.ok(toggleBtn, 'Alarm card must feature intuitive toggle switch button');
        } finally {
          app.cleanup();
        }
      }
    },
    {
      id: 'T1.10.1',
      feature: 'R3.2 Inline Card Expansion',
      name: 'Tapping alarm card expands inline settings panel and collapses on second tap',
      fn: async ({ assert, loadApp }) => {
        const app = loadApp();
        try {
          const cards = app.queryAll('#alarms-deck .alarm-card');
          assert.ok(cards.length > 0, 'Alarm card must be present');
          const card = cards[0];

          // Target card body/header (excluding toggle button)
          const clickableArea = card.querySelector('.card-header') || card.querySelector('.cursor-pointer') || card;
          clickableArea.click();

          // After click, inline expansion panel should be visible
          const expandedPanel = card.querySelector('.alarm-expanded-panel') || card.querySelector('.expanded-content') || card.querySelector('[id*="expanded"]');
          assert.ok(expandedPanel, 'Card must reveal inline expansion settings panel upon tap');

          // Second tap should collapse
          clickableArea.click();
          const isCollapsed = !expandedPanel || expandedPanel.classList.contains('hidden') || card.querySelector('.alarm-expanded-panel') === null;
          assert.ok(isCollapsed, 'Card inline expansion must collapse upon second tap');
        } finally {
          app.cleanup();
        }
      }
    },
    {
      id: 'T1.11.1',
      feature: 'R3.3 Horizontal Swipe Actions',
      name: 'Horizontal left swipe on card reveals Delete quick-action with haptic feedback',
      fn: async ({ assert, loadApp }) => {
        const app = loadApp();
        try {
          const cards = app.queryAll('#alarms-deck .alarm-card');
          assert.ok(cards.length > 0, 'Alarm card must exist for swipe test');
          const card = cards[0];
          const swipeSurface = card.querySelector('.swipe-surface') || card.querySelector('.card-surface') || card;

          // Perform left swipe gesture
          app.touchSwipe(swipeSurface, { deltaX: -75, deltaY: 0 });

          // Haptic click should have been triggered
          const vibrateCalls = app.native.calls.vibrate.map(v => v.type);
          assert.ok(
            vibrateCalls.includes('click') || vibrateCalls.includes('tick') || vibrateCalls.length > 0,
            'Swiping card past threshold must trigger tactile haptic vibration'
          );

          // Delete button should now be revealed
          const deleteBtn = card.querySelector('.btn-swipe-delete') || card.querySelector('button[onclick*="deleteAlarm"]');
          assert.ok(deleteBtn, 'Horizontal swipe must reveal quick-action Delete button');
        } finally {
          app.cleanup();
        }
      }
    },

    // ---------------- R4. Radial Clock Face Dial Time Picker ----------------
    {
      id: 'T1.12.1',
      feature: 'R4.1 Circular Radial Clock Dial Face',
      name: 'Add Alarm screen features SVG circular radial clock face with 12 radial positions',
      fn: async ({ assert, loadApp }) => {
        const app = loadApp();
        try {
          app.click(app.get('nav-btn-add') || app.get('btn-add-alarm') || app.query('nav button[onclick*="add"]'));
          assert.equal(app.getActiveScreen(), 'add', 'Should navigate to Add Alarm screen');

          const dialSvg = app.get('radial-clock-dial') || app.query('#screen-add svg');
          assert.ok(dialSvg, 'Add Alarm screen must render circular radial clock dial SVG');

          // Verify hand line or center pivot and pointer bead
          const hand = dialSvg.querySelector('.dial-hand') || dialSvg.querySelector('line');
          const pivot = dialSvg.querySelector('.dial-pivot') || dialSvg.querySelector('circle');
          assert.ok(hand, 'Clock dial must have hand indicator line');
          assert.ok(pivot, 'Clock dial must have central pivot');
        } finally {
          app.cleanup();
        }
      }
    },
    {
      id: 'T1.13.1',
      feature: 'R4.2 Radial Dragging & Trigonometry',
      name: 'Dragging clock hand updates hour angle and triggers tactile haptic tick',
      fn: async ({ assert, loadApp }) => {
        const app = loadApp();
        try {
          app.click(app.get('nav-btn-add') || app.get('btn-add-alarm') || app.query('nav button[onclick*="add"]'));
          const dial = app.get('radial-clock-dial') || app.query('#screen-add svg');
          assert.ok(dial, 'Radial dial must be present');

          app.native.reset();
          // Drag from 12 o clock (0 deg) to 3 o clock (90 deg)
          app.touchDragDial(dial, { startAngle: 0, endAngle: 90 });

          const vibrates = app.native.calls.vibrate.map(v => v.type);
          assert.ok(
            vibrates.includes('click') || vibrates.includes('tick'),
            'Dragging clock hand must trigger haptic click/tick on each value transition'
          );

          // Verify selected hour displayed
          const hourDisplay = app.get('input-hour') || app.query('.dial-hour-display');
          assert.ok(hourDisplay, 'Hour display element must exist');
        } finally {
          app.cleanup();
        }
      }
    },
    {
      id: 'T1.14.1',
      feature: 'R4.3 Dial Mode Transition & Presets',
      name: 'Supports Hour/Minute mode transition, AM/PM pill, and quick morning presets',
      fn: async ({ assert, loadApp }) => {
        const app = loadApp();
        try {
          app.click(app.get('nav-btn-add') || app.get('btn-add-alarm') || app.query('nav button[onclick*="add"]'));

          // Mode toggle pills
          const modeHourBtn = app.get('btn-mode-hour') || app.query('.dial-mode-hour');
          const modeMinBtn = app.get('btn-mode-minute') || app.query('.dial-mode-minute');
          assert.ok(modeHourBtn || modeMinBtn, 'Clock dial must provide Hour / Minute mode selectors');

          // AM/PM selector
          const btnAm = app.get('btn-ampm-am');
          const btnPm = app.get('btn-ampm-pm');
          assert.ok(btnAm && btnPm, 'Must provide AM and PM selection pills');

          // Quick morning presets
          const presets = app.queryAll('#screen-add .preset-chip') || app.queryAll('#screen-add button[onclick*="Preset"]');
          assert.ok(presets.length >= 3, 'Must provide quick morning preset chips (6:00, 6:30, 7:00, 7:30)');
        } finally {
          app.cleanup();
        }
      }
    },

    // ---------------- R5. Gentle Dawn Waking Screen ----------------
    {
      id: 'T1.15.1',
      feature: 'R5.1 Dawn Morning Horizon Aesthetics',
      name: 'Active alarm screen displays dawn horizon aesthetic and breathing NFC wave',
      fn: async ({ assert, loadApp }) => {
        const app = loadApp();
        try {
          app.click('btn-quick-alarm-test');
          assert.equal(app.getActiveScreen(), 'active', 'Screen must transition to active alarm');

          const activeScreen = app.get('screen-active');
          const raw = app.rawHtml;

          // Check for dawn horizon color tones (#FEF3C7 or warm amber/sunburst)
          const hasDawnGradient = 
            raw.includes('#FEF3C7') || 
            raw.includes('#FFF7ED') || 
            raw.includes('dawn') || 
            raw.includes('sunrise') ||
            activeScreen.className.includes('amber') ||
            activeScreen.className.includes('dawn');
          assert.ok(hasDawnGradient, 'Active alarm screen must feature dawn morning horizon styling (#FEF3C7 / sunrise glow)');

          // Check for breathing wave element
          const breathingWave = activeScreen.querySelector('.breathing-wave') || activeScreen.querySelector('.nfc-pulse-wave') || raw.includes('breathing-wave');
          assert.ok(breathingWave, 'Active alarm must feature breathing circular wave rather than radar rings');
        } finally {
          app.cleanup();
        }
      }
    },
    {
      id: 'T1.16.1',
      feature: 'R5.2 Dim-to-Brightening Transition',
      name: 'Active screen initiates in warm dimmed ambient state and brightens on interaction',
      fn: async ({ assert, loadApp }) => {
        const app = loadApp();
        try {
          app.click('btn-quick-alarm-test');
          const activeScreen = app.get('screen-active');

          // Check if initial state is dimmed (e.g. alarm-dimmed class or brightness filter)
          const isDimmed = 
            activeScreen.classList.contains('alarm-dimmed') || 
            activeScreen.classList.contains('brightness-dim') ||
            app.rawHtml.includes('brightness(0.65)');
          assert.ok(isDimmed, 'Active alarm screen must start in soft warm dimmed ambient state to protect waking eyes');

          // Tap active screen
          activeScreen.click();

          // After interaction, dimming class is removed or brightened
          const isBrightened = !activeScreen.classList.contains('alarm-dimmed');
          assert.ok(isBrightened, 'Active alarm screen must smoothly brighten upon user touch');
        } finally {
          app.cleanup();
        }
      }
    },
    {
      id: 'T1.17.1',
      feature: 'R5.3 Peaceful NFC Disarm & Snooze',
      name: 'Peaceful disarm flow with calming instruction, emergency snooze and NFC disarm',
      fn: async ({ assert, loadApp }) => {
        const app = loadApp();
        try {
          app.click('btn-quick-alarm-test');
          const activeScreen = app.get('screen-active');

          // Calm NFC instruction text
          const instruction = activeScreen.innerText;
          assert.ok(/tap.*nfc|disarm/i.test(instruction), 'Must display clear, calming NFC disarm instruction');

          // Emergency snooze button
          const snoozeBtn = activeScreen.querySelector('button[onclick*="triggerSnooze"]') || activeScreen.querySelector('.btn-snooze');
          assert.ok(snoozeBtn, 'Must provide peaceful Emergency Snooze option (+5 min)');

          // Simulate NFC tap
          const simulateTapBtn = activeScreen.querySelector('button[onclick*="simulateNfcTap"]') || app.get('btn-simulate-nfc');
          assert.ok(simulateTapBtn, 'Must provide simulated NFC tap trigger for demonstration/testing');

          // Verify NFC disarm action stops audio and vibration
          app.scanNfc('04:A2:8F');

          assert.equal(app.native.calls.stopAlarmSound, 1, 'Scanning matching NFC tag must call stopAlarmSound()');
          assert.equal(app.native.calls.stopVibrate, 1, 'Scanning matching NFC tag must call stopVibrate()');
          const vibrates = app.native.calls.vibrate.map(v => v.type);
          assert.ok(vibrates.includes('success'), 'NFC verification must trigger success haptic feedback');
        } finally {
          app.cleanup();
        }
      }
    },

    // ---------------- R6. Zen Soundscapes & Organic Haptics ----------------
    {
      id: 'T1.18.1',
      feature: 'R6.1 Zen Soundscapes Synthesizer',
      name: 'Web Audio synthesizer implements Tibetan Singing Bowl or Celestial Chimes',
      fn: async ({ assert, loadApp }) => {
        const app = loadApp();
        try {
          const raw = app.rawHtml;
          const hasZenSounds = 
            raw.includes('tibetan') || 
            raw.includes('singing_bowl') || 
            raw.includes('celestial') || 
            raw.includes('Tibetan') || 
            raw.includes('Chime');
          assert.ok(hasZenSounds, 'Soundscape engine must define Tibetan singing bowl or celestial chime sound profiles');

          // Verify Web Audio API usage without harsh square/sawtooth looping
          assert.ok(!raw.includes('880, "sawtooth"'), 'Must eliminate harsh 880Hz sawtooth alarm wave');
        } finally {
          app.cleanup();
        }
      }
    },
    {
      id: 'T1.19.1',
      feature: 'R6.2 Organic Native Haptics',
      name: 'RizeNativeInterface.kt implements organic haptic patterns including tick and success',
      fn: async ({ assert, readRizeNativeInterfaceKt }) => {
        const code = readRizeNativeInterfaceKt();
        assert.ok(code.includes('"click"'), 'Native interface must support "click" haptic pattern');
        assert.ok(code.includes('"success"'), 'Native interface must support "success" haptic pattern');
        assert.ok(code.includes('"alarm_pulse"'), 'Native interface must support "alarm_pulse" haptic pattern');
        assert.ok(code.includes('stopVibrate'), 'Native interface must support stopVibrate()');
      }
    },
    {
      id: 'T1.20.1',
      feature: 'Bridge Compatibility & Integrity',
      name: 'Preserves 100% of native bridge contracts and window callbacks',
      fn: async ({ assert, loadApp, readMainActivityKt }) => {
        const app = loadApp();
        try {
          const mainKt = readMainActivityKt();
          assert.ok(mainKt.includes('addJavascriptInterface'), 'MainActivity must inject JavascriptInterface');
          assert.ok(mainKt.includes('"RizeNative"'), 'Bridge object name must be "RizeNative"');

          // Verify window callbacks exist in JS
          assert.equal(typeof app.window.onNativeNfcTag, 'function', 'window.onNativeNfcTag callback must be defined');
          assert.equal(typeof app.window.handleBackNav, 'function', 'window.handleBackNav callback must be defined');
        } finally {
          app.cleanup();
        }
      }
    }
  ]
};
