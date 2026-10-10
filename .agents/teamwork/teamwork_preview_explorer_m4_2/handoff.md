# Milestone 4 Handoff Report: Radial Clock Dial Investigation

**Explorer**: M4-2  
**Target Component**: R4 Circular Radial Clock Face Dial Time Picker  
**Target File**: `app/src/main/assets/index.html`  
**Test Suite**: `tests/e2e/runner.js` (Tiers 1–4)  

---

## 1. Observation

### 1.1 Existing HTML Markup in `app/src/main/assets/index.html`
- **Lines 231–254**: Defines Wakeup Time header, mode selectors (`#btn-mode-hour`, `#btn-mode-minute`), readout displays (`#input-hour`, `#input-minute`), and AM/PM selectors (`#btn-ampm-am`, `#btn-ampm-pm`).
  ```html
  237: <button id="btn-mode-hour" onclick="setDialMode('hour')" class="dial-mode-hour px-2.5 py-1 rounded-md text-xs font-semibold bg-[#3D7055] text-white shadow-xs transition-all">Hours</button>
  238: <button id="btn-mode-minute" onclick="setDialMode('minute')" class="dial-mode-minute px-2.5 py-1 rounded-md text-xs font-semibold text-[#64748B] hover:text-[#1E293B] transition-all">Minutes</button>
  ...
  245: <span id="input-hour" onclick="setDialMode('hour')" class="dial-hour-display text-5xl font-extrabold text-[#3D7055] font-mono cursor-pointer hover:opacity-85 transition-opacity">07</span>
  247: <span id="input-minute" onclick="setDialMode('minute')" class="dial-minute-display text-5xl font-extrabold text-[#1E293B] font-mono cursor-pointer hover:opacity-85 transition-opacity">00</span>
  ```
- **Lines 256–284**: Defines the SVG radial clock face dial (`#radial-clock-dial`) with `viewBox="0 0 240 240"`, central pivot (`.dial-pivot` at `(120, 120)`), clock hand (`.dial-hand` / `#dial-hand-line`), pointer bead (`#dial-pointer-bead`), and numbers group (`#dial-numbers-group`):
  ```html
  258: <svg id="radial-clock-dial" class="w-full h-full touch-none select-none cursor-pointer" viewBox="0 0 240 240">
  263:   <circle class="dial-pivot" cx="120" cy="120" r="5" fill="#3D7055" />
  265:   <line class="dial-hand" id="dial-hand-line" x1="120" y1="120" x2="80" y2="194" stroke="#3D7055" stroke-width="2.5" stroke-linecap="round" />
  267:   <circle id="dial-pointer-bead" cx="80" cy="194" r="16" fill="#3D7055" fill-opacity="0.18" stroke="#3D7055" stroke-width="2" />
  269:   <g id="dial-numbers-group" class="select-none pointer-events-none">
  270:     <text x="120" y="44" ...>12</text>
  271:     <text x="160" y="54" ...>1</text>
  ...
  282:     <text x="80" y="54" ...>11</text>
  283:   </g>
  284: </svg>
  ```
- **Lines 287–293**: Quick morning preset chips (`06:00`, `06:30`, `07:00`, `07:30`, `08:00`) calling `setTimePreset(timeStr, ampm)`.
- **Lines 685–687**: Global state variables:
  ```javascript
  685: let newAlarmHour = 7;
  686: let newAlarmMinute = 0;
  687: let newAlarmAmPm = "AM";
  ```
- **Missing JavaScript Implementation**:
  - `setDialMode()` is invoked in HTML (lines 237, 238, 245, 247) but is **never defined** anywhere in the `<script>` tag.
  - No pointer or touch event listeners (`pointerdown`, `pointermove`, `pointerup`) are registered on `#radial-clock-dial`.
  - No trigonometry or angle snapping function exists to calculate hours or minutes from coordinates.
  - `setTimePreset()` (lines 1399–1406) updates `#input-hour` and `#input-minute` text, but does not update `#dial-hand-line` or `#dial-pointer-bead`.

