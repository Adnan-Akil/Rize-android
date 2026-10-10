## 2026-10-09T16:38:19Z
You are teamwork_preview_worker_m1_1 (Role: Android Native Styling Worker).
Your Working Directory: c:\Users\husai\Downloads\Rize\.agents\teamwork\worker_m1_1
Original Request Path: c:\Users\husai\Downloads\Rize\.agents\teamwork\ORIGINAL_REQUEST.md
Project Document Path: c:\Users\husai\Downloads\Rize\PROJECT.md
Project Root: c:\Users\husai\Downloads\Rize

MANDATORY FIRST STEP: Read ORIGINAL_REQUEST.md at c:\Users\husai\Downloads\Rize\.agents\teamwork\ORIGINAL_REQUEST.md and PROJECT.md at c:\Users\husai\Downloads\Rize\PROJECT.md.
Also review the explorer handoffs:
- c:\Users\husai\Downloads\Rize\.agents\teamwork\teamwork_preview_explorer_survey_2\handoff.md
- c:\Users\husai\Downloads\Rize\.agents\teamwork\teamwork_preview_explorer_survey_3\handoff.md

YOUR EXCLUSIVE WRITE OWNERSHIP:
- app/src/main/res/values/colors.xml
- app/src/main/res/values/themes.xml
- app/src/main/java/com/rize/nfc/MainActivity.kt
- app/src/main/java/com/rize/nfc/RizeNativeInterface.kt
- app/src/main/res/drawable/ic_launcher_background.xml
- app/src/main/res/drawable/ic_launcher_foreground.xml
- gradle.properties

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

MISSION (Milestone 1: Android Native System Styling & Bridge):
Implement R1 Android system chrome and bridge updates according to the exact recommendations from the native and bridge explorers:
1. In `app/src/main/res/values/colors.xml`: Replace dark cyberpunk hex values with the calming light palette tokens (`canvas_bg` #FFF8F9FA, `surface` #FFFFFFFF, `primary` #FF3D7055, `primary_dark` #FF2D5A43, `primary_container` #FFE8F1EC, `accent_amber` #FFD97706, `slate_secondary` #FF64748B, `text_primary` #FF1E293B, etc.).
2. In `app/src/main/res/values/themes.xml`: Set parent to `Theme.MaterialComponents.Light.NoActionBar`, configure `android:statusBarColor` and `android:navigationBarColor` to `@color/canvas_bg`, `android:windowBackground` to `@color/canvas_bg`, and enable `android:windowLightStatusBar` and `android:windowLightNavigationBar`.
3. In `app/src/main/java/com/rize/nfc/MainActivity.kt`:
   - Use `WindowCompat.getInsetsController(window, window.decorView)` to set `isAppearanceLightStatusBars = true` and `isAppearanceLightNavigationBars = true`.
   - Set `window.statusBarColor = Color.parseColor("#F8F9FA")` and `window.navigationBarColor = Color.parseColor("#F8F9FA")`.
   - Set `webView.setBackgroundColor(Color.parseColor("#F8F9FA"))` to eliminate dark launch/overscroll flashes.
   - Add `fun setSystemBarTheme(isLight: Boolean, colorHex: String)` helper.
   - Ensure all existing WebView settings, `RizeNative` bridge, NFC scanner `onTagDiscovered`, and `handleBackNav` remain 100% intact.
4. In `app/src/main/java/com/rize/nfc/RizeNativeInterface.kt`:
   - Add `"tick"` haptic case in `vibrate(type: String)` mapping to `VibrationEffect.EFFECT_TICK` on API 29+ with 10ms fallback.
   - Expose `@JavascriptInterface fun setSystemBarTheme(isLight: Boolean, colorHex: String)` calling `activity.setSystemBarTheme`.
   - Preserve all existing 8 methods and their signatures without any breaking changes.
5. In `app/src/main/res/drawable/ic_launcher_background.xml` and `ic_launcher_foreground.xml`: update colors from neon cyan/green to sage and dawn amber on warm light background.
6. In `gradle.properties`: add `org.gradle.java.home=C:\\Program Files\\Android\\Android Studio\\jbr`.
7. VERIFY:
   Run build and tests using:
   `cmd /c "set JAVA_HOME=C:\Program Files\Android\Android Studio\jbr&& gradlew.bat testDebugUnitTest assembleDebug"`
   Verify `BUILD SUCCESSFUL` with exit code 0.
