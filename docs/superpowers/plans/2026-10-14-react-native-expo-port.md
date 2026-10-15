# React Native & Expo Port Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port the RIZE application to a production-grade, local-first React Native + Expo architecture with the Kiora color palette, Lora + Plus Jakarta Sans typography, fluid Reanimated micro-interactions, and on-device SQLite storage.

**Architecture:** A modular React Native app built on Expo SDK 52 and Expo Router, styled with NativeWind (Tailwind CSS) using the Kiora oceanic/celestial palette. Micro-interactions and touch tracking use React Native Reanimated and Gesture Handler. All alarms, paired NFC checkpoints, and wake records are persisted offline-first via `expo-sqlite`.

**Tech Stack:** React Native 0.76+, Expo SDK 52, TypeScript, Expo Router, NativeWind (Tailwind), React Native Reanimated 3, React Native Gesture Handler, `expo-sqlite`, `expo-haptics`, `react-native-nfc-manager`, Jest, ESLint.

## Global Constraints
- Canvas: Abyssal Night (`#011C40`)
- Surfaces: Midnight Navy (`#023859`)
- Borders: Twilight Slate (`#26658C`)
- Interactive Primary: Ocean Cerulean (`#54ACBF`)
- High-Emphasis Accent: Celestial Cyan (`#A7EBF2`)
- Serif Display Font: Lora
- Geometric UI & Tabular Numbers Font: Plus Jakarta Sans
- Persistence: Offline-first on-device SQLite (zero mandatory cloud dependency)
- CI/CD: Automated GitHub Actions workflow on every push and PR
- Commit Rules: Conventional commit format (`feat:`, `fix:`, `chore:`, `refactor:`, `test:`); `feat`/`fix`/`refactor` must include a `Why:` line

---

### Task 1: Repository Archive, Expo Scaffolding & CI/CD Pipeline

**Files:**
- Create: `.github/workflows/ci.yml`
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `app.json`
- Create: `metro.config.js`
- Create: `babel.config.js`
- Create: `tailwind.config.js`
- Create: `global.css`
- Move: Legacy Android shell (`app/`, `gradle/`, `gradlew*`, `build.gradle.kts`, `settings.gradle.kts`) to `legacy/`

**Interfaces:**
- Produces: Runnable Expo environment with TypeScript, Tailwind compilation, and automated CI pipeline.

- [ ] **Step 1: Move legacy Android prototype to `legacy/`**
  Move existing Android native and Gradle files into `legacy/` so historical work is preserved without conflicting with the new root.
- [ ] **Step 2: Scaffold root `package.json` with Expo SDK 52 & dependencies**
  Configure dependencies: `expo`, `expo-router`, `react-native`, `nativewind`, `tailwindcss`, `react-native-reanimated`, `react-native-gesture-handler`, `expo-sqlite`, `expo-haptics`, `react-native-svg`, `react-native-nfc-manager`, and testing libraries (`jest`, `@testing-library/react-native`, `typescript`).
- [ ] **Step 3: Setup TypeScript and Metro/Tailwind configuration**
  Create `tsconfig.json`, `metro.config.js` (with NativeWind wrapper), and `tailwind.config.js` configured with Kiora palette colors.
- [ ] **Step 4: Create GitHub Actions CI workflow (`.github/workflows/ci.yml`)**
  Configure CI pipeline running on push and PR to `main` and `feat/*`:
  1. `pnpm install --frozen-lockfile`
  2. `pnpm run lint`
  3. `pnpm run typecheck` (`tsc --noEmit`)
  4. `pnpm test`
- [ ] **Step 5: Verify CI configuration and project build integrity**
  Run: `pnpm run typecheck`
  Expected: Clean pass with 0 errors.
- [ ] **Step 6: Stage and commit Task 1**
  Suggested Commit:
  ```
  chore: initialize expo project scaffolding and ci pipeline
  ```

---

### Task 2: Kiora Design System, Theme Tokens & Typography Setup

**Files:**
- Create: `src/styles/theme.ts`
- Create: `src/components/ui/Text.tsx`
- Create: `src/components/ui/Card.tsx`
- Create: `src/components/ui/Button.tsx`
- Create: `src/components/ui/Badge.tsx`
- Test: `tests/unit/theme.test.ts`

**Interfaces:**
- Produces:
  - `THEME.colors`: Typed constants for Abyssal Night (`#011C40`), Midnight Navy (`#023859`), Twilight Slate (`#26658C`), Ocean Cerulean (`#54ACBF`), and Celestial Cyan (`#A7EBF2`).
  - Base UI components (`Text`, `Card`, `Button`, `Badge`) that automatically apply Kiora palette styles and font families.

