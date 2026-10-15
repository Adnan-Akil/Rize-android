import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import * as Haptics from "expo-haptics";
import { THEME } from "../styles/theme";
import { NfcTag } from "../db/schema";
import { nfcTagsRepository } from "../db/nfcTagsRepository";
import { nfcService } from "../features/nfc/nfcService";
import { Text } from "./ui/Text";
import { Button } from "./ui/Button";
import { Badge } from "./ui/Badge";

export interface NfcPairingModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (newTag: NfcTag) => void;
}

export function NfcPairingModal({
  visible,
  onClose,
  onSuccess,
}: NfcPairingModalProps) {
  const [scannedUid, setScannedUid] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");

  useEffect(() => {
    if (!visible) {
      setScannedUid(null);
      setName("");
      setLocation("");
      return;
    }

    nfcService.startListening((uid) => {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (e) {}
      setScannedUid(uid);
    });

    return () => {
      nfcService.stopListening();
    };
  }, [visible]);

  const handleSimulateScan = () => {
    const randomHex = Array.from({ length: 7 }, () =>
      Math.floor(Math.random() * 256)
        .toString(16)
        .padStart(2, "0")
    ).join("");
    const formatted = nfcService.formatUid(randomHex);
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {}
    setScannedUid(formatted);
  };

  const handleSave = async () => {
    if (!scannedUid) return;

    const tag: NfcTag = {
      id: `tag_${Date.now()}`,
      name: name.trim() || "Checkpoint Tag",
      uid: scannedUid,
      location: location.trim() || null,
      createdAt: Date.now(),
    };

    await nfcTagsRepository.registerTag(tag);
    onSuccess(tag);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <SafeAreaView style={styles.modalContent}>
          <View style={styles.header}>
            <Text variant="h2" serif style={styles.title}>
              Pair NFC Tag
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text variant="bodySmall" style={styles.closeText}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>

          {!scannedUid ? (
            <View style={styles.scanningContainer}>
              <View style={styles.radarRing}>
                <View style={styles.innerRadar}>
                  <Text style={styles.radarIcon}>📡</Text>
                </View>
              </View>

              <Text variant="body" style={styles.scanningInstructions}>
                Hold any standard NFC sticker or card near the back of your phone
              </Text>

              {/* Dev / Emulator simulator action */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleSimulateScan}
                style={styles.simulateBtn}
              >
                <Text variant="caption" style={styles.simulateText}>
                  SIMULATE NFC SCAN (DEV)
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.formContainer}>
              <View style={styles.uidBadgeRow}>
                <Badge label="TAG DETECTED" variant="success" size="sm" />
                <Text variant="caption" style={styles.uidValue}>
                  {scannedUid}
                </Text>
              </View>

              <View style={styles.fieldSection}>
                <Text variant="caption" style={styles.fieldLabel}>
                  CHECKPOINT NAME
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Bathroom Mirror"
                  placeholderTextColor={THEME.colors.textMuted}
                  value={name}
                  onChangeText={setName}
                  autoFocus
                />
              </View>

              <View style={styles.fieldSection}>
                <Text variant="caption" style={styles.fieldLabel}>
                  LOCATION / NOTES
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Master Suite Bathroom"
                  placeholderTextColor={THEME.colors.textMuted}
                  value={location}
                  onChangeText={setLocation}
                />
              </View>

              <View style={styles.actionsRow}>
                <Button
                  title="Rescan Tag"
                  variant="secondary"
                  size="md"
                  onPress={() => setScannedUid(null)}
                  style={{ flex: 1, marginRight: 8 }}
                />
                <Button
                  title="Save Checkpoint"
                  variant="primary"
                  size="md"
                  onPress={handleSave}
                  style={{ flex: 1, marginLeft: 8 }}
                />
              </View>
            </View>
          )}
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(1, 28, 64, 0.8)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: THEME.colors.surface,
    borderTopLeftRadius: THEME.radii.xl,
    borderTopRightRadius: THEME.radii.xl,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    padding: 24,
    minHeight: 400,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  title: {
    color: THEME.colors.text,
  },
  closeBtn: {
    padding: 4,
  },
  closeText: {
    color: THEME.colors.textMuted,
  },
  scanningContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
  },
  radarRing: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1.5,
    borderColor: THEME.colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    backgroundColor: "rgba(84, 172, 191, 0.08)",
  },
  innerRadar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "rgba(167, 235, 242, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  radarIcon: {
    fontSize: 28,
  },
  scanningInstructions: {
    color: THEME.colors.textMuted,
    textAlign: "center",
    maxWidth: 260,
    lineHeight: 22,
    marginBottom: 24,
  },
  simulateBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: THEME.radii.full,
    borderWidth: 1,
    borderColor: THEME.colors.cyan,
    backgroundColor: "rgba(167, 235, 242, 0.1)",
  },
  simulateText: {
    color: THEME.colors.cyan,
    fontFamily: THEME.fonts.sansSemiBold,
    letterSpacing: 0.8,
  },
  formContainer: {
    paddingTop: 8,
  },
  uidBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 20,
  },
  uidValue: {
    fontFamily: THEME.fonts.sansBold,
    color: THEME.colors.cyan,
    letterSpacing: 1,
  },
  fieldSection: {
    marginBottom: 16,
  },
  fieldLabel: {
    color: THEME.colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  input: {
    backgroundColor: THEME.colors.canvas,
    borderColor: THEME.colors.border,
    borderWidth: 1,
    borderRadius: THEME.radii.lg,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: THEME.colors.text,
    fontFamily: THEME.fonts.sans,
    fontSize: 16,
  },
  actionsRow: {
    flexDirection: "row",
    marginTop: 16,
  },
});
