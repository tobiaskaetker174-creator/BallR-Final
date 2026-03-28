import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";

const SETTINGS_LIST = [
  {
    key: "game_reminders",
    label: "Game Reminders",
    description: "2 hours before kick-off",
  },
  {
    key: "team_announcements",
    label: "Team Announcements",
    description: "When AI balances and publishes the teams",
  },
  {
    key: "rating_prompts",
    label: "Rating Prompts",
    description: "Remind you to rate players after a match",
  },
  {
    key: "carpool_requests",
    label: "Carpool Requests",
    description: "When someone offers or requests a ride",
  },
  {
    key: "friend_activity",
    label: "Friend Activity",
    description: "When players you follow join a game",
  },
  {
    key: "admin_alerts",
    label: "Admin Alerts",
    description: "No-show records and account notices",
  },
  {
    key: "potm_updates",
    label: "Baller of the Month Updates",
    description: "Monthly leaderboard and award announcements",
  },
];

const DEFAULTS = Object.fromEntries(SETTINGS_LIST.map((s) => [s.key, true]));

export default function NotificationSettingsScreen() {
  const insets = useSafeAreaInsets();
  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const [enabled, setEnabled] = useState<Record<string, boolean>>(DEFAULTS);

  const toggle = (key: string) => {
    Haptics.selectionAsync();
    setEnabled((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const restoreDefaults = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setEnabled({ ...DEFAULTS });
  };

  return (
    <View style={[styles.container, { paddingTop: topPadding }]}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Notification Settings</Text>
        <Pressable onPress={restoreDefaults} style={styles.resetBtn}>
          <Text style={styles.resetBtnText}>Restore defaults</Text>
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + 24 },
        ]}
      >
        <Text style={styles.sectionLabel}>ALERT TYPES</Text>
        <View style={styles.card}>
          {SETTINGS_LIST.map((setting, i) => (
            <View
              key={setting.key}
              style={[
                styles.settingRow,
                i < SETTINGS_LIST.length - 1 && styles.settingRowBorder,
              ]}
            >
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>{setting.label}</Text>
                <Text style={styles.settingDesc}>{setting.description}</Text>
              </View>
              <Switch
                value={!!enabled[setting.key]}
                onValueChange={() => toggle(setting.key)}
                trackColor={{ false: Colors.overlay, true: Colors.primary }}
                thumbColor={enabled[setting.key] ? Colors.accent : Colors.muted}
              />
            </View>
          ))}
        </View>
        <Text style={styles.footerNote}>
          Push notification delivery depends on your device settings. Manage
          system-level permissions in your phone's Settings app.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.base },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    backgroundColor: Colors.surface,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    fontFamily: "Inter_700Bold",
    fontSize: 20,
    color: Colors.text,
  },
  resetBtn: { paddingVertical: 6, paddingHorizontal: 2 },
  resetBtnText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.accent,
  },
  scroll: { paddingHorizontal: 16, paddingTop: 8 },
  sectionLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 10,
    color: Colors.muted,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  settingRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.separator,
  },
  settingInfo: { flex: 1 },
  settingLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.text,
    marginBottom: 2,
  },
  settingDesc: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.muted,
  },
  footerNote: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.muted,
    lineHeight: 18,
    marginTop: 16,
    textAlign: "center",
    paddingHorizontal: 8,
  },
});
