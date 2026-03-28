import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { PENDING_RATINGS, PeerRating } from "@/constants/mock";

function StarRow({ label, rating, onRate }: { label: string; rating: number; onRate: (r: number) => void }) {
  return (
    <View style={styles.starRow}>
      <Text style={styles.starLabel}>{label}</Text>
      <View style={styles.stars}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Pressable
            key={star}
            onPress={() => {
              Haptics.selectionAsync();
              onRate(star);
            }}
          >
            <Ionicons
              name={star <= rating ? "star" : "star-outline"}
              size={28}
              color={star <= rating ? Colors.amber : Colors.overlay}
            />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function PlayerCard({
  rating,
  onUpdate,
}: {
  rating: PeerRating;
  onUpdate: (id: string, field: "skillRating" | "sportsmanshipRating" | "comment", value: any) => void;
}) {
  const initials = rating.ratedPlayer.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const avatarColors = [Colors.primary, Colors.blue, Colors.teal, Colors.purple];
  const avatarBg = avatarColors[rating.ratedPlayer.id.charCodeAt(1) % avatarColors.length];

  return (
    <View style={styles.playerCard}>
      <TouchableOpacity
        style={styles.playerCardHeader}
        onPress={() => router.push({ pathname: "/player/[id]", params: { id: rating.ratedPlayer.id } })}
        activeOpacity={0.7}
      >
        <View style={[styles.avatar, { backgroundColor: avatarBg }]}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Text style={styles.playerName}>{rating.ratedPlayer.name}</Text>
            <Ionicons name="chevron-forward" size={12} color={Colors.muted} />
          </View>
          <Text style={styles.playerPos}>
            {rating.ratedPlayer.preferredPositions.join(" · ")}
          </Text>
        </View>
        {rating.submitted && (
          <View style={styles.submittedBadge}>
            <Ionicons name="checkmark-circle" size={14} color={Colors.accent} />
            <Text style={styles.submittedText}>Rated</Text>
          </View>
        )}
      </TouchableOpacity>

      <StarRow
        label="⚽ Skill"
        rating={rating.skillRating}
        onRate={(r) => onUpdate(rating.id, "skillRating", r)}
      />
      <StarRow
        label="🤝 Sportsmanship"
        rating={rating.sportsmanshipRating}
        onRate={(r) => onUpdate(rating.id, "sportsmanshipRating", r)}
      />

      <TextInput
        style={styles.commentInput}
        placeholder="Optional comment (anonymous, max 200 chars)"
        placeholderTextColor={Colors.muted}
        value={rating.comment ?? ""}
        onChangeText={(t) => onUpdate(rating.id, "comment", t)}
        maxLength={200}
        multiline
      />
    </View>
  );
}

export default function RateScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const bottomPadding = Platform.OS === "web" ? 20 : insets.bottom;

  const [ratings, setRatings] = useState<PeerRating[]>(PENDING_RATINGS);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const updateRating = (ratingId: string, field: "skillRating" | "sportsmanshipRating" | "comment", value: any) => {
    setRatings((prev) =>
      prev.map((r) => (r.id === ratingId ? { ...r, [field]: value } : r))
    );
  };

  const allRated = ratings.every((r) => r.skillRating > 0 && r.sportsmanshipRating > 0);

  const handleSubmit = async () => {
    if (!allRated) {
      Alert.alert("Almost there!", "Please rate all teammates before submitting.");
      return;
    }
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 800));
    setRatings((prev) => prev.map((r) => ({ ...r, submitted: true })));
    setDone(true);
    setSubmitting(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  if (done) {
    return (
      <View style={[styles.container, { paddingTop: topPadding }]}>
        <View style={styles.doneState}>
          <Ionicons name="checkmark-circle" size={72} color={Colors.accent} />
          <Text style={styles.doneTitle}>Ratings Submitted!</Text>
          <Text style={styles.doneSub}>
            Your anonymous ratings help build a better community. You earned +2 POTM points 🏆
          </Text>
          <Pressable style={styles.doneBtn} onPress={() => router.replace("/(tabs)")}>
            <Text style={styles.doneBtnText}>Back to Home</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: topPadding }]}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={Colors.text} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Rate Your Teammates</Text>
          <Text style={styles.headerSub}>Anonymous · Won't be shared publicly</Text>
        </View>
      </View>

      <View style={styles.infoBanner}>
        <Ionicons name="shield-checkmark-outline" size={14} color={Colors.accent} />
        <Text style={styles.infoText}>
          Ratings are completely anonymous. Rate honestly to help improve the community.
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.list, { paddingBottom: bottomPadding + 100 }]}
      >
        {ratings.map((r) => (
          <PlayerCard key={r.id} rating={r} onUpdate={updateRating} />
        ))}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(bottomPadding, 12) + 8 }]}>
        <View style={styles.progressRow}>
          {ratings.map((r) => (
            <View
              key={r.id}
              style={[
                styles.progressDot,
                r.skillRating > 0 && r.sportsmanshipRating > 0 && styles.progressDotFilled,
              ]}
            />
          ))}
          <Text style={styles.progressText}>
            {ratings.filter((r) => r.skillRating > 0 && r.sportsmanshipRating > 0).length}/{ratings.length} rated
          </Text>
        </View>
        <Pressable
          style={({ pressed }) => [
            styles.submitBtn,
            !allRated && styles.submitBtnDisabled,
            pressed && { opacity: 0.85 },
            submitting && { opacity: 0.7 },
          ]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          <Text style={styles.submitBtnText}>
            {submitting ? "Submitting..." : "Submit Ratings"}
          </Text>
          {!submitting && <Ionicons name="checkmark-circle" size={18} color={Colors.text} />}
        </Pressable>
      </View>
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
  headerCenter: { flex: 1, gap: 2 },
  headerTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    color: Colors.text,
  },
  headerSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: Colors.muted,
  },
  infoBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: `${Colors.primary}22`,
    marginHorizontal: 16,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  infoText: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.muted,
    lineHeight: 17,
  },
  list: { paddingHorizontal: 16, gap: 12 },
  playerCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  playerCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    color: Colors.text,
  },
  playerName: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    color: Colors.text,
  },
  playerPos: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: Colors.muted,
  },
  submittedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginLeft: "auto",
  },
  submittedText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    color: Colors.accent,
  },
  starRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  starLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.text,
    flex: 1,
  },
  stars: {
    flexDirection: "row",
    gap: 4,
  },
  commentInput: {
    backgroundColor: Colors.overlay,
    borderRadius: 10,
    padding: 12,
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.text,
    minHeight: 50,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.separator,
    gap: 10,
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.overlay,
  },
  progressDotFilled: { backgroundColor: Colors.accent },
  progressText: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: Colors.muted,
    marginLeft: 4,
  },
  submitBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  submitBtnDisabled: { backgroundColor: Colors.overlay },
  submitBtnText: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    color: Colors.text,
    letterSpacing: 0.5,
  },
  doneState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    gap: 16,
  },
  doneTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 24,
    color: Colors.text,
  },
  doneSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.muted,
    textAlign: "center",
    lineHeight: 20,
  },
  doneBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 40,
    marginTop: 8,
  },
  doneBtnText: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    color: Colors.text,
  },
});
