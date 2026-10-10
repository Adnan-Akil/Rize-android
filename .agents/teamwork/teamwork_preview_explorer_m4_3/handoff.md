# Milestone 4 E2E Test Audit & Implementation Plan

**Explorer**: Explorer M4-3  
**Target Milestone**: Milestone 4 (RIZE E2E Integration & Radial Clock Dial Flow)  
**Target File**: `app/src/main/assets/index.html`  
**Test Suite**: `tests/e2e/runner.js`  
**Date**: 2026-10-10  

---

## 1. Observation

### 1.1 Test Runner Execution Baseline
Execution of `node tests/e2e/runner.js` yielded:
- **Total Tests**: 44
- **Passed**: 41 (93%)
- **Failed**: 3 (7%)
- **Duration**: ~275ms

### 1.2 Summary of Test Tiers
- **Tier 1 (Feature Coverage R1-R6 Isolation)**: 21/22 passed (95%)
  - Failing: `[T1.13.1] Dragging clock hand updates hour angle and triggers tactile haptic tick`
- **Tier 2 (Boundary & Corner Cases)**: 12/13 passed (92%)
  - Failing: `[T2.6.1] Suspended AudioContext state is handled properly and resumed on user interaction`
- **Tier 3 (Cross-Feature Interactions)**: 4/5 passed (80%)
  - Failing: `[T3.4.1] Registering NFC tag in modal enables assignment in Add screen and reflects in active wakeup`
- **Tier 4 (Real-World Scenarios)**: 4/4 passed (100%)
  - All 4 end-to-end scenarios (Wake cycle, snooze, onboarding, routine cleanup) passed.

---

### 1.3 Detailed Failure Audit

#### Failure 1: [T1.13.1]
- **File & Line**: `tests/e2e/test_suites/tier1_feature_coverage.js:318-345`
- **Feature**: R4.2 Radial Dragging & Trigonometry (Tier 1)
- **Verbatim Error**:
  ```
  Error: Dragging clock hand must trigger haptic click/tick on each value transition
      at Object.fn (C:\Users\husai\Downloads\Rize\tests\e2e\test_suites\tier1_feature_coverage.js:333:18)
  ```
- **Failing Assertion**:
  ```javascript
  app.touchDragDial(dial, { startAngle: 0, endAngle: 90 });
  const vibrates = app.native.calls.vibrate.map(v => v.type);
  assert.ok(
    vibrates.includes('click') || vibrates.includes('tick'),
    'Dragging clock hand must trigger haptic click/tick on each value transition'
  );
  ```
- **Code Observation in `index.html`**:
  - The SVG element `<svg id="radial-clock-dial" ...>` exists in lines 258-283.
  - Buttons call `onclick="setDialMode('hour')"` (line 237) and `onclick="setDialMode('minute')"` (line 238), but `setDialMode` is **not defined** anywhere in the `<script>` tag.
  - There are **no event listeners** (`pointerdown`, `pointermove`, `pointerup`, `touchstart`, etc.) registered on `#radial-clock-dial` or in JavaScript for drag / touch interaction.
  - No trigonometry calculation (`Math.atan2`) exists to compute hand angle, rotate the pointer bead, or trigger `Native.vibrate('tick')`.

#### Failure 2: [T2.6.1]
- **File & Line**: `tests/e2e/test_suites/tier2_boundary_corner.js:213-229`
- **Feature**: Boundary & Corner Cases (Tier 2)
- **Verbatim Error**:
  ```
  Error: AudioContext should have been instantiated for alarm tone
      at Object.fn (C:\Users\husai\Downloads\Rize\tests\e2e\test_suites\tier2_boundary_corner.js:223:18)
  ```
- **Failing Assertion**:
  ```javascript
  const app = loadApp({ audioContextSuspended: true });
  app.click('btn-quick-alarm-test');
  const ctx = app.audioContexts[0];
  assert.ok(ctx, 'AudioContext should have been instantiated for alarm tone');
  assert.equal(ctx.state, 'running', 'AudioContext must be resumed upon alarm trigger');
  ```
