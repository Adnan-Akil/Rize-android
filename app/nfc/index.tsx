import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { THEME } from "../../src/styles/theme";
import { NfcTag } from "../../src/db/schema";
import { nfcTagsRepository } from "../../src/db/nfcTagsRepository";
import { Text } from "../../src/components/ui/Text";
import { Card } from "../../src/components/ui/Card";
import { Badge } from "../../src/components/ui/Badge";
import { Button } from "../../src/components/ui/Button";
import { NfcPairingModal } from "../../src/components/NfcPairingModal";

export default function NfcScreen() {
  const router = useRouter();
  const [tags, setTags] = useState<NfcTag[]>([]);
  const [isPairingModalVisible, setIsPairingModalVisible] = useState(false);

  const loadTags = async () => {
    const list = await nfcTagsRepository.getAllTags();
    setTags(list);
  };

  useEffect(() => {
    loadTags();
  }, []);

  const handleDeleteTag = async (tag: NfcTag) => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch (e) {}

    await nfcTagsRepository.deleteTag(tag.id);
    await loadTags();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.back()}
          style={styles.backBtn}
        >
          <Text variant="bodySmall" style={styles.backText}>
            ← Dashboard
          </Text>
        </TouchableOpacity>

        <Text variant="h2" serif style={styles.headerTitle}>
          NFC Checkpoints
        </Text>

        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.infoBanner}>
          <Text variant="bodySmall" style={styles.infoText}>
            Registered NFC tags act as physical waking locks. Your alarm will ring until you physically tap the assigned tag.
          </Text>
        </View>

        {tags.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🏷️</Text>
            <Text variant="body" style={styles.emptyTitle}>
              No Checkpoints Paired
            </Text>
            <Text variant="bodySmall" style={styles.emptySubtitle}>
              Stick an NFC tag on your bathroom mirror, kitchen fridge, or desk, and tap "Pair New Checkpoint" below.
            </Text>
          </View>
        ) : (
          tags.map((tag) => (
            <Card key={tag.id} style={styles.tagCard}>
              <View style={styles.tagInfo}>
                <View style={styles.tagTitleRow}>
                  <Text variant="h3" style={styles.tagName}>
                    {tag.name}
                  </Text>
                  <Badge label={tag.uid} variant="cyan" size="sm" />
                </View>
                {tag.location && (
                  <Text variant="bodySmall" style={styles.tagLocation}>
                    📍 {tag.location}
                  </Text>
                )}
              </View>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => handleDeleteTag(tag)}
                style={styles.deleteBtn}
              >
                <Text variant="caption" style={styles.deleteText}>
                  Delete
                </Text>
              </TouchableOpacity>
            </Card>
          ))
        )}

        <View style={styles.actionContainer}>
          <Button
            title="+ Pair New Checkpoint"
            variant="primary"
            size="lg"
            onPress={() => setIsPairingModalVisible(true)}
          />
        </View>
      </ScrollView>

      <NfcPairingModal
        visible={isPairingModalVisible}
        onClose={() => setIsPairingModalVisible(false)}
        onSuccess={() => loadTags()}
      />
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
  backBtn: {
    paddingVertical: 4,
  },
  backText: {
    color: THEME.colors.primary,
  },
  headerTitle: {
    color: THEME.colors.text,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  infoBanner: {
    backgroundColor: "rgba(38, 101, 140, 0.2)",
    borderColor: THEME.colors.border,
    borderWidth: 1,
    borderRadius: THEME.radii.lg,
    padding: 14,
    marginBottom: 20,
  },
  infoText: {
    color: THEME.colors.cyan,
    lineHeight: 20,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyTitle: {
    color: THEME.colors.text,
    fontFamily: THEME.fonts.sansSemiBold,
    marginBottom: 6,
  },
  emptySubtitle: {
    color: THEME.colors.textMuted,
    textAlign: "center",
    maxWidth: 260,
    lineHeight: 20,
  },
  tagCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: 6,
    padding: 16,
  },
  tagInfo: {
    flex: 1,
  },
  tagTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  tagName: {
    color: THEME.colors.text,
    fontFamily: THEME.fonts.sansSemiBold,
  },
  tagLocation: {
    color: THEME.colors.textMuted,
    marginTop: 4,
  },
  deleteBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: THEME.radii.md,
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.3)",
    marginLeft: 12,
  },
  deleteText: {
    color: THEME.colors.danger,
    fontFamily: THEME.fonts.sansSemiBold,
  },
  actionContainer: {
    marginTop: 24,
  },
});