- [ ] **Step 1: Write failing theme test**
  Verify color token values and theme export contracts.
- [ ] **Step 2: Run test to verify it fails**
  Run: `pnpm test tests/unit/theme.test.ts`
- [ ] **Step 3: Implement `src/styles/theme.ts` & atomic UI components**
  Export `THEME` object and reusable primitive wrappers supporting Lora and Plus Jakarta Sans.
- [ ] **Step 4: Run test to verify it passes**
  Run: `pnpm test tests/unit/theme.test.ts`
- [ ] **Step 5: Stage and commit Task 2**
  Suggested Commit:
  ```
  feat: add kiora design system tokens and atomic ui components

  Why: establishes foundational aesthetic and typography for the new mobile interface
  ```

---

### Task 3: Local-First SQLite Database Engine & Repositories

**Files:**
- Create: `src/db/schema.ts`
- Create: `src/db/database.ts`
- Create: `src/db/alarmsRepository.ts`
- Create: `src/db/nfcTagsRepository.ts`
- Test: `tests/unit/db.test.ts`

**Interfaces:**
- Produces:
  - `initDatabase(): Promise<SQLiteDatabase>`
  - `alarmsRepository`: `getAllAlarms()`, `getAlarmById(id)`, `createAlarm(alarm)`, `updateAlarm(alarm)`, `deleteAlarm(id)`, `toggleAlarm(id, enabled)`
  - `nfcTagsRepository`: `getAllTags()`, `getTagById(id)`, `registerTag(tag)`, `deleteTag(id)`

- [ ] **Step 1: Write failing database and repository tests**
  Write unit tests verifying table initialization, alarm creation, toggle updates, and tag registration.
- [ ] **Step 2: Run test to verify it fails**
  Run: `pnpm test tests/unit/db.test.ts`
- [ ] **Step 3: Implement SQLite database schema and repository methods**
  Write typed SQLite queries handling `alarms`, `nfc_tags`, and `wake_logs` tables with JSON serialization for repeat days.
- [ ] **Step 4: Run test to verify it passes**
  Run: `pnpm test tests/unit/db.test.ts`
- [ ] **Step 5: Stage and commit Task 3**
  Suggested Commit:
  ```
  feat: implement offline-first sqlite database and repositories

  Why: provides zero-latency on-device persistence for alarms and nfc checkpoints
  ```

---

### Task 4: Time Utilities, Alarm Scheduling Math & Hero Countdown Engine

**Files:**
- Create: `src/features/alarms/timeUtils.ts`
- Create: `src/hooks/useAlarmCountdown.ts`
- Test: `tests/unit/timeUtils.test.ts`

**Interfaces:**
- Produces:
  - `calculateNextOccurrence(time: string, repeatDays: number[]): Date`
  - `formatRemainingDuration(targetDate: Date, now?: Date): string` (e.g. "6h 45m")
  - `formatDisplayTime(time: string): { timeString: string, period: 'AM' | 'PM' }`
  - `useAlarmCountdown(nextAlarm: Alarm | null): { formattedCountdown: string, isImminent: boolean }`

- [ ] **Step 1: Write failing time calculation tests**
  Test edge cases: midnight transitions, tomorrow morning alarms, weekend repeat patterns, single-run alarms.
- [ ] **Step 2: Run test to verify it fails**
  Run: `pnpm test tests/unit/timeUtils.test.ts`
- [ ] **Step 3: Implement time utility functions and countdown hook**
- [ ] **Step 4: Run test to verify it passes**
  Run: `pnpm test tests/unit/timeUtils.test.ts`
- [ ] **Step 5: Stage and commit Task 4**
  Suggested Commit:
  ```
  feat: add alarm scheduling math and countdown engine

  Why: enables accurate glanceable countdowns and recurrence resolution
  ```

---

### Task 5: Interactive SVG Radial Clock Dial Component

**Files:**
- Create: `src/components/RadialClockPicker.tsx`
- Create: `src/utils/dialTrigonometry.ts`
- Test: `tests/unit/dialTrigonometry.test.ts`

**Interfaces:**
- Consumes: `THEME.colors`
- Produces:
  - `angleToHour(angleRad: number): number` (1-12)
  - `angleToMinute(angleRad: number): number` (0-59)
  - `<RadialClockPicker value={time} onChange={setTime} mode={mode} onModeChange={setMode} />`

