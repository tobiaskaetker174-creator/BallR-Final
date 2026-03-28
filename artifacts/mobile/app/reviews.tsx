import { Ionicons } from "@expo/vector-icons";
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
import { PROFILE_REVIEWS, formatTimestamp } from "@/constants/mock";

export default function ReviewsScreen() {
  const insets = useSafeAreaInsets();
  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const bottomPadding = Platform.OS === "web" ? 34 : insets.bottom;

  const [tab, setTab] = useState<"pending" | "accepted">("pending");

  const pending = PROFILE_REVIEWS.filter((r) => r.status === "pending");
  const accepted = PROFILE_REVIEWS.filter((r) => r.status === "accepted");

  const reviews = tab === "pending" ? pending : accepted;

  return (
    <View style={[styles.container, { paddingTop: topPadding }]}>
      <View style={styles.navBar}>
        <Pressable style={styles.navBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={Colors.text} />
        </Pressable>
        <Text style={styles.navTitle}>PLAYER REVIEWS</Text>
        <View style={styles.navBtn} />
      </View>

      <View style={styles.tabRow}>
        <Pressable
          style={[styles.tab, tab === "pending" && styles.tabActive]}
          onPress={() => setTab("pending")}
        >
          <Text style={[styles.tabText, tab === "pending" && styles.tabTextActive]}>
            Pending {pending.length > 0 ? `(${pending.length})` : ""}
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, tab === "accepted" && styles.tabActive]}
          onPress={() => setTab("accepted")}
        >
          <Text style={[styles.tabText, tab === "accepted" && styles.tabTextActive]}>
            Published {accepted.length > 0 ? `(${accepted.length})` : ""}
          </Text>
        </Pressable>
      </View>

      {tab === "pending" && pending.length > 0 && (
        <View style={styles.pendingBanner}>
          <Ionicons name="information-circle-outline" size={14} color={Colors.amber} />
          <Text style={styles.pendingBannerText}>
            Reviews are moderated before appearing on your public profile.
          </Text>
        </View>
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: bottomPadding + 30, gap: 10 }}
      >
        {reviews.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="chatbubble-outline" size={36} color={Colors.muted} />
            <Text style={styles.emptyText}>
              {tab === "pending"
                ? "No pending reviews right now."
                : "No published reviews yet. Play more games to receive community reviews!"}
            </Text>
          </View>
        ) : (
          reviews.map((review) => {
            const initials = review.author.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase();
            return (
              <View key={review.id} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <View style={[styles.reviewAvatar, { backgroundColor: Colors.blue + "33" }]}>
                    <Text style={[styles.reviewAvatarText, { color: Colors.blue }]}>{initials}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.reviewAuthor}>{review.author.name}</Text>
                    <Text style={styles.reviewTime}>{formatTimestamp(review.createdAt)}</Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor:
                          review.status === "accepted"
                            ? `${Colors.accent}22`
                            : `${Colors.amber}22`,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusBadgeText,
                        {
                          color:
                            review.status === "accepted" ? Colors.accent : Colors.amber,
                        },
                      ]}
                    >
                      {review.status === "accepted" ? "Published" : "Pending"}
                    </Text>
                  </View>
                </View>
                <Text style={styles.reviewText}>{review.text}</Text>
              </View>
            );
          })
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
    flex: 1,
    textAlign: "center",
    fontFamily: "Inter_700Bold",
    fontSize: 13,
    color: Colors.text,
    letterSpacing: 2.5,
  },
  tabRow: {
    flexDirection: "row",
    backgroundColor: Colors.surface,
    marginHorizontal: 16,
    borderRadius: 10,
    padding: 3,
    marginBottom: 14,
  },
  tab: { flex: 1, paddingVertical: 9, borderRadius: 8, alignItems: "center" },
  tabActive: { backgroundColor: Colors.primary },
  tabText: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: Colors.muted },
  tabTextActive: { color: Colors.text },
  pendingBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: `${Colors.amber}15`,
    marginHorizontal: 16,
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  pendingBannerText: { flex: 1, fontFamily: "Inter_400Regular", fontSize: 11, color: Colors.amber, lineHeight: 16 },
  emptyCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 32,
    alignItems: "center",
    gap: 12,
    marginTop: 10,
  },
  emptyText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.muted,
    textAlign: "center",
    lineHeight: 19,
  },
  reviewCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    gap: 10,
  },
  reviewHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  reviewAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  reviewAvatarText: { fontFamily: "Inter_700Bold", fontSize: 12 },
  reviewAuthor: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: Colors.text },
  reviewTime: { fontFamily: "Inter_400Regular", fontSize: 10, color: Colors.muted },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  statusBadgeText: { fontFamily: "Inter_600SemiBold", fontSize: 10 },
  reviewText: { fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.muted, lineHeight: 19 },
});
