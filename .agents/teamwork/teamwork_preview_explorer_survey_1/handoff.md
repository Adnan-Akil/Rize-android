# Frontend Web Assets Survey & Revamp Architectural Specification

## 1. Observation

### 1.1 Web Assets Inventory & File Structure
Direct inspection of the project files reveals:
- Web Assets Directory: `app/src/main/assets/` contains exactly one file:
  - `app/src/main/assets/index.html` (1,240 lines, 63,451 bytes). There are no external CSS, JS, or audio files in `assets/`.
- Native Bridge Integration:
  - `app/src/main/java/com/rize/nfc/MainActivity.kt`: loads `file:///android_asset/index.html`, injects JavaScript interface `@JavascriptInterface` named `"RizeNative"`, sets system chrome colors:
    - Line 29-30: `window.statusBarColor = Color.parseColor("#111318")`, `window.navigationBarColor = Color.parseColor("#111318")`.
    - Line 58: `webView.setBackgroundColor(Color.parseColor("#111318"))`.
    - Line 129-134: Dispatches scanned NFC tag UIDs to WebView via `window.onNativeNfcTag(hexUid)`.
    - Line 76: Listens to back button presses via `window.handleBackNav()`.
  - `app/src/main/java/com/rize/nfc/RizeNativeInterface.kt`: provides:
    - `isNfcAvailable(): Boolean`
    - `isNfcEnabled(): Boolean`
    - `openNfcSettings()`
    - `vibrate(type: String)` ("click", "heavy_click", "success", "alarm_pulse")
    - `stopVibrate()`
    - `startAlarmSound()` (Android `RingtoneManager.TYPE_ALARM`)
    - `stopAlarmSound()`
    - `setScreenAwake(awake: Boolean)`
  - Android Resources:
    - `app/src/main/res/values/colors.xml`: defines `#FF111318` as black/surface, `#FF00F2FE` as primary.
    - `app/src/main/res/values/themes.xml`: sets `android:statusBarColor`, `android:navigationBarColor`, `android:windowBackground` to `#111318`.

### 1.2 Existing Architecture in `index.html`
- **Head & Dependencies** (Lines 1-47):
  - Fonts: Google Fonts `Plus Jakarta Sans`, `JetBrains Mono`, `Material Symbols Outlined`.
  - Tailwind CSS: CDN script `https://cdn.tailwindcss.com`.
  - `tailwind.config`: defines dark palette (`surface: "#111318"`, `primary-container: "#00f2fe"`, `secondary: "#4edea3"`).
  - `<html class="dark">`.
- **Screens & Views** (Lines 103-584):
  - `#screen-dashboard` (Lines 104-211): Header with "RIZE NFC CORE" + "TEST TRIGGER", Telemetry Banner ("Target Armed", "SYS//06:30.AM", "Next in 6h 24m", "NFC ENFORCED"), Metrics Strip ("STACK / 4 Alarms", "HARDWARE / 3 Tags"), Ambient Mode Toggle ("Deep OLED" vs "Solar Lux"), `#alarms-deck`, FAB button at bottom right.
  - `#screen-add` (Lines 214-363): "NEW ALARM", Stepper time picker (`adjustHour` / `adjustMinute` buttons), Alarm Label text input, 7-day matrix buttons (`day-btn-0` to `day-btn-6`), NFC enforcement toggle + assigned tag card, acoustic profile ("Celestial Pulse" with preview toggle), "ARM ALARM SCHEDULE" button.
  - `#screen-nfc` (Lines 366-410): "NFC HARDWARE", telemetry card, `#nfc-tags-deck` showing paired tags with RSSI/status, test tap, delete, and register button.
  - `#screen-active` (Lines 413-510): Full screen overlay (`bg-[#0A0C10]`), telemetry bar ("ENFORCED ALARM FIRING", "SYS//ACTIVE"), pulsing radar rings (`.radar-ring-1..3`), live time (`06:30 AM`), contactless icon ("TAP NFC CHECKPOINT"), required checkpoint card, "Emergency Snooze (+5 Min)", "Cancel Demo Screen", `#active-success-overlay` ("NFC CHECKPOINT VERIFIED").
  - Modals: `#modal-nfc-scan` (Lines 513-541), `#modal-select-tag` (Lines 544-560).
  - Bottom Navigation (`<nav>`, Lines 563-583): 3 items: "Alarms" (`#nav-btn-dashboard`), "Hardware" (`#nav-btn-nfc`), "Wakeup" (`#nav-btn-active`).
