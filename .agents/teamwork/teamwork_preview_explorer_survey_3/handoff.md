# Handoff Report: Bridge & Hardware Integration Analysis

**Agent**: `teamwork_preview_explorer_survey_3` (Role: Bridge & Hardware Explorer)  
**Date**: 2026-10-09  
**Target File**: `.agents/teamwork/teamwork_preview_explorer_survey_3/handoff.md`  

---

## 1. Observation

### 1.1 Bridge Class Location & Injected Namespace
- File path: `app/src/main/java/com/rize/nfc/MainActivity.kt`
- Line 62:
  ```kotlin
  webView.addJavascriptInterface(RizeNativeInterface(this), "RizeNative")
  ```
- File path: `app/src/main/java/com/rize/nfc/RizeNativeInterface.kt`
- Package: `package com.rize.nfc`
- Constructor: `class RizeNativeInterface(private val activity: MainActivity)`
- Bridge Object Name in JavaScript: `window.RizeNative`.
- Notice: `window.Android` is NOT injected by `MainActivity.kt`. Any script expecting `window.Android` directly would fail unless aliased (`window.Android = window.RizeNative`).

---

### 1.2 Exact `@JavascriptInterface` Method Signatures and Actions

In `app/src/main/java/com/rize/nfc/RizeNativeInterface.kt`:

1. **`isNfcAvailable()`**
   - Signature: `@JavascriptInterface fun isNfcAvailable(): Boolean`
   - Parameters: none
   - Return type: `Boolean`
   - Implementation (lines 31-35):
     ```kotlin
     @JavascriptInterface
     fun isNfcAvailable(): Boolean {
         val adapter = NfcAdapter.getDefaultAdapter(activity)
         return adapter != null
     }
     ```
   - Native effect: Queries system default `NfcAdapter`. Returns `true` if NFC hardware exists on device.

2. **`isNfcEnabled()`**
   - Signature: `@JavascriptInterface fun isNfcEnabled(): Boolean`
   - Parameters: none
   - Return type: `Boolean`
   - Implementation (lines 37-41):
     ```kotlin
     @JavascriptInterface
     fun isNfcEnabled(): Boolean {
         val adapter = NfcAdapter.getDefaultAdapter(activity)
         return adapter?.isEnabled == true
     }
     ```
   - Native effect: Returns `true` if NFC hardware is enabled by the user in Android settings.

3. **`openNfcSettings()`**
   - Signature: `@JavascriptInterface fun openNfcSettings()`
   - Parameters: none
   - Return type: `Unit` (void)
   - Implementation (lines 43-50):
     ```kotlin
     @JavascriptInterface
     fun openNfcSettings() {
         try {
             activity.startActivity(Intent(Settings.ACTION_NFC_SETTINGS))
         } catch (e: Exception) {
             activity.startActivity(Intent(Settings.ACTION_SETTINGS))
         }
     }
     ```
   - Native effect: Launches Android system settings directly to the NFC toggle page.

4. **`vibrate(type: String)`**
   - Signature: `@JavascriptInterface fun vibrate(type: String)`
   - Parameters: `type: String`
   - Return type: `Unit` (void)
   - Implementation (lines 52-98):
     Dispatches to `activity.runOnUiThread`.
     - `"click"`:
       - API 29+ (`Q`): `vibrator?.vibrate(VibrationEffect.createPredefined(VibrationEffect.EFFECT_CLICK))`
       - Fallback: `vibrator?.vibrate(20)` (20ms)
     - `"heavy_click"`:
       - API 29+ (`Q`): `vibrator?.vibrate(VibrationEffect.createPredefined(VibrationEffect.EFFECT_HEAVY_CLICK))`
       - Fallback: `vibrator?.vibrate(50)` (50ms)
     - `"success"`:
       - Waveform: `timings = [0, 40, 60, 40]`, `amplitudes = [0, 255, 0, 255]`, `repeat = -1` (one-shot double click)
       - API 26+ (`O`): `VibrationEffect.createWaveform(timings, amplitudes, -1)`
       - Fallback: `vibrator?.vibrate(timings, -1)`
     - `"alarm_pulse"`:
       - Waveform: `timings = [0, 300, 200, 300]`, `amplitudes = [0, 255, 0, 255]`, `repeat = 0` (**continuous infinite looping pulse until stopped**)
       - API 26+ (`O`): `VibrationEffect.createWaveform(timings, amplitudes, 0)`
       - Fallback: `vibrator?.vibrate(timings, 0)`
     - `else`:
       - Fallback: `vibrator?.vibrate(30)` (30ms default)

