import { Ionicons, Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { GAMES } from "@/constants/mock";

const VENUES = [
  { id: "v1", name: "Benjakitti Park Field 1", city: "Bangkok", image: "featured_pitch.jpg", status: "active" },
  { id: "v2", name: "Pitch Arena 2", city: "Bangkok", image: "venue_pitch.jpg", status: "active" },
  { id: "v3", name: "Seminyak Football Club", city: "Bali", image: null, status: "pending" },
  { id: "v4", name: "Sukhumvit Futsal Center", city: "Bangkok", image: null, status: "active" },
];

const REPORTS = [
  { id: "r1", reporter: "Maya S.", reported: "Amir B.", reason: "Disrespectful behavior", status: "pending", date: "2026-03-24" },
  { id: "r2", reporter: "Chad P.", reported: "Ronan K.", reason: "No-show / ghosting", status: "reviewed", date: "2026-03-23" },
  { id: "r3", reporter: "Kassim K.", reported: "Siraseth N.", reason: "Rule violation", status: "resolved", date: "2026-03-20" },
];

type AdminTab = "venues" | "reports" | "users";

export default function AdminPanelScreen() {
  const insets = useSafeAreaInsets();
  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const bottomPadding = Platform.OS === "web" ? 34 : insets.bottom;
  const [tab, setTab] = useState<AdminTab>("venues");
  const [editingVenue, setEditingVenue] = useState<string | null>(null);

  const reportStatusColor = (s: string) =>
    s === "pending" ? Colors.amber : s === "reviewed" ? Colors.blue : Colors.accent;

  return (
    <View style={[styles.container, { paddingTop: topPadding }]}>
      <View style={styles.navBar}>
        <Pressable style={styles.navBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={Colors.text} />
        </Pressable>
        <View style={{ flex: 1, alignItems: "center" }}>
          <Text style={styles.navTitle}>ADMIN PANEL</Text>
          <View style={styles.adminBadge}>
            <Ionicons name="shield-checkmark" size={10} color={Colors.amber} />
            <Text style={styles.adminBadgeText}>Admin Access</Text>
          </View>
        </View>
        <View style={styles.navBtn} />
      </View>

      <View style={styles.tabRow}>
        {([
          { id: "venues", label: "Venues", icon: "football-outline" },
          { id: "reports", label: "Reports", icon: "flag-outline" },
          { id: "users", label: "Users", icon: "people-outline" },
        ] as { id: AdminTab; label: string; icon: string }[]).map((t) => (
          <Pressable
            key={t.id}
            style={[styles.tab, tab === t.id && styles.tabActive]}
            onPress={() => setTab(t.id)}
          >
            <Ionicons
              name={t.icon as any}
              size={14}
              color={tab === t.id ? Colors.accent : Colors.muted}
            />
            <Text style={[styles.tabText, tab === t.id && styles.tabTextActive]}>
              {t.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: bottomPadding + 30, gap: 12 }}
      >
        {tab === "venues" && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>FIELD MANAGEMENT</Text>
              <Pressable style={styles.addBtn}>
                <Ionicons name="add" size={16} color={Colors.text} />
                <Text style={styles.addBtnText}>Add Venue</Text>
              </Pressable>
            </View>
            <Text style={styles.sectionDesc}>
              Manage field images and venue details. Tap a venue to edit.
            </Text>
            {VENUES.map((venue) => (
              <View key={venue.id} style={styles.venueCard}>
                <View style={styles.venueImageBox}>
                  {venue.image ? (
                    <View style={[styles.venueImagePlaceholder, { backgroundColor: Colors.primary + "44" }]}>
                      <Ionicons name="image" size={24} color={Colors.accent} />
                      <Text style={styles.venueImageName}>{venue.image}</Text>
                    </View>
                  ) : (
                    <View style={[styles.venueImagePlaceholder, { backgroundColor: Colors.overlay }]}>
                      <Ionicons name="image-outline" size={24} color={Colors.muted} />
                      <Text style={styles.venueNoImage}>No image</Text>
                    </View>
                  )}
                </View>
                <View style={styles.venueInfo}>
                  <Text style={styles.venueName}>{venue.name}</Text>
                  <View style={styles.venueMetaRow}>
                    <Ionicons name="location-outline" size={11} color={Colors.muted} />
                    <Text style={styles.venueMeta}>{venue.city}</Text>
                    <View style={[styles.venueStatusDot, {
                      backgroundColor: venue.status === "active" ? Colors.accent : Colors.amber
                    }]} />
                    <Text style={styles.venueMeta}>{venue.status}</Text>
                  </View>
                  <View style={styles.venueActions}>
                    <Pressable
                      style={styles.venueActionBtn}
                      onPress={() => setEditingVenue(editingVenue === venue.id ? null : venue.id)}
                    >
                      <Ionicons name="cloud-upload-outline" size={13} color={Colors.accent} />
                      <Text style={styles.venueActionText}>Upload Image</Text>
                    </Pressable>
                    <Pressable style={[styles.venueActionBtn, { borderColor: Colors.muted + "44" }]}>
                      <Feather name="edit-2" size={12} color={Colors.muted} />
                      <Text style={[styles.venueActionText, { color: Colors.muted }]}>Edit</Text>
                    </Pressable>
                  </View>
                  {editingVenue === venue.id && (
                    <View style={styles.uploadBox}>
                      <Ionicons name="cloud-upload-outline" size={32} color={Colors.accent} />
                      <Text style={styles.uploadTitle}>Upload Field Image</Text>
                      <Text style={styles.uploadDesc}>Drag & drop or tap to select. Supports JPG, PNG, WebP.</Text>
                      <Pressable style={styles.uploadBtn}>
                        <Text style={styles.uploadBtnText}>Choose File</Text>
                      </Pressable>
                      <Text style={styles.uploadNote}>Max 5MB · Recommended: 1920×1080</Text>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </>
        )}

        {tab === "reports" && (
          <>
            <Text style={styles.sectionTitle}>PLAYER REPORTS</Text>
            <Text style={styles.sectionDesc}>
              Review and action all player complaints. Reports are anonymous to other players.
            </Text>
            <View style={styles.statsRow}>
              <View style={styles.statCell}>
                <Text style={[styles.statValue, { color: Colors.amber }]}>
                  {REPORTS.filter((r) => r.status === "pending").length}
                </Text>
                <Text style={styles.statLabel}>PENDING</Text>
              </View>
              <View style={styles.statCell}>
                <Text style={[styles.statValue, { color: Colors.blue }]}>
                  {REPORTS.filter((r) => r.status === "reviewed").length}
                </Text>
                <Text style={styles.statLabel}>REVIEWED</Text>
              </View>
              <View style={styles.statCell}>
                <Text style={[styles.statValue, { color: Colors.accent }]}>
                  {REPORTS.filter((r) => r.status === "resolved").length}
                </Text>
                <Text style={styles.statLabel}>RESOLVED</Text>
              </View>
            </View>
            {REPORTS.map((report) => (
              <View key={report.id} style={styles.reportCard}>
                <View style={styles.reportTop}>
                  <Text style={styles.reportReason}>{report.reason}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: reportStatusColor(report.status) + "22" }]}>
                    <Text style={[styles.statusText, { color: reportStatusColor(report.status) }]}>
                      {report.status.toUpperCase()}
                    </Text>
                  </View>
                </View>
                <Text style={styles.reportMeta}>
                  {report.reporter} reported {report.reported} · {report.date}
                </Text>
                <View style={styles.reportActions}>
                  <Pressable style={[styles.reportActionBtn, { backgroundColor: `${Colors.red}22`, borderColor: `${Colors.red}44` }]}>
                    <Ionicons name="ban-outline" size={12} color={Colors.red} />
                    <Text style={[styles.reportActionText, { color: Colors.red }]}>Warn</Text>
                  </Pressable>
                  <Pressable style={[styles.reportActionBtn, { backgroundColor: `${Colors.amber}22`, borderColor: `${Colors.amber}44` }]}>
                    <Ionicons name="time-outline" size={12} color={Colors.amber} />
                    <Text style={[styles.reportActionText, { color: Colors.amber }]}>Suspend</Text>
                  </Pressable>
                  <Pressable style={[styles.reportActionBtn, { backgroundColor: `${Colors.accent}22`, borderColor: `${Colors.accent}44` }]}>
                    <Ionicons name="checkmark-circle-outline" size={12} color={Colors.accent} />
                    <Text style={[styles.reportActionText, { color: Colors.accent }]}>Resolve</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </>
        )}

        {tab === "users" && (
          <>
            <Text style={styles.sectionTitle}>USER MANAGEMENT</Text>
            <Text style={styles.sectionDesc}>
              View all players, manage roles, and handle account issues.
            </Text>
            <View style={styles.statsRow}>
              <View style={styles.statCell}>
                <Text style={[styles.statValue, { color: Colors.accent }]}>124</Text>
                <Text style={styles.statLabel}>TOTAL</Text>
              </View>
              <View style={styles.statCell}>
                <Text style={[styles.statValue, { color: Colors.blue }]}>89</Text>
                <Text style={styles.statLabel}>ACTIVE</Text>
              </View>
              <View style={styles.statCell}>
                <Text style={[styles.statValue, { color: Colors.red }]}>3</Text>
                <Text style={styles.statLabel}>BANNED</Text>
              </View>
            </View>
            <View style={styles.emptyCard}>
              <Ionicons name="people-outline" size={36} color={Colors.muted} />
              <Text style={styles.emptyText}>
                Full user management connects to your Supabase auth table. Use the Supabase dashboard for complete user control.
              </Text>
              <Pressable style={styles.supabaseBtn}>
                <Ionicons name="server-outline" size={14} color={Colors.accent} />
                <Text style={styles.supabaseBtnText}>Open Supabase Dashboard</Text>
              </Pressable>
            </View>
          </>
        )}
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
    fontFamily: "Inter_700Bold",
    fontSize: 13,
    color: Colors.text,
    letterSpacing: 2.5,
  },
  adminBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: `${Colors.amber}22`,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
  },
  adminBadgeText: { fontFamily: "Inter_600SemiBold", fontSize: 9, color: Colors.amber, letterSpacing: 0.5 },
  tabRow: {
    flexDirection: "row",
    marginHorizontal: 16,
    backgroundColor: Colors.surface,
    borderRadius: 10,
    padding: 3,
    marginBottom: 14,
  },
  tab: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, paddingVertical: 8, borderRadius: 8 },
  tabActive: { backgroundColor: Colors.primary },
  tabText: { fontFamily: "Inter_600SemiBold", fontSize: 12, color: Colors.muted },
  tabTextActive: { color: Colors.text },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sectionTitle: { fontFamily: "Inter_600SemiBold", fontSize: 10, color: Colors.muted, letterSpacing: 1.5 },
  sectionDesc: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.muted, lineHeight: 17 },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addBtnText: { fontFamily: "Inter_700Bold", fontSize: 11, color: Colors.text },
  venueCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    overflow: "hidden",
  },
  venueImageBox: { height: 80 },
  venueImagePlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  venueImageName: { fontFamily: "Inter_400Regular", fontSize: 11, color: Colors.accent },
  venueNoImage: { fontFamily: "Inter_400Regular", fontSize: 11, color: Colors.muted },
  venueInfo: { padding: 12, gap: 8 },
  venueName: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: Colors.text },
  venueMetaRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  venueMeta: { fontFamily: "Inter_400Regular", fontSize: 11, color: Colors.muted },
  venueStatusDot: { width: 6, height: 6, borderRadius: 3, marginLeft: 4 },
  venueActions: { flexDirection: "row", gap: 8 },
  venueActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 1,
    borderColor: `${Colors.accent}44`,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  venueActionText: { fontFamily: "Inter_600SemiBold", fontSize: 11, color: Colors.accent },
  uploadBox: {
    backgroundColor: Colors.overlay,
    borderRadius: 10,
    padding: 16,
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderStyle: "dashed" as any,
    borderColor: `${Colors.accent}44`,
  },
  uploadTitle: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: Colors.text },
  uploadDesc: { fontFamily: "Inter_400Regular", fontSize: 11, color: Colors.muted, textAlign: "center" },
  uploadBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 9,
    borderRadius: 8,
    marginTop: 4,
  },
  uploadBtnText: { fontFamily: "Inter_700Bold", fontSize: 12, color: Colors.text },
  uploadNote: { fontFamily: "Inter_400Regular", fontSize: 10, color: Colors.muted },
  statsRow: {
    flexDirection: "row",
    backgroundColor: Colors.surface,
    borderRadius: 14,
    paddingVertical: 16,
  },
  statCell: { flex: 1, alignItems: "center", gap: 3 },
  statValue: { fontFamily: "Inter_700Bold", fontSize: 24 },
  statLabel: { fontFamily: "Inter_500Medium", fontSize: 9, color: Colors.muted, letterSpacing: 0.5 },
  reportCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 13,
    gap: 8,
  },
  reportTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  reportReason: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: Colors.text, flex: 1 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  statusText: { fontFamily: "Inter_700Bold", fontSize: 9, letterSpacing: 0.5 },
  reportMeta: { fontFamily: "Inter_400Regular", fontSize: 11, color: Colors.muted },
  reportActions: { flexDirection: "row", gap: 8 },
  reportActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  reportActionText: { fontFamily: "Inter_600SemiBold", fontSize: 11 },
  emptyCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 24,
    alignItems: "center",
    gap: 12,
  },
  emptyText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.muted,
    textAlign: "center",
    lineHeight: 19,
  },
  supabaseBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: `${Colors.accent}22`,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: `${Colors.accent}33`,
  },
  supabaseBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 12, color: Colors.accent },
});
