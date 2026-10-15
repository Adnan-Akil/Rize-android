import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { THEME } from "../../src/styles/theme";
import { Alarm, NfcTag } from "../../src/db/schema";
import { alarmsRepository } from "../../src/db/alarmsRepository";
import { nfcTagsRepository } from "../../src/db/nfcTagsRepository";
import { Text } from "../../src/components/ui/Text";
import { Button } from "../../src/components/ui/Button";
import { RadialClockPicker } from "../../src/components/RadialClockPicker";
import { RepeatDaysSelector } from "../../src/components/RepeatDaysSelector";

const PRESETS = [
  { hour: 6, minute: 0, label: "06:00" },
  { hour: 6, minute: 30, label: "06:30" },
  { hour: 7, minute: 0, label: "07:00" },
  { hour: 7, minute: 30, label: "07:30" },
];

export default function AddAlarmScreen() {
  const router = useRouter();
  const [hours, setHours] = useState(6);
  const [minutes, setMinutes] = useState(30);
  const [period, setPeriod] = useState<"AM" | "PM">("AM");
  const [mode, setMode] = useState<"hour" | "minute">("hour");
  const [label, setLabel] = useState("Morning Routine");
  const [repeatDays, setRepeatDays] = useState<number[]>([1, 2, 3, 4, 5]); // Mon-Fri
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  const [vibrate, setVibrate] = useState(true);
  const [tags, setTags] = useState<NfcTag[]>([]);

  useEffect(() => {
    nfcTagsRepository.getAllTags().then((t) => {
      setTags(t);
      if (t.length > 0) {
        setSelectedTagId(t[0].id);
      }
    });
  }, []);

  const handlePeriodChange = (newPeriod: "AM" | "PM") => {
    try {
      Haptics.selectionAsync();
    } catch (e) {}
    setPeriod(newPeriod);
  };

  const handlePresetSelect = (preset: typeof PRESETS[0]) => {
    try {
      Haptics.selectionAsync();
    } catch (e) {}
    setHours(preset.hour);
    setMinutes(preset.minute);
    setPeriod("AM");
  };

  const handleSave = async () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {}

    // Convert 12h to 24h
    let h24 = hours;
    if (period === "AM" && h24 === 12) h24 = 0;
    if (period === "PM" && h24 < 12) h24 += 12;

    const timeStr = `${h24.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;

    const newAlarm: Alarm = {
      id: `alarm_${Date.now()}`,
      time: timeStr,
      label: label.trim() || "Morning Routine",
      repeatDays,
      isEnabled: true,
      tagId: selectedTagId,
      ringtoneUri: null,
      vibrate,
      createdAt: Date.now(),
    };

    await alarmsRepository.createAlarm(newAlarm);
    router.back();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.back()}
          style={styles.headerAction}
        >
          <Text variant="bodySmall" style={styles.cancelText}>
            Cancel
          </Text>
        </TouchableOpacity>

        <Text variant="h3" serif style={styles.headerTitle}>
          Set Wake Routine
        </Text>

        <TouchableOpacity
          testID="save-alarm-btn"
          activeOpacity={0.7}
          onPress={handleSave}
          style={styles.headerAction}
        >
          <Text variant="bodySmall" style={styles.saveText}>
            Save
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Time Selector Hero */}
        <View style={styles.timeDisplayRow}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setMode("hour")}
            style={[styles.timeBox, mode === "hour" && styles.activeTimeBox]}
          >
            <Text style={[styles.timeDigits, mode === "hour" && styles.activeDigits]}>
              {hours.toString().padStart(2, "0")}
            </Text>
          </TouchableOpacity>

          <Text style={styles.timeColon}>:</Text>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setMode("minute")}
            style={[styles.timeBox, mode === "minute" && styles.activeTimeBox]}
          >
            <Text style={[styles.timeDigits, mode === "minute" && styles.activeDigits]}>
              {minutes.toString().padStart(2, "0")}
            </Text>
          </TouchableOpacity>

          {/* AM / PM Toggle Pill */}
          <View style={styles.ampmContainer}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => handlePeriodChange("AM")}
              style={[styles.ampmBtn, period === "AM" && styles.activeAmpmBtn]}
            >
              <Text
                variant="caption"
                style={[styles.ampmText, period === "AM" && styles.activeAmpmText]}
              >
                AM
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => handlePeriodChange("PM")}
              style={[styles.ampmBtn, period === "PM" && styles.activeAmpmBtn]}
            >
              <Text
                variant="caption"
                style={[styles.ampmText, period === "PM" && styles.activeAmpmText]}
              >
                PM
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Presets */}
        <View style={styles.presetsRow}>
          {PRESETS.map((p) => (
            <TouchableOpacity
              key={p.label}
              activeOpacity={0.7}
              onPress={() => handlePresetSelect(p)}
              style={styles.presetPill}
            >
              <Text variant="caption" style={styles.presetText}>
                {p.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Radial Dial */}
        <View style={styles.dialContainer}>
          <RadialClockPicker
            value={{ hours, minutes }}
            onChange={({ hours: h, minutes: m }) => {
              setHours(h);
              setMinutes(m);
            }}
            mode={mode}
            onModeChange={(m) => setMode(m)}
            size={270}
          />
        </View>

        {/* Label Field */}
        <View style={styles.fieldSection}>
          <Text variant="caption" style={styles.fieldLabel}>
            ROUTINE LABEL
          </Text>
          <TextInput
            style={styles.input}
            value={label}
            onChangeText={setLabel}
            placeholder="e.g. Dawn Focus"
            placeholderTextColor={THEME.colors.textMuted}
          />
        </View>

        {/* Repeat Days */}
        <View style={styles.fieldSection}>
          <Text variant="caption" style={styles.fieldLabel}>
            REPEAT SCHEDULE
          </Text>
          <RepeatDaysSelector days={repeatDays} onChange={setRepeatDays} />
        </View>

        {/* NFC Checkpoint Selector */}
        <View style={styles.fieldSection}>
          <Text variant="caption" style={styles.fieldLabel}>
            ASSIGNED NFC CHECKPOINT
          </Text>
          {tags.length === 0 ? (
            <Text variant="bodySmall" style={styles.noTagsText}>
              No NFC tags registered yet. Pair tags in the NFC section to require scanning.
            </Text>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tagScroll}>
              {tags.map((t) => {
                const isSelected = selectedTagId === t.id;
                return (
                  <TouchableOpacity
                    key={t.id}
                    activeOpacity={0.7}
                    onPress={() => setSelectedTagId(isSelected ? null : t.id)}
                    style={[
                      styles.tagPill,
                      isSelected ? styles.selectedTagPill : styles.unselectedTagPill,
                    ]}
                  >
                    <Text
                      variant="caption"
                      style={[
                        styles.tagPillText,
                        isSelected && { color: "#011C40" },
                      ]}
                    >
                      {t.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>

        {/* Vibration Toggle */}
        <View style={styles.switchRow}>
          <Text variant="body">Vibration Pulse</Text>
          <Switch
            value={vibrate}
            onValueChange={setVibrate}
            trackColor={{ false: THEME.colors.border, true: THEME.colors.primary }}
            thumbColor={vibrate ? THEME.colors.cyan : "#8EA5B8"}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: THEME.colors.canvas,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  headerAction: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  cancelText: {
    color: THEME.colors.textMuted,
  },
  headerTitle: {
    color: THEME.colors.text,
  },
  saveText: {
    color: THEME.colors.cyan,
    fontFamily: THEME.fonts.sansBold,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  timeDisplayRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 12,
  },
  timeBox: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: THEME.radii.md,
    backgroundColor: "rgba(2, 56, 89, 0.4)",
    borderWidth: 1,
    borderColor: "transparent",
  },
  activeTimeBox: {
    borderColor: THEME.colors.primary,
    backgroundColor: THEME.colors.surface,
  },
  timeDigits: {
    fontFamily: THEME.fonts.sansBold,
    fontSize: 48,
    lineHeight: 56,
    color: THEME.colors.textMuted,
  },
  activeDigits: {
    color: THEME.colors.cyan,
  },
  timeColon: {
    fontFamily: THEME.fonts.sansBold,
    fontSize: 42,
    color: THEME.colors.border,
    marginHorizontal: 8,
  },
  ampmContainer: {
    marginLeft: 16,
    borderRadius: THEME.radii.md,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    backgroundColor: THEME.colors.surface,
    overflow: "hidden",
  },
  ampmBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  activeAmpmBtn: {
    backgroundColor: THEME.colors.primary,
  },
  ampmText: {
    color: THEME.colors.textMuted,
    fontFamily: THEME.fonts.sansSemiBold,
  },
  activeAmpmText: {
    color: "#011C40",
  },
  presetsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginVertical: 8,
  },
  presetPill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: THEME.radii.full,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    backgroundColor: "rgba(38, 101, 140, 0.15)",
  },
  presetText: {
    color: THEME.colors.cyan,
    fontFamily: THEME.fonts.sansSemiBold,
  },
  dialContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 16,
  },
  fieldSection: {
    marginVertical: 10,
  },
  fieldLabel: {
    color: THEME.colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  input: {
    backgroundColor: THEME.colors.surface,
    borderColor: THEME.colors.border,
    borderWidth: 1,
    borderRadius: THEME.radii.lg,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: THEME.colors.text,
    fontFamily: THEME.fonts.sans,
    fontSize: 16,
  },
  tagScroll: {
    flexDirection: "row",
    marginVertical: 4,
  },
  tagPill: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: THEME.radii.full,
    borderWidth: 1,
    marginRight: 8,
  },
  selectedTagPill: {
    backgroundColor: THEME.colors.primary,
    borderColor: THEME.colors.cyan,
  },
  unselectedTagPill: {
    backgroundColor: THEME.colors.surface,
    borderColor: THEME.colors.border,
  },
  tagPillText: {
    color: THEME.colors.cyan,
    fontFamily: THEME.fonts.sansSemiBold,
  },
  noTagsText: {
    color: THEME.colors.textMuted,
    fontStyle: "italic",
    marginTop: 4,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 14,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
  },
});