5. **`stopVibrate()`**
   - Signature: `@JavascriptInterface fun stopVibrate()`
   - Parameters: none
   - Return type: `Unit` (void)
   - Implementation (lines 100-105):
     ```kotlin
     @JavascriptInterface
     fun stopVibrate() {
         activity.runOnUiThread {
             vibrator?.cancel()
         }
     }
     ```
   - Native effect: Calls `vibrator?.cancel()`. Crucial for cancelling looping `"alarm_pulse"`.

6. **`startAlarmSound()`**
   - Signature: `@JavascriptInterface fun startAlarmSound()`
   - Parameters: none
   - Return type: `Unit` (void)
   - Implementation (lines 107-133):
     Dispatches to `activity.runOnUiThread`.
     - Acquires `RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM)` (fallback: `TYPE_NOTIFICATION`).
     - Builds ringtone with `AudioAttributes.USAGE_ALARM` and `AudioAttributes.CONTENT_TYPE_SONIFICATION`.
     - API 28+ (`P`): sets `isLooping = true`.
     - Plays if not playing: `alarmRingtone?.play()`.

7. **`stopAlarmSound()`**
   - Signature: `@JavascriptInterface fun stopAlarmSound()`
   - Parameters: none
   - Return type: `Unit` (void)
   - Implementation (lines 135-145):
     Dispatches to `activity.runOnUiThread`.
     - Calls `alarmRingtone?.stop()`.
     - Sets `alarmRingtone = null`.

8. **`setScreenAwake(awake: Boolean)`**
   - Signature: `@JavascriptInterface fun setScreenAwake(awake: Boolean)`
   - Parameters: `awake: Boolean`
   - Return type: `Unit` (void)
   - Implementation (lines 147-152):
     Dispatches to `activity.runOnUiThread`.
     - Calls `activity.setKeepScreenOn(awake)` in `MainActivity.kt`:
       - `awake == true`: `window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)`
       - `awake == false`: `window.clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)`

---

### 1.3 Native-to-JavaScript Callbacks Executed by `MainActivity.kt`

1. **NFC Tag Discovery: `window.onNativeNfcTag(hexUid)`**
   - Triggered in `MainActivity.kt` lines 124-135:
     ```kotlin
     override fun onTagDiscovered(tag: Tag?) {
         if (tag == null) return
         val id = tag.id ?: return
         val hexUid = id.joinToString(":") { "%02X".format(it) }

         runOnUiThread {
             webView.evaluateJavascript(
                 "if (window.onNativeNfcTag) { window.onNativeNfcTag('$hexUid'); }",
                 null
             )
         }
     }
     ```
   - Also called in `handleNfcIntent(intent)` (lines 137-146) when launched from NFC intents (`ACTION_NDEF_DISCOVERED`, `ACTION_TAG_DISCOVERED`, `ACTION_TECH_DISCOVERED`).
   - Format: `hexUid` is colon-delimited uppercase hex (e.g. `"04:A2:8F"`, `"04:5A:B2:1C:..."`).
   - JavaScript contract: Global function `window.onNativeNfcTag = function(scannedUid) { ... }`.

2. **Android Back Navigation Interception: `window.handleBackNav()`**
   - Triggered in `MainActivity.kt` lines 74-87:
     ```kotlin
     onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
         override fun handleOnBackPressed() {
             webView.evaluateJavascript("window.handleBackNav ? window.handleBackNav() : false") { result ->
                 if (result != "true") {
                     if (webView.canGoBack()) {
                         webView.goBack()
                     } else {
                         isEnabled = false
                         onBackPressedDispatcher.onBackPressed()
                     }
                 }
             }
         }
     })
     ```
   - JavaScript contract: Global function `window.handleBackNav = function() { ... }`.
   - Returns boolean:
     - `true`: Web page intercepted the back action (e.g., closed modal, collapsed expanded card, or navigated back from Add/NFC to Dashboard).
     - `false`: Activity performs normal Android back stack navigation or exits app.

---

### 1.4 Web Bridge Calling Patterns in `app/src/main/assets/index.html`

In `app/src/main/assets/index.html` lines 694-722:
```javascript
const Native = {
  vibrate: (type) => {
    if (window.RizeNative && window.RizeNative.vibrate) {
      window.RizeNative.vibrate(type);
    } else if (navigator.vibrate) {
      navigator.vibrate(type === "alarm_pulse" ? [300, 200, 300] : 30);
    }
  },
  stopVibrate: () => {
    if (window.RizeNative && window.RizeNative.stopVibrate) {
      window.RizeNative.stopVibrate();
    }
  },
  startAlarmSound: () => {
    if (window.RizeNative && window.RizeNative.startAlarmSound) {
      window.RizeNative.startAlarmSound();
    }
  },
  stopAlarmSound: () => {
    if (window.RizeNative && window.RizeNative.stopAlarmSound) {
      window.RizeNative.stopAlarmSound();
    }
  },
  setScreenAwake: (awake) => {
    if (window.RizeNative && window.RizeNative.setScreenAwake) {
      window.RizeNative.setScreenAwake(awake);
    }
  }
};
```