- **Code Observation in `index.html`**:
  - In `startActiveWakeupSequence()` (lines 1280-1305), the audio tone synthesizer `playTibetanBowlTone()` is **only called inside `setInterval(..., 2000)`** (lines 1299-1304).
  - When `btn-quick-alarm-test` is clicked, `startActiveWakeupSequence()` executes synchronously, but does not call `playTibetanBowlTone()` immediately. Therefore, `new AudioContext()` is not invoked synchronously on alarm start.

#### Failure 3: [T3.4.1]
- **File & Line**: `tests/e2e/test_suites/tier3_cross_feature.js:128-178`
- **Feature**: Cross-Feature Interactions (Tier 3)
- **Verbatim Error**:
  ```
  Error: Cannot read properties of undefined (reading 'time')
        document.getElementById("active-alarm-time-display").innerText = firingAlarm.time;
  ```
- **Failing Assertion**:
  ```javascript
  app.click('btn-quick-alarm-test');
  const activeText = app.get('screen-active').innerText;
  assert.ok(activeText.includes('Balcony Garden Tag') || activeText.includes('Tag'), 'Active alarm checkpoint must specify registered tag name');
  ```
- **Code Observation in `index.html`**:
  - In line 675: `let alarms = JSON.parse(localStorage.getItem("rize_alarms") || "null") || DEFAULT_ALARMS;`. In test T3.4.1, initial storage has `rize_alarms: []`. `JSON.parse("[]")` evaluates to `[]`.
  - In line 680: `let firingAlarm = alarms[0];` evaluates to `undefined`.
  - When `saveNewAlarm()` is called (lines 1461-1483), it prepends `newAlarm` to `alarms`, but does **not update `firingAlarm`**.
  - When `btn-quick-alarm-test` is subsequently clicked, `startActiveWakeupSequence()` executes line 1290: `document.getElementById("active-alarm-time-display").innerText = firingAlarm.time;`. Because `firingAlarm` is still `undefined`, an unhandled TypeError is thrown.

---

### 1.4 Status of R5 (Dawn Active Screen) and R6 (Zen Audio & Haptics)
- **R5.1 (Dawn morning horizon aesthetics & breathing wave)**: `[T1.15.1]` passes (100%).
- **R5.2 (Dim-to-brightening ambient transition)**: `[T1.16.1]` passes (100%).
- **R5.3 (Peaceful NFC disarm & emergency snooze)**: `[T1.17.1]` passes (100%).
- **R6.1 (Zen soundscapes Tibetan Singing Bowl/Celestial Chimes)**: `[T1.18.1]` passes (100%).
- **R6.2 (Organic native haptics tick, click, success, pulse)**: `[T1.19.1]` passes (100%).
- **Native bridge preservation**: `[T1.20.1]` passes (100%).
- **Conclusion for R5 & R6**: The core assets, styling tokens, and bridge methods are completely in place; the only defect in the active screen / audio flow is the deferred initialization in `startActiveWakeupSequence()` causing T2.6.1 and the undefined alarm reference in T3.4.1.

---

## 2. Logic Chain

### 2.1 Failure Analysis & Causality

1. **Failure 1 ([T1.13.1])**:
   - `tests/e2e/harness.js:428-447` dispatches `pointerdown` at `(20+x1, 20+y1)`, `pointermove` at `(20+x2, 20+y2)`, and `pointerup` directly onto `#radial-clock-dial`.
   - `dom_sim.js:241-249` dispatches events directly to the target element's registered listeners without bubbling up to window or document.
   - Because `index.html` has no listener on `#radial-clock-dial` for `pointerdown` or `pointermove`, no handler runs.
   - Consequently, `Native.vibrate('tick')` is never called, and `newAlarmHour` is not updated from dial dragging.
   - **Fix Requirement**: Attach `pointerdown`, `pointermove`, `pointerup` (and touch/mouse fallback) directly to `#radial-clock-dial`. Calculate angle using `Math.atan2(dy, dx) + Math.PI/2`, snap to hours (1..12) or minutes (00..55 in 5m steps), fire `Native.vibrate('tick')` on change, and update the SVG hand/bead and `#input-hour` / `#input-minute`.

