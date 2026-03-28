import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { PLAYERS } from "@/constants/mock";

const REPORT_REASONS = [
  { id: "disrespect", label: "Disrespectful behavior", icon: "hand-left-outline" },
  { id: "rule_violation", label: "Rule violation", icon: "warning-outline" },
  { id: "language", label: "Inappropriate language", icon: "chatbubble-ellipses-outline" },
  { id: "no_show", label: "No-show / ghosting", icon: "calendar-outline" },
  { id: "other", label: "Other", icon: "ellipsis-horizontal-outline" },
];

export default function ReportPlayerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const bottomPadding = Platform.OS === "web" ? 34 : insets.bottom;

  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [details, setDetails] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const player = PLAYERS.find((p) => p.id === id);
  const initials = player
    ? player.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : "??";

  function handleSubmit() {
    if (!selectedReason) return;
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <View style={[styles.container, { paddingTop: topPadding }]}>
        <View style={styles.navBar}>
          <Pressable style={styles.navBtn} onPress={() => router.back()}>
            <Ionicons name="close" size={20} color={Colors.text} />
          </Pressable>
          <View style={styles.navBtn} />
        </View>
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={52} color={Colors.accent} />
          </View>
          <Text style={styles.successTitle}>Report Submitted</Text>
          <Text style={styles.successSub}>
            Thank you for keeping BallR safe. Our team will review this report anonymously within 48 hours.
          </Text>
          <View style={styles.anonymousNote}>
            <Ionicons name="shield-checkmark-outline" size={14} color={Colors.muted} />
            <Text style={styles.anonymousNoteText}>
              Your identity is completely anonymous. The reported player will not know who filed this report.
            </Text>
          </View>
          <Pressable style={styles.doneBtn} onPress={() => router.back()}>
            <Text style={styles.doneBtnText}>Done</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: topPadding }]}>
      <View style={styles.navBar}>
        <Pressable style={styles.navBtn} onPress={() => router.back()}>
          <Ionicons name="close" size={20} color={Colors.text} />
        </Pressable>
        <Text style={styles.navTitle}>REPORT PLAYER</Text>
        <View style={styles.navBtn} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottomPadding + 30 }}
      >
        {player && (
          <View style={styles.playerCard}>
            <View style={styles.playerAvatar}>
              <Text style={styles.playerAvatarText}>{initials}</Text>
            </View>
            <View>
              <Text style={styles.playerName}>{player.name}</Text>
              <Text style={styles.playerSub}>{player.basedIn} · {player.eloRating} ELO</Text>
            </View>
          </View>
        )}

        <View style={styles.anonymousBanner}>
          <Ionicons name="shield-checkmark-outline" size={15} color={Colors.accent} />
          <Text style={styles.anonymousBannerText}>
            This report is completely anonymous. The player will never know you reported them.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>REASON FOR REPORT</Text>
          {REPORT_REASONS.map((reason) => (
            <Pressable
              key={reason.id}
              style={[
                styles.reasonRow,
                selectedReason === reason.id && styles.reasonRowSelected,
              ]}
              onPress={() => setSelectedReason(reason.id)}
            >
              <Ionicons
                name={reason.icon as any}
                size={16}
                color={selectedReason === reason.id ? Colors.accent : Colors.muted}
              />
              <Text
                style={[
                  styles.reasonText,
                  selectedReason === reason.id && styles.reasonTextSelected,
                ]}
              >
                {reason.label}
              </Text>
              <View
                style={[
                  styles.radioOuter,
                  selectedReason === reason.id && styles.radioOuterSelected,
                ]}
              >
                {selectedReason === reason.id && <View style={styles.radioInner} />}
              </View>
            </Pressable>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ADDITIONAL DETAILS (OPTIONAL)</Text>
          <TextInput
            style={styles.detailsInput}
            multiline
            numberOfLines={4}
            placeholder="Describe what happened..."
            placeholderTextColor={Colors.muted}
            value={details}
            onChangeText={setDetails}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.section}>
          <Pressable
            style={[styles.submitBtn, !selectedReason && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={!selectedReason}
          >
            <Ionicons name="flag" size={16} color={Colors.text} />
            <Text style={styles.submitBtnText}>Submit Report</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.base },
  navBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  navBtn: {
    width: 36,
    height: 36,
    backgroundColor: Colors.surface,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  navTitle: {
    flex: 1,
    textAlign: "center",
    fontFamily: "Inter_700Bold",
    fontSize: 13,
    color: Colors.text,
    letterSpacing: 2.5,
  },
  playerCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.surface,
    marginHorizontal: 16,
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
  },
  playerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  playerAvatarText: { fontFamily: "Inter_700Bold", fontSize: 15, color: Colors.text },
  playerName: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: Colors.text },
  playerSub: { fontFamily: "Inter_400Regular", fontSize: 11, color: Colors.muted },
  anonymousBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: `${Colors.primary}22`,
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: `${Colors.accent}33`,
  },
  anonymousBannerText: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.accent,
    lineHeight: 17,
  },
  section: { paddingHorizontal: 16, marginBottom: 20 },
  sectionTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 10,
    color: Colors.muted,
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  reasonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 7,
    borderWidth: 1,
    borderColor: Colors.separator,
  },
  reasonRowSelected: {
    borderColor: Colors.accent,
    backgroundColor: `${Colors.primary}22`,
  },
  reasonText: { flex: 1, fontFamily: "Inter_500Medium", fontSize: 13, color: Colors.muted },
  reasonTextSelected: { color: Colors.text },
  radioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: Colors.separator,
    alignItems: "center",
    justifyContent: "center",
  },
  radioOuterSelected: { borderColor: Colors.accent },
  radioInner: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: Colors.accent,
  },
  detailsInput: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 13,
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.text,
    minHeight: 100,
    borderWidth: 1,
    borderColor: Colors.separator,
  },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.red,
    borderRadius: 12,
    paddingVertical: 15,
  },
  submitBtnDisabled: { opacity: 0.4 },
  submitBtnText: { fontFamily: "Inter_700Bold", fontSize: 15, color: Colors.text },
  successContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 16,
  },
  successIcon: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: `${Colors.primary}33`,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  successTitle: { fontFamily: "Inter_700Bold", fontSize: 26, color: Colors.text },
  successSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.muted,
    textAlign: "center",
    lineHeight: 21,
  },
  anonymousNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 13,
    alignSelf: "stretch",
  },
  anonymousNoteText: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.muted,
    lineHeight: 17,
  },
  doneBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 50,
    marginTop: 8,
  },
  doneBtnText: { fontFamily: "Inter_700Bold", fontSize: 15, color: Colors.text },
});