NFC Callback implementation (lines 901-933):
```javascript
window.onNativeNfcTag = function(scannedUid) {
  Native.vibrate("success");

  // If in NFC registration modal
  const modal = document.getElementById("modal-nfc-scan");
  if (!modal.classList.contains("hidden")) {
    document.getElementById("scan-modal-detected-uid").innerText = scannedUid;
    playSynthesizedTone(900, "sine");
    return;
  }

  // If active alarm is firing
  if (isAlarmFiring) {
    isAlarmFiring = false;
    clearInterval(alarmPulseInterval);
    Native.stopAlarmSound();
    Native.stopVibrate();

    // Show verification success banner
    const overlay = document.getElementById("active-success-overlay");
    overlay.classList.remove("hidden");
    document.getElementById("success-verified-tag-name").innerText = `${firingAlarm.tagName || "Paired Checkpoint"} (${scannedUid})`;

    playSynthesizedTone(600, "triangle");
    setTimeout(() => playSynthesizedTone(880, "sine"), 120);

    setTimeout(() => {
      overlay.classList.add("hidden");
      Native.setScreenAwake(false);
      showScreen("dashboard");
    }, 2500);
  }
};
```

Back navigation callback (lines 1225-1231):
```javascript
window.handleBackNav = function() {
  if (currentScreen !== "dashboard") {
    showScreen("dashboard");
    return true;
  }
  return false;
};
```

---

### 1.5 Hardware Integrations: NFC, Audio, Haptics, Screen

1. **NFC Flow**:
   - Hardware: Android `NfcAdapter` ReaderMode flags `FLAG_READER_NFC_A | FLAG_READER_NFC_B | FLAG_READER_NFC_F | FLAG_READER_NFC_V | FLAG_READER_NO_PLATFORM_SOUNDS`.
   - Reader mode mutes native OS sound (`FLAG_READER_NO_PLATFORM_SOUNDS`) so RIZE triggers its own haptics (`Native.vibrate("success")`) and audio tone (`playSynthesizedTone`).
   - Tag Enrollment: User opens scan modal -> holds tag -> `window.onNativeNfcTag(uid)` fires -> UID updates in input field -> user confirms -> saved to `localStorage` (`rize_tags`).
   - Alarm Disarm: Active alarm fires -> user touches registered tag (or triggers `simulateNfcTap()`) -> `window.onNativeNfcTag(uid)` fires -> stops audio & vibration, cancels wake lock, reveals success overlay, returns to dashboard.

2. **Haptics / Vibration**:
   - Native: `vibratorManager?.defaultVibrator` or `getSystemService(VIBRATOR_SERVICE)`.
   - Discrete UI Haptics:
     - `"click"`: Dial dragging/ticks, AM/PM toggle, screen tabs, accordion toggle.
     - `"heavy_click"`: Alarm toggle on/off, Save alarm, Delete card, Snooze.
     - `"success"`: NFC tag tap confirmation.
     - `"alarm_pulse"`: Infinite looping pulse while alarm is active.
   - Stop: `stopVibrate()` immediately halts vibration.
   - Web Fallback: `navigator.vibrate([300, 200, 300])` for alarms, `30ms` for clicks.

3. **Audio Architecture**:
   - Native Audio: `RingtoneManager` alarm ringtone with `USAGE_ALARM` audio stream.
   - Web Audio Synthesizer: `AudioContext` with custom oscillators (`sine`, `triangle`, `sawtooth`, `square`) and gain envelopes.
   - Complementary dual-mode: Native ringtone ensures high-volume alarm wake capability on Android device; Web Audio provides soothing Zen chimes, singing bowl frequencies, and interactive sound design.

4. **Android System Styling & Chrome**:
   - `MainActivity.kt`:
     - Line 29: `window.statusBarColor = Color.parseColor("#111318")`
     - Line 30: `window.navigationBarColor = Color.parseColor("#111318")`
     - Line 58: `webView.setBackgroundColor(Color.parseColor("#111318"))`
   - `res/values/themes.xml`:
     - Sets dark theme colors `#111318`.
   - Acceptance Criteria & R1 require light theme styling:
     - `statusBarColor` and `navigationBarColor` to `#FAFAF9` / `#F8F9FA`.
     - Window decor view / `WindowInsetsControllerCompat` light status bar icons (`isAppearanceLightStatusBars = true`, `isAppearanceLightNavigationBars = true`).