- [ ] **Step 1: Write failing trigonometry tests**
  Test angle-to-time conversions at 0, 90, 180, 270 degrees and notch snapping.
- [ ] **Step 2: Run test to verify it fails**
  Run: `pnpm test tests/unit/dialTrigonometry.test.ts`
- [ ] **Step 3: Implement trigonometry utilities and SVG RadialClockPicker**
  Implement smooth gesture tracking via `PanGestureHandler`, needle line, pointer bead, 12 radial hour markers, and tactile haptic clicks on step boundaries (`expo-haptics`).
- [ ] **Step 4: Run test to verify it passes**
  Run: `pnpm test tests/unit/dialTrigonometry.test.ts`
- [ ] **Step 5: Stage and commit Task 5**
  Suggested Commit:
  ```
  feat: create interactive radial clock dial with haptic feedback

  Why: provides an intuitive, tactile time-selection experience on mobile touchscreens
  ```

---

### Task 6: Swipeable & Expandable Alarm Card Component

**Files:**
- Create: `src/components/SwipeableAlarmCard.tsx`
- Create: `src/components/RepeatDaysSelector.tsx`
- Test: `tests/unit/SwipeableAlarmCard.test.tsx`

**Interfaces:**
- Consumes: `THEME.colors`, `Alarm` model, `alarmsRepository`
- Produces:
  - `<SwipeableAlarmCard alarm={alarm} onToggle={handleToggle} onDelete={handleDelete} onUpdate={handleUpdate} />`

- [ ] **Step 1: Write failing card component tests**
  Verify rendering of formatted time, day pills, NFC tag label, and toggle callback firing.
- [ ] **Step 2: Run test to verify it fails**
  Run: `pnpm test tests/unit/SwipeableAlarmCard.test.tsx`
- [ ] **Step 3: Implement SwipeableAlarmCard with Reanimated 3**
  Add horizontal swipe resistance for delete action with haptic confirmation and accordion expansion (`Layout.springify()`) for inline tag and repeat configuration.
- [ ] **Step 4: Run test to verify it passes**
  Run: `pnpm test tests/unit/SwipeableAlarmCard.test.tsx`
- [ ] **Step 5: Stage and commit Task 6**
  Suggested Commit:
  ```
  feat: build swipeable expandable alarm card with spring physics

  Why: allows effortless glanceable control, quick toggles, and inline editing
  ```

---

### Task 7: Dashboard Screen & Navigation Shell

**Files:**
- Create: `app/_layout.tsx`
- Create: `app/index.tsx`
- Create: `src/components/DashboardHero.tsx`
- Create: `src/components/BottomNavBar.tsx`
- Test: `tests/unit/Dashboard.test.tsx`

**Interfaces:**
- Produces:
  - Root layout with font loaders (`useFonts` for Lora & Plus Jakarta Sans) and SQLite provider.
  - Dashboard screen featuring Glanceable Hero countdown ("Wake up in 6h 45m"), alarm list, empty state illustration, and bottom navigation bar with elevated '+' action.

- [ ] **Step 1: Write failing dashboard component tests**
  Verify hero displays nearest active alarm countdown, renders alarm cards from SQLite, and triggers navigation on '+' button.
- [ ] **Step 2: Run test to verify it fails**
  Run: `pnpm test tests/unit/Dashboard.test.tsx`
- [ ] **Step 3: Implement Root Layout and Dashboard Screen**
  Wire real database state, font loading state, and hero countdown updates.
- [ ] **Step 4: Run test to verify it passes**
  Run: `pnpm test tests/unit/Dashboard.test.tsx`
- [ ] **Step 5: Stage and commit Task 7**
  Suggested Commit:
  ```
  feat: build root layout and dashboard with glanceable hero

  Why: establishes the primary morning overview and alarm management hub
  ```

---

### Task 8: Add & Edit Alarm Screen Modal

**Files:**
- Create: `app/alarms/new.tsx`
- Create: `app/alarms/[id].tsx`
- Test: `tests/unit/AlarmModal.test.tsx`

**Interfaces:**
- Consumes: `RadialClockPicker`, `RepeatDaysSelector`, `nfcTagsRepository`, `alarmsRepository`
- Produces:
  - Modal sheets to configure alarm time (via radial dial), label, repeat schedule, assigned NFC checkpoint tag, and ringtone/vibration settings.

- [ ] **Step 1: Write failing alarm creation modal test**
  Verify form validation, default preset selections (06:30 AM), and database insert on save.
