# Original User Request

## Initial Request — 2026-10-09T16:25:49Z

Completely revamp the RIZE application UI and Android system styling into a polished, calming light theme with an intuitive mobile layout, radial clock dial time picker, inline expandable and swipable alarm cards, and a gentle dawn waking screen.

Working directory: c:\Users\husai\Downloads\Rize
Integrity mode: development

## Requirements

### R1. Calming Light Visual Identity & Palette
- Replace the dark cyberpunk/neon palette with a serene, organic light theme. Branding is simply "RIZE".
- Canvas background: Soft warm porcelain/off-white (`#F8F9FA` / `#FAFAF9`).
- Card surfaces: Crisp warm white (`#FFFFFF`) with delicate hairline borders (`#E5E7EB` / `#E2E8F0`) and whisper-soft diffuse shadows (`0 2px 10px rgba(0,0,0,0.03)`).
- Accent colors: Gentle organic sage/eucalyptus/pine (`#3D7055` / `#2D5A43`), warm dawn amber accents (`#D97706`), and calm slate secondary tones (`#64748B`). No neon cyan, harsh green, or flashing laser colors.
- Android system chrome: Update `MainActivity.kt`, `themes.xml`, and `colors.xml` to match the light theme with light status bar icons (dark icons on light background) and matching navigation bar color.

### R2. Glanceable Dashboard & Navigation Architecture
- Replace the tactical military header and telemetry widgets with a calm, glanceable morning hero card showing next alarm countdown ("Wake up in 6h 24m") and gentle status.
- Implement a clean bottom navigation bar with 2 primary tabs: "Alarms" and "NFC Tags", plus an elevated, thumb-friendly '+' button for creating new alarms.
- Humanize all copy: Replace "SYS//06:30.AM", "TARGET ARMED", "HARDWARE", "NFC ENFORCED" with natural, peaceful language ("Upcoming Alarm", "Active", "Bathroom Mirror NFC", etc.).

### R3. Inline Expandable & Swipable Alarm Cards
- Alarm cards display large serene time typography, intuitive toggle switch, repeat days pills, and NFC checkpoint tag pill.
- Inline Expansion: Tapping a card expands it smoothly in-place on the dashboard to adjust repeat days, assigned NFC tag, sound, and quick toggles.
- Swipe Action: Swiping an alarm card horizontally reveals smooth quick-action buttons (Delete / Duplicate) with tactile feedback.

### R4. Radial Clock Face Dial Time Picker
- In the Add/Edit alarm screen, provide an interactive circular radial clock dial.
- Tapping or dragging the central clock hand smoothly selects hours (1–12) and minutes (00–55) with gentle haptic clicks (`vibrate("click")`) on each tick.
- Smooth transition between Hour and Minute selection modes, with clear AM/PM toggle pill and quick morning preset chips (6:00, 6:30, 7:00, 7:30).

### R5. Gentle Dawn Waking Screen (Active Alarm)
- Redesign the active alarm firing screen with a peaceful morning horizon aesthetic (soft porcelain to dawn warm glow, serene large time display, breathing circular NFC wave).
- Implement a dim-to-brightening transition: starts in a soft warm dimmed ambient state to protect groggy eyes waking up in a dark room, then smoothly brightens as the user interacts or approaches the phone.
- Clear, calming NFC instruction: "Tap Bathroom Mirror NFC Tag to disarm", with simulated NFC tap and peaceful emergency snooze option.

### R6. Zen Soundscapes & Organic Haptics
- Integrate soothing Tibetan singing bowl / celestial morning chime tones that swell gently using the Web Audio synthesizer.
- Pair interactions (dial rotation, card toggles, scan verification) with tactile native haptics via `RizeNativeInterface`.

## Acceptance Criteria

### Visual & Theming
- [ ] UI displays in a cohesive, calming light theme across all 4 screens (Dashboard, Add Alarm, NFC Tags, Active Alarm).
- [ ] Brand title is simply "RIZE" with no extraneous military/core suffixes.
- [ ] No harsh neon cyberpunk accents, blinking lasers, or tactical military jargon remain.
- [ ] Android status bar and navigation bar match the light theme with dark status bar icons.

### Navigation & Layout
- [ ] Bottom navigation tabs seamlessly switch between Alarms and NFC Tags screens.
- [ ] Central '+' button opens the Add Alarm screen with the radial clock dial.
- [ ] Top hero card on Dashboard displays accurate next alarm countdown and state.

### Interactivity & Ergonomics
- [ ] Alarm cards expand inline when tapped to reveal settings, and collapse when tapped again.
- [ ] Alarm cards support horizontal swipe gestures revealing action buttons (Delete).
- [ ] Radial clock dial accurately sets hours and minutes by tapping/dragging, with AM/PM selection.
- [ ] Active alarm screen begins warm-dimmed and smoothly brightens, displaying the assigned NFC tag checkpoint and disarming upon NFC verification.

### Code & Performance
- [ ] All existing native interface bridges (`RizeNativeInterface.kt`, NFC scans, audio playback, vibrations) remain fully functional without console errors or broken imports.
- [ ] HTML/CSS/JS in `app/src/main/assets/index.html` is clean, modular, and responsive to Android phone viewports.


## 2026-10-10T06:48:33Z

Complete the final UI milestone for RIZE (c:\Users\husai\Downloads\Rize):
Specifically implement R4: Circular Radial Clock Face Dial Time Picker and ensure all remaining tests in tests/e2e/runner.js pass 100%.

Working directory: c:\Users\husai\Downloads\Rize
Integrity mode: development