- **State Management & Logic** (Lines 586-1237):
  - Storage: `DEFAULT_ALARMS` (4 objects) and `DEFAULT_TAGS` (3 objects) in `localStorage` (`rize_alarms`, `rize_tags`).
  - Navigation: `showScreen(name)` toggles `.hidden` class on screens and recolors navigation icons.
  - Audio Synthesizer: `playSynthesizedTone(freq, type)` creates short oscillator bursts (0.4s). Active alarm loops sawtooth (880Hz) and square (1200Hz) pulses every 1000ms.
  - Alarm Cards: Rendered inside `renderDashboard()`. Currently static; clicking card text triggers `testTriggerAlarm(id)` rather than inline expansion. No swipe actions exist.

### 1.3 Build & Test Verification Command Results
- `./gradlew assembleDebug` with `JAVA_HOME="C:\Program Files\Android\Android Studio\jbr"` succeeded (Exit Code 0, BUILD SUCCESSFUL in 21s).
- `./gradlew testDebugUnitTest` succeeded (Exit Code 0, BUILD SUCCESSFUL in 12s).

---

## 2. Logic Chain

### 2.1 Theme & Styling Revamp (R1)
- **Observation**: `index.html` lines 2, 17-39, and 55 use `#111318` dark surface with neon cyan `#00f2fe` and neon mint `#4edea3`. `MainActivity.kt` and `themes.xml` hardcode `#111318`.
- **Requirement R1**: Soft warm porcelain canvas (`#F8F9FA` / `#FAFAF9`), crisp warm white card surfaces (`#FFFFFF`) with hairline borders (`#E5E7EB` / `#E2E8F0`), soft diffuse shadows (`0 2px 10px rgba(0,0,0,0.03)`), gentle organic sage/pine accents (`#3D7055` / `#2D5A43`), dawn amber (`#D97706`), calm slate (`#64748B`), and text (`#1E293B`).
- **Logic**:
  1. Remove `class="dark"` from `<html>`.
  2. Update `tailwind.config` colors to provide light semantic tokens:
     - `canvas`: `#F8F9FA`
     - `surface`: `#FFFFFF`
     - `surface-subtle`: `#F1F5F9`
     - `border`: `#E2E8F0`
     - `primary`: `#3D7055` (gentle sage)
     - `primary-dark`: `#2D5A43`
     - `primary-light`: `#E8F0EC`
     - `accent-amber`: `#D97706`
     - `accent-amber-light`: `#FEF3C7`
     - `text-main`: `#1E293B`
     - `text-muted`: `#64748B`
     - `text-subtle`: `#94A3B8`
  3. Replace cyberpunk box shadows (`shadow-[0_0_20px_rgba(0,242,254,0.4)]`) with organic elevation: `shadow-[0_2px_10px_rgba(0,0,0,0.03)]` and `shadow-[0_10px_25px_-5px_rgba(61,112,85,0.1)]`.
  4. Coordinate with Native Explorer to update `MainActivity.kt` (`window.statusBarColor = Color.parseColor("#F8F9FA")`, light status bar appearance `window.decorView.systemUiVisibility` or `WindowInsetsControllerCompat(window, window.decorView).isAppearanceLightStatusBars = true`), and `themes.xml`/`colors.xml`.

### 2.2 Dashboard & Navigation Architecture (R2)
- **Observation**:
  - Dashboard header displays "RIZE NFC CORE" and tactical button "TEST TRIGGER" (Lines 114, 117-121).
  - Telemetry banner displays "Target Armed" with animated ping, "SYS//06:30.AM", "Scheduled Awakening", and "NFC ENFORCED" (Lines 129-154).
  - Metrics strip displays "STACK" and "HARDWARE / SYNCED" (Lines 157-182).
  - Bottom navigation has 3 tabs: "Alarms", "Hardware", and "Wakeup" (Lines 563-583), while an isolated FAB '+' button floats at `bottom-20` (Line 208).