---

## 2. Logic Chain

1. **Observation 1.1 & 1.2** show that `MainActivity.kt` explicitly injects `RizeNativeInterface` using the exact string `"RizeNative"`.
   - Therefore, the JavaScript runtime exposes methods exclusively on `window.RizeNative`.
   - If JavaScript code attempts to call `window.Android.*` without a fallback alias, all calls will fail with `TypeError: window.Android is undefined`.
   - To make the web code completely bulletproof across all environments, `window.Android` should be aliased to `window.RizeNative` if present, while continuing to target `window.RizeNative`.

2. **Observation 1.2** details the 8 specific `@JavascriptInterface` methods in `RizeNativeInterface.kt`.
   - None of these methods can be modified, renamed, or deleted without breaking native compatibility.
   - Notably, `vibrate(type: String)` only recognizes 4 specific strings: `"click"`, `"heavy_click"`, `"success"`, and `"alarm_pulse"`. Any other string falls back to an unspecialized 30ms vibration.
   - Furthermore, `"alarm_pulse"` has `repeat = 0`, creating an infinite repeating vibration loop in Android.
   - Therefore, any UI code that calls `Native.vibrate("alarm_pulse")` MUST guarantee a symmetrical call to `Native.stopVibrate()` whenever the alarm ceases (disarm, snooze, dismiss). Failing to call `stopVibrate()` will leave the user's phone vibrating endlessly.

3. **Observation 1.3** establishes the exact bidirectional contract between Native Kotlin and Web JavaScript:
   - Kotlin -> JS: `MainActivity.kt` executes two specific `evaluateJavascript` strings:
     1. `"if (window.onNativeNfcTag) { window.onNativeNfcTag('$hexUid'); }"`
     2. `"window.handleBackNav ? window.handleBackNav() : false"`
   - If `index.html` renames `window.onNativeNfcTag` or moves it to a local/scoped function not attached to `window`, native NFC tag scans will silently fail to do anything in the app.
   - If `window.handleBackNav` is omitted or does not return a boolean, physical Android back button presses will fail to collapse open cards or close modals, leading to unintended app exits.

4. **Observation 1.4 & 1.5** demonstrate how the `Native` JS wrapper isolates browser and web environments from Android WebView.
   - In browser preview / testing, `window.RizeNative` is `undefined`.
   - The wrapper checks `if (window.RizeNative && ...)` before each invocation and falls back to standard Web APIs (`navigator.vibrate`, Web Audio API).
   - This ensures the UI remains fully testable in a standard desktop browser or preview server without throwing unhandled exceptions.

5. **Observation 1.5.4** confirms the Android shell styling requirements from R1 and Acceptance Criteria:
   - `MainActivity.kt`, `res/values/themes.xml`, and `res/values/colors.xml` currently hardcode dark `#111318` system bar colors.
   - Updating these to the light palette (`#FAFAF9` / `#F8F9FA`) with `WindowInsetsControllerCompat` / `isAppearanceLightStatusBars = true` fulfills R1 and AC without modifying any bridge behavior.

---

## 3. Caveats

1. **Gradle Build Tooling**:
   - The root gradle build requires JDK 11+ (specifically Android Studio bundled JBR at `C:\Program Files\Android\Android Studio\jbr`), whereas system `JAVA_HOME` was pointing to Java 8. Running gradle commands requires setting `$env:JAVA_HOME="C:\Program Files\Android\Android Studio\jbr"`.
2. **NFC Simulation vs Real NFC**:
   - While real NFC requires a physical Android device with an NFC transceiver, both `MainActivity.kt` and `index.html` support `simulateNfcTap()` and `simulateTagScan()`. Testing in emulator or desktop browser can fully verify the end-to-end data flow using the simulation triggers.
3. **Audio Permissions / Autoplay**:
   - Android WebView has `settings.mediaPlaybackRequiresUserGesture = false`, allowing alarms to sound even without immediate user gesture. In standard desktop browsers, Web Audio `audioCtx` requires user interaction before playing audio.

---

## 4. Conclusion & Compatibility Invariants

### 4.1 Invariants That MUST NOT Be Broken