- [ ] **Step 2: Run test to verify it fails**
  Run: `pnpm test tests/unit/AlarmModal.test.tsx`
- [ ] **Step 3: Implement `app/alarms/new.tsx` and `app/alarms/[id].tsx`**
  Integrate radial dial, AM/PM toggle, preset buttons (6:00, 6:30, 7:00, 7:30), and save action returning to dashboard.
- [ ] **Step 4: Run test to verify it passes**
  Run: `pnpm test tests/unit/AlarmModal.test.tsx`
- [ ] **Step 5: Stage and commit Task 8**
  Suggested Commit:
  ```
  feat: add alarm creation and editing modal screens

  Why: allows setting alarm times via interactive radial dial with custom recurrence and nfc tags
  ```

---

### Task 9: NFC Tag Management & Tag Pairing Screen

**Files:**
- Create: `app/nfc/index.tsx`
- Create: `src/features/nfc/nfcService.ts`
- Create: `src/components/NfcPairingModal.tsx`
- Test: `tests/unit/nfcService.test.ts`

**Interfaces:**
- Produces:
  - `nfcService.scanTagUid(): Promise<string>`
  - NFC checkpoint listing screen with registered tags (e.g. Bathroom Mirror, Kitchen).
  - Pairing modal with visual NFC scanning wave and tag label input.

- [ ] **Step 1: Write failing NFC service unit tests**
  Mock NFC hardware adapter to test tag scanning, hex UID formatting, and error handling.
- [ ] **Step 2: Run test to verify it fails**
  Run: `pnpm test tests/unit/nfcService.test.ts`
- [ ] **Step 3: Implement NFC service and management screen**
  Wrap `react-native-nfc-manager` with error fallbacks (e.g. if NFC is disabled or unsupported), and implement tag registration sheet.
- [ ] **Step 4: Run test to verify it passes**
  Run: `pnpm test tests/unit/nfcService.test.ts`
- [ ] **Step 5: Stage and commit Task 9**
  Suggested Commit:
  ```
  feat: implement nfc checkpoint management and tag pairing

  Why: allows users to scan physical tags and pair them with wake-up routines
  ```

---

### Task 10: Dawn Waking Screen (Active Alarm with Dim-to-Bright & NFC Disarm)

**Files:**
- Create: `app/active-alarm.tsx`
- Create: `src/components/ActiveWakeWave.tsx`
- Create: `src/features/ringtones/alarmSoundService.ts`
- Test: `tests/unit/ActiveAlarm.test.tsx`

**Interfaces:**
- Consumes: `nfcTagsRepository`, `alarmsRepository`, `nfcService`
- Produces:
  - Full-screen wake layout with gradual dim-to-brightening ambient transition.
  - Looping audio playback and vibration pulse.
  - Active NFC listening loop verifying scanned tag UID against the alarm's assigned tag.
  - Emergency snooze (+5m) and disarm completion logging.

- [ ] **Step 1: Write failing active alarm disarm test**
  Verify scanning valid tag disarms alarm, invalid tag displays warning, and snooze reschedules alarm by +5m.
- [ ] **Step 2: Run test to verify it fails**
  Run: `pnpm test tests/unit/ActiveAlarm.test.tsx`
- [ ] **Step 3: Implement active waking screen with concentric ripple wave**
  Wire ambient brightness transition, audio player loop, NFC listener loop, and wake log persistence.
- [ ] **Step 4: Run test to verify it passes**
  Run: `pnpm test tests/unit/ActiveAlarm.test.tsx`
- [ ] **Step 5: Stage and commit Task 10**
  Suggested Commit:
  ```
  feat: implement dawn active alarm screen with nfc disarm flow

  Why: provides the core waking experience with sensory dimming and physical tag disarming
  ```

---

### Task 11: End-to-End Verification & Documentation Update

**Files:**
- Modify: `PROJECT.md`
- Test: `tests/` (run full suite)

- [ ] **Step 1: Execute full test suite and TypeScript validation**
  Run: `pnpm run typecheck && pnpm test`
  Expected: 100% pass across all unit tests and zero TypeScript errors.
- [ ] **Step 2: Update `PROJECT.md` documentation**
  Update architecture documentation to reflect React Native + Expo structure, Kiora styling tokens, and SQLite database schema.
- [ ] **Step 3: Stage and commit Task 11**
  Suggested Commit:
  ```
  docs: update project documentation to reflect expo architecture

  Why: ensures project documentation accurately documents the new react native codebase
  ```
