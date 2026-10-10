# Project: RIZE Application Revamp

## Architecture
RIZE is an Android native hybrid application composed of:
1. **Android Native Shell (`com.rize.nfc`)**:
   - `MainActivity.kt`: Hosts full-viewport `WebView`, controls system window chrome (status bar, navigation bar), handles NFC hardware reader lifecycle, and dispatches Android hardware back navigation.
   - `RizeNativeInterface.kt`: Injected via `webView.addJavascriptInterface(..., "RizeNative")`. Exposes haptics (`vibrate`, `stopVibrate`), audio (`startAlarmSound`, `stopAlarmSound`), screen wake lock (`setScreenAwake`), and NFC system queries (`isNfcAvailable`, `isNfcEnabled`, `openNfcSettings`).
   - Native resources (`themes.xml`, `colors.xml`, launcher icons): defines Material theme with light status bar and navigation bar styling.
2. **Frontend Single-Page Application (`app/src/main/assets/index.html`)**:
   - Clean, modular modern SPA utilizing Tailwind CSS and Google Fonts.
   - Screen management: Dashboard (`#screen-dashboard`), Add/Edit Alarm with Radial Dial (`#screen-add`), NFC Hardware (`#screen-nfc`), and Gentle Dawn Active Alarm (`#screen-active`).
   - Local storage persistence (`rize_alarms`, `rize_tags`).
   - Zen soundscape synthesizer utilizing Web Audio API (multi-oscillator Tibetan Singing Bowl & Celestial Morning Chime with gentle harmonic swell).
   - Bidirectional native bridge integration (`window.RizeNative`, `window.onNativeNfcTag`, `window.handleBackNav`).
3. **E2E Testing Track**:
   - Automated testing suite verifying DOM structure, styling tokens, time math & dial trigonometry, card gesture states, Web Audio synthesizers, and native bridge callbacks.

