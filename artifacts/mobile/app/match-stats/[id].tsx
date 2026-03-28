import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import {
  ALL_GAMES,
  MATCH_STATS_MAP,
  MY_GAMES_IDS,
  formatGameTime,
} from "@/constants/mock";

const ME_ID = "p0";

export default function MatchStatsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const topPadding = Platform.OS === "web" ? 67 : insets.top;

  const game = ALL_GAMES.find((g) => g.id === id);
  const stats = id ? MATCH_STATS_MAP[id] : undefined;

  const amParticipant = MY_GAMES_IDS.has(id ?? "");
  const initialVotedFor = stats?.mvpVotes
    ? Object.entries(stats.mvpVotes).find(([, voters]) => voters.includes(ME_ID))?.[0] ?? null
    : null;

  const [votedForId, setVotedForId] = useState<string | null>(initialVotedFor);
  const [voteLocked, setVoteLocked] = useState<boolean>(initialVotedFor !== null);
  const [liveVotes, setLiveVotes] = useState<Record<string, string[]>>(
    stats?.mvpVotes ? { ...stats.mvpVotes } : {}
  );

  if (!game || !stats) {
    return (
      <View style={[styles.container, { paddingTop: topPadding }]}>
        <View style={styles.navBar}>
          <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.navBtn, pressed && { opacity: 0.7 }]}>
            <Ionicons name="arrow-back" size={20} color={Colors.text} />
          </Pressable>
          <Text style={styles.navTitle}>MATCH STATS</Text>
          <View style={styles.navBtn} />
        </View>
        <View style={styles.empty}>
          <Ionicons name="trophy-outline" size={40} color={Colors.muted} />
          <Text style={styles.emptyText}>Stats not available yet</Text>
        </View>
      </View>
    );
  }

  const blueBookings = game.bookings.filter((b) => b.teamAssignment === "blue");
  const redBookings = game.bookings.filter((b) => b.teamAssignment === "red");
  const attendedBookings = game.bookings.filter((b) => b.attended !== false);

  const totalVoteCount = Object.values(liveVotes).reduce((s, voters) => s + voters.length, 0);
  const mvpId = stats.mvpVotes
    ? Object.entries(liveVotes).reduce<[string, number] | null>((best, [pid, voters]) => {
        return !best || voters.length > best[1] ? [pid, voters.length] : best;
      }, null)?.[0] ?? null
    : stats.mvpPlayerId ?? null;

  const result: "blue" | "red" | "draw" | null =
    game.winningTeam ?? (stats.scoreBlue > stats.scoreRed ? "blue" : stats.scoreBlue < stats.scoreRed ? "red" : "draw");

  const goals = stats.goals ?? [];
  const cards = stats.cards ?? [];
  const sortedGoals = [...goals].sort((a, b) => a.minute - b.minute);

  function handleVote(playerId: string) {
    if (!amParticipant || voteLocked) return;
    setLiveVotes((prev) => {
      const next = { ...prev };
      next[playerId] = [...(next[playerId] ?? []), ME_ID];
      return next;
    });
    setVotedForId(playerId);
    setVoteLocked(true);
  }

  function getInitials(name: string) {
    return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  }

  return (
    <View style={[styles.container, { paddingTop: topPadding }]}>
      <View style={styles.navBar}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.navBtn, pressed && { opacity: 0.7 }]}
        >
          <Ionicons name="arrow-back" size={20} color={Colors.text} />
        </Pressable>
        <Text style={styles.navTitle}>MATCH STATS</Text>
        <View style={styles.navBtn} />
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: (Platform.OS === "web" ? 34 : insets.bottom) + 32 }}
      >
        {mvpId && (
          <View style={styles.mvpBanner}>
            <View style={styles.mvpBannerInner}>
              <Text style={styles.mvpCrown}>🏆</Text>
              <View>
                <Text style={styles.mvpBannerLabel}>MATCH MVP</Text>
                <Text style={styles.mvpBannerName}>
                  {attendedBookings.find((b) => b.player.id === mvpId)?.player.name ?? stats.mvpPlayerName}
                </Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.scoreCard}>
          <View style={styles.scoreTeamCol}>
            <Text style={[styles.scoreTeamLabel, { color: Colors.blue }]}>TEAM BLUE</Text>
            <Text style={[styles.scoreTeamScore, { color: Colors.blue }]}>{stats.scoreBlue}</Text>
            <View style={styles.scorePlayerList}>
              {blueBookings.slice(0, 4).map((b) => (
                <Text key={b.id} style={styles.scorePlayerName} numberOfLines={1}>{b.player.name.split(" ")[0]}</Text>
              ))}
              {blueBookings.length > 4 && <Text style={styles.scorePlayerMore}>+{blueBookings.length - 4} more</Text>}
            </View>
          </View>

          <View style={styles.scoreCenter}>
            <Text style={styles.scoreSep}>VS</Text>
            <View style={[
              styles.resultChip,
              result === "blue" ? { backgroundColor: Colors.blue + "33", borderColor: Colors.blue + "66" }
                : result === "red" ? { backgroundColor: Colors.red + "33", borderColor: Colors.red + "66" }
                : { backgroundColor: Colors.amber + "33", borderColor: Colors.amber + "66" },
            ]}>
              <Text style={[
                styles.resultChipText,
                { color: result === "blue" ? Colors.blue : result === "red" ? Colors.red : Colors.amber },
              ]}>
                {result === "blue" ? "BLUE WIN" : result === "red" ? "RED WIN" : "DRAW"}
              </Text>
            </View>
            <Text style={styles.gameMeta}>{formatGameTime(game.gameTime)}</Text>
            <Text style={styles.gameMeta}>{game.venue.name}</Text>
          </View>

          <View style={styles.scoreTeamCol}>
            <Text style={[styles.scoreTeamLabel, { color: Colors.red }]}>TEAM RED</Text>
            <Text style={[styles.scoreTeamScore, { color: Colors.red }]}>{stats.scoreRed}</Text>
            <View style={styles.scorePlayerList}>
              {redBookings.slice(0, 4).map((b) => (
                <Text key={b.id} style={styles.scorePlayerName} numberOfLines={1}>{b.player.name.split(" ")[0]}</Text>
              ))}
              {redBookings.length > 4 && <Text style={styles.scorePlayerMore}>+{redBookings.length - 4} more</Text>}
            </View>
          </View>
        </View>

        {sortedGoals.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>GOALS</Text>
            <View style={styles.eventList}>
              {sortedGoals.map((goal, i) => (
                <View key={i} style={styles.goalRow}>
                  <View style={[
                    styles.goalTeamDot,
                    { backgroundColor: goal.team === "blue" ? Colors.blue : Colors.red },
                  ]} />
                  <Text style={[
                    styles.goalMinute,
                    { color: goal.team === "blue" ? Colors.blue : Colors.red },
                  ]}>{goal.minute}'</Text>
                  <Text style={styles.goalName}>
                    {goal.playerName}{goal.isOwnGoal ? " (OG)" : ""}
                  </Text>
                  <View style={[
                    styles.goalTeamChip,
                    { backgroundColor: goal.team === "blue" ? Colors.blue + "22" : Colors.red + "22" },
                  ]}>
                    <Text style={[
                      styles.goalTeamChipText,
                      { color: goal.team === "blue" ? Colors.blue : Colors.red },
                    ]}>
                      {goal.team === "blue" ? "BLUE" : "RED"}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {cards.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>CARDS</Text>
            <View style={styles.eventList}>
              {[...cards].sort((a, b) => a.minute - b.minute).map((card, i) => (
                <View key={i} style={styles.cardRow}>
                  <View style={[
                    styles.cardIcon,
                    { backgroundColor: card.cardType === "yellow" ? Colors.amber : Colors.red },
                  ]} />
                  <Text style={styles.cardMinute}>{card.minute}'</Text>
                  <Text style={styles.cardName}>{card.playerName}</Text>
                  {card.reason && (
                    <Text style={styles.cardReason} numberOfLines={1}>{card.reason}</Text>
                  )}
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.mvpVoteHeader}>
            <Text style={styles.sectionTitle}>VOTE FOR MVP</Text>
            {amParticipant && !voteLocked && (
              <Text style={styles.voteCta}>Tap a player to vote</Text>
            )}
            {voteLocked && (
              <Text style={styles.voteConfirmed}>Vote submitted</Text>
            )}
          </View>
          <View style={styles.playerGrid}>
            {attendedBookings.map((booking) => {
              const pid = booking.player.id;
              const voteCount = liveVotes[pid]?.length ?? 0;
              const isVotedFor = votedForId === pid;
              const isMvp = pid === mvpId && totalVoteCount > 0;
              const initials = getInitials(booking.player.name);
              const teamColor = booking.teamAssignment === "blue" ? Colors.blue : Colors.red;

              return (
                <Pressable
                  key={booking.id}
                  style={({ pressed }) => [
                    styles.playerTile,
                    isVotedFor && styles.playerTileVoted,
                    pressed && amParticipant && !voteLocked && { opacity: 0.8 },
                  ]}
                  onPress={() => handleVote(pid)}
                  disabled={!amParticipant || voteLocked}
                >
                  {isMvp && <Text style={styles.trophyOverlay}>🏆</Text>}
                  <View style={[
                    styles.playerTileAvatar,
                    { backgroundColor: teamColor + "44", borderColor: isVotedFor ? Colors.accent : "transparent" },
                  ]}>
                    <Text style={[styles.playerTileInitials, { color: teamColor }]}>{initials}</Text>
                  </View>
                  <Text style={styles.playerTileName} numberOfLines={1}>
                    {booking.player.name.split(" ")[0]}
                  </Text>
                  {voteCount > 0 && (
                    <View style={[styles.voteCountBadge, isVotedFor && styles.voteCountBadgeActive]}>
                      <Text style={styles.voteCountText}>{voteCount}</Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
          {!amParticipant && (
            <Text style={styles.observerNote}>Only participants can vote for MVP</Text>
          )}
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
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.separator,
  },
  navBtn: { width: 36, height: 36, justifyContent: "center", alignItems: "center" },
  navTitle: { fontFamily: "Inter_700Bold", fontSize: 13, color: Colors.text, letterSpacing: 2 },
  scroll: { flex: 1 },
  empty: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },
  emptyText: { fontFamily: "Inter_400Regular", fontSize: 15, color: Colors.muted },

  mvpBanner: {
    margin: 16,
    borderRadius: 12,
    backgroundColor: Colors.amber + "1A",
    borderWidth: 1,
    borderColor: Colors.amber + "44",
    padding: 16,
  },
  mvpBannerInner: { flexDirection: "row", alignItems: "center", gap: 12 },
  mvpCrown: { fontSize: 28 },
  mvpBannerLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 10,
    color: Colors.amber,
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  mvpBannerName: { fontFamily: "Inter_700Bold", fontSize: 18, color: Colors.text },

  scoreCard: {
    flexDirection: "row",
    marginHorizontal: 16,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    gap: 8,
  },
  scoreTeamCol: { flex: 1, alignItems: "center", gap: 6 },
  scoreTeamLabel: { fontFamily: "Inter_600SemiBold", fontSize: 10, letterSpacing: 1.5 },
  scoreTeamScore: { fontFamily: "Inter_700Bold", fontSize: 52, lineHeight: 56 },
  scorePlayerList: { gap: 2, alignItems: "center" },
  scorePlayerName: { fontFamily: "Inter_400Regular", fontSize: 11, color: Colors.muted },
  scorePlayerMore: { fontFamily: "Inter_400Regular", fontSize: 11, color: Colors.muted, fontStyle: "italic" },
  scoreCenter: { alignItems: "center", gap: 8, flex: 0, paddingHorizontal: 8 },
  scoreSep: { fontFamily: "Inter_600SemiBold", fontSize: 12, color: Colors.muted, letterSpacing: 1 },
  resultChip: {
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  resultChipText: { fontFamily: "Inter_700Bold", fontSize: 11, letterSpacing: 1 },
  gameMeta: { fontFamily: "Inter_400Regular", fontSize: 10, color: Colors.muted, textAlign: "center" },

  section: { marginTop: 20, marginHorizontal: 16 },
  sectionTitle: { fontFamily: "Inter_600SemiBold", fontSize: 11, color: Colors.muted, letterSpacing: 1.5, marginBottom: 10 },

  eventList: { gap: 8 },
  goalRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: 10,
  },
  goalTeamDot: { width: 8, height: 8, borderRadius: 4 },
  goalMinute: { fontFamily: "Inter_700Bold", fontSize: 13, width: 32 },
  goalName: { flex: 1, fontFamily: "Inter_500Medium", fontSize: 14, color: Colors.text },
  goalTeamChip: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 4 },
  goalTeamChipText: { fontFamily: "Inter_600SemiBold", fontSize: 9, letterSpacing: 1 },

  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: 10,
  },
  cardIcon: { width: 12, height: 16, borderRadius: 2 },
  cardMinute: { fontFamily: "Inter_700Bold", fontSize: 13, color: Colors.text, width: 32 },
  cardName: { flex: 1, fontFamily: "Inter_500Medium", fontSize: 14, color: Colors.text },
  cardReason: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.muted, maxWidth: 100 },

  mvpVoteHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  voteCta: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.accent, fontStyle: "italic" },
  voteConfirmed: { fontFamily: "Inter_500Medium", fontSize: 12, color: Colors.teal },

  playerGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  playerTile: {
    width: "22%",
    flexGrow: 1,
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: 10,
    padding: 10,
    gap: 6,
    borderWidth: 1.5,
    borderColor: "transparent",
    position: "relative",
  },
  playerTileVoted: { borderColor: Colors.accent, backgroundColor: Colors.accent + "11" },
  trophyOverlay: { position: "absolute", top: -8, right: -4, fontSize: 14 },
  playerTileAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
  },
  playerTileInitials: { fontFamily: "Inter_700Bold", fontSize: 14 },
  playerTileName: { fontFamily: "Inter_500Medium", fontSize: 11, color: Colors.text, textAlign: "center" },
  voteCountBadge: {
    backgroundColor: Colors.overlay,
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: "center",
  },
  voteCountBadgeActive: { backgroundColor: Colors.accent + "33" },
  voteCountText: { fontFamily: "Inter_700Bold", fontSize: 11, color: Colors.text },
  observerNote: {
    marginTop: 12,
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.muted,
    textAlign: "center",
    fontStyle: "italic",
  },
});
