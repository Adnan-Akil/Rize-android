# Testing Infrastructure: RIZE Application Revamp

## 1. Overview & Architecture

RIZE Revamp utilizes a self-contained, opaque-box E2E testing framework executing in Node.js (`v24+`) without external npm dependencies. The test harness evaluates the application entry points exactly as an Android host and user would:
- Target DOM: `app/src/main/assets/index.html`
- Native Android styling tokens & resources: `app/src/main/res/values/themes.xml`, `colors.xml`, `MainActivity.kt`, and `RizeNativeInterface.kt`
- Virtual DOM simulation: `tests/e2e/dom_sim.js`
- Bridge & Hardware simulation: `tests/e2e/harness.js`
- Test runner CLI: `tests/e2e/runner.js`
- 4-Tier Test Suites: `tests/e2e/test_suites/`

```
c:\Users\husai\Downloads\Rize\
├── tests/
│   └── e2e/
│       ├── dom_sim.js            # Lightweight DOM parser, Element, Document, Events & Selector engine
│       ├── harness.js            # Sandbox host, MockNative, MockAudioContext, MockLocalStorage, helpers
│       ├── runner.js             # CLI Test runner, reporter, tier & feature breakdown aggregator
│       └── test_suites/
│           ├── tier1_feature_coverage.js      # Isolated feature checks for R1-R6
│           ├── tier2_boundary_corner.js       # Boundary conditions, edge cases, stress
│           ├── tier3_cross_feature.js         # Pairwise cross-feature interactions
│           └── tier4_real_world_scenarios.js  # Full end-to-end user wake/config scenarios
├── TEST_INFRA.md                 # Test harness and infrastructure documentation (this document)
└── TEST_READY.md                 # Test readiness status, command inventory & feature checklist
```

---

## 2. 4-Tier Testing Methodology

The test suite enforces a comprehensive 4-Tier hierarchy:

| Tier | Name | Purpose | Test Count |
|------|------|---------|------------|
| **Tier 1** | Feature Coverage | Verifies R1–R6 requirements in isolation against DOM classes, color tokens, element structures, and native XML | 20 |
| **Tier 2** | Boundary & Corner Cases | Exercises edge conditions: empty storage, 12 AM/PM midnight/noon boundaries, 2-digit minute padding, rapid toggles, audio suspended states, orphaned tags, hardware back | 13 |
| **Tier 3** | Cross-Feature Interactions | Verifies pairwise state integration: dial time save + hero countdown recalculation, swipe delete + deck sync, NFC registration modal + alarm assignment + active disarm | 5 |
| **Tier 4** | Real-World Scenarios | Executes full user journeys: complete morning wake cycle (dim -> brighten -> scan -> disarm), emergency snooze (+5 min), new user onboarding, inline reconfiguration | 4 |
| **Total** | | | **42 Tests** |

---

## 3. Simulated Environment Capabilities

### 3.1 DOM & Event Engine (`tests/e2e/dom_sim.js`)
- Full DOM element tree hierarchy (`children`, `parentNode`, `childNodes`).
- Dynamic class management (`classList.add`, `remove`, `contains`, `toggle`) and `className` reflection.
- Attribute manipulation (`setAttribute`, `getAttribute`, `removeAttribute`).
- Text and HTML synchronization: `innerText`, `textContent`, and dynamic `innerHTML` parsing and fragment insertion.
- CSS selectors engine supporting `#id`, `.class`, `tag`, `[attr]`, `[attr="val"]`, and nested descendant expressions (`#screen-add button`, `article.alarm-card`).
- Touch, pointer, and mouse event dispatching with coordinate payloads (`clientX`, `clientY`, `touches`, `changedTouches`).

### 3.2 Mock Android Bridge (`MockNativeInterface` in `tests/e2e/harness.js`)
- Injected into web sandbox as `window.RizeNative` and aliased to `window.Android`.
- Records call telemetry for:
  - `vibrate(type)` (types: `"click"`, `"tick"`, `"heavy_click"`, `"success"`, `"alarm_pulse"`)
  - `stopVibrate()`
  - `startAlarmSound()` and `stopAlarmSound()`
  - `setScreenAwake(awake)`
  - `isNfcAvailable()` and `isNfcEnabled()`
  - `openNfcSettings()`

### 3.3 Mock Web Audio Engine (`MockAudioContext`)
- Simulates W3C Web Audio API.
- Tracks `createOscillator()`, `createGain()`, frequency curves, ramps, connections, and start/stop timestamps.
- Simulates browser autoplay policy (`suspended` state transition via `resume()`).

### 3.4 Storage & Timer Isolation
- `MockLocalStorage` isolator initialized per test instance, preventing state leakage across test cases.
- Automatic timer tracking (`setInterval`, `setTimeout`) with `app.cleanup()` to guarantee clean synchronous teardown.

---

## 4. Test Execution & CLI Commands

### 4.1 Running All Tests
To run the full test suite across all 4 tiers:
```powershell
node tests/e2e/runner.js
```
*Note: Exits with code `0` if all tests pass; exits with code `1` if any test fails.*

### 4.2 Non-Blocking / Diagnostic Mode
To run all tests and display the full diagnostic report without failing the shell process:
```powershell
node tests/e2e/runner.js --report-only
```

### 4.3 Filtering by Tier
```powershell
# Run only Tier 1 Feature Coverage
node tests/e2e/runner.js --tier 1

# Run only Tier 2 Boundary Cases
node tests/e2e/runner.js --tier 2

# Run only Tier 3 Cross-Feature Interactions
node tests/e2e/runner.js --tier 3

# Run only Tier 4 Real-World Scenarios
node tests/e2e/runner.js --tier 4
```

### 4.4 Filtering by Feature or ID
```powershell
# Run tests for Radial Clock Dial (R4)
node tests/e2e/runner.js --feature "radial"

# Run tests matching specific ID or keyword
node tests/e2e/runner.js --filter "T1.1"

# Verbose error stack traces
node tests/e2e/runner.js --verbose
```

### 4.5 JSON Output
```powershell
node tests/e2e/runner.js --json
```

---

## 5. Adding New Tests

To add tests to a specific tier:
1. Open the relevant file in `tests/e2e/test_suites/tierX_*.js`.
2. Append a new test object to the `tests` array:
   ```javascript
   {
     id: 'T1.21.1',
     feature: 'R7 Feature Name',
     name: 'Descriptive test assertion name',
     fn: async ({ assert, loadApp, readMainActivityKt }) => {
       const app = loadApp({ initialStorage: { ... } });
       try {
         // Perform actions and assert
         app.click('btn-id');
         assert.equal(app.getActiveScreen(), 'target-screen');
       } finally {
         app.cleanup();
       }
     }
   }
   ```
3. Run `node tests/e2e/runner.js --filter T1.21.1` to verify execution.
