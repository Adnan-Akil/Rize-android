import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { THEME } from "../../src/styles/theme";
import { Alarm, NfcTag } from "../../src/db/schema";
import { alarmsRepository } from "../../src/db/alarmsRepository";
import { nfcTagsRepository } from "../../src/db/nfcTagsRepository";
import { Text } from "../../src/components/ui/Text";
import { RadialClockPicker } from "../../src/components/RadialClockPicker";
import { RepeatDaysSelector } from "../../src/components/RepeatDaysSelector";

export default function EditAlarmScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [loading, setLoading] = useState(true);
  const [alarm, setAlarm] = useState<Alarm | null>(null);
  const [hours, setHours] = useState(6);
  const [minutes, setMinutes] = useState(30);
  const [period, setPeriod] = useState<"AM" | "PM">("AM");
  const [mode, setMode] = useState<"hour" | "minute">("hour");
  const [label, setLabel] = useState("");
  const [repeatDays, setRepeatDays] = useState<number[]>([]);
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  const [vibrate, setVibrate] = useState(true);
  const [tags, setTags] = useState<NfcTag[]>([]);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      alarmsRepository.getAlarmById(id),
      nfcTagsRepository.getAllTags(),
    ]).then(([fetchedAlarm, fetchedTags]) => {
      setTags(fetchedTags);
      if (fetchedAlarm) {
        setAlarm(fetchedAlarm);
        setLabel(fetchedAlarm.label);
        setRepeatDays(fetchedAlarm.repeatDays);
        setSelectedTagId(fetchedAlarm.tagId);
        setVibrate(fetchedAlarm.vibrate);

        const [hStr, mStr] = fetchedAlarm.time.split(":");
        let h = parseInt(hStr, 10);
        const m = parseInt(mStr, 10);
        const p: "AM" | "PM" = h >= 12 ? "PM" : "AM";
        if (h === 0) h = 12;
        else if (h > 12) h -= 12;
        setHours(h);
        setMinutes(m);
        setPeriod(p);
      }
      setLoading(false);
    });
  }, [id]);

  const handleSave = async () => {
    if (!alarm) return;
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {}

    let h24 = hours;
    if (period === "AM" && h24 === 12) h24 = 0;
    if (period === "PM" && h24 < 12) h24 += 12;

    const timeStr = `${h24.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;

    await alarmsRepository.updateAlarm({
      ...alarm,
      time: timeStr,
      label: label.trim() || "Morning Routine",
      repeatDays,
      tagId: selectedTagId,
      vibrate,
    });

    router.back();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ActivityIndicator color={THEME.colors.primary} size="large" />
      </SafeAreaView>
    );
  }

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
          Edit Alarm
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

          <View style={styles.ampmContainer}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setPeriod("AM")}
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
              onPress={() => setPeriod("PM")}
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

        <View style={styles.fieldSection}>
          <Text variant="caption" style={styles.fieldLabel}>
            ROUTINE LABEL
          </Text>
          <TextInput
            style={styles.input}
            value={label}
            onChangeText={setLabel}
            placeholderTextColor={THEME.colors.textMuted}
          />
        </View>

        <View style={styles.fieldSection}>
          <Text variant="caption" style={styles.fieldLabel}>
            REPEAT SCHEDULE
          </Text>
          <RepeatDaysSelector days={repeatDays} onChange={setRepeatDays} />
        </View>

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