2. **Failure 2 ([T2.6.1])**:
   - `tier2_boundary_corner.js:218-225` tests:
     ```javascript
     const app = loadApp({ audioContextSuspended: true });
     app.click('btn-quick-alarm-test');
     const ctx = app.audioContexts[0];
     assert.ok(ctx, 'AudioContext should have been instantiated for alarm tone');
     assert.equal(ctx.state, 'running', 'AudioContext must be resumed upon alarm trigger');
     ```
   - In `index.html:1299`, audio is deferred: `setInterval(() => { playTibetanBowlTone(); ... }, 2000)`.
   - The test inspects `app.audioContexts` synchronously right after clicking the button. Because 2000ms has not elapsed, no `AudioContext` was instantiated.
   - Furthermore, `playSynthesizedTone()` in `index.html:703-705` already has `if (audioCtx.state === "suspended") audioCtx.resume();`.
   - **Fix Requirement**: Immediately invoke `playTibetanBowlTone()` when entering `startActiveWakeupSequence()` before scheduling the interval, and also ensure `audioCtx.resume()` is called on screen interaction (`brightenActiveScreen()`).

3. **Failure 3 ([T3.4.1])**:
   - `tier3_cross_feature.js:133-174` sets initial `rize_alarms: []`.
   - `index.html:680` initializes `firingAlarm = alarms[0]` -> `undefined`.
   - When a user registers a tag and creates an alarm, `saveNewAlarm()` pushes the new alarm into `alarms` and saves to `localStorage`, but never sets `firingAlarm = newAlarm`.
   - When `btn-quick-alarm-test` is triggered, `startActiveWakeupSequence()` accesses `firingAlarm.time` without checking for undefined or resolving the active alarm.
   - **Fix Requirement**:
     1. In `saveNewAlarm()`: set `firingAlarm = newAlarm;`.
     2. In `startActiveWakeupSequence()`: fallback helper `firingAlarm = getActiveFiringAlarm();` where `getActiveFiringAlarm` checks `firingAlarm || getNextAlarmInfo()?.alarm || alarms[0] || DEFAULT_ALARMS[0]`.

---

## 3. End-to-End User Flow: Radial Clock Alarm Creation

