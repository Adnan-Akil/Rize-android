package com.rize.alarm.presentation

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.rize.alarm.presentation.alarm.AlarmListScreen
import com.rize.alarm.presentation.create.CreateAlarmScreen
import com.rize.alarm.presentation.navigation.Screen
import com.rize.alarm.presentation.setup.NfcSetupScreen
import com.rize.alarm.presentation.stats.StatsScreen
import com.rize.alarm.presentation.theme.RizeTheme
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            RizeTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = androidx.compose.material3.MaterialTheme.colorScheme.background
                ) {
                    val navController = rememberNavController()
                    NavHost(
                        navController = navController,
                        startDestination = Screen.AlarmList.route
                    ) {
                        composable(route = Screen.AlarmList.route) {
                            AlarmListScreen(navController = navController)
                        }

                        composable(
                            route = Screen.CreateAlarm.route,
                            arguments = listOf(
                                navArgument("alarmId") {
                                    type = NavType.IntType
                                    defaultValue = -1
                                }
                            )
                        ) { backStackEntry ->
                            val alarmId = backStackEntry.arguments?.getInt("alarmId") ?: -1
                            CreateAlarmScreen(navController = navController, alarmId = alarmId)
                        }

                        composable(
                            route = Screen.NfcSetup.route,
                            arguments = listOf(
                                navArgument("alarmId") {
                                    type = NavType.IntType
                                }
                            )
                        ) { backStackEntry ->
                            val alarmId = backStackEntry.arguments?.getInt("alarmId") ?: -1
                            NfcSetupScreen(navController = navController, alarmId = alarmId)
                        }

                        composable(route = Screen.Stats.route) {
                            StatsScreen(navController = navController)
                        }
                    }
                }
            }
        }
    }
}
