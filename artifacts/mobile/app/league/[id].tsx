import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useMemo } from "react";
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
  ALL_GAMES,
  LEAGUES,
  PLAYERS,
  getLeagueStandings,
  getLeagueGames,
  isLeagueMember,
  LeagueStanding,
  formatGameTime,
  Game,
} from "@/constants/mock";
import { useBallrData } from "@/context/BallrDataContext";
import { useAuth } from "@/context/AuthContext";

function StandingsRow({
  standing,
  rank,
  isCurrentUser,
}: {
  standing: LeagueStanding;
  rank: number;
  isCurrentUser: boolean;
}) {
  const medalIcon =
    rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : null;
  const rankColor =
    rank === 1
      ? Colors.amber
      : rank === 2
        ? Colors.muted
        : rank === 3
          ? "#C4834A"
          : Colors.muted;

  const initials = standing.playerName
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const avatarColors = [
    Colors.primary,
    Colors.blue,
    Colors.teal,
    Colors.purple,
    Colors.amber,
  ];
  const avatarBg = avatarColors[rank % avatarColors.length];

  return (
    <Pressable
      style={[styles.standingRow, isCurrentUser && styles.standingRowHighlight]}
      onPress={() => {
        if (PLAYERS.find((p) => p.id === standing.playerId)) {
          router.push({
            pathname: "/player/[id]",
            params: { id: standing.playerId },
          });
        }
      }}
    >
      <Text style={[styles.standingRank, { color: rankColor }]}>
        {rank < 10 ? `0${rank}` : rank}
      </Text>
      {medalIcon && <Text style={styles.standingMedal}>{medalIcon}</Text>}
      <View style={[styles.standingAvatar, { backgroundColor: `${avatarBg}44` }]}>
        <Text style={[styles.standingAvatarText, { color: avatarBg }]}>
          {initials}
        </Text>
      </View>
      <View style={styles.standingInfo}>
        <Text style={styles.standingName} numberOfLines={1}>
          {standing.playerName}
          {isCurrentUser ? " (You)" : ""}
        </Text>
        <Text style={styles.standingSub}>
          {standing.played}P {standing.wins}W {standing.draws}D {standing.losses}L
        </Text>
      </View>
      <View style={styles.standingStats}>
        <Text style={styles.standingGd}>
          {standing.goalDifference > 0
            ? `+${standing.goalDifference}`
            : `${standing.goalDifference}`}
        </Text>
        <Text style={styles.standingPts}>{standing.points}</Text>
      </View>
    </Pressable>
  );
}

function RecentGameRow({ game }: { game: Game }) {
  const resultLabel =
    game.winningTeam === "blue"
      ? "Blue Win"
      : game.winningTeam === "red"
        ? "Red Win"
        : "Draw";
  const resultColor =
    game.winningTeam === "blue"
      ? Colors.blue
      : game.winningTeam === "red"
        ? Colors.red
        : Colors.muted;

  return (
    <View style={styles.recentGameRow}>
      <View style={styles.recentGameLeft}>
        <Text style={styles.recentGameVenue} numberOfLines={1}>
          {game.venue.name}
        </Text>
        <Text style={styles.recentGameTime}>{formatGameTime(game.gameTime)}</Text>
      </View>
      <View style={[styles.recentGameBadge, { backgroundColor: `${resultColor}22` }]}>
        <Text style={[styles.recentGameBadgeText, { color: resultColor }]}>
          {resultLabel}
        </Text>
      </View>
      <Text style={styles.recentGamePlayers}>
        {game.currentPlayers}v{game.currentPlayers}
      </Text>
    </View>
  );
}