```
[ Dashboard Screen (#screen-dashboard) ]
   │
   ▼ User taps elevated '+' FAB (#nav-btn-add)
[ Open Add Screen (#screen-add) ]
   │
   ├─► Initialize dial mode: dialMode = 'hour'
   ├─► Set dial hand pointing to 07 (angle 210°, or current hour)
   ├─► Render numbers 1-12 in #dial-numbers-group
   ├─► Highlight #input-hour ('07') in sage #3D7055; #input-minute ('00') in slate
   │
   ▼ User touches / drags clock hand on SVG (#radial-clock-dial)
[ Step 1: Hour Selection ]
   │
   ├─► Pointer events (down/move) captured on #radial-clock-dial
   ├─► Trigonometry: cx = rect.left + rect.width/2; cy = rect.top + rect.height/2
   ├─► rad = Math.atan2(clientY - cy, clientX - cx) + Math.PI/2
   ├─► deg = (rad * 180 / Math.PI) % 360
   ├─► hour = Math.round(deg / 30) % 12; if (hour === 0) hour = 12
   ├─► If hour != newAlarmHour:
   │     - Native.vibrate("tick")
   │     - newAlarmHour = hour
   │     - Update hand line & bead coordinates: (120 + 76*cos, 120 + 76*sin)
   │     - Update #input-hour text: String(hour).padStart(2, '0')
   ├─► Pointer up: auto-advance to minute mode (setDialMode('minute'))
   │
   ▼
[ Step 2: Minute Selection ]
   │
   ├─► Mode switch to 'minute' (or user taps #btn-mode-minute or #input-minute)
   ├─► Render 00, 05, 10, ..., 55 in #dial-numbers-group
   ├─► Highlight #input-minute in sage #3D7055; #input-hour in slate
   ├─► Hand points to newAlarmMinute (angle = minute * 6°)
   ├─► Dragging / tapping dial calculates:
   │     - min = (Math.round(deg / 30) * 5) % 60
   │     - If min != newAlarmMinute:
   │         - Native.vibrate("tick")
   │         - newAlarmMinute = min
   │         - Update hand line & bead coordinates
   │         - Update #input-minute text: String(min).padStart(2, '0')
   │
   ▼
[ Step 3: Preset Chips (Alternative to Dial) ]
   │
   └─► Tapping '06:00', '06:30', '07:00', '07:30' calls setTimePreset(timeStr, ampm)
       Updates newAlarmHour, newAlarmMinute, hand angle, AM/PM pill
   │
   ▼
[ Step 4: AM / PM Selection ]
   │
   └─► Tapping #btn-ampm-am or #btn-ampm-pm calls setAmPm('AM' | 'PM')
       Updates newAlarmAmPm, toggles active pill styles, Native.vibrate("click")
   │
   ▼
[ Step 5: Day Matrix Selection ]
   │
   └─► Tapping day pills M, T, W, T, F, S, S calls toggleDay(0..6)
       Tapping 'Select All' calls toggleAllDays()
       Updates newAlarmDays array and active pill colors
   │
   ▼
[ Step 6: NFC Tag Assignment ]
   │
   ├─► Toggle NFC enforcement: toggleAddNfcEnforced()
   ├─► Pick existing tag: openSelectTagModal() -> select tag -> updates newAlarmSelectedTag
   └─► Scan new tag: startNfcScanRegistration() -> NFC tap -> confirmRegisterTag()
       Persists to 'rize_tags' in localStorage, sets newAlarmSelectedTag
   │
   ▼
[ Step 7: Save Alarm (saveNewAlarm()) ]
   │
   ├─► Native.vibrate("heavy_click")
   ├─► Read label from #input-alarm-label (fallback: "Morning Routine" if empty)
   ├─► Format time: `${String(newAlarmHour).padStart(2, "0")}:${String(newAlarmMinute).padStart(2, "0")}`
   ├─► Construct alarm object:
   │     {
   │       id: "alarm-" + Date.now(),
   │       time: timeFormatted,
   │       ampm: newAlarmAmPm,
   │       label: label,
   │       enabled: true,
   │       days: [...newAlarmDays],
   │       nfcEnforced: newAlarmNfc,
   │       tagId: newAlarmSelectedTag?.id || null,
   │       tagName: newAlarmSelectedTag?.name || null,
   │       tagUid: newAlarmSelectedTag?.uid || null,
   │       sound: "Tibetan Singing Bowl"
   │     }
   ├─► Update memory state: alarms.unshift(newAlarm); firingAlarm = newAlarm;
   ├─► Persist to localStorage: localStorage.setItem("rize_alarms", JSON.stringify(alarms));
   ├─► showScreen("dashboard")
   │
   ▼
[ Step 8: Dashboard Return & Recalculation (renderDashboard()) ]
   │
   ├─► Synchronize alarms and tags from localStorage
   ├─► updateHeroCard():
   │     - getNextAlarmInfo() calculates next upcoming alarm across days & time
   │     - #telemetry-next-time: "Tomorrow, 06:30 AM"
   │     - #banner-countdown: "Wake up in 6h 24m"
   │     - #hero-status-label: "Active & Ready"
   ├─► render cards in #alarms-deck:
   │     - Alarm card with serene typography (06:30 AM)
   │     - Active toggle switch (toggleAlarm(id))
   │     - Repeat days chips & NFC checkpoint tag pill
   │     - Inline expandable settings panel (toggleCardExpand(id))
   │     - Horizontal swipe layer for Delete (attachSwipeListeners)
```

---

## 4. Step-by-Step Implementation Plan for Worker M4

The implementer (Worker M4) should make targeted edits inside `app/src/main/assets/index.html`.

### Step 1: Add Radial Dial State Variables
In `<script>` around line 685:
```javascript
// --- Radial Clock Dial State ---
let dialMode = "hour"; // 'hour' | 'minute'
let isDialDragging = false;
const DIAL_CENTER = 120;
const DIAL_RADIUS = 76;
```