## Code Layout
```
c:\Users\husai\Downloads\Rize\
├── app/
│   ├── build.gradle.kts
│   └── src/
│       ├── main/
│       │   ├── AndroidManifest.xml
│       │   ├── java/com/rize/nfc/
│       │   │   ├── MainActivity.kt
│       │   │   └── RizeNativeInterface.kt
│       │   ├── assets/
│       │   │   └── index.html
│       │   └── res/
│       │       ├── values/
│       │       │   ├── colors.xml
│       │       │   └── themes.xml
│       │       └── drawable/
│       │           ├── ic_launcher_background.xml
│       │           └── ic_launcher_foreground.xml
│       └── test/
│           └── java/com/rize/nfc/
│               └── ExampleUnitTest.kt
├── gradle.properties
├── build.gradle.kts
├── settings.gradle.kts
└── tests/
    └── e2e/
        ├── runner.js
        └── test_suites/
```

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | R1.1 Soft Warm Canvas & Surfaces | Replace dark palette with `#F8F9FA` canvas, `#FFFFFF` cards, `#E5E7EB` hairline borders, and diffuse shadows | M2 | ORIGINAL_REQUEST §R1 |
| 2 | R1.2 Organic Accent Palette | Sage/pine (`#3D7055` / `#2D5A43`), dawn amber (`#D97706`), calm slate (`#64748B`), and dark slate text (`#1E293B`). No neon cyan/green | M2 | ORIGINAL_REQUEST §R1 |
| 3 | R1.3 Android System Chrome Theming | Light status bar and navigation bar (`#F8F9FA`) with dark icons via `WindowCompat` & `WindowInsetsControllerCompat` | M1 | ORIGINAL_REQUEST §R1 |
| 4 | R1.4 Android Resources & Themes | Update `themes.xml` (parent `Theme.MaterialComponents.Light.NoActionBar`), `colors.xml`, and launcher icons | M1 | ORIGINAL_REQUEST §R1 |
| 5 | R2.1 Clean Brand & Header | Clean minimalist "RIZE" brand title with morning icon and subtle test trigger action | M2 | ORIGINAL_REQUEST §R2 |
| 6 | R2.2 Morning Glanceable Hero Card | Morning hero countdown card ("Wake up in 6h 24m", "Next Alarm: Tomorrow, 6:30 AM") and "Active & Ready" status | M3 | ORIGINAL_REQUEST §R2 |
| 7 | R2.3 Bottom Navigation Architecture | 2 primary tabs ("Alarms" and "NFC Tags") with elevated, thumb-friendly '+' button (`bg-[#3D7055]`) | M2 | ORIGINAL_REQUEST §R2 |
| 8 | R2.4 Humanized Copywriting | Replace all tactical/cyberpunk terms ("SYS//", "TARGET ARMED", "STACK", "HARDWARE") with peaceful language | M2, M3, M5 | ORIGINAL_REQUEST §R2 |
| 9 | R3.1 Alarm Card Typography & Toggles | Serene time typography (`06:30 AM`), intuitive toggle switch, repeat days pills, and NFC checkpoint tag pill | M3 | ORIGINAL_REQUEST §R3 |
| 10 | R3.2 Inline Card Expansion | Tapping card expands smoothly in-place on dashboard to adjust repeat days, assigned NFC tag, sound, and quick toggles | M3 | ORIGINAL_REQUEST §R3 |
| 11 | R3.3 Horizontal Swipe Actions | Swiping card horizontally reveals smooth quick-action buttons (Delete) with tactile haptic feedback | M3 | ORIGINAL_REQUEST §R3 |
| 12 | R4.1 Circular Radial Clock Dial Face | SVG clock face dial with 12 radial positions for hours and minutes, central clock hand line and pointer bead | M4 | ORIGINAL_REQUEST §R4 |
| 13 | R4.2 Radial Dragging & Trigonometry | Draggable/tappable hand using `atan2` tracking with gentle haptic clicks (`vibrate("click")`/`vibrate("tick")`) on each tick | M4 | ORIGINAL_REQUEST §R4 |
| 14 | R4.3 Dial Mode Transition & Presets | Smooth transition from Hour to Minute mode, AM/PM toggle pill, and quick morning presets (6:00, 6:30, 7:00, 7:30) | M4 | ORIGINAL_REQUEST §R4 |
| 15 | R5.1 Dawn Morning Horizon Aesthetics | Active alarm firing screen with soft sunrise gradient (`#FEF3C7` to `#F8F9FA`), serene time display, and breathing circular NFC wave | M5 | ORIGINAL_REQUEST §R5 |
| 16 | R5.2 Dim-to-Brightening Transition | Starts in soft warm dimmed ambient state (`brightness(0.65)`), smoothly brightens over 12s or on touch to protect groggy eyes | M5 | ORIGINAL_REQUEST §R5 |
| 17 | R5.3 Peaceful NFC Disarm & Snooze | Calming instruction ("Tap Bathroom Mirror NFC Tag to disarm"), simulated NFC tap, and emergency snooze (+5 min) | M5 | ORIGINAL_REQUEST §R5 |
| 18 | R6.1 Zen Soundscapes Synthesizer | Multi-oscillator Tibetan Singing Bowl and Celestial Morning Chimes with gentle harmonic swell via Web Audio API | M5 | ORIGINAL_REQUEST §R6 |
| 19 | R6.2 Organic Native Haptics | Native haptics paired with dial ticks, card swipe snaps, inline toggles, and NFC verification | M1, M3, M4, M5 | ORIGINAL_REQUEST §R6 |
| 20 | Bridge Compatibility & Integrity | 100% preservation of `RizeNativeInterface.kt`, `window.RizeNative`, `window.onNativeNfcTag`, and `window.handleBackNav` | M1, M5, M6 | Acceptance Criteria |
| 21 | E2E Opaque-Box Test Suite | Comprehensive 4-tier E2E testing runner and test cases covering all R1-R6 requirements | E2E Track | Architecture & AC |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| E2E | E2E Testing Suite | Requirements-driven test runner and test cases for Tiers 1-4 | none | DONE |
| M1 | Android Native System Styling & Bridge | `MainActivity.kt`, `themes.xml`, `colors.xml`, `RizeNativeInterface.kt`, and `gradle.properties` | none | DONE |
| M2 | UI Theming & Core Shell Foundation | Design tokens, color palette, "RIZE" brand header, 2-tab bottom nav with center '+' button, humanized copy | M1 | DONE |
| M3 | Dashboard Hero & Swipable/Expandable Cards | Morning hero countdown card, inline expandable alarm cards, horizontal swipe-to-delete gesture | M2 | DONE |
| M4 | Radial Clock Face Dial Time Picker | Interactive SVG radial dial, trigonometry touch tracking, haptic ticks, Hour/Minute mode auto-advance, AM/PM, presets | M2 | DONE |
| M5 | Dawn Waking Screen, Zen Sounds & NFC Flow | Sunrise horizon aesthetic, dim-to-brightening transition, breathing NFC wave, Tibetan bowl/chimes, NFC disarm flow | M2, M3 | PLANNED |
| M6 | Final Verification & Adversarial Hardening | Pass 100% E2E test suite (Tiers 1-4) + adversarial testing + forensic integrity audit | M1, M2, M3, M4, M5, E2E | PLANNED |

