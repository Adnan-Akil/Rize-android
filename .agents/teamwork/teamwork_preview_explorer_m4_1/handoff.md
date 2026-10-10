# Handoff Report: Milestone 4 (R4 Radial Clock Face Dial Time Picker)

## 1. Observation

### Current E2E Test Execution Status
Running `node tests/e2e/runner.js` produces:
```
========================================================================
  RIZE REVAMP — E2E TEST RUNNER
  Mode: 4-Tier Opaque-Box Verification
  Target: C:\Users\husai\Downloads\Rize\app\src\main\assets\index.html
========================================================================
  Total Tests:    44
  Passed:         41
  Failed:         3
  Total Duration: 291ms

  Failure Audit:
  1. [T1.13.1] Dragging clock hand updates hour angle and triggers tactile haptic tick
     Feature: R4.2 Radial Dragging & Trigonometry (Tier 1)
     Detail: Dragging clock hand must trigger haptic click/tick on each value transition

  2. [T2.6.1] Suspended AudioContext state is handled properly and resumed on user interaction
     Feature: Boundary & Corner Cases (Tier 2)
     Detail: AudioContext should have been instantiated for alarm tone

  3. [T3.4.1] Registering NFC tag in modal enables assignment in Add screen and reflects in active wakeup
     Feature: Cross-Feature Interactions (Tier 3)
     Detail: Cannot read properties of undefined (reading 'time')
========================================================================
```

### Exact Test Suite Selectors & Invariants for Milestone 4 (R4)
Inspecting `tests/e2e/harness.js` and `tests/e2e/test_suites/tier1_feature_coverage.js`:
1. **Screen Switch to Add Screen**:
   - Trigger: `app.click(app.get('nav-btn-add') || app.get('btn-add-alarm') || app.query('nav button[onclick*="add"]'))`
   - Target container: `#screen-add` (class `hidden` must be removed when navigated to).
   - In `index.html`: Line 218 `<div id="screen-add" class="screen-view hidden flex-col min-h-screen">`
2. **Radial Clock Dial SVG (`T1.12.1`)**:
   - Selector: `app.get('radial-clock-dial') || app.query('#screen-add svg')`
   - Hand Line: `dialSvg.querySelector('.dial-hand') || dialSvg.querySelector('line')`
   - Pivot Circle: `dialSvg.querySelector('.dial-pivot') || dialSvg.querySelector('circle')`
   - In `index.html`: Line 258 `<svg id="radial-clock-dial" ... viewBox="0 0 240 240">`, Line 263 `<circle class="dial-pivot" ...>`, Line 265 `<line class="dial-hand" id="dial-hand-line" ...>`, Line 267 `<circle id="dial-pointer-bead" ...>`
