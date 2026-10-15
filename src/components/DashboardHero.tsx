import React from "react";
import { View, StyleSheet } from "react-native";
import { THEME } from "../styles/theme";
import { Alarm } from "../db/schema";
import { formatDisplayTime } from "../features/alarms/timeUtils";
import { Card } from "./ui/Card";
import { Text } from "./ui/Text";
import { Badge } from "./ui/Badge";

export interface DashboardHeroProps {
  nextAlarm: Alarm | null;
  countdownText: string;
  tagName?: string | null;
}

export function DashboardHero({
  nextAlarm,
  countdownText,
  tagName,
}: DashboardHeroProps) {
  const isArmed = Boolean(nextAlarm && nextAlarm.isEnabled);

  return (
    <Card elevated style={styles.heroCard}>
      <View style={styles.topRow}>
        <Badge
          label={isArmed ? "ACTIVE & READY" : "ALL QUIET"}
          variant={isArmed ? "success" : "slate"}
          size="sm"
        />
        {tagName && isArmed && (
          <Badge label={tagName} variant="cyan" size="sm" />
        )}
      </View>

      <View style={styles.countdownContainer}>
        <Text variant="caption" style={styles.wakeLabel}>
          {isArmed ? "ESTIMATED WAKE UP" : "SYSTEM STATUS"}
        </Text>
        <Text style={styles.countdownValue}>{countdownText}</Text>
      </View>

      {isArmed && nextAlarm && (
        <View style={styles.footerRow}>
          <Text variant="bodySmall" style={styles.footerDetails}>
            {`Next: ${formatDisplayTime(nextAlarm.time).timeString}${
              nextAlarm.label ? ` • ${nextAlarm.label}` : ""
            }`}
          </Text>
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    backgroundColor: THEME.colors.surface,
    borderColor: THEME.colors.border,
    borderWidth: 1.5,
    borderRadius: THEME.radii.xl,
    padding: 20,
    marginVertical: 12,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  countdownContainer: {
    marginVertical: 4,
  },
  wakeLabel: {
    color: THEME.colors.textMuted,
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  countdownValue: {
    fontFamily: THEME.fonts.sansBold,
    fontSize: 38,
    lineHeight: 46,
    color: THEME.colors.cyan,
  },
  footerRow: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(38, 101, 140, 0.3)",
  },
  footerDetails: {
    color: THEME.colors.primary,
    fontFamily: THEME.fonts.sansMedium,
  },
});
