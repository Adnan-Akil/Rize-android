# Project: RIZE Application (React Native & Expo Port)

## Architecture
RIZE is a production-grade, local-first mobile application built with **React Native (Expo SDK 52+)**, **TypeScript**, **Expo Router**, **NativeWind (Tailwind CSS)**, and **React Native Reanimated**.

1. **Mobile Application Framework**:
   - Expo SDK 52 with file-based routing (`app/`).
   - Styled with the serene **Kiora** color palette (Abyssal Night, Midnight Navy, Twilight Slate, Ocean Cerulean, and Celestial Cyan).
   - High-end typography pairing: **Lora** (literary serif for headlines and titles) and **Plus Jakarta Sans** (clean geometric sans with tabular monospace numbers for time).
   - Fluid 60/120fps micro-animations via `react-native-reanimated` and `react-native-gesture-handler`.
2. **Offline-First Persistence**:
   - Local database layer powered by `expo-sqlite` (with seamless `InMemoryDatabaseAdapter` fallback for ultra-fast Jest testing).
   - Tables: `alarms`, `nfc_tags`, `wake_logs`.
   - Zero mandatory cloud dependency: instant startup, zero network latency, and complete user privacy.
3. **Hardware & Wake Services**:
   - Interactive SVG radial clock dial with `atan2` angle trigonometry and tactile haptic feedback (`expo-haptics`).
   - Native NFC tag scanning via `react-native-nfc-manager` for physical wake-up locks.
   - Dawn waking screen with gradual dim-to-brightening ambient transition and continuous looping wake alarms.
4. **CI/CD Pipeline**:
   - Automated GitHub Actions workflow (`.github/workflows/ci.yml`) on every push/PR running ESLint, TypeScript typechecks (`tsc --noEmit`), and Jest unit tests.

## Code Layout
```
c:\Users\husai\Downloads\Rize\
├── .github/
│   └── workflows/
│       └── ci.yml                         # Automated quality gate: lint, typecheck, tests
├── app/                                   # Expo Router file-based screens
│   ├── _layout.tsx                        # Root layout (Google Fonts, SQLite warmup, navigation)
│   ├── index.tsx                          # Dashboard: Glanceable hero, alarm card list, bottom nav
│   ├── alarms/
│   │   ├── new.tsx                        # Add Alarm modal (Radial dial + presets + NFC selector)
│   │   └── [id].tsx                       # Edit Alarm modal
│   ├── nfc/
│   │   └── index.tsx                      # NFC Checkpoints inventory & pairing sheet
│   └── active-alarm.tsx                   # Full-screen dawn waking screen with NFC disarm
├── src/
│   ├── components/                        # Reusable design primitives & micro-interaction atoms
│   │   ├── ui/                            # Text (Lora/Jakarta), Card, Button, Badge
│   │   ├── RadialClockPicker.tsx          # Interactive SVG radial dial with haptic ticks
│   │   ├── RepeatDaysSelector.tsx         # Weekly recurrence selector
│   │   ├── SwipeableAlarmCard.tsx         # Alarm card with inline schedule editor and toggle switch
│   │   ├── DashboardHero.tsx              # Glanceable countdown hero card
│   │   ├── BottomNavBar.tsx               # Floating navigation bar with elevated '+' action
│   │   ├── NfcPairingModal.tsx            # NFC hardware pairing sheet with scanning wave radar
│   │   └── ActiveWakeWave.tsx             # Concentric breathing wave radar for active wake screen
│   ├── db/
│   │   ├── schema.ts                      # SQLite table schemas and entity interfaces
│   │   ├── database.ts                    # SQLite and InMemory database adapters
│   │   ├── alarmsRepository.ts            # Typed CRUD queries for alarms
│   │   └── nfcTagsRepository.ts           # Typed CRUD queries for NFC tags
│   ├── features/
│   │   ├── alarms/
│   │   │   └── timeUtils.ts               # Recurrence math, 24h/12h conversions, duration format
│   │   ├── nfc/
│   │   │   └── nfcService.ts              # react-native-nfc-manager wrapper & UID formatting
│   │   └── ringtones/
│   │       └── alarmSoundService.ts       # Looping sound and vibration pulse engine
│   ├── hooks/
│   │   └── useAlarmCountdown.ts           # Real-time countdown calculation hook
│   └── styles/
│       └── theme.ts                       # Kiora color constants & typography mapping
├── tests/
│   └── unit/                              # 100% passing Jest unit test suite
├── legacy/                                # Preserved legacy Android WebView prototype
├── app.json
├── package.json
└── tsconfig.json
```

## The Kiora Design System
* **Abyssal Night (`#011C40`)**: Canvas background that eases dark-adapted eyes.
* **Midnight Navy (`#023859`)**: Card surfaces, bottom navigation sheet, and elevated panels.
* **Twilight Slate (`#26658C`)**: Hairline borders, inactive toggle tracks, dividers.
* **Ocean Cerulean (`#54ACBF`)**: Primary interactive buttons, selected repeat days, dial hand bead.
* **Celestial Cyan (`#A7EBF2`)**: Active countdown pills, prominent time numerals, NFC wave ripples.

## Verification & Commands
* **Typecheck**:
  ```powershell
  pnpm run typecheck
  ```
* **Run Unit Tests**:
  ```powershell
  pnpm test
  ```
* **Start Development Server**:
  ```powershell
  pnpm start
  ```
