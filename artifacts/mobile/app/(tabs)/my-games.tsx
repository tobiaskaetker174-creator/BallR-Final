import { Ionicons, Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import BallrLogo from "@/components/BallrLogo";
import React, { useState } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import {
  GAMES,
  COMPLETED_GAMES,
  NOTIFICATIONS,
  MY_GAME_IDS,
  Game,
  formatGameTime,
  formatPrice,
  getSkillColor,
  getSkillLabel,
} from "@/constants/mock";
import { useAuth } from "@/context/AuthContext";
const TABS = ["Upcoming", "Completed"];

function RatingPromptCard({ game }: { game: Game }) {
  return (
    <Pressable
      style={styles.ratingPrompt}
      onPress={() => router.push({ pathname: "/rate/[id]", params: { id: game.id } })}
    >
      <View style={styles.ratingPromptIcon}>
        <Ionicons name="star" size={18} color={Colors.amber} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.ratingPromptTitle}>Rate your teammates</Text>
        <Text style={styles.ratingPromptSub}>{game.venue.name} · {formatGameTime(game.gameTime)}</Text>
      </View>
      <Feather name="arrow-right" size={16} color={Colors.amber} />
    </Pressable>
  );
}

function GameCard({ game, isJoined, isCompleted, isOrganizer }: { game: Game; isJoined: boolean; isCompleted?: boolean; isOrganizer?: boolean }) {
  const skillColor = getSkillColor(game.skillLevel);
  const fillPct = game.currentPlayers / game.maxPlayers;
  const fillColor = fillPct >= 1 ? Colors.red : fillPct > 0.8 ? Colors.amber : Colors.accent;

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
      onPress={() => router.push({ pathname: "/game/[id]", params: { id: game.id } })}
    >
      <View style={[styles.accentBar, { backgroundColor: skillColor }]} />
      <View style={styles.cardBody}>
        <View style={styles.cardTop}>
          <View style={styles.cardTopLeft}>
            <Text style={styles.cardVenue} numberOfLines={1}>{game.venue.name}</Text>
            <View style={styles.cardMeta}>
              <Ionicons name="location-outline" size={11} color={Colors.muted} />
              <Text style={styles.cardMetaText}>{game.venue.address.split(",")[0]}</Text>
            </View>
          </View>
          <View style={styles.cardTopRight}>
            <Text style={styles.cardPrice}>{formatPrice(game.pricePerPlayer, game.cityId)}</Text>
            <View style={[styles.skillChip, { backgroundColor: `${skillColor}22` }]}>
              <Text style={[styles.skillChipText, { color: skillColor }]}>
                {getSkillLabel(game.skillLevel)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.cardStats}>
          <View style={styles.cardStat}>
            <Ionicons name="time-outline" size={12} color={Colors.muted} />
            <Text style={styles.cardStatText}>{formatGameTime(game.gameTime)}</Text>
          </View>
          <View style={styles.statDot} />
          <View style={styles.cardStat}>
            <Ionicons name="people-outline" size={12} color={Colors.muted} />
            <Text style={styles.cardStatText}>{game.currentPlayers}/{game.maxPlayers}</Text>
          </View>
          {isCompleted && game.winningTeam && (
            <>
              <View style={styles.statDot} />
              <Text style={[styles.cardStatText, {
                color: game.winningTeam === "blue" ? Colors.blue : game.winningTeam === "draw" ? Colors.muted : Colors.red
              }]}>
                {game.winningTeam === "blue" ? "Blue Won 🔵" : game.winningTeam === "red" ? "Red Won 🔴" : "Draw"}
              </Text>
            </>
          )}
        </View>

        {!isCompleted && (
          <>
            <View style={styles.fillTrack}>
              <View
                style={[
                  styles.fillFill,
                  {
                    width: `${Math.min(fillPct * 100, 100)}%` as any,
                    backgroundColor: fillColor,
                  },
                ]}
              />
            </View>
            <View style={styles.cardActions}>
              <Pressable
                style={({ pressed }) => [styles.joinBtn, pressed && { opacity: 0.85 }]}
                onPress={() => router.push({ pathname: "/game/[id]", params: { id: game.id } })}
              >
                <Ionicons name="checkmark-circle" size={14} color={Colors.accent} />
                <Text style={styles.joinBtnText}>View Game</Text>
              </Pressable>
              {isOrganizer ? (
                <Pressable
                  style={({ pressed }) => [styles.orgBtn, pressed && { opacity: 0.85 }]}
                  onPress={() => router.push({ pathname: "/organizer/[id]", params: { id: game.id } })}
                >
                  <Ionicons name="settings-outline" size={14} color={Colors.amber} />
                  <Text style={styles.orgBtnText}>Manage</Text>
                </Pressable>
              ) : (
                <Pressable
                  style={({ pressed }) => [styles.chatBtn, pressed && { opacity: 0.85 }]}
                  onPress={() => router.push({ pathname: "/chat/[id]", params: { id: game.id } })}
                >
                  <Ionicons name="chatbubble-outline" size={14} color={Colors.muted} />
                  <Text style={styles.chatBtnText}>Chat</Text>
                </Pressable>
              )}
            </View>
          </>
        )}

        {isCompleted && (
          <Pressable
            style={styles.rateTeammatesBtn}
            onPress={() => router.push({ pathname: "/rate/[id]", params: { id: game.id } })}
          >
            <Ionicons name="star-outline" size={14} color={Colors.amber} />
            <Text style={styles.rateTeammatesBtnText}>Rate Teammates</Text>
            <Feather name="arrow-right" size={12} color={Colors.amber} />
          </Pressable>
        )}
      </View>
    </Pressable>
  );
}