- **Requirement R2**:
  - Branding: Simply "RIZE".
  - Morning hero card: Calm, glanceable countdown ("Wake up in 6h 24m", "Next Alarm: Tomorrow, 6:30 AM") and gentle status.
  - Bottom nav: 2 primary tabs ("Alarms" and "NFC Tags") with an elevated, thumb-friendly '+' button in the center.
  - Natural human copy across all screens.
- **Logic**:
  1. Header: Clean minimalist "RIZE" brand title with a peaceful morning icon (e.g. sun or leaf) and a subtle test alarm icon button.
  2. Hero Card: Replace the tactical telemetry banner with a morning horizon hero card:
     - Countdown: "Wake up in 6h 24m".
     - Subtext: "Next: Tomorrow at 6:30 AM • Bathroom Mirror".
     - Gentle status badge: "Active & Ready" with soft sage dot.
  3. Navigation: Redesign `<nav>` to a 3-column layout:
     - Left: "Alarms" tab.
     - Center: Elevated floating circular '+' button with sage gradient and soft elevation to open Add Alarm.
     - Right: "NFC Tags" tab.
     - Eliminate separate "Wakeup" tab (testing wakeup can be done from card tap or a test action).

### 2.3 Inline Expandable & Swipable Alarm Cards (R3)
- **Observation**:
  - `renderDashboard()` (Lines 776-849) renders a static card. Clicking the card triggers `testTriggerAlarm(alarm.id)`. There is no expansion mechanism, nor touch swipe gesture tracking.
- **Requirement R3**:
  - Large serene time typography, intuitive toggle switch, repeat days pills, NFC checkpoint tag pill.
  - Inline expansion: Tapping card smoothly expands in-place on the dashboard to adjust repeat days, assigned NFC tag, sound, and quick toggles.
  - Swipe action: Swiping card horizontally reveals smooth quick-action buttons (Delete / Duplicate) with tactile feedback.
- **Logic**:
  1. **Inline Expansion Architecture**:
     - Maintain state: `let expandedAlarmId = null`.
     - When user taps card header/body (excluding toggle button):
       - If `expandedAlarmId === alarm.id`, set `expandedAlarmId = null` (collapse).
       - Else, set `expandedAlarmId = alarm.id` (expand).
       - Re-render or toggle DOM `.expanded` container with CSS transition (`grid-template-rows: 0fr -> 1fr` or `max-height`).
     - Expanded panel contents:
       - Interactive day selector pills: clickable Mon-Sun chips allowing inline day toggling without opening Add screen.
       - Checkpoint tag pill / selector: displays current tag, with a "Change" button that opens tag picker.
       - Sound selection chips: Tibetan Singing Bowl, Celestial Morning Chime, Dawn Forest.
       - Vibration toggle pill.
       - "Delete Alarm" and "Edit" action buttons.
  2. **Horizontal Swipe-to-Action Architecture**:
     - Card container structure: Outer overflow-hidden wrapper with two layers:
       - Background layer: Action buttons (e.g. Red "Delete" button on the right).
       - Foreground layer: The interactive alarm card surface.
     - Touch Event Listeners on foreground surface:
       - `touchstart`: record `startX = e.touches[0].clientX`, `startY = e.touches[0].clientY`, reset translation.
       - `touchmove`: compute `deltaX = currentX - startX`, `deltaY = currentY - startY`. If `Math.abs(deltaX) > Math.abs(deltaY)`, prevent vertical scroll. If `deltaX < 0` (swiping left), translate foreground by `Math.max(deltaX, -90)px`.
       - When translation passes -50px, trigger `Native.vibrate("click")` once.
       - `touchend`: if `deltaX < -45`, snap open to `-80px` (showing Delete button). If not, snap back to `0px`.
       - Tapping anywhere else or swiping right resets translation to `0px`.

### 2.4 Radial Clock Face Dial Time Picker (R4)
- **Observation**:
  - `#screen-add` (Lines 226-266) uses numeric increment/decrement buttons (`adjustHour`, `adjustMinute`) with five hardcoded presets (`05:30`, `06:00`, `06:30`, `07:15`, `08:00`).
- **Requirement R4**:
  - Interactive circular radial clock dial.
  - Tapping or dragging central clock hand smoothly selects hours (1-12) and minutes (00-55) with gentle haptic clicks (`Native.vibrate("click")`) on each tick.
  - Smooth transition between Hour and Minute selection modes.
  - Clear AM/PM toggle pill.
  - Quick morning preset chips: 6:00, 6:30, 7:00, 7:30.