export default function LeagueDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const bottomPadding = Platform.OS === "web" ? 34 : insets.bottom;
  const { currentPlayer } = useBallrData();
  const { user } = useAuth();

  const playerId = user?.id ?? "p0";
  const league = LEAGUES.find((l) => l.id === id);
  const isMember = league ? isLeagueMember(league.id, playerId) : false;

  const isPublic = league?.type === "public";

  const standings = useMemo(
    () => (league && isMember && !isPublic ? getLeagueStandings(league.id) : []),
    [league, isMember, isPublic]
  );

  const recentGames = useMemo(
    () =>
      league
        ? getLeagueGames(league.id)
            .sort(
              (a, b) =>
                new Date(b.gameTime).getTime() - new Date(a.gameTime).getTime()
            )
            .slice(0, 5)
        : [],
    [league]
  );

  // For public leagues, show recent public games from ALL_GAMES
  const recentPublicGames = useMemo(() => {
    if (!league || league.type !== "public") return [];
    return ALL_GAMES.filter(
      (g) =>
        g.status === "completed" &&
        g.cityId === "bangkok"
    )
      .sort(
        (a, b) =>
          new Date(b.gameTime).getTime() - new Date(a.gameTime).getTime()
      )
      .slice(0, 5);
  }, [league]);

  if (!league) {
    return (
      <View style={[styles.container, { paddingTop: topPadding }]}>
        <View style={styles.navBar}>
          <Pressable style={styles.navBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color={Colors.text} />
          </Pressable>
          <Text style={styles.navTitle}>LEAGUE</Text>
          <View style={styles.navBtn} />
        </View>
        <View style={styles.emptyState}>
          <Ionicons name="alert-circle-outline" size={48} color={Colors.muted} />
          <Text style={styles.emptyText}>League not found.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: topPadding }]}>
      <View style={styles.navBar}>
        <Pressable style={styles.navBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={Colors.text} />
        </Pressable>
        <Text style={styles.navTitle}>{league.name.toUpperCase()}</Text>
        <View style={styles.navBtn} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottomPadding + 30 }}
      >
        {/* League Header */}
        <View style={styles.leagueHeader}>
          <View style={styles.leagueIconWrap}>
            <Ionicons
              name={league.type === "private" ? "shield" : "globe-outline"}
              size={32}
              color={Colors.accent}
            />
          </View>
          <Text style={styles.leagueName}>{league.name}</Text>
          <View style={styles.leagueMetaRow}>
            {league.type === "private" && (
              <View style={styles.privateBadge}>
                <Text style={styles.privateBadgeText}>PRIVATE</Text>
              </View>
            )}
            <Text style={styles.leagueMetaText}>{league.city}</Text>
            <View style={styles.metaDot} />
            <Text style={styles.leagueMetaText}>
              {league.memberIds.length}/{league.maxMembers} members
            </Text>
          </View>
          {league.description ? (
            <Text style={styles.leagueDescription}>{league.description}</Text>
          ) : null}
        </View>

        {/* Non-member view — metadata + request to join */}
        {!isMember && (
          <View style={styles.lockedSection}>
            <View style={styles.metaGrid}>
              <View style={styles.metaItem}>
                <Ionicons name="people-outline" size={18} color={Colors.accent} />
                <Text style={styles.metaValue}>{league.memberIds.length}</Text>
                <Text style={styles.metaLabel}>Members</Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="football-outline" size={18} color={Colors.accent} />
                <Text style={styles.metaValue}>{getLeagueGames(league.id).length}</Text>
                <Text style={styles.metaLabel}>Games</Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="calendar-outline" size={18} color={Colors.accent} />
                <Text style={styles.metaValue}>{new Date(league.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}</Text>
                <Text style={styles.metaLabel}>Founded</Text>
              </View>
            </View>
            {league.type === "private" && (
              <>
                <View style={styles.lockedInfo}>
                  <Ionicons name="lock-closed-outline" size={16} color={Colors.muted} />
                  <Text style={styles.lockedDesc}>
                    Members, standings, and stats are only visible to league members.
                  </Text>
                </View>
                <Pressable style={styles.requestJoinBtn}>
                  <Ionicons name="person-add-outline" size={16} color={Colors.base} />
                  <Text style={styles.requestJoinText}>Request to Join</Text>
                </Pressable>
              </>
            )}
          </View>
        )}

        {/* Member view: Standings */}
        {isMember && standings.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>STANDINGS</Text>
            <View style={styles.standingsHeader}>
              <Text style={[styles.standingsHeaderText, { width: 30 }]}>#</Text>
              <Text style={[styles.standingsHeaderText, { flex: 1, marginLeft: 40 }]}>
                Player
              </Text>
              <Text style={[styles.standingsHeaderText, { width: 36, textAlign: "right" }]}>
                GD
              </Text>
              <Text style={[styles.standingsHeaderText, { width: 36, textAlign: "right" }]}>
                Pts
              </Text>
            </View>
            <View style={styles.standingsCard}>
              {standings.map((s, i) => (
                <StandingsRow
                  key={s.playerId}
                  standing={s}
                  rank={i + 1}
                  isCurrentUser={s.playerId === playerId}
                />
              ))}
            </View>
          </View>
        )}

        {/* Recent Games */}
        {isMember && recentGames.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>RECENT GAMES</Text>
            <View style={styles.recentGamesCard}>
              {recentGames.map((game, i) => (
                <View key={game.id}>
                  <RecentGameRow game={game} />
                  {i < recentGames.length - 1 && <View style={styles.recentGameDivider} />}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Members List (for private leagues, member-only) */}
        {isMember && league.type === "private" && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              MEMBERS ({league.memberIds.length})
            </Text>
            <View style={styles.membersCard}>
              {league.memberIds.map((mid) => {
                const player = PLAYERS.find((p) => p.id === mid);
                const name = player?.name ?? mid;
                const initials = name
                  .split(" ")
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase();
                const avatarColors = [
                  Colors.primary,
                  Colors.blue,
                  Colors.teal,
                  Colors.purple,
                  Colors.amber,
                ];
                const colorIdx = mid.charCodeAt(mid.length - 1) % avatarColors.length;
                return (
                  <Pressable
                    key={mid}
                    style={styles.memberRow}
                    onPress={() => {
                      if (player) {
                        router.push({
                          pathname: "/player/[id]",
                          params: { id: mid },
                        });
                      }
                    }}
                  >
                    <View
                      style={[
                        styles.memberAvatar,
                        { backgroundColor: `${avatarColors[colorIdx]}44` },
                      ]}
                    >
                      <Text
                        style={[
                          styles.memberAvatarText,
                          { color: avatarColors[colorIdx] },
                        ]}
                      >
                        {initials}
                      </Text>
                    </View>
                    <Text style={styles.memberName}>{name}</Text>
                    {mid === playerId && (
                      <View style={styles.youBadge}>
                        <Text style={styles.youBadgeText}>YOU</Text>
                      </View>
                    )}
                    {player && (
                      <Ionicons
                        name="chevron-forward"
                        size={14}
                        color={Colors.muted}
                      />
                    )}
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {/* Public league — metadata + contact + recent public games */}
        {isPublic && (
          <>
            <View style={styles.section}>
              <View style={styles.metaGrid}>
                <View style={styles.metaItem}>
                  <Ionicons name="people-outline" size={18} color={Colors.accent} />
                  <Text style={styles.metaValue}>{league.memberIds.length}</Text>
                  <Text style={styles.metaLabel}>Members</Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="globe-outline" size={18} color={Colors.accent} />
                  <Text style={styles.metaValue}>{league.city}</Text>
                  <Text style={styles.metaLabel}>City</Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="calendar-outline" size={18} color={Colors.accent} />
                  <Text style={styles.metaValue}>
                    {new Date(league.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      year: "numeric",
                    })}
                  </Text>
                  <Text style={styles.metaLabel}>Founded</Text>
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>CONTACT</Text>
              <View style={styles.contactCard}>
                <Ionicons name="mail-outline" size={18} color={Colors.accent} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.contactLabel}>Organizer Contact</Text>
                  <Text style={styles.contactValue}>ballr.bangkok@gmail.com</Text>
                </View>
              </View>
            </View>

            {recentPublicGames.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>VIEW GAMES</Text>
                <View style={styles.recentGamesCard}>
                  {recentPublicGames.map((game, i) => (
                    <View key={game.id}>
                      <Pressable
                        style={styles.recentGameRow}
                        onPress={() =>
                          router.push({
                            pathname: "/game/[id]",
                            params: { id: game.id },
                          })
                        }
                      >
                        <View style={styles.recentGameLeft}>
                          <Text style={styles.recentGameVenue} numberOfLines={1}>
                            {game.venue.name}
                          </Text>
                          <Text style={styles.recentGameTime}>
                            {formatGameTime(game.gameTime)}
                          </Text>
                        </View>
                        {game.winningTeam ? (
                          <View
                            style={[
                              styles.recentGameBadge,
                              {
                                backgroundColor: `${
                                  game.winningTeam === "blue"
                                    ? Colors.blue
                                    : game.winningTeam === "red"
                                      ? Colors.red
                                      : Colors.muted
                                }22`,
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.recentGameBadgeText,
                                {
                                  color:
                                    game.winningTeam === "blue"
                                      ? Colors.blue
                                      : game.winningTeam === "red"
                                        ? Colors.red
                                        : Colors.muted,
                                },
                              ]}
                            >
                              {game.winningTeam === "blue"
                                ? "Blue Win"
                                : game.winningTeam === "red"
                                  ? "Red Win"
                                  : "Draw"}
                            </Text>
                          </View>
                        ) : (
                          <View
                            style={[
                              styles.recentGameBadge,
                              { backgroundColor: `${Colors.accent}22` },
                            ]}
                          >
                            <Text
                              style={[
                                styles.recentGameBadgeText,
                                { color: Colors.accent },
                              ]}
                            >
                              Completed
                            </Text>
                          </View>
                        )}
                        <Text style={styles.recentGamePlayers}>
                          {game.currentPlayers}v{game.currentPlayers}
                        </Text>
                      </Pressable>
                      {i < recentPublicGames.length - 1 && (
                        <View style={styles.recentGameDivider} />
                      )}
                    </View>
                  ))}
                </View>
              </View>
            )}
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
    flex: 1,
    textAlign: "center",
    fontFamily: "Inter_700Bold",
    fontSize: 12,
    color: Colors.text,
    letterSpacing: 2,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    gap: 12,
  },
  emptyText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.muted,
  },
  leagueHeader: {
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 20,
    gap: 8,
  },
  leagueIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: `${Colors.primary}44`,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  leagueName: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    color: Colors.text,
    textAlign: "center",
  },
  leagueMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  leagueMetaText: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.muted,
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Colors.overlay,
  },
  privateBadge: {
    backgroundColor: `${Colors.purple}33`,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  privateBadgeText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 9,
    color: Colors.purple,
    letterSpacing: 1,
  },
  leagueDescription: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.muted,
    textAlign: "center",
    lineHeight: 19,
    marginTop: 4,
  },
  lockedSection: {
    alignItems: "center",
    paddingVertical: 48,
    paddingHorizontal: 32,
    gap: 12,
  },
  lockedTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    color: Colors.text,
  },
  lockedDesc: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.muted,
    textAlign: "center",
    lineHeight: 20,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 10,
    color: Colors.muted,
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  standingsHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingBottom: 6,
  },
  standingsHeaderText: {
    fontFamily: "Inter_500Medium",
    fontSize: 9,
    color: Colors.muted,
    letterSpacing: 0.5,
  },
  standingsCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    overflow: "hidden",
  },
  standingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 11,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.separator,
  },
  standingRowHighlight: {
    backgroundColor: `${Colors.primary}22`,
  },
  standingRank: {
    fontFamily: "Inter_700Bold",
    fontSize: 12,
    width: 22,
    textAlign: "center",
  },
  standingMedal: {
    fontSize: 14,
    width: 18,
    textAlign: "center",
  },
  standingAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  standingAvatarText: {
    fontFamily: "Inter_700Bold",
    fontSize: 11,
  },
  standingInfo: {
    flex: 1,
  },
  standingName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: Colors.text,
  },
  standingSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 10,
    color: Colors.muted,
    marginTop: 1,
  },
  standingStats: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  standingGd: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: Colors.muted,
    width: 36,
    textAlign: "right",
  },
  standingPts: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
    color: Colors.accent,
    width: 30,
    textAlign: "right",
  },
  recentGamesCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    overflow: "hidden",
  },
  recentGameRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  recentGameDivider: {
    height: 1,
    backgroundColor: Colors.separator,
    marginHorizontal: 14,
  },
  recentGameLeft: {
    flex: 1,
  },
  recentGameVenue: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.text,
  },
  recentGameTime: {
    fontFamily: "Inter_400Regular",
    fontSize: 10,
    color: Colors.muted,
    marginTop: 2,
  },
  recentGameBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  recentGameBadgeText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 10,
  },
  recentGamePlayers: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: Colors.muted,
  },
  membersCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    overflow: "hidden",
  },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.separator,
  },
  memberAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  memberAvatarText: {
    fontFamily: "Inter_700Bold",
    fontSize: 11,
  },
  memberName: {
    flex: 1,
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.text,
  },
  youBadge: {
    backgroundColor: `${Colors.accent}33`,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  youBadgeText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 8,
    color: Colors.accent,
    letterSpacing: 0.8,
  },
  metaGrid: { flexDirection: "row", justifyContent: "space-around", width: "100%" as `${number}%`, marginBottom: 16 },
  metaItem: { alignItems: "center" as const, gap: 4 },
  metaValue: { fontFamily: "Inter_700Bold", fontSize: 16, color: Colors.text },
  metaLabel: { fontFamily: "Inter_400Regular", fontSize: 10, color: Colors.muted },
  lockedInfo: { flexDirection: "row" as const, alignItems: "center" as const, gap: 8, paddingHorizontal: 16 },
  requestJoinBtn: { backgroundColor: Colors.accent, flexDirection: "row" as const, alignItems: "center" as const, justifyContent: "center" as const, gap: 8, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 10, marginTop: 8 },
  requestJoinText: { fontFamily: "Inter_700Bold", fontSize: 14, color: Colors.base },
  contactCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 12,
  },
  contactLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: Colors.muted,
  },
  contactValue: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.accent,
    marginTop: 2,
  },
});