### Step 2: Implement `setDialMode(mode)` and `updateDialVisuals()`
Expose globally on `window`:
```javascript
function setDialMode(mode) {
  dialMode = mode;
  Native.vibrate("click");

  const btnHour = document.getElementById("btn-mode-hour");
  const btnMin = document.getElementById("btn-mode-minute");
  const hourDisplay = document.getElementById("input-hour");
  const minDisplay = document.getElementById("input-minute");

  if (mode === "hour") {
    if (btnHour) {
      btnHour.className = "dial-mode-hour px-2.5 py-1 rounded-md text-xs font-semibold bg-[#3D7055] text-white shadow-xs transition-all";
    }
    if (btnMin) {
      btnMin.className = "dial-mode-minute px-2.5 py-1 rounded-md text-xs font-semibold text-[#64748B] hover:text-[#1E293B] transition-all";
    }
    if (hourDisplay) {
      hourDisplay.classList.add("text-[#3D7055]");
      hourDisplay.classList.remove("text-[#1E293B]");
    }
    if (minDisplay) {
      minDisplay.classList.remove("text-[#3D7055]");
      minDisplay.classList.add("text-[#1E293B]");
    }
  } else {
    if (btnMin) {
      btnMin.className = "dial-mode-minute px-2.5 py-1 rounded-md text-xs font-semibold bg-[#3D7055] text-white shadow-xs transition-all";
    }
    if (btnHour) {
      btnHour.className = "dial-mode-hour px-2.5 py-1 rounded-md text-xs font-semibold text-[#64748B] hover:text-[#1E293B] transition-all";
    }
    if (minDisplay) {
      minDisplay.classList.add("text-[#3D7055]");
      minDisplay.classList.remove("text-[#1E293B]");
    }
    if (hourDisplay) {
      hourDisplay.classList.remove("text-[#3D7055]");
      hourDisplay.classList.add("text-[#1E293B]");
    }
  }

  updateDialVisuals();
}
window.setDialMode = setDialMode;
```

And `updateDialVisuals()`:
```javascript
function updateDialVisuals() {
  const numbersGroup = document.getElementById("dial-numbers-group");
  const handLine = document.getElementById("dial-hand-line");
  const pointerBead = document.getElementById("dial-pointer-bead");
  const hourDisplay = document.getElementById("input-hour");
  const minDisplay = document.getElementById("input-minute");

  if (hourDisplay) hourDisplay.innerText = String(newAlarmHour).padStart(2, "0");
  if (minDisplay) minDisplay.innerText = String(newAlarmMinute).padStart(2, "0");

  // Determine angle for current value
  let angleDeg = 0;
  if (dialMode === "hour") {
    angleDeg = (newAlarmHour % 12) * 30;
  } else {
    angleDeg = (newAlarmMinute / 5) * 30; // or newAlarmMinute * 6
  }

  const rad = (angleDeg - 90) * (Math.PI / 180);
  const hx = Math.round(DIAL_CENTER + DIAL_RADIUS * Math.cos(rad));
  const hy = Math.round(DIAL_CENTER + DIAL_RADIUS * Math.sin(rad));

  if (handLine) {
    handLine.setAttribute("x1", DIAL_CENTER);
    handLine.setAttribute("y1", DIAL_CENTER);
    handLine.setAttribute("x2", hx);
    handLine.setAttribute("y2", hy);
  }
  if (pointerBead) {
    pointerBead.setAttribute("cx", hx);
    pointerBead.setAttribute("cy", hy);
  }

  // Render 12 numbers in SVG
  if (numbersGroup) {
    const hours = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    const minutes = ["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"];
    const labels = dialMode === "hour" ? hours : minutes;
    const currentVal = dialMode === "hour" ? newAlarmHour : newAlarmMinute;

    let groupHtml = "";
    for (let i = 0; i < 12; i++) {
      const numDeg = i * 30;
      const numRad = (numDeg - 90) * (Math.PI / 180);
      const nx = Math.round(DIAL_CENTER + DIAL_RADIUS * Math.cos(numRad));
      const ny = Math.round(DIAL_CENTER + DIAL_RADIUS * Math.sin(numRad));
      
      const isSelected = dialMode === "hour" 
        ? (labels[i] === currentVal)
        : (parseInt(labels[i], 10) === currentVal);

      const fillColor = isSelected ? "#3D7055" : "#1E293B";
      const fontWeight = isSelected ? "700" : "600";

      groupHtml += `<text x="${nx}" y="${ny}" text-anchor="middle" dominant-baseline="central" font-family="'Plus Jakarta Sans', sans-serif" font-weight="${fontWeight}" font-size="14" fill="${fillColor}">${labels[i]}</text>`;
    }
    numbersGroup.innerHTML = groupHtml;
  }
}
window.updateDialVisuals = updateDialVisuals;
```