- **Logic**:
  1. **Dial Geometry & Mathematics**:
     - Radius `R = 100px`, center `(cx, cy) = (120px, 120px)`.
     - 12 radial positions spaced by 30° ($360^\circ / 12 = 30^\circ$).
     - Angle for index $i \in [0..11]$: $\theta = (i \times 30 - 90) \times \frac{\pi}{180}$.
     - Position: $x = cx + R \times \cos(\theta)$, $y = cy + R \times \sin(\theta)$.
     - For Hours: labels 12 (top, $-90^\circ$), 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11.
     - For Minutes: labels 00 (top), 05, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55.
  2. **Hand & Pointer Tracking**:
     - SVG `<svg viewBox="0 0 240 240">` with:
       - Outer dial face circle (`fill: #FFFFFF`, `stroke: #E2E8F0`).
       - Central pivot dot (`fill: #3D7055`, radius 4px).
       - Hand line from center to selected coordinate (`stroke: #3D7055`, stroke-width 2.5).
       - Selector head bead at tip (`fill: #3D7055`, radius 18px) with white label.
     - Pointer down / move handler:
       - Get bounding box `rect = svg.getBoundingClientRect()`.
       - Compute relative coordinates $dx = clientX - (rect.left + rect.width / 2)$, $dy = clientY - (rect.top + rect.height / 2)$.
       - Compute raw angle $\alpha = (\text{atan2}(dy, dx) \times \frac{180}{\pi} + 90 + 360) \pmod{360}$.
       - If Hour mode: step = $\text{round}(\alpha / 30) \pmod{12}$; value = step === 0 ? 12 : step.
       - If Minute mode: step = $\text{round}(\alpha / 30) \pmod{12}$; value = step * 5.
       - If value changed: trigger `Native.vibrate("click")` and update hand angle.
  3. **Auto-advance & Mode Switch**:
     - Mode pill header: `[ Hour: 07 ]` and `[ Min: 30 ]`.
     - When user completes hour drag/tap (`pointerup`), set state to `minute` mode with a smooth fade/zoom transition between dial numbers.
  4. **Presets**:
     - Render quick chips: `6:00 AM`, `6:30 AM`, `7:00 AM`, `7:30 AM`. Clicking sets time, AM, updates dial hand, and triggers haptic click.

### 2.5 Gentle Dawn Waking Screen (Active Alarm) (R5)
- **Observation**:
  - `#screen-active` (Lines 413-510) is a pitch black screen (`bg-[#0A0C10]`) with flashing radar rings, harsh cyan accents, and abrasive military labels ("ENFORCED ALARM FIRING", "SYS//ACTIVE").
- **Requirement R5**:
  - Peaceful morning horizon aesthetic (soft porcelain to dawn warm glow, serene large time display, breathing circular NFC wave).
  - Dim-to-brightening transition: starts in soft warm dimmed ambient state, smoothly brightens as user interacts or approaches phone.
  - Calming NFC instruction: "Tap Bathroom Mirror NFC Tag to disarm".
  - Simulated NFC tap button and peaceful emergency snooze option.
- **Logic**:
  1. Palette & Horizon Aesthetic:
     - Background: Morning horizon dawn gradient (`background: radial-gradient(circle at 50% 30%, #FEF3C7 0%, #FFF7ED 50%, #F8F9FA 100%)`).
     - Serene typography: Deep warm slate time `06:30` with soft sage `AM`.
  2. Dim-to-Brightening Transition:
     - Initial state when `startActiveWakeupSequence()` executes: container has class `alarm-dimmed` (`filter: brightness(0.65) saturate(0.85); transition: filter 12s cubic-bezier(0.4, 0, 0.2, 1);`).
     - Screen gently brightens over 12 seconds to `brightness(1.0)` automatically, or instantly brightens smoothly on first touch/tap.
  3. Breathing Circular NFC Wave:
     - Replace the 3 rigid `.radar-ring` CSS classes with organic breathing waves (`@keyframes breathing-wave { 0%, 100% { transform: scale(0.92); opacity: 0.35; } 50% { transform: scale(1.15); opacity: 0.75; } }`).
     - Rings styled with warm dawn amber and gentle sage borders.
  4. Calming Disarm Display:
     - Primary headline: "Good Morning".
     - Instruction: "Tap Bathroom Mirror NFC Tag to disarm".
     - Checkpoint card displays assigned tag name and location.
     - "Test Tap Checkpoint" (Simulate NFC tap) button.
     - "Emergency Snooze (+5 min)" with soft amber outline.
     - Success Overlay: Peaceful dawn card "Good morning! Checkpoint verified" with gentle Tibetan chime before returning to Dashboard.

