# Design Specification: RIZE React Native & Expo Port

**Date**: 2026-10-14  
**Topic**: React Native + Expo Architecture, Editorial UI/UX with Kiora Palette, and Offline-First Alarm Engine  
**Status**: DRAFT (Awaiting Review)  

---

## 1. Executive Summary & Goals
RIZE is transitioning from an Android WebView prototype into a production-grade, local-first mobile application built on **React Native (Expo SDK 52+)** with **TypeScript**, **Expo Router**, **NativeWind (Tailwind CSS)**, and **React Native Reanimated**.

### Core Goals:
1. **Editorial Calm Visual Identity**: Replace the prototype styling with the cohesive, contemplative **Kiora** color palette (abyssal navies, twilight slates, celestial cyans) paired with a high-end typography hierarchy (**Lora** serif for titles, **Plus Jakarta Sans** for precision UI and tabular time).
2. **Fluid Micro-Animations**: Implement 60/120fps spring physics for swipeable cards, interactive SVG radial clock dial (`atan2` trigonometry with haptic ticks), and breathing wake waves.
3. **Local-First / Zero Cloud Overhead**: Deliver an offline-first storage model using `expo-sqlite` for alarm schedules, paired NFC checkpoints, and wake logs with zero latency and maximum privacy.
4. **Reliable Hardware Integration**: Leverage device-native ringtones, continuous NFC tag scanning via `react-native-nfc-manager`, and Android exact alarm scheduling (`AlarmManager.setAlarmClock`) with lockscreen waking capabilities.
5. **Day-One CI/CD**: Automated GitHub Actions workflow testing TypeScript types, ESLint rules, and Jest unit tests.

---

## 2. Visual Design System

### 2.1 The Kiora Color System
* **Canvas / Abyssal Night (`#011C40`)**: Immersive, deep base canvas that protects dark-adapted eyes in the evening and morning.
* **Elevated Surfaces / Midnight Navy (`#023859`)**: Primary card containers, bottom navigation sheets, and elevated modal surfaces.
* **Structural Borders / Twilight Slate (`#26658C`)**: Hairline borders, inactive toggle tracks, dividers, and inactive day pills.
* **Primary Interactive / Ocean Cerulean (`#54ACBF`)**: Active button fills, selected repeat days, dial hand bead, and toggle thumbs.
* **High-Emphasis Accent / Celestial Cyan (`#A7EBF2`)**: Primary glanceable time numerals, next alarm countdown pill, glowing NFC wave ripples, and active state highlights.

### 2.2 Typography
* **Serif Display (H1, H2, Modal Titles)**: **Lora** (Google Fonts). Introduces a human, literary cadence that creates a relaxed feeling of presence.
* **Body & UI Elements**: **Plus Jakarta Sans** (Google Fonts). Geometric structure, generous letter-spacing, and clear hierarchy for glanceable data.
* **Time Numerals**: Monospace/tabular digits (`font-mono` / tabular numbers) to ensure zero layout shift during time selection and live countdowns.

---

## 3. Architecture & File Structure

```
rize/
├── .github/
│   └── workflows/
│       └── ci.yml                         # CI: TypeScript check, lint, Jest tests
├── app/                                   # Expo Router file-based screens
│   ├── _layout.tsx                        # Root layout (Fonts, SQLite Provider, Gestures)
│   ├── index.tsx                          # Dashboard: Hero card, alarm list, bottom bar
│   ├── alarms/
│   │   ├── new.tsx                        # Add Alarm modal (Radial dial + repeat settings)
│   │   └── [id].tsx                       # Edit Alarm modal
│   ├── nfc/
│   │   └── index.tsx                      # NFC Checkpoints management & pairing sheet
│   └── active-alarm.tsx                   # Full-screen lockscreen waking screen
├── src/
│   ├── components/
│   │   ├── ui/                            # Atoms: Card, Button, Switch, DayPicker, Badge
│   │   ├── RadialClockPicker.tsx          # SVG Clock dial with touch tracking & haptics
│   │   ├── SwipeableAlarmCard.tsx         # Reanimated spring-loaded swipe-to-delete card
│   │   └── ActiveWakeWave.tsx             # Pulsing concentric rings for NFC scanner
│   ├── features/
│   │   ├── alarms/                        # Alarm entity types, calculation logic, countdowns
│   │   ├── nfc/                           # NFC Manager wrapper, scanning hooks & pairing
│   │   └── ringtones/                     # System ringtone integration & audio player
│   ├── db/
│   │   ├── schema.ts                      # SQLite table definitions & migrations
│   │   └── alarmsRepository.ts            # Local CRUD operations
│   ├── hooks/
│   │   ├── useAlarmCountdown.ts           # Real-time countdown calculation hook
│   │   └── useHaptics.ts                  # Haptic triggers (selection, impact, pulse)
│   └── styles/
│       └── theme.ts                       # Kiora color constants & typography mapping
├── legacy/                                # Preserved original Android WebView prototype
├── app.json                               # Expo configuration & plugins
├── package.json
└── tsconfig.json
```

