## 2026-10-09T16:38:19Z
You are teamwork_preview_test_writer_e2e_1 (Role: E2E Test Track Architect).
Your Working Directory: c:\Users\husai\Downloads\Rize\.agents\teamwork\test_writer_e2e_1
Original Request Path: c:\Users\husai\Downloads\Rize\.agents\teamwork\ORIGINAL_REQUEST.md
Project Document Path: c:\Users\husai\Downloads\Rize\PROJECT.md
Project Root: c:\Users\husai\Downloads\Rize

MANDATORY FIRST STEP: Read ORIGINAL_REQUEST.md at c:\Users\husai\Downloads\Rize\.agents\teamwork\ORIGINAL_REQUEST.md and PROJECT.md at c:\Users\husai\Downloads\Rize\PROJECT.md.

YOUR EXCLUSIVE WRITE OWNERSHIP:
- tests/ directory (e.g. tests/e2e/runner.js, test suites)
- c:\Users\husai\Downloads\Rize\TEST_INFRA.md
- c:\Users\husai\Downloads\Rize\TEST_READY.md

MISSION:
Build a comprehensive, requirement-driven, opaque-box E2E test suite for the RIZE application revamp covering all requirements R1-R6 and all features in PROJECT.md § Feature Inventory.

Test Philosophy:
- Opaque-box: Test the application entry points as an end user / Android host would (`app/src/main/assets/index.html` DOM, CSS classes, JavaScript functions, state machine, and native XML resources).
- Framework: Build a self-contained Node.js test runner in `tests/e2e/runner.js` that can execute cleanly via `node tests/e2e/runner.js`. You can use Node.js built-ins (fs, path, vm, assert) or available libraries to parse the HTML, verify DOM elements, styles, classes, execute functions in a simulated browser context with mock `window.RizeNative`, `localStorage`, `AudioContext`, and simulate touch/click/drag events.
- Implement the 4-Tier Methodology:
  - Tier 1: Feature Coverage (tests verifying R1-R6 features in isolation)
  - Tier 2: Boundary & Corner Cases (empty states, 0/24/12 hour boundaries, rapid toggling, missing NFC tag ID, audio context suspended, etc.)
  - Tier 3: Cross-Feature Interactions (pairwise: dial time setting + card save, swipe delete + hero update, alarm trigger + NFC disarm callback, etc.)
  - Tier 4: Real-World Scenarios (complete morning wake cycle, alarm configuration, NFC pairing, disarming sequence)
- Create `TEST_INFRA.md` at project root using the project pattern template.
- When test suite construction is complete and executable, publish `TEST_READY.md` at project root with runner command, tier breakdown, and feature checklist.
- Maintain your `progress.md` with timestamped updates.
- Write your final report to `c:\Users\husai\Downloads\Rize\.agents\teamwork\test_writer_e2e_1\handoff.md`.
- Message me when finished.
