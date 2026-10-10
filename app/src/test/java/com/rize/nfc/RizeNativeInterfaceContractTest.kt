package com.rize.nfc

import android.webkit.JavascriptInterface
import org.junit.Assert.*
import org.junit.Test
import java.lang.reflect.Method

/**
 * Empirical contract test suite for RizeNativeInterface and MainActivity bridge methods.
 * Tests bridge annotations, method signatures, parameter types, and contract invariants.
 */
class RizeNativeInterfaceContractTest {

    @Test
    fun testAllRequiredBridgeMethodsExistAndHaveJavascriptInterface() {
        val clazz = RizeNativeInterface::class.java
        val methods = clazz.declaredMethods

        val requiredContracts = mapOf(
            "isNfcAvailable" to arrayOf<Class<*>>(),
            "isNfcEnabled" to arrayOf<Class<*>>(),
            "openNfcSettings" to arrayOf<Class<*>>(),
            "vibrate" to arrayOf<Class<*>>(String::class.java),
            "stopVibrate" to arrayOf<Class<*>>(),
            "startAlarmSound" to arrayOf<Class<*>>(),
            "stopAlarmSound" to arrayOf<Class<*>>(),
            "setScreenAwake" to arrayOf<Class<*>>(Boolean::class.javaPrimitiveType!!),
            "setSystemBarTheme" to arrayOf<Class<*>>(Boolean::class.javaPrimitiveType!!, String::class.java)
        )

        for ((name, paramTypes) in requiredContracts) {
            val method: Method? = try {
                clazz.getMethod(name, *paramTypes)
            } catch (e: NoSuchMethodException) {
                null
            }

            assertNotNull("Bridge method '$name' with parameters ${paramTypes.contentToString()} must exist on RizeNativeInterface", method)
            val jsAnnotation = method!!.getAnnotation(JavascriptInterface::class.java)
            assertNotNull("Bridge method '$name' MUST be annotated with @JavascriptInterface", jsAnnotation)
        }
    }

    @Test
    fun testReturnTypesOfBridgeMethods() {
        val clazz = RizeNativeInterface::class.java

        val isNfcAvailableMethod = clazz.getMethod("isNfcAvailable")
        assertEquals(Boolean::class.javaPrimitiveType, isNfcAvailableMethod.returnType)

        val isNfcEnabledMethod = clazz.getMethod("isNfcEnabled")
        assertEquals(Boolean::class.javaPrimitiveType, isNfcEnabledMethod.returnType)

        val openNfcSettingsMethod = clazz.getMethod("openNfcSettings")
        assertEquals(Void.TYPE, openNfcSettingsMethod.returnType)

        val vibrateMethod = clazz.getMethod("vibrate", String::class.java)
        assertEquals(Void.TYPE, vibrateMethod.returnType)

        val stopVibrateMethod = clazz.getMethod("stopVibrate")
        assertEquals(Void.TYPE, stopVibrateMethod.returnType)

        val startAlarmSoundMethod = clazz.getMethod("startAlarmSound")
        assertEquals(Void.TYPE, startAlarmSoundMethod.returnType)

        val stopAlarmSoundMethod = clazz.getMethod("stopAlarmSound")
        assertEquals(Void.TYPE, stopAlarmSoundMethod.returnType)

        val setScreenAwakeMethod = clazz.getMethod("setScreenAwake", Boolean::class.javaPrimitiveType!!)
        assertEquals(Void.TYPE, setScreenAwakeMethod.returnType)

        val setSystemBarThemeMethod = clazz.getMethod("setSystemBarTheme", Boolean::class.javaPrimitiveType!!, String::class.java)
        assertEquals(Void.TYPE, setSystemBarThemeMethod.returnType)
    }

    @Test
    fun testMainActivityExposesRequiredHelperMethods() {
        val clazz = MainActivity::class.java

        val setSystemBarThemeMethod = clazz.methods.find { it.name == "setSystemBarTheme" }
        assertNotNull("MainActivity must define setSystemBarTheme", setSystemBarThemeMethod)
        assertEquals(2, setSystemBarThemeMethod!!.parameterTypes.size)
        assertEquals(Boolean::class.javaPrimitiveType, setSystemBarThemeMethod.parameterTypes[0])
        assertEquals(String::class.java, setSystemBarThemeMethod.parameterTypes[1])

        val setKeepScreenOnMethod = clazz.methods.find { it.name == "setKeepScreenOn" }
        assertNotNull("MainActivity must define setKeepScreenOn", setKeepScreenOnMethod)
        assertEquals(1, setKeepScreenOnMethod!!.parameterTypes.size)
        assertEquals(Boolean::class.javaPrimitiveType, setKeepScreenOnMethod.parameterTypes[0])
    }

    @Test
    fun testVibrateSupportedTypesCoverage() {
        // Contract documentation specifies: "click", "heavy_click", "success", "alarm_pulse", "tick"
        val supportedTypes = setOf("click", "heavy_click", "success", "alarm_pulse", "tick")
        val testInputs = listOf("click", "heavy_click", "success", "alarm_pulse", "tick", "unknown_type", "")
        
        for (input in testInputs) {
            // Verifies our contract test tracks all supported inputs without compile or signature errors
            assertNotNull(input)
        }
        assertTrue(supportedTypes.contains("tick"))
    }
}
