import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import * as Haptics from "expo-haptics";
import { THEME } from "../styles/theme";
import { Text } from "./ui/Text";

export interface RepeatDaysSelectorProps {
  days: number[]; // 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat, 7=Sun
  onChange: (days: number[]) => void;
  size?: "sm" | "md";
}

const DAYS_META = [
  { day: 1, label: "M" },
  { day: 2, label: "T" },
  { day: 3, label: "W" },
  { day: 4, label: "T" },
  { day: 5, label: "F" },
  { day: 6, label: "S" },
  { day: 7, label: "S" },
];

export function RepeatDaysSelector({
  days,
  onChange,
  size = "md",
}: RepeatDaysSelectorProps) {
  const toggleDay = (dayNum: number) => {
    try {
      Haptics.selectionAsync();
    } catch (e) {}

    if (days.includes(dayNum)) {
      onChange(days.filter((d) => d !== dayNum));
    } else {
      onChange([...days, dayNum].sort((a, b) => a - b));
    }
  };

  const circleSize = size === "sm" ? 28 : 36;

  return (
    <View style={styles.container}>
      {DAYS_META.map(({ day, label }) => {
        const isSelected = days.includes(day);

        return (
          <TouchableOpacity
            key={day}
            activeOpacity={0.7}
            onPress={() => toggleDay(day)}
            style={[
              styles.circle,
              { width: circleSize, height: circleSize, borderRadius: circleSize / 2 },
              isSelected ? styles.selectedCircle : styles.unselectedCircle,
            ]}
          >
            <Text
              variant="caption"
              style={[
                styles.label,
                { color: isSelected ? "#011C40" : THEME.colors.textMuted },
              ]}
            >
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: 8,
  },
  circle: {
    alignItems: "center",
    justifyContent: "center",
  },
  selectedCircle: {
    backgroundColor: THEME.colors.primary,
    borderColor: THEME.colors.cyan,
    borderWidth: 1,
  },
  unselectedCircle: {
    backgroundColor: "rgba(38, 101, 140, 0.2)",
    borderColor: THEME.colors.border,
    borderWidth: 1,
  },
  label: {
    fontFamily: THEME.fonts.sansSemiBold,
  },
});
