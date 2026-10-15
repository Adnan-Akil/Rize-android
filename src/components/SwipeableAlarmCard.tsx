import React, { useState } from "react";
import { View, StyleSheet, TouchableOpacity, Switch } from "react-native";
import * as Haptics from "expo-haptics";
import { THEME } from "../styles/theme";
import { Alarm } from "../db/schema";
import { formatDisplayTime } from "../features/alarms/timeUtils";
import { Card } from "./ui/Card";
import { Text } from "./ui/Text";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import { RepeatDaysSelector } from "./RepeatDaysSelector";

export interface SwipeableAlarmCardProps {
  alarm: Alarm;
  tagName?: string | null;
  onToggle: (id: string, isEnabled: boolean) => void;
  onDelete: (id: string) => void;
  onUpdate: (updated: Alarm) => void;
}

export function SwipeableAlarmCard({
  alarm,
  tagName,
  onToggle,
  onDelete,
  onUpdate,
}: SwipeableAlarmCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { hours, minutes, period } = formatDisplayTime(alarm.time);

  const handleToggle = (val: boolean) => {
    try {
      Haptics.selectionAsync();
    } catch (e) {}
    onToggle(alarm.id, val);
  };

  const handleCardPress = () => {
    try {
      Haptics.selectionAsync();
    } catch (e) {}
    setIsExpanded((prev) => !prev);
  };

  const handleDaysChange = (newDays: number[]) => {
    onUpdate({
      ...alarm,
      repeatDays: newDays,
    });
  };

  const handleDeletePress = () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch (e) {}
    onDelete(alarm.id);
  };

  return (
    <Card style={styles.cardContainer}>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={handleCardPress}
        style={styles.mainContent}
      >
        <View style={styles.timeSection}>
          <View style={styles.timeRow}>
            <Text
              style={[
                styles.timeText,
                !alarm.isEnabled && styles.disabledText,
              ]}
            >
              {`${hours}:${minutes}`}
            </Text>
            <Text
              variant="caption"
              style={[
                styles.periodText,
                !alarm.isEnabled && styles.disabledText,
              ]}
            >
              {period}
            </Text>
          </View>
          <Text
            variant="bodySmall"
            style={[styles.labelText, !alarm.isEnabled && styles.disabledText]}
          >
            {alarm.label}
          </Text>
        </View>

        <View style={styles.controlsSection}>
          <Switch
            testID={`alarm-toggle-${alarm.id}`}
            value={alarm.isEnabled}
            onValueChange={handleToggle}
            trackColor={{ false: THEME.colors.border, true: THEME.colors.primary }}
            thumbColor={alarm.isEnabled ? THEME.colors.cyan : "#8EA5B8"}
          />
        </View>
      </TouchableOpacity>

      {/* Glanceable Tag Pill */}
      {tagName && (
        <View style={styles.tagRow}>
          <Badge label={tagName} variant="cyan" size="sm" />
        </View>
      )}

      {/* Inline Expansion Area */}
      {isExpanded && (
        <View style={styles.expandedSection}>
          <View style={styles.divider} />
          <Text variant="caption" style={styles.sectionHeader}>
            REPEAT SCHEDULE
          </Text>
          <RepeatDaysSelector
            days={alarm.repeatDays}
            onChange={handleDaysChange}
            size="sm"
          />

          <View style={styles.expandedActions}>
            <Button
              title="Delete Alarm"
              variant="danger"
              size="sm"
              onPress={handleDeletePress}
            />
          </View>
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    marginVertical: 6,
    padding: 18,
  },
  mainContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  timeSection: {
    flex: 1,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  timeText: {
    fontFamily: THEME.fonts.sansBold,
    fontSize: 34,
    lineHeight: 40,
    color: THEME.colors.cyan,
  },
  periodText: {
    fontFamily: THEME.fonts.sansSemiBold,
    fontSize: 14,
    color: THEME.colors.primary,
    marginLeft: 6,
  },
  labelText: {
    fontFamily: THEME.fonts.sans,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
  disabledText: {
    color: THEME.colors.textMuted,
    opacity: 0.5,
  },
  controlsSection: {
    marginLeft: 12,
  },
  tagRow: {
    marginTop: 10,
    flexDirection: "row",
  },
  expandedSection: {
    marginTop: 14,
  },
  divider: {
    height: 1,
    backgroundColor: THEME.colors.border,
    marginBottom: 12,
  },
  sectionHeader: {
    color: THEME.colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  expandedActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 10,
  },
});