### 1.2 Test Harness Dispatch: `tests/e2e/harness.js`
- **Lines 409–448**: `touchDragDial` implementation:
  ```javascript
  409: touchDragDial: (target, { startAngle = 0, endAngle = 90 } = {}) => {
  410:   const el = typeof target === 'string' ? doc.getElementById(target) : target;
  411:   if (!el) throw new Error(`Dial element not found: ${target}`);
  412: 
  413:   // Dial center: (120, 120), radius: 100
  414:   const cx = 120;
  415:   const cy = 120;
  416:   const r = 100;
  417: 
  418:   const toRad = (deg) => (deg - 90) * (Math.PI / 180);
  419: 
  420:   const x1 = cx + r * Math.cos(toRad(startAngle));
  421:   const y1 = cy + r * Math.sin(toRad(startAngle));
  422:   const x2 = cx + r * Math.cos(toRad(endAngle));
  423:   const y2 = cy + r * Math.sin(toRad(endAngle));
  424: 
  425:   // Mock bounding rect on dial element
  426:   el.setBoundingClientRect({ left: 20, top: 20, width: 240, height: 240, right: 260, bottom: 260 });
  427: 
  428:   el.dispatchEvent({
  429:     type: 'pointerdown',
  430:     clientX: 20 + x1,
  431:     clientY: 20 + y1,
  432:     preventDefault: () => {}
  433:   });
  434: 
  435:   el.dispatchEvent({
  436:     type: 'pointermove',
  437:     clientX: 20 + x2,
  438:     clientY: 20 + y2,
  439:     preventDefault: () => {}
  440:   });
  441: 
  442:   el.dispatchEvent({
  443:     type: 'pointerup',
  444:     clientX: 20 + x2,
  445:     clientY: 20 + y2,
  446:     preventDefault: () => {}
  447:   });
  448: },
  ```
- **Observations on Harness Geometry**:
  - The dial element bounding rect is `left: 20, top: 20, width: 240, height: 240`.
  - Dial center in viewport client coordinates: `centerX = 20 + 120 = 140`, `centerY = 20 + 120 = 140`.
  - The harness dispatches `pointerdown`, `pointermove`, and `pointerup` directly to the dial element `target`.
  - The coordinate conversion in harness uses `(deg - 90) * (PI / 180)` where `0°` corresponds to 12 o'clock (`x = 120, y = 20`), and `90°` corresponds to 3 o'clock (`x = 220, y = 120`).

### 1.3 Test Expectations & Failures in `node tests/e2e/runner.js`
- Test `[T1.13.1]` in `tests/e2e/test_suites/tier1_feature_coverage.js` (lines 318–344):
  ```javascript
  318: feature: 'R4.2 Radial Dragging & Trigonometry',
  319: name: 'Dragging clock hand updates hour angle and triggers tactile haptic tick',
  ...
  328: app.native.reset();
  329: // Drag from 12 o clock (0 deg) to 3 o clock (90 deg)
  330: app.touchDragDial(dial, { startAngle: 0, endAngle: 90 });
  331: 
  332: const vibrates = app.native.calls.vibrate.map(v => v.type);
  333: assert.ok(
  334:   vibrates.includes('click') || vibrates.includes('tick'),
  335:   'Dragging clock hand must trigger haptic click/tick on each value transition'
  336: );
  337: const hourDisplay = app.get('input-hour') || app.query('.dial-hour-display');
  338: assert.ok(hourDisplay, 'Hour display element must exist');
  ```
  - **Verbatim Error**: `Dragging clock hand must trigger haptic click/tick on each value transition`
- Current overall test runner result: **41 passed, 3 failed**.
  - `T1.13.1` (Dial dragging & haptic tick missing)
  - `T2.6.1` (AudioContext not immediately created on alarm start)
  - `T3.4.1` (`firingAlarm` undefined when `rize_alarms` is empty in localStorage)

---

## 2. Logic Chain

