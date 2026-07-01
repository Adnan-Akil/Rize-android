# Rize — Standard Operating Procedure (SOP)

> **This document is the single source of truth for the Rize project.**
> Refer here before making any architectural decision, debugging any issue, or releasing any build.
> Last updated: 2026-07-01

---

## Table of Contents

1. [Project Identity](#1-project-identity)
2. [Development Environment Setup](#2-development-environment-setup)
3. [Project Structure](#3-project-structure)
4. [Tech Stack Reference](#4-tech-stack-reference)
5. [Permissions Reference](#5-permissions-reference)
6. [Core Implementation Rules](#6-core-implementation-rules)
7. [Git Workflow](#7-git-workflow)
8. [GitHub Distribution (APK via Releases)](#8-github-distribution-apk-via-releases)
9. [CI/CD — GitHub Actions](#9-cicd--github-actions)
10. [Build & Signing](#10-build--signing)
11. [Testing Procedures](#11-testing-procedures)
12. [Common Errors & Fixes](#12-common-errors--fixes)
13. [Edge Case Handling Reference](#13-edge-case-handling-reference)
14. [Feature Release Checklist](#14-feature-release-checklist)

---

## 1. Project Identity

| Field | Value |
|-------|-------|
| App Name | **Rize** |
| Package ID | `com.rize.alarm` |
| Language | Kotlin |
| Min SDK | API 26 (Android 8.0) |
| Target SDK | API 35 (Android 15) |
| Architecture | MVVM + Clean Architecture |
| Distribution | GitHub Releases (APK) |
| Repository | `github.com/<your-username>/rize-android` |
| Version Format | `v{MAJOR}.{MINOR}.{PATCH}` (e.g., `v1.0.0`) |

**Package ID is permanent. Never change it after first distribution.**

---

## 2. Development Environment Setup

### Required Tools

| Tool | Version | Notes |
|------|---------|-------|
| Android Studio | Latest stable (Meerkat 2024.3.1+) | developer.android.com |
| JDK | 17 (bundled with Android Studio) | Do not use system JDK |
| Kotlin | 2.0+ | Via Gradle plugin |
| Gradle | 8.x | Defined in `gradle/wrapper/gradle-wrapper.properties` |
| Git | Latest | For version control |

### First-Time Setup Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/<your-username>/rize-android.git
   cd rize-android
   ```

2. **Open in Android Studio**
   - File → Open → select the `rize-android` folder
   - Wait for Gradle sync to complete

3. **Configure your signing keystore** (see Section 10)

4. **Create local environment file**
   ```
   # local.properties (already gitignored)
   sdk.dir=C\:\\Users\\<your-username>\\AppData\\Local\\Android\\Sdk
   KEYSTORE_PATH=../rize-release.keystore
   KEYSTORE_PASSWORD=<your-password>
   KEY_ALIAS=rize
   KEY_PASSWORD=<your-password>
   ```

5. **Physical device required for NFC testing**
   - Emulators do NOT support NFC hardware interaction
   - Enable Developer Options on your test device
   - Enable USB Debugging
   - Keep NFC enabled throughout development

### SDK Configuration in `build.gradle.kts`

```kotlin
android {
    compileSdk = 35
    defaultConfig {
        applicationId = "com.rize.alarm"
        minSdk = 26
        targetSdk = 35
        versionCode = 1        // increment by 1 for every release
        versionName = "1.0.0"  // matches GitHub release tag (without "v")
    }
}
```

---

## 3. Project Structure

```
rize-android/
├── .github/
│   └── workflows/
│       ├── ci.yml             <- runs on every push/PR
│       └── release.yml        <- runs on v* tags
│
├── app/
│   └── src/
│       ├── main/
│       │   ├── AndroidManifest.xml
│       │   ├── java/com/rize/alarm/
│       │   │   ├── data/
│       │   │   │   ├── local/
│       │   │   │   │   ├── AppDatabase.kt
│       │   │   │   │   ├── AlarmDao.kt
│       │   │   │   │   ├── NfcTagDao.kt
│       │   │   │   │   └── WakeLogDao.kt
│       │   │   │   ├── model/
│       │   │   │   │   ├── Alarm.kt
│       │   │   │   │   ├── NfcTag.kt
│       │   │   │   │   └── WakeLog.kt
│       │   │   │   └── repository/
│       │   │   │       ├── AlarmRepository.kt
│       │   │   │       └── NfcTagRepository.kt
│       │   │   │
│       │   │   ├── domain/
│       │   │   │   └── usecase/
│       │   │   │       ├── ScheduleAlarmUseCase.kt
│       │   │   │       ├── DismissAlarmUseCase.kt
│       │   │   │       └── RegisterNfcTagUseCase.kt
│       │   │   │
│       │   │   ├── presentation/
│       │   │   │   ├── alarm/
│       │   │   │   │   ├── AlarmListScreen.kt
│       │   │   │   │   └── AlarmViewModel.kt
│       │   │   │   ├── create/
│       │   │   │   │   ├── CreateAlarmScreen.kt
│       │   │   │   │   └── CreateAlarmViewModel.kt
│       │   │   │   ├── ringing/
│       │   │   │   │   ├── RingingActivity.kt
│       │   │   │   │   └── RingingViewModel.kt
│       │   │   │   ├── setup/
│       │   │   │   │   ├── NfcSetupScreen.kt
│       │   │   │   │   └── NfcSetupViewModel.kt
│       │   │   │   └── stats/
│       │   │   │       ├── StatsScreen.kt
│       │   │   │       └── StatsViewModel.kt
│       │   │   │
│       │   │   ├── service/
│       │   │   │   └── AlarmForegroundService.kt
│       │   │   │
│       │   │   ├── receiver/
│       │   │   │   ├── AlarmReceiver.kt
│       │   │   │   └── BootReceiver.kt
│       │   │   │
│       │   │   ├── nfc/
│       │   │   │   └── NfcTagHandler.kt
│       │   │   │
│       │   │   └── di/
│       │   │       └── AppModule.kt
│       │   │
│       │   └── res/
│       │       ├── raw/            <- alarm sounds (.mp3/.ogg)
│       │       └── xml/
│       │           └── nfc_tech_filter.xml
│       │
│       ├── test/                   <- unit tests
│       └── androidTest/            <- instrumented tests
│
├── gradle/wrapper/
├── build.gradle.kts
├── settings.gradle.kts
├── local.properties                <- gitignored, holds secrets
├── rize-release.keystore           <- gitignored, signing key
├── mistake.md
├── progress.md
├── CHANGELOG.md
├── SOP.md                          <- this file
└── README.md
```

---

## 4. Tech Stack Reference

| Layer | Library | Purpose |
|-------|---------|---------|
| UI | Jetpack Compose | Declarative UI |
| Navigation | Navigation Compose | Screen routing |
| Database | Room | Local persistence |
| DI | Hilt | Dependency injection |
| Async | Kotlin Coroutines + Flow | Reactive data, background work |
| Alarm scheduling | AlarmManager (`setAlarmClock`) | Exact alarm firing |
| Boot reschedule | WorkManager | Reschedule alarms after reboot |
| Audio | MediaPlayer | Alarm sound playback |
| NFC | NfcAdapter (system API) | Tag reading and UID matching |
| Crash reporting | Firebase Crashlytics (optional) | Free crash reporting |
| Lifecycle | ViewModel + SavedState | Survives config changes |

### Dependency Philosophy
- No library is added without a clear reason
- Prefer Jetpack/official Android libraries over third-party equivalents
- Pin all versions in `libs.versions.toml` (version catalog)

---

## 5. Permissions Reference

Declare in `AndroidManifest.xml`:

```xml
<!-- NFC — required=false so app installs on non-NFC devices, check at runtime -->
<uses-permission android:name="android.permission.NFC" />
<uses-feature android:name="android.hardware.nfc" android:required="false" />

<!-- Exact alarms — use both with maxSdkVersion to avoid duplicates -->
<uses-permission
    android:name="android.permission.SCHEDULE_EXACT_ALARM"
    android:maxSdkVersion="32" />
<uses-permission android:name="android.permission.USE_EXACT_ALARM" />

<!-- Background & system -->
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK" />
<uses-permission android:name="android.permission.WAKE_LOCK" />
<uses-permission android:name="android.permission.VIBRATE" />
<uses-permission android:name="android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
<uses-permission android:name="android.permission.USE_FULL_SCREEN_INTENT" />
```

### Runtime Permission Check Order (first launch onboarding)

1. `POST_NOTIFICATIONS` (Android 13+) — standard dialog
2. `SCHEDULE_EXACT_ALARM` — check `alarmManager.canScheduleExactAlarms()`; if false, open Settings
3. `REQUEST_IGNORE_BATTERY_OPTIMIZATIONS` — guide user to exempt Rize in battery settings
4. NFC enabled check — not a permission; check `NfcAdapter.isEnabled` at runtime

---

## 6. Core Implementation Rules

### 6.1 AlarmManager

**Always use `setAlarmClock()`.** Never use `setExact()` or `setExactAndAllowWhileIdle()` for the main alarm trigger.

```kotlin
fun scheduleAlarm(context: Context, alarm: Alarm) {
    val alarmManager = context.getSystemService(AlarmManager::class.java)

    // Mandatory permission check on API 31+
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
        if (!alarmManager.canScheduleExactAlarms()) {
            val intent = Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM)
            context.startActivity(intent)
            return
        }
    }

    val intent = Intent(context, AlarmReceiver::class.java).apply {
        putExtra("alarm_id", alarm.id)
    }
    val pendingIntent = PendingIntent.getBroadcast(
        context,
        alarm.id,
        intent,
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    )

    val alarmClockInfo = AlarmManager.AlarmClockInfo(alarm.triggerAtMillis, pendingIntent)
    alarmManager.setAlarmClock(alarmClockInfo, pendingIntent)
}

fun cancelAlarm(context: Context, alarmId: Int) {
    val alarmManager = context.getSystemService(AlarmManager::class.java)
    val intent = Intent(context, AlarmReceiver::class.java)
    val pendingIntent = PendingIntent.getBroadcast(
        context, alarmId, intent,
        PendingIntent.FLAG_NO_CREATE or PendingIntent.FLAG_IMMUTABLE
    )
    pendingIntent?.let { alarmManager.cancel(it) }
}
```

**Rules:**
- `PendingIntent.FLAG_IMMUTABLE` is mandatory on API 31+
- Use `alarm.id` as the request code — ensures each alarm has a unique PendingIntent
- Always check `canScheduleExactAlarms()` before every schedule call, not just on first launch (permission can be revoked at any time)
- Listen for `ACTION_SCHEDULE_EXACT_ALARM_PERMISSION_STATE_CHANGED` to reschedule when permission is re-granted

---

### 6.2 Foreground Service

```kotlin
class AlarmForegroundService : Service() {

    private lateinit var wakeLock: PowerManager.WakeLock
    private var mediaPlayer: MediaPlayer? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        startForeground(NOTIFICATION_ID, buildNotification())
        acquireWakeLock()
        playAlarmSound()
        return START_STICKY  // restart automatically if killed
    }

    override fun onDestroy() {
        releaseWakeLock()
        mediaPlayer?.stop()
        mediaPlayer?.release()
        super.onDestroy()
    }

    private fun acquireWakeLock() {
        val pm = getSystemService(PowerManager::class.java)
        wakeLock = pm.newWakeLock(
            PowerManager.PARTIAL_WAKE_LOCK,
            "Rize::AlarmWakeLock"
        )
        wakeLock.acquire(10 * 60 * 1000L) // 10 min safety ceiling
    }

    private fun releaseWakeLock() {
        if (::wakeLock.isInitialized && wakeLock.isHeld) wakeLock.release()
    }
}
```

**Rules:**
- `START_STICKY` is non-negotiable
- Always release `WakeLock` in `onDestroy()` — leaked WakeLock drains battery
- Volume escalates from 30% to 100% over 60 seconds — logic lives in this service
- The foreground notification must NOT have a "Stop" or "Dismiss" action button

---

### 6.3 NFC Implementation

**Tag registration (setup screen):**
```kotlin
override fun onResume() {
    super.onResume()
    val pendingIntent = PendingIntent.getActivity(
        this, 0,
        Intent(this, javaClass).addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP),
        PendingIntent.FLAG_MUTABLE  // must be MUTABLE for NFC foreground dispatch
    )
    nfcAdapter?.enableForegroundDispatch(this, pendingIntent, null, null)
}

override fun onPause() {
    nfcAdapter?.disableForegroundDispatch(this)
    super.onPause()
}

override fun onNewIntent(intent: Intent) {
    super.onNewIntent(intent)
    val tag = intent.getParcelableExtra<Tag>(NfcAdapter.EXTRA_TAG)
    val uid = tag?.id?.toHexString()
    // Store UID in Room, associated with the alarm
}

private fun ByteArray.toHexString() = joinToString("") { "%02X".format(it) }
```

**Tag dismissal (ringing screen):**
```kotlin
override fun onNewIntent(intent: Intent) {
    super.onNewIntent(intent)
    val tag = intent.getParcelableExtra<Tag>(NfcAdapter.EXTRA_TAG)
    val scannedUid = tag?.id?.toHexString()?.uppercase()
    val expectedUid = viewModel.expectedTagUid.value?.uppercase()

    if (scannedUid != null && scannedUid == expectedUid) {
        dismissAlarm()
    } else {
        showWrongTagFeedback() // red flash + single vibrate, do NOT dismiss
    }
}
```

**Rules:**
- `RingingActivity` must have `android:launchMode="singleTop"` in manifest
- NFC foreground dispatch PendingIntent must be `FLAG_MUTABLE` (unlike most other PendingIntents)
- UID comparison must always be case-insensitive — normalize to `.uppercase()` on both sides
- Always null-check `tag?.id` — it can be null on damaged or incompatible tags
- Accept all common NFC tag technologies (NfcA, NfcB, NfcF, NfcV) — user may buy any brand

**`res/xml/nfc_tech_filter.xml`:**
```xml
<resources xmlns:xliff="urn:oasis:names:tc:xliff:document:1.2">
    <tech-list><tech>android.nfc.tech.NfcA</tech></tech-list>
    <tech-list><tech>android.nfc.tech.NfcB</tech></tech-list>
    <tech-list><tech>android.nfc.tech.NfcF</tech></tech-list>
    <tech-list><tech>android.nfc.tech.NfcV</tech></tech-list>
</resources>
```

---

### 6.4 Lock Screen Activity

```kotlin
// In RingingActivity.onCreate()
if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
    setShowWhenLocked(true)
    setTurnScreenOn(true)
} else {
    @Suppress("DEPRECATION")
    window.addFlags(
        WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
        WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
    )
}
window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
```

**Manifest declaration:**
```xml
<activity
    android:name=".presentation.ringing.RingingActivity"
    android:launchMode="singleTop"
    android:showWhenLocked="true"
    android:turnScreenOn="true"
    android:exported="false" />
```

---

### 6.5 Boot Persistence

**`BootReceiver.kt`:**
```kotlin
class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Intent.ACTION_BOOT_COMPLETED ||
            intent.action == "android.intent.action.QUICKBOOT_POWERON") {
            RescheduleAlarmsWorker.enqueue(context)
        }
    }
}
```

**`RescheduleAlarmsWorker.kt`:**
```kotlin
class RescheduleAlarmsWorker(ctx: Context, params: WorkerParameters) :
    CoroutineWorker(ctx, params) {
    override suspend fun doWork(): Result {
        val alarms = alarmRepository.getActiveAlarms()
        alarms.forEach { alarm ->
            if (alarm.triggerAtMillis > System.currentTimeMillis()) {
                scheduleAlarmUseCase(alarm)
            }
        }
        return Result.success()
    }
}
```

**Manifest:**
```xml
<receiver android:name=".receiver.BootReceiver" android:exported="true">
    <intent-filter>
        <action android:name="android.intent.action.BOOT_COMPLETED" />
        <action android:name="android.intent.action.QUICKBOOT_POWERON" />
    </intent-filter>
</receiver>
```

---

### 6.6 Snooze / Cancel Budget (Weekly Limit)

The snooze and cancel feature is intentionally scarce — **1 use per week** across both snooze and cancel combined.

- The remaining count is stored in Room as part of a `WeeklyBudget` entity, keyed to the ISO week number
- At the start of a new week, the budget resets to 1 automatically
- In the UI, the button is labeled: **"Emergency Skip — 1 remaining this week"**
- When budget is 0, the button is hidden entirely — not greyed out, hidden
- This scarcity is a core product principle. Do not make it configurable in free tier

---

### 6.7 Repeating Alarm Storage Rule

**Never store raw `epochMillis` for repeating alarms.**

Store: `hour` (Int), `minute` (Int), `repeatDays` (bitmask or Set<DayOfWeek>).

Calculate `triggerAtMillis` fresh each time the alarm is scheduled or rescheduled. This ensures DST changes, timezone changes, and reboot reschedules all produce the correct next-fire time.

```kotlin
fun nextTriggerMillis(hour: Int, minute: Int, repeatDays: Set<DayOfWeek>): Long {
    val now = LocalDateTime.now()
    var candidate = now.withHour(hour).withMinute(minute).withSecond(0).withNano(0)
    if (candidate <= now) candidate = candidate.plusDays(1)
    while (candidate.dayOfWeek !in repeatDays) {
        candidate = candidate.plusDays(1)
    }
    return candidate.atZone(ZoneId.systemDefault()).toInstant().toEpochMilli()
}
```

---

## 7. Git Workflow

### Branch Naming

| Type | Pattern | Example |
|------|---------|---------|
| Feature | `feat/<name>` | `feat/nfc-setup-screen` |
| Bug fix | `fix/<name>` | `fix/alarm-not-firing-doze` |
| Chore | `chore/<name>` | `chore/update-dependencies` |
| Release prep | `release/v<version>` | `release/v1.0.0` |

### Commit Format (Conventional Commits)
```
<type>(<scope>): <short description>

Types: feat | fix | refactor | test | chore | docs | style
```

Examples:
```
feat(alarm): add volume escalation over 60 seconds
fix(nfc): handle null tag ID on incompatible tag types
test(alarm): add DST boundary scheduling edge case
```

### Workflow
```
1. git checkout main && git pull
2. git checkout -b feat/<name>
3. Make changes, commit incrementally
4. git push origin feat/<name>
5. Open PR on GitHub
6. CI must be green before merge
7. Squash and merge into main
8. Delete the feature branch
```

**Non-negotiable:**
- Never commit directly to `main`
- Never merge a PR with failing CI
- Never push without a commit message that follows the format above

---

## 8. GitHub Distribution (APK via Releases)

### How it works
1. A tagged commit (`v1.0.0`) triggers the release GitHub Actions workflow
2. The workflow builds and signs the release APK
3. The signed APK is uploaded as an asset to the GitHub Release
4. Users download and install the APK manually

### In-App Update Check

On each app launch, query the GitHub Releases API:
```
GET https://api.github.com/repos/<username>/rize-android/releases/latest
```
Compare `tag_name` (e.g., `"v1.2.0"`) against `BuildConfig.VERSION_NAME`. If newer, show a non-blocking update banner.

### User Installation (document in README)
```
1. Go to Settings → Apps → Special App Access → Install unknown apps
2. Allow your browser or Files app to install apps
3. Download Rize.apk from the GitHub Releases tab
4. Open the downloaded file and tap Install
(This only needs to be done once)
```

### Versioning Rules
- `versionName` in `build.gradle.kts` must always match the Git tag (tag `v1.2.0` → `versionName = "1.2.0"`)
- `versionCode` increments by 1 for every release, never decrements
- Keep `CHANGELOG.md` updated before every tag

---

## 9. CI/CD — GitHub Actions

### `ci.yml` — on every push and PR to `main`

```yaml
name: CI

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up JDK 17
        uses: actions/setup-java@v4
        with:
          java-version: '17'
          distribution: 'temurin'
          cache: gradle

      - name: Grant execute permission for gradlew
        run: chmod +x gradlew

      - name: Run lint
        run: ./gradlew lint

      - name: Run unit tests
        run: ./gradlew test

      - name: Upload lint results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: lint-results
          path: app/build/reports/lint-results-*.html
```

### `release.yml` — on version tags (`v*.*.*`)

```yaml
name: Release

on:
  push:
    tags:
      - 'v*.*.*'

jobs:
  build-and-release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up JDK 17
        uses: actions/setup-java@v4
        with:
          java-version: '17'
          distribution: 'temurin'
          cache: gradle

      - name: Grant execute permission for gradlew
        run: chmod +x gradlew

      - name: Run unit tests
        run: ./gradlew test

      - name: Build release APK
        run: ./gradlew assembleRelease

      - name: Sign APK
        uses: r0adkll/sign-android-release@v1
        with:
          releaseDirectory: app/build/outputs/apk/release
          signingKeyBase64: ${{ secrets.SIGNING_KEY_BASE64 }}
          alias: ${{ secrets.KEY_ALIAS }}
          keyStorePassword: ${{ secrets.KEYSTORE_PASSWORD }}
          keyPassword: ${{ secrets.KEY_PASSWORD }}

      - name: Create GitHub Release
        uses: softprops/action-gh-release@v2
        with:
          files: app/build/outputs/apk/release/app-release-signed.apk
          generate_release_notes: true
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### Required GitHub Secrets

Repository → Settings → Secrets and Variables → Actions

| Secret | Value |
|--------|-------|
| `SIGNING_KEY_BASE64` | Base64-encoded `.keystore` file |
| `KEYSTORE_PASSWORD` | Keystore password |
| `KEY_ALIAS` | `rize` |
| `KEY_PASSWORD` | Key password |

Encode your keystore on Windows:
```powershell
certutil -encode rize-release.keystore tmp.b64
# Copy the content between the header/footer lines into the secret
```

---

## 10. Build & Signing

### Generate Release Keystore (one-time only)

```bash
keytool -genkey -v \
  -keystore rize-release.keystore \
  -alias rize \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

**This keystore is permanent. Back it up to a password manager or secure cloud storage. If it is lost, users must uninstall and reinstall every future update.**

The keystore file is gitignored. It must never be committed to the repository.

### `build.gradle.kts` signing config

```kotlin
android {
    signingConfigs {
        create("release") {
            storeFile = file(properties["KEYSTORE_PATH"] as String)
            storePassword = properties["KEYSTORE_PASSWORD"] as String
            keyAlias = properties["KEY_ALIAS"] as String
            keyPassword = properties["KEY_PASSWORD"] as String
        }
    }
    buildTypes {
        release {
            signingConfig = signingConfigs.getByName("release")
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }
}
```

### Build Commands

```bash
./gradlew assembleDebug        # debug build for development
./gradlew assembleRelease      # signed release APK
./gradlew test                 # unit tests
./gradlew lint                 # lint check
./gradlew clean assembleRelease  # clean release build
```

---

## 11. Testing Procedures

### Unit Tests — `app/src/test/`

| Test Class | What it Tests |
|-----------|--------------|
| `AlarmSchedulerTest` | `triggerAtMillis` calculation: today, tomorrow, next-week repeat, DST boundaries, midnight |
| `NfcTagMatcherTest` | UID exact match, case-insensitive match, wrong tag, null tag, empty UID |
| `WakeStreakCalculatorTest` | Consecutive days, streak broken, same-day multiple alarms |
| `AlarmRepositoryTest` | Insert/query/delete/update — using in-memory Room DB |
| `WeeklyBudgetTest` | Budget resets on new week, budget depletion, button visibility logic |

### Manual QA Checklist (run before every release)

**Alarm firing:**
- [ ] Set alarm 1 minute from now → fires at exact second
- [ ] Set alarm with phone idle (screen off, Doze mode) → fires correctly
- [ ] Reboot device with an alarm set → alarm reschedules and fires

**NFC:**
- [ ] Register NFC tag → name displayed correctly
- [ ] Scan correct tag while ringing → alarm dismisses, wake log recorded
- [ ] Scan incorrect tag while ringing → red flash, vibrate, alarm continues
- [ ] Attempt scan with NFC off → warning shown, NFC settings deep link works
- [ ] Scan tag from a different manufacturer → works (cross-brand compatibility)

**Foreground Service:**
- [ ] Alarm fires → swipe app from recents → alarm continues
- [ ] Volume escalates from quiet to loud over ~60 seconds
- [ ] WakeLock released correctly after dismissal (check battery stats)

**Lock screen:**
- [ ] Alarm fires with screen off → RingingActivity appears on lock screen
- [ ] NFC scan works from lock screen without unlocking

**Snooze budget:**
- [ ] With 1 remaining: button visible, tap it → budget goes to 0, button disappears
- [ ] With 0 remaining: button is not visible at all
- [ ] New ISO week: budget resets to 1

**Permissions:**
- [ ] Fresh install → all permission prompts appear in correct order
- [ ] Revoke exact alarm permission → in-app warning shown → re-grant → alarms reschedule
- [ ] Battery optimization enabled for app → in-app warning shown

**UI/UX:**
- [ ] Dark mode — all screens render correctly
- [ ] Large font size — no text clipping or overflow
- [ ] Rotate device on alarm list → state preserved

---

## 12. Common Errors & Fixes

### `SecurityException: Caller does not have permission to schedule exact alarms`
**Cause:** `canScheduleExactAlarms()` returned false but `setAlarmClock()` was called.
**Fix:** Gate every `scheduleAlarm()` call with a `canScheduleExactAlarms()` check. Redirect to settings if false.

---

### Alarm fires in debug but not in release
**Cause:** ProGuard stripping `AlarmReceiver` or `BootReceiver`.
**Fix:** Add to `proguard-rules.pro`:
```
-keep class com.rize.alarm.receiver.** { *; }
-keep class com.rize.alarm.service.** { *; }
```

---

### NFC tag not detected on RingingActivity
**Cause 1:** Activity went to background, `disableForegroundDispatch` was called.
**Fix:** Verify `FLAG_SHOW_WHEN_LOCKED` is set so activity stays in foreground.

**Cause 2:** Second instance of activity was created instead of calling `onNewIntent`.
**Fix:** Confirm `android:launchMode="singleTop"` in manifest.

---

### `onNewIntent` fires but alarm doesn't dismiss
**Cause:** UID comparison is case-sensitive — stored vs scanned UIDs have different casing.
**Fix:** Normalize both UIDs with `.uppercase()` before comparing.

---

### Foreground Service killed immediately after starting
**Cause:** Battery optimization is active for the app.
**Fix:** Request `REQUEST_IGNORE_BATTERY_OPTIMIZATIONS` in onboarding. Also verify `android:foregroundServiceType="mediaPlayback"` is declared on the `<service>` in manifest.

---

### Alarm doesn't fire after reboot
**Cause 1:** `BootReceiver` missing `android:exported="true"` in manifest.
**Fix:** Add `android:exported="true"`.

**Cause 2:** App was never opened after install — Android blocks broadcasts to never-launched apps.
**Fix:** Document in README that the user must open Rize at least once before rebooting.

---

### Room crash after schema change
**Cause:** Schema changed with no migration written.
**Fix:** Always write a migration:
```kotlin
val MIGRATION_1_2 = object : Migration(1, 2) {
    override fun migrate(database: SupportSQLiteDatabase) {
        database.execSQL("ALTER TABLE alarms ADD COLUMN snooze_count INTEGER NOT NULL DEFAULT 0")
    }
}
```
`fallbackToDestructiveMigration()` is acceptable in development only. Never in a shipped version.

---

## 13. Edge Case Handling Reference

| Scenario | Expected Behavior |
|----------|------------------|
| NFC disabled when alarm fires | Full-screen warning with "Open NFC Settings" deep link. Alarm continues. |
| User lost their NFC tag | Settings → "Replace tag" to re-register. Emergency: 3x power button press stops alarm after 30s, logged. |
| Alarm set less than 60 seconds away | AlarmManager handles it. Show a warning toast in UI but don't block. |
| Two alarms fire at the same time | `RingingActivity` is `singleTop`. First alarm fires. Second is queued for 1 minute later. |
| Phone in silent/vibrate mode | Override with `STREAM_ALARM` at max volume. Warn user in settings that alarms bypass silent mode. |
| Wrong NFC tag scanned | Red border flash (300ms) + single vibrate (150ms) + "Wrong tag" text for 2s. No dismiss. |
| App force-stopped by user | `AlarmManager` intents survive on most devices. Behavior is manufacturer-dependent. Document this. |
| Very low battery (<5%) | Alarm fires regardless. WakeLock prevents deep sleep during ringing. |
| DST clock change | Use `LocalTime` + `DayOfWeek` for storage (see Section 6.7). Never raw epoch for repeating alarms. |
| Non-NFC device | `NfcAdapter.getDefaultAdapter(context)` returns null. Show a clear "Your device does not support NFC" message at setup and disable alarm creation. |
| Weekly snooze budget at 0 | Hide skip button entirely. No alternative dismiss path. This is by design. |

---

## 14. Feature Release Checklist

Complete every item before creating a release tag.

**Code:**
- [ ] All unit tests passing: `./gradlew test`
- [ ] Lint clean: `./gradlew lint`
- [ ] `versionCode` incremented in `build.gradle.kts`
- [ ] `versionName` updated to match the upcoming tag (without `v`)
- [ ] `CHANGELOG.md` updated with new version entry
- [ ] No debug `Log.d()` calls in release code path

**Testing:**
- [ ] Full manual QA checklist completed (Section 11)
- [ ] Tested on at least 2 Android versions (always include a Samsung device — manufacturer alarm restrictions are common)

**Git:**
- [ ] All changes on `main` via merged PRs
- [ ] CI pipeline green on `main`
- [ ] Create and push tag:
  ```bash
  git tag v1.0.0
  git push origin v1.0.0
  ```
- [ ] GitHub Actions release workflow completes → APK attached to release

**GitHub Release:**
- [ ] Title: `Rize v1.0.0`
- [ ] Release notes reviewed (auto-generated from commits)
- [ ] APK asset downloadable
- [ ] SHA-256 hash published in release notes:
  ```powershell
  Get-FileHash app-release-signed.apk -Algorithm SHA256
  ```
