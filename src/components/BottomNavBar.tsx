import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import * as Haptics from "expo-haptics";
import { THEME } from "../styles/theme";
import { Text } from "./ui/Text";

export interface BottomNavBarProps {
  activeTab: "alarms" | "nfc";
  onSelectTab: (tab: "alarms" | "nfc") => void;
  onAddAlarm: () => void;
}

export function BottomNavBar({
  activeTab,
  onSelectTab,
  onAddAlarm,
}: BottomNavBarProps) {
  const handleTabPress = (tab: "alarms" | "nfc") => {
    try {
      Haptics.selectionAsync();
    } catch (e) {}
    onSelectTab(tab);
  };

  const handleAddPress = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (e) {}
    onAddAlarm();
  };

  return (
    <View style={styles.container}>
      {/* Alarms Tab */}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => handleTabPress("alarms")}
        style={styles.tabItem}
      >
        <Text
          variant="bodySmall"
          style={[
            styles.tabText,
            activeTab === "alarms" ? styles.activeTabText : styles.inactiveTabText,
          ]}
        >
          Alarms
        </Text>
      </TouchableOpacity>

      {/* Center Elevated '+' Button */}
      <TouchableOpacity
        testID="bottom-nav-add-btn"
        activeOpacity={0.8}
        onPress={handleAddPress}
        style={styles.centerAddButton}
      >
        <Text style={styles.addIcon}>+</Text>
      </TouchableOpacity>

      {/* NFC Tags Tab */}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => handleTabPress("nfc")}
        style={styles.tabItem}
      >
        <Text
          variant="bodySmall"
          style={[
            styles.tabText,
            activeTab === "nfc" ? styles.activeTabText : styles.inactiveTabText,
          ]}
        >
          NFC Tags
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    backgroundColor: THEME.colors.surface,
    borderTopColor: THEME.colors.border,
    borderTopWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    height: 72,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  tabText: {
    fontFamily: THEME.fonts.sansSemiBold,
    fontSize: 14,
  },
  activeTabText: {
    color: THEME.colors.cyan,
  },
  inactiveTabText: {
    color: THEME.colors.textMuted,
  },
  centerAddButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: THEME.colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: THEME.colors.cyan,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
    marginHorizontal: 16,
  },
  addIcon: {
    fontFamily: THEME.fonts.sansBold,
    fontSize: 26,
    lineHeight: 28,
    color: "#011C40",
  },
});
