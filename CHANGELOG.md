# Changelog

All notable changes to Rize will be documented here.
Format: [Unreleased] → [v1.0.0] on release.

## [Unreleased]

### Added
- Initial project scaffold: Gradle setup, Room DB, Hilt DI
- AlarmManager scheduling with exact alarm permission handling
- AlarmForegroundService with volume escalation and WakeLock
- BootReceiver + RescheduleAlarmsWorker for reboot persistence
- CI/CD: GitHub Actions for lint/test on push, APK release on version tags