export default function MyGamesScreen() {
  const insets = useSafeAreaInsets();
  const { isLoggedIn } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const bottomPadding = Platform.OS === "web" ? 34 : insets.bottom;

  const unreadCount = NOTIFICATIONS.filter((n) => !n.read).length;
  const myGames = GAMES.filter((g) => MY_GAME_IDS.includes(g.id));
  const completedGames = COMPLETED_GAMES;

  const activeGames = activeTab === 0 ? myGames : completedGames;
  const pendingRatings = completedGames.filter((g) => g.status === "completed");

  if (!isLoggedIn) {
    return (
      <View style={[styles.container, { paddingTop: topPadding }]}>
        <View style={styles.topBar}>
          <Text style={styles.cityLabel}>BANGKOK</Text>
          <BallrLogo />
          <View style={styles.bellBtn} />
        </View>
        <View style={styles.authGate}>
          <Ionicons name="calendar-outline" size={52} color={Colors.muted} style={{ marginBottom: 8 }} />
          <Text style={styles.authGateTitle}>Your Games</Text>
          <Text style={styles.authGateDesc}>
            Log in to view your upcoming and past matches, rate teammates, and chat with your squad.
          </Text>
          <Pressable
            style={styles.authGateBtn}
            onPress={() => router.push("/auth")}
          >
            <Ionicons name="person-outline" size={16} color={Colors.text} />
            <Text style={styles.authGateBtnText}>Log In to BallR</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: topPadding }]}>
      <View style={styles.topBar}>
        <Text style={styles.cityLabel}>BANGKOK</Text>
        <BallrLogo />
        <Pressable
          style={styles.bellBtn}
          onPress={() => router.push("/notifications")}
        >
          <Ionicons name="notifications-outline" size={20} color={Colors.muted} />
          {unreadCount > 0 && (
            <View style={styles.bellBadge}>
              <Text style={styles.bellBadgeText}>{unreadCount > 9 ? "9+" : unreadCount}</Text>
            </View>
          )}
        </Pressable>
      </View>

      <View style={styles.headerRow}>
        <Text style={styles.screenTitle}>My Games</Text>
        <View style={styles.countChip}>
          <Text style={styles.countChipText}>{myGames.length} upcoming</Text>
        </View>
      </View>

      <View style={styles.tabsRow}>
        {TABS.map((tab, i) => (
          <Pressable
            key={tab}
            style={[styles.tab, activeTab === i && styles.tabActive]}
            onPress={() => setActiveTab(i)}
          >
            <Text style={[styles.tabText, activeTab === i && styles.tabTextActive]}>
              {tab}
            </Text>
            {i === 1 && completedGames.length > 0 && (
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>{completedGames.length}</Text>
              </View>
            )}
          </Pressable>
        ))}
      </View>

      <FlatList
        data={activeGames}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <GameCard
            game={item}
            isJoined={MY_GAME_IDS.includes(item.id)}
            isCompleted={activeTab === 1}
            isOrganizer={item.organizer.id === "p0"}
          />
        )}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.list, { paddingBottom: bottomPadding + 90 }]}
        ListHeaderComponent={
          activeTab === 1 && pendingRatings.length > 0 ? (
            <View style={styles.ratingSection}>
              <Text style={styles.ratingSectionTitle}>PENDING RATINGS</Text>
              {pendingRatings.map((g) => (
                <RatingPromptCard key={g.id} game={g} />
              ))}
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="calendar-outline" size={48} color={Colors.muted} />
            <Text style={styles.emptyTitle}>
              {activeTab === 0 ? "No upcoming games" : "No completed games"}
            </Text>
            <Text style={styles.emptySub}>
              {activeTab === 0
                ? "Discover a match and book your spot"
                : "Your match history will appear here"}
            </Text>
            {activeTab === 0 && (
              <Pressable style={styles.discoverBtn} onPress={() => router.replace("/(tabs)")}>
                <Text style={styles.discoverBtnText}>Browse Games</Text>
              </Pressable>
            )}
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.base },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  cityLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    color: Colors.muted,
    letterSpacing: 1.5,
  },
  logoText: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    color: Colors.text,
    letterSpacing: 3,
  },
  bellBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center", position: "relative" },
  bellBadge: {
    position: "absolute",
    top: 2,
    right: 2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.red,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  bellBadgeText: { fontFamily: "Inter_700Bold", fontSize: 9, color: Colors.text },
  authGate: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    gap: 14,
  },
  authGateTitle: { fontFamily: "Inter_700Bold", fontSize: 22, color: Colors.text, textAlign: "center" },
  authGateDesc: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.muted,
    textAlign: "center",
    lineHeight: 19,
  },
  authGateBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 13,
    borderRadius: 12,
    marginTop: 6,
  },
  authGateBtnText: { fontFamily: "Inter_700Bold", fontSize: 14, color: Colors.text },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 14,
    gap: 10,
  },
  screenTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 26,
    color: Colors.text,
    letterSpacing: -0.5,
  },
  countChip: {
    backgroundColor: `${Colors.primary}44`,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  countChipText: { fontFamily: "Inter_600SemiBold", fontSize: 11, color: Colors.accent },
  tabsRow: {
    flexDirection: "row",
    marginHorizontal: 16,
    backgroundColor: Colors.surface,
    borderRadius: 10,
    padding: 3,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  tabActive: { backgroundColor: Colors.primary },
  tabText: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: Colors.muted },
  tabTextActive: { color: Colors.text },
  tabBadge: {
    backgroundColor: Colors.amber,
    borderRadius: 999,
    minWidth: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  tabBadgeText: { fontFamily: "Inter_700Bold", fontSize: 9, color: Colors.base },
  list: { paddingHorizontal: 16 },
  ratingSection: { marginBottom: 14, gap: 8 },
  ratingSectionTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 10,
    color: Colors.muted,
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  ratingPrompt: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: `${Colors.amber}11`,
    borderRadius: 12,
    padding: 13,
    gap: 10,
    borderWidth: 1,
    borderColor: `${Colors.amber}33`,
  },
  ratingPromptIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${Colors.amber}22`,
    alignItems: "center",
    justifyContent: "center",
  },
  ratingPromptTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: Colors.text,
  },
  ratingPromptSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: Colors.muted,
  },
  card: {
    flexDirection: "row",
    backgroundColor: Colors.surface,
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 10,
  },
  accentBar: { width: 3 },
  cardBody: { flex: 1, padding: 13, gap: 7 },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  cardTopLeft: { flex: 1, gap: 3, marginRight: 8 },
  cardVenue: { fontFamily: "Inter_700Bold", fontSize: 15, color: Colors.text },
  cardMeta: { flexDirection: "row", alignItems: "center", gap: 3 },
  cardMetaText: { fontFamily: "Inter_400Regular", fontSize: 11, color: Colors.muted },
  cardTopRight: { alignItems: "flex-end", gap: 4 },
  cardPrice: { fontFamily: "Inter_700Bold", fontSize: 15, color: Colors.accent },
  skillChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  skillChipText: { fontFamily: "Inter_600SemiBold", fontSize: 9, letterSpacing: 0.3 },
  cardStats: { flexDirection: "row", alignItems: "center", gap: 6 },
  cardStat: { flexDirection: "row", alignItems: "center", gap: 3 },
  cardStatText: { fontFamily: "Inter_400Regular", fontSize: 11, color: Colors.muted },
  statDot: { width: 3, height: 3, borderRadius: 999, backgroundColor: Colors.overlay },
  fillTrack: { height: 3, backgroundColor: Colors.overlay, borderRadius: 999, overflow: "hidden" },
  fillFill: { height: 3, borderRadius: 999 },
  cardActions: { flexDirection: "row", gap: 8 },
  joinBtn: {
    flex: 1,
    backgroundColor: `${Colors.primary}33`,
    borderRadius: 8,
    paddingVertical: 9,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: `${Colors.accent}44`,
  },
  joinBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 12, color: Colors.accent },
  chatBtn: {
    backgroundColor: Colors.overlay,
    borderRadius: 8,
    paddingVertical: 9,
    paddingHorizontal: 14,
    alignItems: "center",
    flexDirection: "row",
    gap: 5,
  },
  chatBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 12, color: Colors.muted },
  orgBtn: {
    backgroundColor: `${Colors.amber}18`,
    borderRadius: 8,
    paddingVertical: 9,
    paddingHorizontal: 14,
    alignItems: "center",
    flexDirection: "row",
    gap: 5,
    borderWidth: 1,
    borderColor: `${Colors.amber}33`,
  },
  orgBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 12, color: Colors.amber },
  rateTeammatesBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: `${Colors.amber}11`,
    borderRadius: 8,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: `${Colors.amber}33`,
  },
  rateTeammatesBtnText: {
    flex: 1,
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: Colors.amber,
  },
  empty: { alignItems: "center", paddingTop: 60, gap: 10 },
  emptyTitle: { fontFamily: "Inter_700Bold", fontSize: 18, color: Colors.text },
  emptySub: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.muted,
    textAlign: "center",
    paddingHorizontal: 30,
  },
  discoverBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 28,
    marginTop: 8,
  },
  discoverBtnText: { fontFamily: "Inter_700Bold", fontSize: 13, color: Colors.text },
});
