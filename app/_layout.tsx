import React, { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useFonts, Lora_400Regular, Lora_600SemiBold } from "@expo-google-fonts/lora";
import {
  useFonts as useJakartaFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from "@expo-google-fonts/plus-jakarta-sans";
import { THEME } from "../src/styles/theme";
import { getDatabaseAdapter } from "../src/db/database";

export default function RootLayout() {
  const [loraLoaded] = useFonts({
    Lora_400Regular,
    Lora_600SemiBold,
  });

  const [jakartaLoaded] = useJakartaFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });

  useEffect(() => {
    // Warm up SQLite database schema
    try {
      getDatabaseAdapter().initialize();
    } catch (e) {
      console.warn("DB init warning", e);
    }
  }, []);

  if (!loraLoaded || !jakartaLoaded) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: THEME.colors.canvas,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator color={THEME.colors.primary} size="large" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" backgroundColor={THEME.colors.canvas} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: THEME.colors.canvas },
          animation: "fade",
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen
          name="alarms/new"
          options={{ presentation: "modal", animation: "slide_from_bottom" }}
        />
        <Stack.Screen
          name="alarms/[id]"
          options={{ presentation: "modal", animation: "slide_from_bottom" }}
        />
        <Stack.Screen
          name="nfc/index"
          options={{ presentation: "card", animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="active-alarm"
          options={{ presentation: "fullScreenModal", gestureEnabled: false }}
        />
      </Stack>
    </>
  );
}