3. **Dial Dragging & Trigonometry (`T1.13.1`)**:
   - Method: `app.touchDragDial(dial, { startAngle: 0, endAngle: 90 })` in `tests/e2e/harness.js` lines 409-448.
   - Mock Rect: `el.setBoundingClientRect({ left: 20, top: 20, width: 240, height: 240, right: 260, bottom: 260 })`
   - Center coordinates: `cx = 120`, `cy = 120`. Radius: `r = 100`.
   - Events dispatched directly to `dial` element:
     - `pointerdown`: `clientX = 20 + 120 = 140`, `clientY = 20 + 20 = 40` (at 0 deg / 12 o'clock)
     - `pointermove`: `clientX = 20 + 220 = 240`, `clientY = 20 + 120 = 140` (at 90 deg / 3 o'clock)
     - `pointerup`: `clientX = 20 + 220 = 240`, `clientY = 20 + 120 = 140`
   - Haptic expectation: `app.native.calls.vibrate.map(v => v.type)` must include `'click'` or `'tick'` during value transition.
   - Display expectation: `app.get('input-hour') || app.query('.dial-hour-display')` must exist.
4. **Dial Mode & Presets (`T1.14.1`)**:
   - Mode selectors: `app.get('btn-mode-hour') || app.query('.dial-mode-hour')` and `app.get('btn-mode-minute') || app.query('.dial-mode-minute')`.
   - AM/PM toggle: `app.get('btn-ampm-am')` and `app.get('btn-ampm-pm')`.
   - Preset chips: `app.queryAll('#screen-add .preset-chip') || app.queryAll('#screen-add button[onclick*="Preset"]')` (length >= 3).
5. **No Event Bubbling in Simulated DOM**:
   - Inspecting `tests/e2e/dom_sim.js` lines 241-249: `dispatchEvent` only executes listeners registered on `this` (`el`). It does NOT bubble up to `document` or `window`! Therefore, pointer event listeners (`pointerdown`, `pointermove`, `pointerup`) MUST be attached directly to `#radial-clock-dial`.

### Current State of `app/src/main/assets/index.html`
1. **DOM Markup (Lines 218–294)**:
   - Contains `#screen-add`, `#btn-mode-hour`, `#btn-mode-minute`, `#input-hour`, `#input-minute`, `#btn-ampm-am`, `#btn-ampm-pm`.
   - Contains SVG `#radial-clock-dial` (`viewBox="0 0 240 240"`), with `#dial-hand-line`, `#dial-pointer-bead`, and `<g id="dial-numbers-group">` having 12 static text elements (12, 1, 2, ..., 11).
   - Contains 5 preset buttons (`.preset-chip`): 06:00, 06:30, 07:00, 07:30, 08:00.
2. **Missing JavaScript (Lines 612–1650)**:
   - `setDialMode(mode)` is completely undefined in JavaScript (lines 237–238 call `onclick="setDialMode('hour')"` but the function does not exist).
   - Zero event listeners are attached to `#radial-clock-dial`.
   - Hand trigonometry tracking (`atan2`) is absent.
   - Haptic feedback on dial value transition is absent.
   - `renderDialNumbers(mode)` to switch numbers between Hours (1–12) and Minutes (00–55) does not exist.
   - `setTimePreset` does not update the SVG hand or pointer bead.

---

## 2. Logic Chain

1. **Root Cause of T1.13.1 Failure**:
   - `touchDragDial` dispatches `pointerdown` (at 0 deg), `pointermove` (at 90 deg), and `pointerup` on `dial`.
   - Because `#radial-clock-dial` has no pointer event listeners, no code executes.
   - As a result, `app.native.calls.vibrate` remains empty (no `'tick'` or `'click'` called), failing the assertion on line 334 of `tier1_feature_coverage.js`.
2. **Trigonometry Mapping**:
   - Center is $(120, 120)$.
   - From `clientX`, `clientY`:
     - $dx = \text{svgX} - 120$
     - $dy = \text{svgY} - 120$
   - Radial angle from 12 o'clock:
     - $\theta_{\text{deg}} = \left(\text{atan2}(dy, dx) \times \frac{180}{\pi} + 90\right) \pmod{360}$
     - If $\theta_{\text{deg}} < 0$, $\theta_{\text{deg}} \gets \theta_{\text{deg}} + 360$.
   - **Hour Mode**:
     - $\text{hour} = \text{round}(\theta_{\text{deg}} / 30)$. If $0$, $\text{hour} = 12$.
     - Snapped angle: $(\text{hour} \pmod{12}) \times 30^\circ$.
     - Value transition triggers `Native.vibrate('tick')`.
   - **Minute Mode**:
     - $\text{minute} = (\text{round}(\theta_{\text{deg}} / 30) \times 5) \pmod{60}$.
     - Snapped angle: $(\text{minute} / 5) \times 30^\circ$.
     - Value transition triggers `Native.vibrate('tick')`.
   - **Hand and Bead Coordinates** (radius $r = 78$ to $80$):
     - $\text{rad} = (\text{angle} - 90) \times \frac{\pi}{180}$
     - $x_2 = 120 + r \times \cos(\text{rad})$
     - $y_2 = 120 + r \times \sin(\text{rad})$
     - Set `#dial-hand-line` attributes: `x1="120"`, `y1="120"`, `x2`, `y2`.
     - Set `#dial-pointer-bead` attributes: `cx`, `cy`.
3. **Auto-Advance Requirement**:
   - PROJECT.md Milestone 4 specifies: "Hour/Minute mode auto-advance".
   - When the user lifts the pointer (`pointerup`) in Hour mode, transition to Minute mode via `setTimeout(() => setDialMode('minute'), 250)`.
4. **Resolution of Ancillary Test Failures (T2.6.1 & T3.4.1)**:
   - **T2.6.1**: `startActiveWakeupSequence()` places `playTibetanBowlTone()` inside `setInterval(..., 2000)` instead of calling it immediately upon triggering. Calling `playTibetanBowlTone()` immediately synchronously instantiates `audioCtx` and calls `resume()`, satisfying `app.audioContexts[0].state === 'running'`.
   - **T3.4.1**: When storage begins with empty alarms (`rize_alarms: []`), `firingAlarm` is initially `undefined`. `saveNewAlarm()` creates an alarm but does not update `firingAlarm = newAlarm`. Then `showScreen('active')` attempts `firingAlarm.time` and throws `Cannot read properties of undefined (reading 'time')`. Safeguarding `firingAlarm = firingAlarm || alarms[0] || newAlarm` in `saveNewAlarm()` and `startActiveWakeupSequence()` resolves this crash.

---

## 3. Caveats

- **Explorer Read-Only Boundary**: In accordance with the Explorer archetype, no project source files (`index.html`) were modified during this investigation.
- **Event Dispatch in Headless Mock vs Real Browser**: In `dom_sim.js`, `pointermove` and `pointerup` are dispatched directly on `dialSvg` and do not bubble to `window` or `document`. On a real browser, users can drag outside the SVG boundaries. Therefore, event listeners should be attached to `dialSvg` directly, while optionally also listening on `document` in browser environments.
- **Pointer Events vs Touch Events**: Modern Android WebViews support both Pointer Events and Touch Events. Attaching both (`pointerdown`/`pointermove`/`pointerup` and `touchstart`/`touchmove`/`touchend`) ensures full compatibility across all Android versions.

---

## 4. Conclusion

The DOM elements and SVG layout for Milestone 4 (R4) in `#screen-add` already have the correct IDs, classes, and viewBox dimensions in `index.html`. What is missing is the interactive JavaScript layer:
1. Implement `setDialMode(mode)` ('hour' vs 'minute') to toggle UI styles, render dial face numbers (1–12 vs 00–55), and reposition the dial hand.
2. Implement trigonometry-based pointer/touch drag tracking on `#radial-clock-dial` with `atan2`, step snapping ($30^\circ$ steps), and haptic tick vibrations (`Native.vibrate('tick')`).
3. Wire `setTimePreset` and `showScreen('add')` to synchronize the radial dial hand and numbers.
4. Auto-advance from Hour mode to Minute mode on `pointerup`.
5. Address the two edge-case fixes in `startActiveWakeupSequence()` and `saveNewAlarm()` to bring the overall E2E test pass rate to 100% (44/44 passing).

---

## 5. Verification Method

To verify the investigation and proposed changes:

1. **Run E2E Test Suite**:
   ```powershell
   node tests/e2e/runner.js
   ```
2. **Run Individual Milestone 4 Tests**:
   ```powershell
   node tests/e2e/runner.js --filter "T1.12.1|T1.13.1|T1.14.1"
   ```
3. **Inspect Output Target**:
   `app/src/main/assets/index.html` around line 231 to 294 (DOM) and line 1368 to 1650 (JavaScript).
4. **Android Build Verification**:
   ```powershell
   $env:JAVA_HOME="C:\Program Files\Android\Android Studio\jbr"
   .\gradlew.bat testDebugUnitTest
   ```