## Interface Contracts

### 1. Native Android (`MainActivity.kt` & `RizeNativeInterface.kt`) ↔ Web JavaScript
- **Bridge Object**: Injected as `window.RizeNative` (aliased safely in JS to `window.Android = window.RizeNative`).
- **Methods**:
  - `isNfcAvailable(): Boolean`
  - `isNfcEnabled(): Boolean`
  - `openNfcSettings(): Unit`
  - `vibrate(type: String): Unit` (Supported types: `"click"`, `"heavy_click"`, `"success"`, `"alarm_pulse"`, `"tick"`)
  - `stopVibrate(): Unit` (MUST be called whenever `"alarm_pulse"` ends)
  - `startAlarmSound(): Unit`
  - `stopAlarmSound(): Unit`
  - `setScreenAwake(awake: Boolean): Unit`
  - `setSystemBarTheme(isLight: Boolean, colorHex: String): Unit` (optional dynamic bar dimming)
- **Native-to-JS Callbacks**:
  - `window.onNativeNfcTag(scannedUid: String)`: `scannedUid` formatted as uppercase colon-separated hex string (`%02X:%02X:...`).
  - `window.handleBackNav(): Boolean`: Intercepts physical back button. Returns `true` if handled by web SPA (e.g., closing modal, returning to dashboard, collapsing card), `false` to pop Android activity.

### 2. Local Storage Schemas
- `rize_alarms`: JSON array of alarm objects:
  ```json
  [
    {
      "id": "alarm_1",
      "time": "06:30",
      "label": "Morning Focus",
      "days": [1, 2, 3, 4, 5],
      "enabled": true,
      "tagId": "tag_mirror",
      "tagName": "Bathroom Mirror",
      "sound": "tibetan_bowl",
      "vibrate": true
    }
  ]
  ```
- `rize_tags`: JSON array of registered NFC tag checkpoints:
  ```json
  [
    {
      "id": "tag_mirror",
      "name": "Bathroom Mirror",
      "uid": "04:5A:B2:1C:89",
      "location": "Master Bathroom"
    }
  ]
  ```

### 3. Build & Test Commands
- Gradle Java Home: `C:\Program Files\Android\Android Studio\jbr`
- Test debug unit tests:
  ```powershell
  $env:JAVA_HOME="C:\Program Files\Android\Android Studio\jbr"
  .\gradlew.bat testDebugUnitTest
  ```
- Assemble debug APK:
  ```powershell
  $env:JAVA_HOME="C:\Program Files\Android\Android Studio\jbr"
  .\gradlew.bat assembleDebug
  ```
