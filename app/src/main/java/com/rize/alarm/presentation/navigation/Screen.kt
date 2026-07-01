package com.rize.alarm.presentation.navigation

/**
 * Screen navigation routes for the Rize application
 */
sealed class Screen(val route: String) {
    object AlarmList : Screen("alarm_list")
    object CreateAlarm : Screen("create_alarm?alarmId={alarmId}") {
        fun passAlarmId(alarmId: Int = -1): String = "create_alarm?alarmId=$alarmId"
    }
    object NfcSetup : Screen("nfc_setup?alarmId={alarmId}") {
        fun passAlarmId(alarmId: Int): String = "nfc_setup?alarmId=$alarmId"
    }
    object Stats : Screen("stats")
}