### 2.6 Zen Soundscapes & Organic Haptics (R6)
- **Observation**:
  - `playSynthesizedTone` (Lines 670-691) plays a harsh single oscillator burst. Active alarm loops 880Hz sawtooth + 1200Hz square waves.
- **Requirement R6**:
  - Tibetan singing bowl / celestial morning chime tones that swell gently using Web Audio synthesizer.
  - Pair interactions (dial rotation, card toggles, scan verification) with tactile native haptics via `RizeNativeInterface`.
- **Logic**:
  1. **Tibetan Singing Bowl Synthesizer**:
     - Fundamental frequency $f_0 = 216\text{ Hz}$ or $432\text{ Hz}$ (sine wave).
     - Overtones: $f_1 \approx 2.76 \times f_0$ ($596\text{ Hz}$) and $f_2 \approx 5.4 \times f_0$ ($1166\text{ Hz}$) with slight frequency detune ($\pm 2\text{ Hz}$) to produce soothing acoustic beating.
     - Gain Envelope: Attack ramp 0.3s (gentle swell), sustain decay exponential ramp to 0.001 over 3.5 seconds.
  2. **Celestial Morning Chime Synthesizer**:
     - Bell chime with pentatonic chord (E5 659Hz, G#5 831Hz, B5 988Hz, E6 1319Hz) with crystalline envelope.
  3. **Gentle Progressive Swell**:
     - Master gain starts at $0.05$ and smoothly swells to $0.5$ over 30 seconds during active alarm sequence, avoiding sudden loud awakenings.
  4. **Haptic Pairing**:
     - Dial tick -> `Native.vibrate("click")`
     - Alarm toggle / Expansion -> `Native.vibrate("click")`
     - Preset click / Button tap -> `Native.vibrate("click")`
     - NFC tag verified / Alarm saved -> `Native.vibrate("success")`

---

## 3. Systematic Requirements Mapping Table (R1–R6)

| Req | Domain / Feature | Existing Code & Elements (`index.html`) | Proposed Code & Elements |
|---|---|---|---|
| **R1** | HTML & Background | Line 2 `<html class="dark">`, Line 55 `body { background-color: #111318; color: #e2e2e8; }` | Remove `.dark`; `body { background-color: #F8F9FA; color: #1E293B; }` |
| **R1** | Tailwind Palette | Lines 17-39 `surface: "#111318"`, `primary-container: "#00f2fe"`, `secondary: "#4edea3"` | Warm porcelain `#F8F9FA`, cards `#FFFFFF`, borders `#E2E8F0`, sage `#3D7055`, amber `#D97706`, slate `#64748B` |
| **R1** | Android Chrome | `MainActivity.kt:29-30`, `themes.xml:3-5`, `colors.xml:2-5` hardcoded `#111318` | Set status/navigation bar to `#F8F9FA`, enable light status bar icons (`WindowInsetsControllerCompat.isAppearanceLightStatusBars = true`) |
| **R2** | Dashboard Header | Lines 106-123: "RIZE NFC CORE" + "TEST TRIGGER" button | Minimalist "RIZE" brand header with subtle sage sun icon and clean secondary action |
| **R2** | Hero Card | Lines 128-154: "Target Armed", "SYS//06:30.AM", "Scheduled Awakening", "NFC ENFORCED" | Morning Horizon Card: "Wake up in 6h 24m", "Next Alarm: Tomorrow, 6:30 AM", "Active & Ready" |
| **R2** | Bottom Navigation | Lines 563-583: 3 tabs ("Alarms", "Hardware", "Wakeup") + Line 208 floating FAB | 2 tabs ("Alarms", "NFC Tags") with an elevated center circular '+' button (`bg-[#3D7055]`) |
| **R2** | Natural Copy | All screens: "SYS//", "TARGET ARMED", "STACK", "HARDWARE", "ARM ALARM SCHEDULE" | "Upcoming Alarm", "Active", "Bathroom Mirror NFC", "Save Alarm", "Good Morning" |
| **R3** | Card Expansion | Lines 765-850 `renderDashboard()`: static card, click triggers test alarm | Inline accordion container (`.alarm-expanded-panel`) containing interactive repeat days, NFC tag selector, sound picker, quick toggles |
| **R3** | Card Swipe Action | Currently missing in `renderDashboard()` | Touch handlers (`touchstart`, `touchmove`, `touchend`) with horizontal drag revealing smooth red Delete button; threshold haptic tick |
| **R4** | Radial Clock Dial | Lines 226-266: Stepper buttons `adjustHour(1)`, `adjustMinute(5)` | Interactive circular SVG clock face with draggable clock hand, 12 radial hour positions, 12 minute positions, haptic ticks on snap |
| **R4** | Auto-Advance & AM/PM | Lines 251-256: AM/PM buttons; no auto-advance | Smooth transition from Hour mode to Minute mode on release; pill toggles for Hour/Minute and AM/PM; morning chips (6:00, 6:30, 7:00, 7:30) |
| **R5** | Active Alarm Canvas | Lines 413-431: Pitch black `bg-[#0A0C10]`, violent radar pulse rings | Morning horizon dawn gradient (`#FEF3C7` to `#F8F9FA`), breathing circular NFC wave |
| **R5** | Dim-to-Brightening | Currently missing: static bright screen | Starts warm-dimmed (`brightness(0.65)`), smoothly brightens over 12s or on touch |
| **R5** | NFC Disarm Display | Lines 443-458: "TAP NFC CHECKPOINT", "HOLD PHONE TO TAG" | "Tap Bathroom Mirror NFC Tag to disarm", simulated NFC tap button, peaceful snooze option |
| **R6** | Sound Synthesizer | Lines 670-691: `playSynthesizedTone()` single oscillator, sawtooth/square loops | Multi-oscillator Tibetan Singing Bowl and Celestial Morning Chime with gentle harmonic swells |
| **R6** | Haptics Integration | Native bridge `RizeNativeInterface.kt` | Paired with dial ticks, card swipe snap, inline toggles, and NFC disarm verification |

---

## 4. Implementation Blueprint & Architecture Details

### 4.1 HTML & CSS Architecture
Replace the current inline Tailwind config and head styles with:
```javascript
tailwind.config = {
  theme: {
    extend: {
      colors: {
        canvas: "#F8F9FA",
        surface: "#FFFFFF",
        "surface-subtle": "#F1F5F9",
        border: "#E2E8F0",
        "border-subtle": "#F1F5F9",
        primary: "#3D7055",
        "primary-dark": "#2D5A43",
        "primary-light": "#E8F0EC",
        amber: "#D97706",
        "amber-light": "#FEF3C7",
        "amber-subtle": "#FFFBEB",
        slate: "#64748B",
        "slate-dark": "#1E293B",
        "slate-light": "#94A3B8"
      },
      fontFamily: {
        sans: ["Plus Jakarta Sans", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"]
      },
      boxShadow: {
        card: "0 2px 10px rgba(0,0,0,0.03)",
        soft: "0 4px 20px -2px rgba(61,112,85,0.08)",
        fab: "0 8px 24px -4px rgba(61,112,85,0.25)"
      }
    }
  }
};
```

### 4.2 Radial Clock Face Dial Component Specification
- **DOM Container**: `#radial-clock-picker` inside `#screen-add`.
- **Modes**: Controlled by `clockMode = 'hour' | 'minute'`.
- **Header**:
  - Large time display: `[ <span id="clock-display-hours">07</span> : <span id="clock-display-minutes">30</span> ]` with underline on active mode.
  - AM / PM pill: Segmented pill toggle.
- **Clock SVG Dial** (`width="240" height="240" viewBox="0 0 240 240"`):
  - Base dial circle: `cx="120" cy="120" r="110" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1.5"`
  - Center pivot: `cx="120" cy="120" r="4" fill="#3D7055"`
  - Hand line: `<line id="clock-hand-line" x1="120" y1="120" x2="..." y2="..." stroke="#3D7055" stroke-width="2.5" stroke-linecap="round"/>`
  - Hand bead: `<circle id="clock-hand-bead" cx="..." cy="..." r="18" fill="#3D7055"/>`
  - Dial numbers: 12 elements rendered dynamically with trigonometry:
    ```javascript
    function renderDialNumbers(mode) {
      const container = document.getElementById("clock-dial-numbers");
      container.innerHTML = "";
      const isHour = mode === "hour";
      const count = 12;
      const radius = 80;
      const cx = 120, cy = 120;
      
      for (let i = 0; i < count; i++) {
        const value = isHour ? (i === 0 ? 12 : i) : String(i * 5).padStart(2, "0");
        const angle = (i * 30 - 90) * (Math.PI / 180);
        const x = cx + radius * Math.cos(angle);
        const y = cy + radius * Math.sin(angle);
        
        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute("x", x);
        text.setAttribute("y", y + 5);
        text.setAttribute("text-anchor", "middle");
        text.setAttribute("class", "text-sm font-semibold select-none pointer-events-none fill-[#1E293B]");
        text.textContent = value;
        container.appendChild(text);
      }
    }
    ```
- **Interaction Handler**:
  - Pointer tracking calculates $\theta = \text{atan2}(dy, dx)$.
  - Snaps to 30° steps. When value changes, calls `Native.vibrate("click")`.
  - When pointer released in Hour mode, switches to Minute mode automatically with a 200ms delay.

### 4.3 Alarm Card Expansion & Swipe Specification
- **Card HTML Structure**:
  ```html
  <div class="alarm-card-wrapper relative overflow-hidden rounded-2xl mb-3 shadow-card border border-border bg-white">
    <!-- Behind: Swipe Action Layer -->
    <div class="absolute inset-y-0 right-0 w-24 bg-red-50 flex items-center justify-center">
      <button onclick="deleteAlarm('...')" class="flex flex-col items-center text-red-600 active:scale-95">
        <span class="material-symbols-outlined text-2xl">delete</span>
        <span class="text-[10px] font-semibold mt-0.5">Delete</span>
      </button>
    </div>
    
    <!-- Foreground: Card Surface -->
    <div class="alarm-card-surface relative bg-white transition-transform duration-200">
      <!-- Main Row (Click to Expand) -->
      <div class="p-4 flex items-center justify-between cursor-pointer" onclick="toggleCardExpand('...')">
        <div>
          <div class="flex items-baseline gap-1.5">
            <span class="text-3xl font-bold tracking-tight text-slate-dark">06:30</span>
            <span class="text-xs font-semibold text-primary">AM</span>
          </div>
          <p class="text-xs text-slate font-medium mt-0.5">Morning Deep Focus</p>
        </div>
        <!-- Toggle Switch -->
        <button onclick="event.stopPropagation(); toggleAlarm('...')" class="toggle-switch relative w-12 h-7 rounded-full transition-colors ...">
          ...
        </button>
      </div>

      <!-- Collapsed Summary Row -->
      <div class="px-4 pb-3 flex items-center justify-between text-xs text-slate">
        <div class="flex gap-1">...days pills...</div>
        <div class="flex items-center gap-1 text-[11px] bg-primary-light text-primary px-2 py-0.5 rounded-full font-medium">
          <span class="material-symbols-outlined text-xs">contactless</span>
          <span>Bathroom Mirror</span>
        </div>
      </div>

      <!-- Inline Expandable Container -->
      <div class="alarm-expanded-panel max-h-0 overflow-hidden transition-all duration-300 ease-in-out border-t border-border-subtle bg-canvas/40 px-4">
        <!-- Interactive Day Toggles -->
        <div class="py-3">
          <label class="text-[11px] font-semibold text-slate uppercase block mb-1.5">Repeat Days</label>
          <div class="flex gap-1.5">...7 day pills clickable inline...</div>
        </div>
        <!-- Assigned Tag Selector -->
        <div class="pb-3 flex items-center justify-between">
          ...
        </div>
        <!-- Soundscape Selector -->
        <div class="pb-3 flex items-center justify-between">
          ...
        </div>
      </div>
    </div>
  </div>
  ```

### 4.4 Zen Soundscapes Synthesizer Engine
```javascript
const ZenAudio = {
  ctx: null,
  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  },
  playTibetanBowl(baseFreq = 216) {
    this.init();
    const now = this.ctx.currentTime;
    
    // Fundamental + 2 Overtones with gentle detune
    const partials = [
      { freq: baseFreq, gain: 0.35, detune: 0 },
      { freq: baseFreq * 2.76, gain: 0.15, detune: 1.5 },
      { freq: baseFreq * 5.4, gain: 0.08, detune: -2.0 }
    ];

    partials.forEach(p => {
      const osc = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(p.freq, now);
      osc.detune.setValueAtTime(p.detune * 10, now);

      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(p.gain, now + 0.25); // Gentle swell
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 3.8); // Long resonance

      osc.connect(gainNode);
      gainNode.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 4.0);
    });
  },
  playMorningChime() {
    this.init();
    const chord = [659.25, 830.61, 987.77, 1318.51]; // E5, G#5, B5, E6
    chord.forEach((freq, idx) => {
      const delay = idx * 0.12;
      const now = this.ctx.currentTime + delay;
      const osc = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now);

      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.18, now + 0.04);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 2.2);

      osc.connect(gainNode);
      gainNode.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 2.4);
    });
  }
};
```

---

## 5. Caveats
- No caveats regarding asset files: `app/src/main/assets/index.html` is the sole web asset file in the project.
- The web assets rely on Google Fonts (`Plus Jakarta Sans`, `JetBrains Mono`, `Material Symbols Outlined`) and Tailwind CDN (`https://cdn.tailwindcss.com`). The native WebView requires internet access or cached assets to load CDN resources; all styles and icons operate with fallback system sans-serif and unicode symbols.
- Android system chrome changes (`MainActivity.kt`, `themes.xml`, `colors.xml`) are tracked in parallel by the native inspection and must be coordinated so the status bar and navigation bar background match `#F8F9FA`.

---

## 6. Conclusion
The frontend web architecture is cleanly contained in `app/src/main/assets/index.html` (1,240 lines). The complete design and technical blueprint for Requirements R1–R6 is fully mapped:
1. **Light Palette & Theming (R1)**: Migration to `#F8F9FA` warm porcelain canvas, `#FFFFFF` cards, `#3D7055` sage accent, `#D97706` amber accents, and `#1E293B` text.
2. **Dashboard & Navigation (R2)**: Morning horizon hero card with natural countdown, 2 primary bottom navigation tabs ("Alarms" and "NFC Tags"), and an elevated center '+' button.
3. **Alarm Cards (R3)**: Smooth inline accordion expansion with interactive day pills, assigned tag selector, and horizontal swipe-to-delete with haptic feedback.
4. **Time Picker (R4)**: Circular radial clock dial with smooth hour/minute trigonometry pointer tracking, haptic clicks, auto-advance, AM/PM toggle, and morning presets (6:00, 6:30, 7:00, 7:30).
5. **Dawn Active Alarm (R5)**: Peaceful sunrise horizon gradient, dim-to-brightening wake transition, organic breathing NFC wave, and clear disarm guidance.
6. **Zen Soundscapes & Haptics (R6)**: Multi-oscillator Tibetan Singing Bowl and Celestial Morning Chime synthesis paired with `RizeNativeInterface.vibrate`.

All existing bridge functions (`RizeNative.vibrate`, `startAlarmSound`, `stopAlarmSound`, `setScreenAwake`, `window.onNativeNfcTag`, `window.handleBackNav`) will remain 100% contract-compatible with the native Android layer.

---

## 7. Verification Method

### 7.1 Independent Inspection
1. Inspect `app/src/main/assets/index.html` to verify lines and structures documented above.
2. Inspect `app/src/main/java/com/rize/nfc/MainActivity.kt` and `RizeNativeInterface.kt` to verify bridge signatures.

### 7.2 Independent Verification Commands
Run in PowerShell from the project root (`c:\Users\husai\Downloads\Rize`):
```powershell
$env:JAVA_HOME="C:\Program Files\Android\Android Studio\jbr"
./gradlew testDebugUnitTest
./gradlew assembleDebug
```
Both commands must complete with Exit Code 0 and `BUILD SUCCESSFUL`.