### Step 3: Implement Trigonometry Pointer Tracking on `#radial-clock-dial`
```javascript
function handleDialPointer(e, isEnd) {
  const dialSvg = document.getElementById("radial-clock-dial");
  if (!dialSvg) return;

  const rect = dialSvg.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;

  const clientX = e.clientX !== undefined ? e.clientX : (e.touches && e.touches[0] ? e.touches[0].clientX : (e.changedTouches && e.changedTouches[0] ? e.changedTouches[0].clientX : cx));
  const clientY = e.clientY !== undefined ? e.clientY : (e.touches && e.touches[0] ? e.touches[0].clientY : (e.changedTouches && e.changedTouches[0] ? e.changedTouches[0].clientY : cy));

  const dx = clientX - cx;
  const dy = clientY - cy;

  let rad = Math.atan2(dy, dx) + Math.PI / 2;
  if (rad < 0) rad += 2 * Math.PI;
  const deg = (rad * 180 / Math.PI) % 360;

  if (dialMode === "hour") {
    let hour = Math.round(deg / 30) % 12;
    if (hour === 0) hour = 12;
    if (hour !== newAlarmHour) {
      newAlarmHour = hour;
      Native.vibrate("tick");
      updateDialVisuals();
    }
    if (isEnd) {
      // Auto-advance to minutes
      setTimeout(() => {
        if (dialMode === "hour") setDialMode("minute");
      }, 250);
    }
  } else {
    // 5-minute snapping (00, 05, 10... 55)
    let min = (Math.round(deg / 30) * 5) % 60;
    if (min !== newAlarmMinute) {
      newAlarmMinute = min;
      Native.vibrate("tick");
      updateDialVisuals();
    }
  }
}

function initRadialDialListeners() {
  const dialSvg = document.getElementById("radial-clock-dial");
  if (!dialSvg) return;

  const onDown = (e) => {
    isDialDragging = true;
    if (e.preventDefault) e.preventDefault();
    handleDialPointer(e, false);
  };
  const onMove = (e) => {
    if (isDialDragging) {
      if (e.preventDefault) e.preventDefault();
      handleDialPointer(e, false);
    }
  };
  const onUp = (e) => {
    if (isDialDragging) {
      isDialDragging = false;
      if (e.preventDefault) e.preventDefault();
      handleDialPointer(e, true);
    }
  };

  // Direct element listeners (CRITICAL for dom_sim.js dispatchEvent!)
  dialSvg.addEventListener("pointerdown", onDown);
  dialSvg.addEventListener("pointermove", onMove);
  dialSvg.addEventListener("pointerup", onUp);

  dialSvg.addEventListener("touchstart", onDown);
  dialSvg.addEventListener("touchmove", onMove);
  dialSvg.addEventListener("touchend", onUp);

  dialSvg.addEventListener("mousedown", onDown);
  dialSvg.addEventListener("mousemove", onMove);
  dialSvg.addEventListener("mouseup", onUp);
}
```

### Step 4: Fix `setTimePreset` to Synchronize Radial Dial Visuals
```javascript
function setTimePreset(timeStr, ampm) {
  const [h, m] = timeStr.split(":").map(Number);
  newAlarmHour = h;
  newAlarmMinute = m;
  updateDialVisuals();
  setAmPm(ampm);
}
window.setTimePreset = setTimePreset;
```

### Step 5: Fix T2.6.1 in `startActiveWakeupSequence()`
In `startActiveWakeupSequence()`:
```javascript
// Immediately start Tibetan singing bowl tone and resume AudioContext synchronously
playTibetanBowlTone();

if (alarmPulseInterval) clearInterval(alarmPulseInterval);
alarmPulseInterval = setInterval(() => {
  if (isAlarmFiring) {
    playTibetanBowlTone();
    Native.vibrate("alarm_pulse");
  }
}, 2000);
```
And inside `brightenActiveScreen()`:
```javascript
function brightenActiveScreen() {
  const activeEl = document.getElementById("screen-active");
  if (activeEl) {
    activeEl.classList.remove("alarm-dimmed");
  }
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume();
  }
}
```

