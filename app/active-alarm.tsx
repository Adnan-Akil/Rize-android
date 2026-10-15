import React, { useState, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { THEME } from "../src/styles/theme";
import { Alarm, NfcTag } from "../src/db/schema";
import { alarmsRepository } from "../src/db/alarmsRepository";
import { nfcTagsRepository } from "../src/db/nfcTagsRepository";
import { nfcService } from "../src/features/nfc/nfcService";
import { alarmSoundService } from "../src/features/ringtones/alarmSoundService";
import { Text } from "../src/components/ui/Text";
import { Badge } from "../src/components/ui/Badge";
import { Button } from "../src/components/ui/Button";
import { ActiveWakeWave } from "../src/components/ActiveWakeWave";

export default function ActiveAlarmScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ alarmId?: string }>();

  const [currentTime, setCurrentTime] = useState("");
  const [assignedTag, setAssignedTag] = useState<NfcTag | null>(null);
  const [disarmed, setDisarmed] = useState(false);

  // Dim-to-brightening ambient transition (starts at 0.65, brightens over 12s)
  const ambientBrightness = useRef(new Animated.Value(0.65)).current;

  useEffect(() => {
    // Start ambient brightening
    Animated.timing(ambientBrightness, {
      toValue: 1,
      duration: 12000,
      useNativeDriver: true,
    }).start();

    // Start alarm audio/vibration
    alarmSoundService.startAlarm(true);

    // Live clock ticker
    const updateClock = () => {
      const now = new Date();
      const h = now.getHours();
      const m = now.getMinutes().toString().padStart(2, "0");
      const s = now.getSeconds().toString().padStart(2, "0");
      const period = h >= 12 ? "PM" : "AM";
      const h12 = (h % 12 || 12).toString().padStart(2, "0");
      setCurrentTime(`${h12}:${m}:${s} ${period}`);
    };
    updateClock();
    const clockInterval = setInterval(updateClock, 1000);

    // Look up assigned tag if alarmId provided
    if (params.alarmId) {
      alarmsRepository.getAlarmById(params.alarmId).then((alarm) => {
        if (alarm && alarm.tagId) {
          nfcTagsRepository.getTagById(alarm.tagId).then(setAssignedTag);
        }
      });
    }

    // Start active NFC hardware scanning loop
    nfcService.startListening((scannedUid) => {
      handleTagScanned(scannedUid);
    });

    return () => {
      clearInterval(clockInterval);
      alarmSoundService.stopAlarm();
      nfcService.stopListening();
    };
  }, [params.alarmId]);

  const handleTagScanned = (scannedUid: string) => {
    // If assigned to a specific tag, verify UID
    if (assignedTag && assignedTag.uid !== scannedUid) {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } catch (e) {}
      return;
    }

    // Valid tag scanned
    disarmAlarm();
  };

  const disarmAlarm = () => {
    setDisarmed(true);
    alarmSoundService.stopAlarm();
    nfcService.stopListening();

    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {}

    setTimeout(() => {
      router.back();
    }, 1200);
  };

  const handleSnooze = () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch (e) {}

    alarmSoundService.stopAlarm();
    nfcService.stopListening();
    router.back();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Animated.View style={[styles.container, { opacity: ambientBrightness }]}>
        {/* Morning Brand & State */}
        <View style={styles.topSection}>
          <Badge label="GENTLE DAWN" variant="cyan" size="sm" />
          <Text variant="h1" serif style={styles.sereneHeadline}>
            {disarmed ? "Welcome to Your Morning" : "Rise with Intention"}
          </Text>
          <Text style={styles.clockNumeral}>{currentTime}</Text>
        </View>

        {/* Central Breathing Wave with NFC Target */}
        <View style={styles.waveSection}>
          <ActiveWakeWave size={280} />
          <View style={styles.instructionCard}>
            <Text variant="caption" style={styles.targetLabel}>
              PHYSICAL DISARM CHECKPOINT
            </Text>
            <Text variant="h3" style={styles.targetTagName}>
              {assignedTag ? assignedTag.name : "Tap Any NFC Checkpoint"}
            </Text>
            <Text variant="bodySmall" style={styles.tapInstruction}>
              Hold your registered NFC sticker near the phone to silence
            </Text>
          </View>
        </View>

        {/* Bottom Actions */}
        <View style={styles.bottomSection}>
          {/* Dev / Emulator simulator trigger */}
          <TouchableOpacity
            testID="simulate-disarm-btn"
            activeOpacity={0.7}
            onPress={disarmAlarm}
            style={styles.simulateBtn}
          >
            <Text variant="caption" style={styles.simulateText}>
              DISARM WITH NFC (SIMULATE)
            </Text>
          </TouchableOpacity>

          <Button
            testID="emergency-snooze-btn"
            title="Emergency Snooze (+5 min)"
            variant="secondary"
            size="md"
            onPress={handleSnooze}
          />
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: THEME.colors.canvas,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 20,
    justifyContent: "space-between",
  },
  topSection: {
    alignItems: "center",
    marginTop: 16,
  },
  sereneHeadline: {
    color: THEME.colors.text,
    textAlign: "center",
    marginTop: 12,
    marginBottom: 8,
  },
  clockNumeral: {
    fontFamily: THEME.fonts.sansBold,
    fontSize: 36,
    color: THEME.colors.cyan,
    letterSpacing: 1,
  },
  waveSection: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 20,
  },
  instructionCard: {
    alignItems: "center",
    backgroundColor: "rgba(2, 56, 89, 0.7)",
    borderColor: THEME.colors.border,
    borderWidth: 1,
    borderRadius: THEME.radii.xl,
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginTop: -20,
    maxWidth: 300,
  },
  targetLabel: {
    color: THEME.colors.textMuted,
    letterSpacing: 1,
    marginBottom: 4,
  },
  targetTagName: {
    color: THEME.colors.cyan,
    fontFamily: THEME.fonts.sansSemiBold,
    marginBottom: 4,
  },
  tapInstruction: {
    color: THEME.colors.textMuted,
    textAlign: "center",
    fontSize: 12,
    lineHeight: 16,
  },
  bottomSection: {
    gap: 12,
    marginBottom: 16,
  },
  simulateBtn: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: THEME.radii.lg,
    borderWidth: 1,
    borderColor: THEME.colors.primary,
    backgroundColor: "rgba(84, 172, 191, 0.12)",
  },
  simulateText: {
    color: THEME.colors.cyan,
    fontFamily: THEME.fonts.sansSemiBold,
    letterSpacing: 0.8,
  },
});