| Component | Invariant / Requirement | Reason |
|---|---|---|
| **Bridge Injection** | `webView.addJavascriptInterface(RizeNativeInterface(this), "RizeNative")` in `MainActivity.kt` | Web code expects `window.RizeNative`. |
| **Bridge Namespace** | `window.RizeNative` in JS (alias `window.Android = window.RizeNative` if needed) | Native calls will fail if namespace is renamed. |
| **NFC Callback Name** | `window.onNativeNfcTag = function(scannedUid) { ... }` on global `window` | `MainActivity.kt` calls `window.onNativeNfcTag('$hexUid')`. |
| **NFC UID Format** | Upper-case colon-separated hex (`%02X:%02X:...`) | Emitted by `MainActivity.kt:127`. Parsing/matching must be case-insensitive or expect colons. |
| **Back Nav Callback** | `window.handleBackNav = function(): boolean` on global `window` | `MainActivity.kt:76` checks this for back-button interception. Must return `true` when consumed. |
| **Haptic Types** | `vibrate("click")`, `vibrate("heavy_click")`, `vibrate("success")`, `vibrate("alarm_pulse")` | Exact string switches in `RizeNativeInterface.kt:55-96`. |
| **Vibration Stop** | Every `"alarm_pulse"` invocation MUST be cancelled with `stopVibrate()` | `"alarm_pulse"` loops infinitely natively (`repeat = 0`). |
| **Audio Methods** | `startAlarmSound()` and `stopAlarmSound()` must remain callable | Controls native `RingtoneManager` looped alarm sound. |
| **Screen Wake Methods**| `setScreenAwake(awake: Boolean)` must remain callable | Controls `FLAG_KEEP_SCREEN_ON` for waking groggy users. |
| **Defensive Guards** | Every bridge call in JS must check `if (window.RizeNative && ...)` | Prevents crashes in browser preview or environments without Android bridge. |

### 4.2 Recommended Safe Bridge Wrapper for New UI
To ensure 100% compatibility across both `window.RizeNative` and any potential `window.Android` conventions while maintaining browser fallbacks:

```javascript
// Universal Bridge Wrapper
const Bridge = (typeof window !== 'undefined' && (window.RizeNative || window.Android)) || null;

const Native = {
  isNfcAvailable: () => Bridge?.isNfcAvailable ? Bridge.isNfcAvailable() : ('NDEFReader' in window),
  isNfcEnabled: () => Bridge?.isNfcEnabled ? Bridge.isNfcEnabled() : true,
  openNfcSettings: () => { if (Bridge?.openNfcSettings) Bridge.openNfcSettings(); },
  vibrate: (type) => {
    if (Bridge?.vibrate) {
      Bridge.vibrate(type);
    } else if (navigator.vibrate) {
      navigator.vibrate(type === "alarm_pulse" ? [300, 200, 300] : 30);
    }
  },
  stopVibrate: () => {
    if (Bridge?.stopVibrate) {
      Bridge.stopVibrate();
    } else if (navigator.vibrate) {
      navigator.vibrate(0);
    }
  },
  startAlarmSound: () => {
    if (Bridge?.startAlarmSound) Bridge.startAlarmSound();
  },
  stopAlarmSound: () => {
    if (Bridge?.stopAlarmSound) Bridge.stopAlarmSound();
  },
  setScreenAwake: (awake) => {
    if (Bridge?.setScreenAwake) Bridge.setScreenAwake(awake);
  }
};
```

---

## 5. Verification Method

1. **Inspect Kotlin Files**:
   - Confirm bridge methods in `app/src/main/java/com/rize/nfc/RizeNativeInterface.kt` lines 31-153.
   - Confirm bridge registration and JS callbacks in `app/src/main/java/com/rize/nfc/MainActivity.kt` lines 62, 76, 131.

2. **Verify JavaScript Invocations & Callbacks**:
   - In `app/src/main/assets/index.html`:
     - Test `window.RizeNative` existence check.
     - Test `window.onNativeNfcTag("04:A2:8F")` in browser console: confirms haptic, sound chime, and disarm/registration flow.
     - Test `window.handleBackNav()`: confirms returns `true` when not on dashboard, and `false` on dashboard.

3. **Run Android Unit Tests**:
   Execute from project root using Android Studio JBR:
   ```powershell
   $env:JAVA_HOME="C:\Program Files\Android\Android Studio\jbr"
   .\gradlew.bat testDebugUnitTest
   ```
   Invalidation conditions:
   - Any modification or renaming of `@JavascriptInterface` method names in `RizeNativeInterface.kt`.
   - Renaming `window.RizeNative` or deleting `window.onNativeNfcTag` / `window.handleBackNav`.
   - Unhandled exception when `window.RizeNative` is absent.