---

## 4. Feature Specifications

### 4.1 Dashboard (`app/index.tsx`)
* **Header**: Serene "RIZE" brand heading in Lora serif with subtle quick test action.
* **Glanceable Hero**: Card styled in `#023859` with `#26658C` border showing:
  * "Wake up in 6h 45m" countdown badge in Celestial Cyan (`#A7EBF2`).
  * "Active & Ready" breathing status indicator.
  * Next scheduled alarm time, day, and assigned NFC tag.
* **Alarm List**: Scrollable list of `SwipeableAlarmCard` components:
  * Left: Serene time typography (`06:30 AM`) + alarm label.
  * Right: Tactile switch toggle.
  * Tapping expands accordion to reveal: repeat days selector, assigned NFC tag, ringtone picker.
  * Swiping left reveals smooth "Delete" action with haptic confirmation.
* **Bottom Action Bar**: Floating, thumb-friendly navigation with center '+' action in Ocean Cerulean (`#54ACBF`).

### 4.2 Radial Clock Face Picker (`src/components/RadialClockPicker.tsx`)
* Custom SVG dial with 12 radial hour positions and 60-minute positions.
* Drag gesture using `react-native-gesture-handler` and `atan2` angle math.
* Tactile haptic feedback (`Haptics.selectionAsync()`) as finger snaps across hour/minute ticks.
* Auto-advances from Hour mode to Minute mode with spring transition upon release.
* Presets: Quick-set buttons for 06:00, 06:30, 07:00, 07:30.

### 4.3 Dawn Waking Screen & NFC Disarm (`app/active-alarm.tsx`)
* Full-screen wake layout triggered upon alarm execution.
* **Dim-to-Brightening Ambient Transition**: Starts at subdued ambient brightness and gently brightens over 15 seconds to ease waking eyes.
* **Audio & Haptics**: Plays user's chosen system alarm ringtone in an infinite loop while pulsing the vibration motor.
* **NFC Wave Radar**: Concentric breathing circles in Celestial Cyan (`#A7EBF2`) around the tag target icon.
* **Disarm Action**: Scanning the assigned NFC tag instantly verifies the serial UID against local SQLite database, terminates audio/vibration, logs the wake event, and dismisses the screen.
* **Emergency Snooze**: Subtle button offering a +5 minute fallback snooze.

### 4.4 NFC Tag Management & Pairing (`app/nfc/index.tsx`)
* Lists all registered NFC checkpoints (e.g., "Bathroom Mirror", "Kitchen Coffee Maker", "Study Desk").
* "Pair New Tag" modal: Activates `react-native-nfc-manager` session; tapping any standard NFC sticker/card captures its UID, verifies uniqueness, and stores it in SQLite.

---

## 5. Offline-First Data Schema (SQLite)

```sql
CREATE TABLE IF NOT EXISTS alarms (
    id TEXT PRIMARY KEY,
    time TEXT NOT NULL,          -- "06:30" (24-hour format)
    label TEXT NOT NULL,
    repeat_days TEXT NOT NULL,   -- JSON array: [1,2,3,4,5] (Monday=1)
    is_enabled INTEGER NOT NULL DEFAULT 1,
    tag_id TEXT,                 -- Foreign key to nfc_tags(id)
    ringtone_uri TEXT,           -- System sound URI or default
    vibrate INTEGER NOT NULL DEFAULT 1,
    created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS nfc_tags (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,          -- e.g. "Bathroom Mirror"
    uid TEXT UNIQUE NOT NULL,    -- Hex string e.g. "04:5A:B2:1C:89"
    location TEXT,
    created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS wake_logs (
    id TEXT PRIMARY KEY,
    alarm_id TEXT NOT NULL,
    scheduled_time TEXT NOT NULL,
    dismissed_at INTEGER NOT NULL,
    method TEXT NOT NULL         -- "nfc" or "snooze"
);
```

---

## 6. Testing & CI/CD Strategy
* **CI Workflow (`.github/workflows/ci.yml`)**:
  * Trigger: Push and Pull Request to `feat/*`, `fix/*`, and `main`.
  * Steps: `pnpm install`, `pnpm run lint` (ESLint), `pnpm run typecheck` (`tsc --noEmit`), and `pnpm test` (Jest unit tests).
* **Unit Tests (`tests/unit/`)**:
  * Alarm countdown calculations, next-alarm resolution across days.
  * Radial angle-to-time trigonometry math.
  * SQLite repository CRUD operations.