### Step 6: Fix T3.4.1 in `startActiveWakeupSequence()` and `saveNewAlarm()`
Add safe active alarm resolver:
```javascript
function getActiveFiringAlarm() {
  if (firingAlarm && firingAlarm.time) return firingAlarm;
  const nextInfo = getNextAlarmInfo();
  if (nextInfo && nextInfo.alarm) return nextInfo.alarm;
  if (alarms && alarms.length > 0 && alarms[0] && alarms[0].time) return alarms[0];
  return DEFAULT_ALARMS[0];
}
```
In `startActiveWakeupSequence()`:
```javascript
firingAlarm = getActiveFiringAlarm();
document.getElementById("active-alarm-time-display").innerText = firingAlarm.time;
document.getElementById("active-alarm-title-display").innerText = firingAlarm.label || "Morning Routine";
document.getElementById("active-target-tag-name").innerText = firingAlarm.tagName || "Bathroom Mirror #01";
const instructionTag = document.getElementById("active-target-instruction-tag");
if (instructionTag) instructionTag.innerText = firingAlarm.tagName || "Bathroom Mirror";
```
In `saveNewAlarm()`:
```javascript
alarms.unshift(newAlarm);
firingAlarm = newAlarm; // Ensure active sequence uses the newly created alarm
localStorage.setItem("rize_alarms", JSON.stringify(alarms));
showScreen("dashboard");
```
And when tag is confirmed in `confirmRegisterTag()`:
```javascript
tags.push(newTag);
localStorage.setItem("rize_tags", JSON.stringify(tags));
newAlarmSelectedTag = newTag;
const tagNameEl = document.getElementById("add-selected-tag-name");
const tagUidEl = document.getElementById("add-selected-tag-uid");
if (tagNameEl) tagNameEl.innerText = newTag.name;
if (tagUidEl) tagUidEl.innerText = `UID: ${newTag.uid}`;
```

### Step 7: Call `initRadialDialListeners()` on `DOMContentLoaded` and in `showScreen('add')`
In `showScreen('add')`:
```javascript
} else if (name === "add") {
  document.getElementById("screen-add").classList.remove("hidden");
  setDialMode("hour");
  updateDialVisuals();
}
```
And in `window.addEventListener("DOMContentLoaded", ...)`:
```javascript
window.addEventListener("DOMContentLoaded", () => {
  renderDashboard();
  initRadialDialListeners();
  updateDialVisuals();
});
```

---

## 5. Caveats

- **Caveat 1**: `dom_sim.js` does not implement event bubbling for `dispatchEvent`. Event listeners must be registered directly on `radial-clock-dial`, not only on `window` or `document`.
- **Caveat 2**: When `rize_alarms` starts with empty array `[]` (such as in fresh onboarding or test T3.4.1), `alarms[0]` is undefined. All code referencing `firingAlarm` must pass through the `getActiveFiringAlarm()` guard.
- **Caveat 3**: Web Audio context suspension must be resumed synchronously upon user interaction or alarm triggering to avoid modern browser autoplay blocking.

---

## 6. Conclusion

- Current baseline passes 41/44 (93%) E2E tests.
- Exactly 3 tests fail due to 3 localized, well-understood issues in `app/src/main/assets/index.html`:
  1. `[T1.13.1]`: Missing radial clock dial pointer interaction and trigonometry calculation.
  2. `[T2.6.1]`: Deferred audio context startup in active wakeup sequence.
  3. `[T3.4.1]`: Unhandled `undefined` reference to `firingAlarm` when alarms array is initially empty.
- Implementing the 7-step plan above will resolve all 3 failures without affecting any of the 41 existing passing tests, achieving **100% (44/44) pass rate across all 4 tiers**.

---

## 7. Verification Method

To verify the fixes after implementation:
1. Run the full E2E test runner:
   ```powershell
   node tests/e2e/runner.js
   ```
   **Expected Outcome**: 44/44 tests passing (100%), 0 failures, exit code 0.
2. Run with verbose flag to inspect individual timings:
   ```powershell
   node tests/e2e/runner.js -v
   ```
3. Run the Milestone 2 Challenger verification:
   ```powershell
   node tests/e2e/challenger_m2_verify.js
   ```
   **Expected Outcome**: 15/15 tests passing (100%), exit code 0.
4. Verify Android Gradle debug unit tests:
   ```powershell
   $env:JAVA_HOME="C:\Program Files\Android\Android Studio\jbr"
   .\gradlew.bat testDebugUnitTest
   ```
