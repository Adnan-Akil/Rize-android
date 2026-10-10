## 2026-10-09T17:32:37Z
You are teamwork_preview_worker_m3_1 (Role: Dashboard & Alarm Cards Worker).
Your Working Directory: c:\Users\husai\Downloads\Rize\.agents\teamwork\worker_m3_1
Original Request Path: c:\Users\husai\Downloads\Rize\.agents\teamwork\ORIGINAL_REQUEST.md
Project Document Path: c:\Users\husai\Downloads\Rize\PROJECT.md
Project Root: c:\Users\husai\Downloads\Rize

MANDATORY FIRST STEP: Read ORIGINAL_REQUEST.md at c:\Users\husai\Downloads\Rize\.agents\teamwork\ORIGINAL_REQUEST.md and PROJECT.md at c:\Users\husai\Downloads\Rize\PROJECT.md.
Also review the design specifications in Explorer 1's handoff:
c:\Users\husai\Downloads\Rize\.agents\teamwork\teamwork_preview_explorer_survey_1\handoff.md § 4.3.

YOUR EXCLUSIVE WRITE OWNERSHIP:
- app/src/main/assets/index.html (specifically Dashboard Hero Card countdown and Alarm Cards rendering, inline expansion state & handlers, horizontal swipe gesture event listeners and delete actions)

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

MISSION (Milestone 3: Dashboard Hero & Swipable/Expandable Alarm Cards):
Implement R3 requirements in `app/src/main/assets/index.html`:
1. Hero Card (R2.2): Ensure `#hero-alarm-card` calculates and displays next alarm countdown ("Wake up in 6h 24m") based on active alarms in `localStorage` (`rize_alarms`), updating dynamically when alarms are toggled or deleted.
2. Alarm Card Structure (R3.1):
   - In `#alarms-deck`, render `.alarm-card` elements with crisp white background (`#FFFFFF`), hairline border (`#E2E8F0`), and soft shadow (`0 2px 10px rgba(0,0,0,0.03)`).
   - Display large serene time typography (`.alarm-time`), intuitive toggle switch button with `onclick="toggleAlarm('...')"` (using `event?.stopPropagation?.()`), repeat day pills, and assigned NFC checkpoint tag pill.
3. Inline Card Expansion (R3.2):
   - Clicking the card surface / header (outside toggle switch) toggles inline expansion of `.alarm-expanded-panel`.
   - Expanding a card smoothly reveals: clickable repeat day chips (Mon-Sun) allowing inline day toggles, assigned NFC checkpoint tag with a change button, soundscape chips (Tibetan Bowl, Morning Chimes), and delete button.
   - Tapping the card again collapses it.
4. Horizontal Swipe Gesture (R3.3):
   - Card structure: outer container with background layer containing `.btn-swipe-delete` (button with `onclick="deleteAlarm('...')"`), and foreground `.swipe-surface` / `.card-surface`.
   - Touch event listeners on `.swipe-surface` / `.card-surface` (`touchstart`, `touchmove`, `touchend`):
     - Dragging horizontally translates foreground surface to reveal Delete action.
     - When swiping past threshold (-50px), trigger haptic tick (`Native.vibrate('click')` or `Native.vibrate('tick')`).
     - Snap open to reveal `.btn-swipe-delete` if swiped past threshold; snap closed if not.
     - Ensure compatibility with `app.touchSwipe(el, { deltaX: -75, deltaY: 0 })` in `tests/e2e/harness.js`.
5. Preserve all existing bridge helpers (`Native.*`), event handlers, modals, and navigation.
6. VERIFY:
   - Run `node tests/e2e/runner.js` and verify Tier 1 R3.1, R3.2, R3.3, and Tier 3 swipe/expansion tests pass!
   - Run `cmd /c "gradlew.bat testDebugUnitTest"` to ensure clean build.

Write your report to `c:\Users\husai\Downloads\Rize\.agents\teamwork\worker_m3_1\handoff.md`.
Maintain `progress.md` with timestamped updates.
Message me when finished with your verification results.