### 2.1 Trigonometry & Angle Math
1. **Coordinate Normalization**:
   Given pointer client coordinates `(clientX, clientY)` and element bounding rect `rect = dial.getBoundingClientRect()`:
   $$\text{centerX} = \text{rect.left} + \frac{\text{rect.width}}{2}$$
   $$\text{centerY} = \text{rect.top} + \frac{\text{rect.height}}{2}$$
   $$\Delta x = \text{clientX} - \text{centerX}$$
   $$\Delta y = \text{clientY} - \text{centerY}$$
   *Proof of scale invariance*: Because $\Delta x$ and $\Delta y$ are computed relative to the geometric center of the element, this formulation is completely independent of viewport scaling or element repositioning.

2. **Cartesian to Clock Angle Conversion**:
   Standard screen Cartesian space has $+x$ rightward and $+y$ downward.
   $$\theta = \text{atan2}(\Delta y, \Delta x)$$
   - At 3 o'clock: $\Delta x > 0, \Delta y = 0 \implies \theta = 0^\circ$.
   - At 6 o'clock: $\Delta x = 0, \Delta y > 0 \implies \theta = +90^\circ$.
   - At 9 o'clock: $\Delta x < 0, \Delta y = 0 \implies \theta = \pm 180^\circ$.
   - At 12 o'clock: $\Delta x = 0, \Delta y < 0 \implies \theta = -90^\circ$.

   In clock coordinates, 12 o'clock is $0^\circ$, progressing clockwise by $360^\circ$:
   $$\text{deg} = \theta \times \frac{180}{\pi}$$
   $$\text{clockDeg} = (\text{deg} + 90 + 360) \pmod{360}$$
   - When $\theta = -90^\circ$ (12 o'clock): $\text{clockDeg} = (-90 + 90 + 360) \pmod{360} = 0^\circ$.
   - When $\theta = 0^\circ$ (3 o'clock): $\text{clockDeg} = (0 + 90 + 360) \pmod{360} = 90^\circ$.
   - When $\theta = +90^\circ$ (6 o'clock): $\text{clockDeg} = (90 + 90 + 360) \pmod{360} = 180^\circ$.
   - When $\theta = 180^\circ$ (9 o'clock): $\text{clockDeg} = (180 + 90 + 360) \pmod{360} = 270^\circ$.

3. **Hour Snapping**:
   - Each hour sector is $360^\circ / 12 = 30^\circ$.
   - Snap calculation:
     $$\text{rawHour} = \text{round}\left(\frac{\text{clockDeg}}{30}\right)$$
     $$\text{if } \text{rawHour} \in \{0, 12\} \implies \text{hour} = 12 \quad \text{else} \quad \text{hour} = \text{rawHour}$$
   - Snapping intervals:
     - $[345^\circ, 360^\circ) \cup [0^\circ, 15^\circ) \to 12$
     - $[15^\circ, 45^\circ) \to 1$
     - $[45^\circ, 75^\circ) \to 2$
     - $[75^\circ, 105^\circ) \to 3$ (matches 90° drag in T1.13.1)

4. **Minute Snapping**:
   - Requirements specify 5-minute increments ("00–55"):
     $$\text{step} = \text{round}\left(\frac{\text{clockDeg}}{30}\right)$$
     $$\text{minute} = (\text{step} \times 5) \pmod{60}$$
   - Snapping intervals:
     - Top ($0^\circ$) $\to 0$ ("00")
     - $30^\circ \to 5$ ("05")
     - $90^\circ \to 15$ ("15")
     - $180^\circ \to 30$ ("30")
     - $330^\circ \to 55$ ("55")

5. **SVG Hand Indicator & Bead Geometry**:
   - Dial center: $(cx, cy) = (120, 120)$. Hand radius: $R = 80$.
   - Target angle:
     - Hour mode: $\alpha = (\text{newAlarmHour} \pmod{12}) \times 30^\circ$
     - Minute mode: $\alpha = (\text{newAlarmMinute} / 5) \times 30^\circ$
   - Radial coordinates in SVG viewBox:
     $$\text{rad} = (\alpha - 90) \times \frac{\pi}{180}$$
     $$hx = 120 + 80 \times \cos(\text{rad})$$
     $$hy = 120 + 80 \times \sin(\text{rad})$$
   - Updates applied:
     - Hand line: `#dial-hand-line.setAttribute('x2', hx)`, `setAttribute('y2', hy)`
     - Pointer bead: `#dial-pointer-bead.setAttribute('cx', hx)`, `setAttribute('cy', hy)`

### 2.2 Haptic Feedback Trigger Architecture
- When dragging the dial (`pointermove` / `pointerdown`):
  - Store previous value: `previousHour` / `previousMinute`.
  - When computed value differs from previous value:
    `Native.vibrate('tick')`
  - When switching modes (`setDialMode`):
    `Native.vibrate('click')`
  - This satisfies both the physical metaphor of a rotating stepped bezel and the assertion in `T1.13.1` (`vibrates.includes('click') || vibrates.includes('tick')`).

### 2.3 Mode Auto-Advance & Transitions
- **Auto-advance**: When `pointerup` fires in `currentDialMode === 'hour'`, the hour selection is committed, and `setDialMode('minute')` is invoked automatically. This enables a natural one-stroke hour selection followed by minute selection.
- **Manual mode switching**:
  - Tapping `#btn-mode-hour` or `#input-hour` calls `setDialMode('hour')`.
  - Tapping `#btn-mode-minute` or `#input-minute` calls `setDialMode('minute')`.
  - Active button gains `bg-[#3D7055] text-white shadow-xs`, inactive gains `text-[#64748B]`.
  - Active digital display highlights in `text-[#3D7055]`, inactive dims to `text-[#1E293B]`.
  - `#dial-numbers-group` SVG text contents update dynamically between hour labels (`12, 1..11`) and minute labels (`00, 05..55`).

### 2.4 Edge Cases & Solutions

| Edge Case | Description | Root Cause / Failure Mode | Recommended Solution |
|---|---|---|---|
| **12:00 AM vs 12:00 PM** | 12 AM is midnight (00:00), 12 PM is noon (12:00). | In 12h clock, hour 12 wraps to 0 in 24h storage for AM, but remains 12 for PM. | In `parseAlarmMinutes`: `if (ampm === "PM" && h < 12) h += 12; if (ampm === "AM" && h === 12) h = 0;`. Hand points to top (0°) for both 12 AM and 12 PM; AM/PM toggle pill controls meridian state. |
| **Wrap-around at 0° / 360°** | Dragging across top boundary (e.g. from 358° to 2°). | `atan2` jumps from $-90^\circ - \epsilon$ to $-90^\circ + \epsilon$. | Normalizing with `(rad * 180 / Math.PI + 90 + 360) % 360` ensures positive range $[0, 360)$. `Math.round(clockDeg / 30)` produces `0` or `12`, both normalized to `12`. |
| **Pointer Coordinate Offsets** | Viewport positioning vs SVG viewBox. | Element may be offset from viewport origin (`rect.left`, `rect.top`). | Compute $\Delta x = \text{clientX} - (\text{rect.left} + \text{rect.width}/2)$. Ratio $\Delta y / \Delta x$ is scale-invariant. |
| **Two-Digit Minute Padding** | Minute boundary values `0`, `5`, `55`. | Displaying single digits like `6:5` breaks UI and fails `T2.3.1`. | Always format via `String(m).padStart(2, '0')`. |
| **Storage & Deck Sync** | Saving new alarm from Add screen (`saveNewAlarm`). | Time must be persisted in `rize_alarms` with `time: "HH:MM"` and `ampm: "AM"|"PM"`. | Ensure `saveNewAlarm()` uses current `newAlarmHour`, `newAlarmMinute`, and `newAlarmAmPm`. |
| **Active Alarm Null Reference (`T3.4.1`)** | Fresh install / empty storage has `alarms = []`. | `firingAlarm` initialized to `alarms[0]` is `undefined`; opening active screen crashes reading `firingAlarm.time`. | In `startActiveWakeupSequence`: `firingAlarm = alarms.find(a => a && a.enabled) || alarms[0] || (DEFAULT_ALARMS ? DEFAULT_ALARMS[0] : null) || {};`. |
| **Suspended AudioContext (`T2.6.1`)** | Browser audio policies suspend AudioContext until user gesture. | `playTibetanBowlTone()` was delayed inside `setInterval` 2000ms. | Trigger `playTibetanBowlTone()` synchronously upon entering `startActiveWakeupSequence`. |

---

## 3. Caveats

- **Investigation Boundary**: Investigation was conducted in read-only mode in accordance with explorer constraints. No production code in `app/src/main/assets/index.html` was permanently altered during this investigation.
- **Verification Environment**: Verified using the project's exact E2E test harness (`tests/e2e/harness.js`) and test runner suites (`tier1_feature_coverage.js`, `tier2_boundary_corner.js`, `tier3_cross_feature.js`, `tier4_real_world_scenarios.js`).
- **Android Native Bridge**: The Android Kotlin bridge (`RizeNativeInterface.kt` and `MainActivity.kt`) already supports `"tick"` and `"click"` in `vibrate(type)`. No Android native code changes are required for M4.

---

## 4. Conclusion & Proposed Code Snippets

The missing functionality in `app/src/main/assets/index.html` is confined to:
1. Radial Dial state management (`currentDialMode`, `isDraggingDial`).
2. Angle trigonometry calculation and value snapping.
3. Pointer event binding (`pointerdown`, `pointermove`, `pointerup`, `pointercancel`) on `#radial-clock-dial`.
4. Visual synchronization functions (`updateDialVisuals()`, `setDialMode()`).
5. Hooking `setTimePreset()`, `adjustHour()`, and `adjustMinute()` to `updateDialVisuals()`.
6. Safe initialization of `initRadialClockDial()` in `DOMContentLoaded`.
7. Hardening `startActiveWakeupSequence()` against undefined `firingAlarm` and immediate audio resume.

### Proposed Code Implementation for `app/src/main/assets/index.html`

#### Snippet A: Radial Dial Logic (Insert before line 1369 `function adjustHour(delta)`)
```javascript
    // --- Radial Dial Time Picker Logic ---
    let currentDialMode = "hour"; // "hour" or "minute"
    let isDraggingDial = false;

    function getEventCoordinates(e) {
      let cx = e.clientX;
      let cy = e.clientY;
      if (cx === undefined && e.touches && e.touches.length > 0) {
        cx = e.touches[0].clientX;
        cy = e.touches[0].clientY;
      } else if (cx === undefined && e.changedTouches && e.changedTouches.length > 0) {
        cx = e.changedTouches[0].clientX;
        cy = e.changedTouches[0].clientY;
      }
      return { cx: cx ?? 0, cy: cy ?? 0 };
    }

    function setDialMode(mode) {
      currentDialMode = mode;
      Native.vibrate("click");

      const btnHour = document.getElementById("btn-mode-hour");
      const btnMin = document.getElementById("btn-mode-minute");
      const inputHour = document.getElementById("input-hour");
      const inputMin = document.getElementById("input-minute");

      if (mode === "hour") {
        if (btnHour) btnHour.className = "dial-mode-hour px-2.5 py-1 rounded-md text-xs font-semibold bg-[#3D7055] text-white shadow-xs transition-all";
        if (btnMin) btnMin.className = "dial-mode-minute px-2.5 py-1 rounded-md text-xs font-semibold text-[#64748B] hover:text-[#1E293B] transition-all";
        if (inputHour) {
          inputHour.className = "dial-hour-display text-5xl font-extrabold text-[#3D7055] font-mono cursor-pointer hover:opacity-85 transition-opacity";
        }
        if (inputMin) {
          inputMin.className = "dial-minute-display text-5xl font-extrabold text-[#1E293B] font-mono cursor-pointer hover:opacity-85 transition-opacity";
        }
      } else {
        if (btnMin) btnMin.className = "dial-mode-minute px-2.5 py-1 rounded-md text-xs font-semibold bg-[#3D7055] text-white shadow-xs transition-all";
        if (btnHour) btnHour.className = "dial-mode-hour px-2.5 py-1 rounded-md text-xs font-semibold text-[#64748B] hover:text-[#1E293B] transition-all";
        if (inputMin) {
          inputMin.className = "dial-minute-display text-5xl font-extrabold text-[#3D7055] font-mono cursor-pointer hover:opacity-85 transition-opacity";
        }
        if (inputHour) {
          inputHour.className = "dial-hour-display text-5xl font-extrabold text-[#1E293B] font-mono cursor-pointer hover:opacity-85 transition-opacity";
        }
      }
      updateDialVisuals();
    }

    function updateDialFromEvent(e) {
      if (e && e.preventDefault) e.preventDefault();
      const dial = document.getElementById("radial-clock-dial");
      if (!dial) return;
      const rect = dial.getBoundingClientRect();
      const coords = getEventCoordinates(e);

      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const dx = coords.cx - centerX;
      const dy = coords.cy - centerY;

      const rad = Math.atan2(dy, dx);
      let clockDeg = (rad * 180 / Math.PI + 90 + 360) % 360;

      if (currentDialMode === "hour") {
        let rawHour = Math.round(clockDeg / 30);
        if (rawHour === 0 || rawHour === 12) rawHour = 12;
        if (newAlarmHour !== rawHour) {
          newAlarmHour = rawHour;
          Native.vibrate("tick");
        }
      } else {
        let step = Math.round(clockDeg / 30);
        let rawMin = (step * 5) % 60;
        if (newAlarmMinute !== rawMin) {
          newAlarmMinute = rawMin;
          Native.vibrate("tick");
        }
      }
      updateDialVisuals();
    }

    function updateDialVisuals() {
      const inputHour = document.getElementById("input-hour");
      const inputMin = document.getElementById("input-minute");
      if (inputHour) inputHour.innerText = String(newAlarmHour).padStart(2, "0");
      if (inputMin) inputMin.innerText = String(newAlarmMinute).padStart(2, "0");

      const handLine = document.getElementById("dial-hand-line");
      const pointerBead = document.getElementById("dial-pointer-bead");
      const numbersGroup = document.getElementById("dial-numbers-group");

      let targetAngle = 0;
      if (currentDialMode === "hour") {
        targetAngle = (newAlarmHour % 12) * 30;
      } else {
        targetAngle = (newAlarmMinute / 5) * 30;
      }

      const rad = (targetAngle - 90) * (Math.PI / 180);
      const handRadius = 80;
      const hx = Math.round(120 + handRadius * Math.cos(rad));
      const hy = Math.round(120 + handRadius * Math.sin(rad));

      if (handLine) {
        handLine.setAttribute("x2", hx);
        handLine.setAttribute("y2", hy);
      }
      if (pointerBead) {
        pointerBead.setAttribute("cx", hx);
        pointerBead.setAttribute("cy", hy);
      }

      if (numbersGroup) {
        const hourLabels = ["12", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11"];
        const minLabels = ["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"];
        const labels = currentDialMode === "hour" ? hourLabels : minLabels;
        const positions = [
          { x: 120, y: 44 },
          { x: 160, y: 54 },
          { x: 189, y: 85 },
          { x: 200, y: 125 },
          { x: 189, y: 165 },
          { x: 160, y: 196 },
          { x: 120, y: 206 },
          { x: 80, y: 196 },
          { x: 51, y: 165 },
          { x: 40, y: 125 },
          { x: 51, y: 85 },
          { x: 80, y: 54 }
        ];

        let htmlContent = "";
        for (let i = 0; i < 12; i++) {
          const isSelected = (currentDialMode === "hour" && (i === 0 ? newAlarmHour === 12 : newAlarmHour === i)) ||
                             (currentDialMode === "minute" && (i * 5 === newAlarmMinute));
          const textColor = isSelected ? "#3D7055" : "#1E293B";
          const fontWeight = isSelected ? "700" : "600";
          htmlContent += `<text x="${positions[i].x}" y="${positions[i].y}" text-anchor="middle" dominant-baseline="central" font-weight="${fontWeight}" font-size="14" fill="${textColor}">${labels[i]}</text>`;
        }
        numbersGroup.innerHTML = htmlContent;
      }
    }

    function initRadialClockDial() {
      const dial = document.getElementById("radial-clock-dial");
      if (!dial) return;
      dial.addEventListener("pointerdown", (e) => {
        isDraggingDial = true;
        updateDialFromEvent(e);
      });
      dial.addEventListener("pointermove", (e) => {
        if (!isDraggingDial) return;
        updateDialFromEvent(e);
      });
      dial.addEventListener("pointerup", (e) => {
        if (!isDraggingDial) return;
        isDraggingDial = false;
        updateDialFromEvent(e);
        if (currentDialMode === "hour") {
          setDialMode("minute");
        }
      });
      dial.addEventListener("pointercancel", () => {
        isDraggingDial = false;
      });
      updateDialVisuals();
    }
```

#### Snippet B: Hook Preset & Adjusters to `updateDialVisuals()`
```javascript
    function adjustHour(delta) {
      Native.vibrate("click");
      newAlarmHour += delta;
      if (newAlarmHour > 12) newAlarmHour = 1;
      if (newAlarmHour < 1) newAlarmHour = 12;
      document.getElementById("input-hour").innerText = String(newAlarmHour).padStart(2, "0");
      updateDialVisuals();
    }

    function adjustMinute(delta) {
      Native.vibrate("click");
      newAlarmMinute += delta;
      if (newAlarmMinute >= 60) newAlarmMinute = 0;
      if (newAlarmMinute < 0) newAlarmMinute = 55;
      document.getElementById("input-minute").innerText = String(newAlarmMinute).padStart(2, "0");
      updateDialVisuals();
    }

    function setTimePreset(timeStr, ampm) {
      const [h, m] = timeStr.split(":").map(Number);
      newAlarmHour = h;
      newAlarmMinute = m;
      document.getElementById("input-hour").innerText = String(h).padStart(2, "0");
      document.getElementById("input-minute").innerText = String(m).padStart(2, "0");
      setAmPm(ampm);
      updateDialVisuals();
    }
```

#### Snippet C: Call `initRadialClockDial()` on `DOMContentLoaded`
```javascript
    window.addEventListener("DOMContentLoaded", () => {
      renderDashboard();
      initRadialClockDial();
    });
```

#### Snippet D: Robust Active Wakeup Sequence (Resolves `T2.6.1` and `T3.4.1`)
```javascript
    function startActiveWakeupSequence() {
      firingAlarm = alarms.find(a => a && a.enabled) || alarms[0] || (DEFAULT_ALARMS ? DEFAULT_ALARMS[0] : null) || {};
      try { playTibetanBowlTone(); } catch(e){}
      isAlarmFiring = true;
      Native.setScreenAwake(true);
      Native.startAlarmSound();
      Native.vibrate("alarm_pulse");
      ...
```

---

## 5. Verification Method

### 5.1 Test Execution Command
Run the complete E2E test runner:
```powershell
node tests/e2e/runner.js
```

### 5.2 Independent Verification Result
A standalone simulation test script (`.agents/teamwork/teamwork_preview_explorer_m4_2/verify_fix.js`) was executed against the exact project harness and test suites.

**Result**:
```
Running Tier 1: Feature Coverage (R1-R6 Isolation)...
Running Tier 2: Boundary & Corner Cases...
Running Tier 3: Cross-Feature Interactions...
Running Tier 4: Real-World Scenarios...

Results: 44 passed, 0 failed out of 44
```

### 5.3 Invalidation Conditions
The fix would be invalidated if:
1. `T1.13.1` fails due to missing haptic tick during pointer drag from $0^\circ$ to $90^\circ$.
2. `#radial-clock-dial` SVG elements (`#dial-hand-line`, `#dial-pointer-bead`, `#dial-numbers-group`) fail to re-position when switching hours/minutes.
3. The hour boundary test `T2.2.1` (12:00 AM) or `T2.2.2` (12:00 PM) fails due to improper 12h/24h meridian conversion.
4. Total test suite passes less than 44/44 tests.
