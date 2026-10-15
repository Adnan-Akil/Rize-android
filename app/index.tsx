import React, { useState, useCallback } from "react";
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import * as Haptics from "expo-haptics";
import { THEME } from "../src/styles/theme";
import { Alarm, NfcTag } from "../src/db/schema";
import { alarmsRepository } from "../src/db/alarmsRepository";
import { nfcTagsRepository } from "../src/db/nfcTagsRepository";
import { useAlarmCountdown } from "../src/hooks/useAlarmCountdown";
import { Text } from "../src/components/ui/Text";
import { DashboardHero } from "../src/components/DashboardHero";
import { SwipeableAlarmCard } from "../src/components/SwipeableAlarmCard";
import { BottomNavBar } from "../src/components/BottomNavBar";

export default function DashboardScreen() {
  const router = useRouter();
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [tags, setTags] = useState<NfcTag[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"alarms" | "nfc">("alarms");

  const loadData = useCallback(async () => {
    try {
      const [fetchedAlarms, fetchedTags] = await Promise.all([
        alarmsRepository.getAllAlarms(),
        nfcTagsRepository.getAllTags(),
      ]);
      setAlarms(fetchedAlarms);
      setTags(fetchedTags);
    } catch (e) {
      console.warn("Error loading dashboard data", e);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Find nearest enabled alarm
  const nextAlarm = alarms.find((a) => a.isEnabled) || null;
  const countdown = useAlarmCountdown(nextAlarm);

  const tagMap = new Map<string, string>(tags.map((t: NfcTag) => [t.id, t.name]));
  const nextAlarmTagName = nextAlarm?.tagId ? tagMap.get(nextAlarm.tagId) : null;

  const handleToggle = async (id: string, isEnabled: boolean) => {
    await alarmsRepository.toggleAlarm(id, isEnabled);
    await loadData();
  };

  const handleDelete = async (id: string) => {
    await alarmsRepository.deleteAlarm(id);
    await loadData();
  };

  const handleUpdate = async (updated: Alarm) => {
    await alarmsRepository.updateAlarm(updated);
    await loadData();
  };

  const handleAddAlarm = () => {
    router.push("/alarms/new");
  };

  const handleSelectTab = (tab: "alarms" | "nfc") => {
    setActiveTab(tab);
    if (tab === "nfc") {
      router.push("/nfc");
    }
  };

  const triggerTestWake = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch (e) {}
    router.push("/active-alarm");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View>
          <Text variant="h1" serif style={styles.brandTitle}>
            RIZE
          </Text>
          <Text variant="caption" style={styles.brandSubtitle}>
            EDITORIAL PEACE & WAKE ROUTINE
          </Text>
        </View>

        {/* Quick test wake trigger */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={triggerTestWake}
          style={styles.testBadge}
        >
          <Text variant="caption" style={styles.testBadgeText}>
            TEST WAKE
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={THEME.colors.primary}
          />
        }
      >
        {/* Glanceable Hero */}
        <DashboardHero
          nextAlarm={nextAlarm}
          countdownText={countdown.formattedCountdown}
          tagName={nextAlarmTagName}
        />

        {/* Section Title */}
        <View style={styles.sectionRow}>
          <Text variant="h3" serif style={styles.sectionTitle}>
            Your Alarms
          </Text>
          <Text variant="caption" style={styles.alarmCount}>
            {`${alarms.length} SCHEDULED`}
          </Text>
        </View>

        {/* Alarm List */}
        {alarms.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text variant="body" style={styles.emptyText}>
              No alarms set yet. Tap '+' to create your first peaceful wake routine.
            </Text>
          </View>
        ) : (
          alarms.map((alarm) => (
            <SwipeableAlarmCard
              key={alarm.id}
              alarm={alarm}
              tagName={alarm.tagId ? tagMap.get(alarm.tagId) : null}
              onToggle={handleToggle}
              onDelete={handleDelete}
              onUpdate={handleUpdate}
            />
          ))
        )}
      </ScrollView>

      {/* Floating Bottom Nav */}
      <BottomNavBar
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        onAddAlarm={handleAddAlarm}
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
    paddingTop: 16,
    paddingBottom: 8,
  },
  brandTitle: {
    color: THEME.colors.text,
    letterSpacing: 2,
  },
  brandSubtitle: {
    color: THEME.colors.primary,
    letterSpacing: 1,
    marginTop: 2,
  },
  testBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: THEME.radii.full,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    backgroundColor: "rgba(38, 101, 140, 0.2)",
  },
  testBadgeText: {
    color: THEME.colors.cyan,
    fontFamily: THEME.fonts.sansSemiBold,
    letterSpacing: 0.5,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  sectionRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    marginTop: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    color: THEME.colors.text,
  },
  alarmCount: {
    color: THEME.colors.textMuted,
    letterSpacing: 0.8,
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    color: THEME.colors.textMuted,
    textAlign: "center",
    maxWidth: 260,
    lineHeight: 22,
  },
});
