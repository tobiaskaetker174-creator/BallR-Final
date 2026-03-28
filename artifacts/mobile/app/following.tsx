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
import {
  PLAYERS,
  FOLLOWED_PLAYER_IDS,
  GAMES,
  getEloLabel,
  getReliabilityColor,
} from "@/constants/mock";

export default function FollowingScreen() {
  const insets = useSafeAreaInsets();
  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const bottomPadding = Platform.OS === "web" ? 34 : insets.bottom;

  const [followedIds, setFollowedIds] = useState<Set<string>>(new Set(FOLLOWED_PLAYER_IDS));

  const followedPlayers = PLAYERS.filter((p) => followedIds.has(p.id));

  function getActiveGame(playerId: string) {
    for (const game of GAMES) {
      if (game.status === "upcoming" || game.status === "full") {
        const booking = game.bookings.find((b) => b.player.id === playerId);
        if (booking) return game;
      }
    }
    return null;
  }

  function handleUnfollow(playerId: string) {
    setFollowedIds((prev) => {
      const next = new Set(prev);
      next.delete(playerId);
      FOLLOWED_PLAYER_IDS.delete(playerId);
      return next;
    });
  }

  return (
    <View style={[styles.container, { paddingTop: topPadding }]}>
      <View style={styles.navBar}>
        <Pressable style={styles.navBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={Colors.text} />
        </Pressable>
        <Text style={styles.navTitle}>FOLLOWING</Text>
        <View style={styles.navBtn} />
      </View>

      <View style={styles.countRow}>
        <Text style={styles.countText}>
          {followedPlayers.length} {followedPlayers.length === 1 ? "player" : "players"} you follow
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottomPadding + 30, paddingTop: 8 }}
      >
        {followedPlayers.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={42} color={Colors.muted} />
            <Text style={styles.emptyTitle}>No one followed yet</Text>
            <Text style={styles.emptySub}>
              Follow players from their profiles to see them here.
            </Text>
          </View>
        )}

        {followedPlayers.map((player) => {
          const eloTier = getEloLabel(player.eloRating, player, PLAYERS);
          const reliabilityColor = getReliabilityColor(player.reliabilityScore);
          const initials = player.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
          const activeGame = getActiveGame(player.id);

          return (
            <Pressable
              key={player.id}
              style={({ pressed }) => [styles.playerRow, pressed && { opacity: 0.85 }]}
              onPress={() => router.push({ pathname: "/player/[id]", params: { id: player.id } })}
            >
              <View style={styles.avatarOuter}>
                <View style={styles.avatarInner}>
                  <Text style={styles.avatarText}>{initials}</Text>
                </View>
                {player.medal && (
                  <View style={styles.medalBubble}>
                    <Text style={{ fontSize: 11 }}>
                      {player.medal === "gold" ? "🥇" : player.medal === "silver" ? "🥈" : "🥉"}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.playerInfo}>
                <View style={styles.playerNameRow}>
                  <Text style={styles.playerName}>{player.name}</Text>
                  {player.winStreak && player.winStreak > 1 && (
                    <View style={styles.streakBadge}>
                      <Ionicons name="flame" size={10} color={Colors.amber} />
                      <Text style={styles.streakText}>{player.winStreak}</Text>
                    </View>
                  )}
                </View>

                <Text style={styles.playerSub}>
                  {player.nationality} · {player.basedIn}
                </Text>

                <View style={styles.playerMeta}>
                  <View style={[styles.eloChip, { backgroundColor: `${eloTier.color}22` }]}>
                    <Text style={[styles.eloChipText, { color: eloTier.color }]}>
                      {player.eloRating} ELO
                    </Text>
                  </View>
                  <View style={styles.reliabilityDot}>
                    <View style={[styles.dot, { backgroundColor: reliabilityColor }]} />
                    <Text style={[styles.reliabilityText, { color: reliabilityColor }]}>
                      {player.reliabilityScore}%
                    </Text>
                  </View>
                </View>

                {activeGame && (
                  <View style={styles.activeGameChip}>
                    <Ionicons name="football-outline" size={10} color={Colors.teal} />
                    <Text style={styles.activeGameText} numberOfLines={1}>
                      Playing at {activeGame.venue.name.split(" ").slice(0, 3).join(" ")}
                    </Text>
                  </View>
                )}
              </View>

              <Pressable
                style={styles.unfollowBtn}
                onPress={(e) => {
                  e.stopPropagation();
                  handleUnfollow(player.id);
                }}
              >
                <Ionicons name="person-remove-outline" size={14} color={Colors.muted} />
                <Text style={styles.unfollowText}>Unfollow</Text>
              </Pressable>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.base,
  },
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
    alignItems: "center",
    justifyContent: "center",
  },
  navTitle: {
    flex: 1,
    fontFamily: "Inter_700Bold",
    fontSize: 13,
    color: Colors.text,
    letterSpacing: 2,
    textAlign: "center",
  },
  countRow: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.separator,
  },
  countText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.muted,
  },
  emptyState: {
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: Colors.text,
  },
  emptySub: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.muted,
    textAlign: "center",
    lineHeight: 18,
  },
  playerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.separator,
  },
  avatarOuter: {
    position: "relative",
    flexShrink: 0,
  },
  avatarInner: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${Colors.primary}55`,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: `${Colors.accent}44`,
  },
  avatarText: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: Colors.accent,
  },
  medalBubble: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.overlay,
  },
  playerInfo: {
    flex: 1,
    gap: 3,
  },
  playerNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  playerName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.text,
  },
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    backgroundColor: `${Colors.amber}22`,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 999,
  },
  streakText: {
    fontFamily: "Inter_700Bold",
    fontSize: 9,
    color: Colors.amber,
  },
  playerSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: Colors.muted,
  },
  playerMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 1,
  },
  eloChip: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
  },
  eloChipText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 10,
  },
  reliabilityDot: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  reliabilityText: {
    fontFamily: "Inter_500Medium",
    fontSize: 10,
  },
  activeGameChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: `${Colors.teal}18`,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: "flex-start",
    marginTop: 2,
  },
  activeGameText: {
    fontFamily: "Inter_500Medium",
    fontSize: 10,
    color: Colors.teal,
  },
  unfollowBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.separator,
    flexShrink: 0,
  },
  unfollowText: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    color: Colors.muted,
  },
});
