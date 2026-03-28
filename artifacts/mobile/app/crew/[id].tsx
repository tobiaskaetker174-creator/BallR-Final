import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import {
  Crew,
  CrewMember,
  CrewGame,
  CrewLeaderboardEntry,
} from "@/constants/mock";
import {
  fetchCrewById,
  fetchCrewMembers,
  fetchCrewGames,
  fetchCrewLeaderboard,
} from "@/lib/ballrApi";

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  owner: { label: "OWNER", color: Colors.amber },
  admin: { label: "ADMIN", color: Colors.blue },
  member: { label: "MEMBER", color: Colors.muted },
};

function LeaderboardRow({ entry }: { entry: CrewLeaderboardEntry }) {
  const isTop3 = entry.rank <= 3;
  const medalIcon = entry.rank === 1 ? "🥇" : entry.rank === 2 ? "🥈" : entry.rank === 3 ? "🥉" : null;
  const rankColor = entry.rank === 1 ? Colors.amber : entry.rank === 2 ? Colors.muted : entry.rank === 3 ? "#C4834A" : Colors.muted;

  const initials = entry.playerName
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const avatarColors = [Colors.primary, Colors.blue, Colors.teal, Colors.purple, Colors.amber];
  const avatarBg = avatarColors[entry.rank % avatarColors.length];

  return (
    <Pressable
      style={[styles.leaderRow, isTop3 && styles.leaderRowTop]}
      onPress={() => router.push({ pathname: "/player/[id]", params: { id: entry.playerId } })}
    >
      <Text style={[styles.leaderRank, { color: rankColor }]}>
        {entry.rank < 10 ? `0${entry.rank}` : entry.rank}
      </Text>
      {medalIcon && <Text style={styles.leaderMedal}>{medalIcon}</Text>}
      <View style={[styles.leaderAvatar, { backgroundColor: avatarBg }]}>
        <Text style={styles.leaderAvatarText}>{initials}</Text>
      </View>
      <View style={styles.leaderInfo}>
        <Text style={styles.leaderName} numberOfLines={1}>{entry.playerName}</Text>
        <Text style={styles.leaderSub}>{entry.gamesPlayed} games · {entry.gamesWon}W</Text>
      </View>
      <Text style={[styles.leaderElo, isTop3 && { color: Colors.accent }]}>{entry.crewElo}</Text>
    </Pressable>
  );
}

function MemberRow({ member }: { member: CrewMember }) {
  const roleInfo = ROLE_LABELS[member.role] ?? ROLE_LABELS.member;
  const initials = member.playerName
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <Pressable
      style={styles.memberRow}
      onPress={() => router.push({ pathname: "/player/[id]", params: { id: member.playerId } })}
    >
      <View style={[styles.memberAvatar, { backgroundColor: Colors.primary }]}>
        <Text style={styles.memberAvatarText}>{initials}</Text>
      </View>
      <View style={styles.memberInfo}>
        <Text style={styles.memberName}>{member.playerName}</Text>
        <Text style={styles.memberSub}>{member.crewElo} ELO · {member.gamesPlayed} games</Text>
      </View>
      <View style={[styles.roleBadge, { borderColor: roleInfo.color }]}>
        <Text style={[styles.roleBadgeText, { color: roleInfo.color }]}>{roleInfo.label}</Text>
      </View>
    </Pressable>
  );
}

function GameRow({ game }: { game: CrewGame }) {
  const isUpcoming = game.status === "upcoming";
  const isCompleted = game.status === "completed";
  const statusColor = isUpcoming ? Colors.accent : isCompleted ? Colors.muted : Colors.blue;
  const statusLabel = isUpcoming ? "UPCOMING" : isCompleted ? "COMPLETED" : game.status.toUpperCase();

  const dateStr = game.gameTime
    ? new Date(game.gameTime).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      })
    : "";
  const timeStr = game.gameTime
    ? new Date(game.gameTime).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      })
    : "";

  return (
    <Pressable
      style={({ pressed }) => [styles.gameRow, pressed && { opacity: 0.8 }]}
      onPress={() => router.push({ pathname: "/game/[id]", params: { id: game.gameId } })}
    >
      <View style={styles.gameRowLeft}>
        <View style={[styles.gameStatusDot, { backgroundColor: statusColor }]} />
        <View>
          <Text style={styles.gameVenue} numberOfLines={1}>{game.venueName}</Text>
          <Text style={styles.gameTime}>{dateStr} · {timeStr}</Text>
        </View>
      </View>
      <View style={styles.gameRowRight}>
        <View style={[styles.gameStatusBadge, { backgroundColor: `${statusColor}22` }]}>
          <Text style={[styles.gameStatusText, { color: statusColor }]}>{statusLabel}</Text>
        </View>
        <Text style={styles.gamePlayers}>{game.playerCount}/{game.maxPlayers}</Text>
      </View>
    </Pressable>
  );
}

export default function CrewDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const bottomPadding = Platform.OS === "web" ? 34 : insets.bottom;

  const [crew, setCrew] = useState<Crew | null>(null);
  const [members, setMembers] = useState<CrewMember[]>([]);
  const [games, setGames] = useState<CrewGame[]>([]);
  const [leaderboard, setLeaderboard] = useState<CrewLeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showInviteCode, setShowInviteCode] = useState(false);

  useEffect(() => {
    if (id) loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [crewData, membersData, gamesData, leaderboardData] = await Promise.all([
        fetchCrewById(id),
        fetchCrewMembers(id),
        fetchCrewGames(id),
        fetchCrewLeaderboard(id),
      ]);
      if (crewData) setCrew(crewData);
      setMembers(membersData);
      setGames(gamesData);
      setLeaderboard(leaderboardData);
    } catch {
      // silently fail
    } finally {
      setIsLoading(false);
    }
  };

  const upcomingGames = games.filter((g) => g.status === "upcoming");
  const completedGames = games.filter((g) => g.status === "completed");

  const handleShareInvite = async () => {
    if (!crew) return;
    try {
      await Share.share({
        message: `Join my crew "${crew.name}" on BallR! Use invite code: ${crew.inviteCode}`,
      });
    } catch {
      // cancelled
    }
  };

  const accentColor = crew?.primaryColor || Colors.primary;

  const renderItem = () => null;

  return (
    <View style={[styles.container, { paddingTop: topPadding }]}>
      <FlatList
        data={[]}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottomPadding + 32 }}
        ListHeaderComponent={
          <>
            {/* Nav bar */}
            <View style={styles.navBar}>
              <Pressable style={styles.backBtn} onPress={() => router.back()}>
                <Ionicons name="arrow-back" size={22} color={Colors.text} />
              </Pressable>
              <Text style={styles.navTitle} numberOfLines={1}>
                {crew?.name ?? "Crew"}
              </Text>
              <View style={{ width: 36 }} />
            </View>

            {isLoading ? (
              <View style={styles.loadingWrap}>
                <ActivityIndicator size="large" color={Colors.accent} />
                <Text style={styles.loadingText}>Loading crew...</Text>
              </View>
            ) : crew ? (
              <>
                {/* Hero */}
                <View style={[styles.heroSection, { borderBottomColor: accentColor }]}>
                  <View style={[styles.heroBg, { backgroundColor: `${accentColor}18` }]} />
                  <View style={[styles.heroIcon, { backgroundColor: `${accentColor}30` }]}>
                    <Ionicons name="people" size={32} color={accentColor} />
                  </View>
                  <Text style={styles.heroName}>{crew.name}</Text>
                  {crew.description ? (
                    <Text style={styles.heroDesc}>{crew.description}</Text>
                  ) : null}
                  <View style={styles.heroStatsRow}>
                    <View style={styles.heroStat}>
                      <Text style={styles.heroStatValue}>{crew.memberCount}</Text>
                      <Text style={styles.heroStatLabel}>Members</Text>
                    </View>
                    <View style={styles.heroStatDivider} />
                    <View style={styles.heroStat}>
                      <Text style={styles.heroStatValue}>{crew.gameCount}</Text>
                      <Text style={styles.heroStatLabel}>Games</Text>
                    </View>
                    <View style={styles.heroStatDivider} />
                    <View style={styles.heroStat}>
                      <Text style={styles.heroStatValue}>{crew.avgElo}</Text>
                      <Text style={styles.heroStatLabel}>Avg ELO</Text>
                    </View>
                  </View>
                  <Pressable style={styles.inviteBtn} onPress={() => setShowInviteCode((v) => !v)}>
                    <Ionicons name="link-outline" size={14} color={Colors.accent} />
                    <Text style={styles.inviteBtnText}>Invite Players</Text>
                  </Pressable>
                  {showInviteCode && (
                    <View style={styles.inviteCodeBox}>
                      <Text style={styles.inviteCodeLabel}>INVITE CODE</Text>
                      <Text style={styles.inviteCodeValue}>{crew.inviteCode || "N/A"}</Text>
                      <Pressable style={styles.shareBtn} onPress={handleShareInvite}>
                        <Ionicons name="share-outline" size={14} color={Colors.text} />
                        <Text style={styles.shareBtnText}>Share</Text>
                      </Pressable>
                    </View>
                  )}
                </View>

                {/* Leaderboard */}
                {leaderboard.length > 0 && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>LEADERBOARD</Text>
                    {leaderboard.slice(0, 10).map((entry) => (
                      <LeaderboardRow key={entry.playerId} entry={entry} />
                    ))}
                  </View>
                )}

                {/* Upcoming Games */}
                {upcomingGames.length > 0 && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>UPCOMING GAMES</Text>
                    {upcomingGames.slice(0, 5).map((game) => (
                      <GameRow key={game.id} game={game} />
                    ))}
                  </View>
                )}

                {/* Recent Results */}
                {completedGames.length > 0 && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>RECENT RESULTS</Text>
                    {completedGames.slice(0, 5).map((game) => (
                      <GameRow key={game.id} game={game} />
                    ))}
                  </View>
                )}

                {/* Members */}
                {members.length > 0 && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>MEMBERS ({members.length})</Text>
                    {members.map((member) => (
                      <MemberRow key={member.id} member={member} />
                    ))}
                  </View>
                )}

                {/* No content fallbacks */}
                {leaderboard.length === 0 && members.length === 0 && (
                  <View style={styles.emptySection}>
                    <Ionicons name="people-outline" size={32} color={Colors.muted} />
                    <Text style={styles.emptySectionText}>No data available yet</Text>
                  </View>
                )}
              </>
            ) : (
              <View style={styles.loadingWrap}>
                <Ionicons name="alert-circle-outline" size={32} color={Colors.muted} />
                <Text style={styles.loadingText}>Crew not found</Text>
              </View>
            )}
          </>
        }
      />
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
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  navTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: Colors.text,
    flex: 1,
    textAlign: "center",
    marginHorizontal: 12,
  },
  loadingWrap: {
    alignItems: "center",
    paddingVertical: 64,
    gap: 12,
  },
  loadingText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.muted,
  },
  // Hero
  heroSection: {
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 24,
    borderBottomWidth: 2,
    marginBottom: 8,
    position: "relative",
    overflow: "hidden",
  },
  heroBg: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  heroIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  heroName: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    color: Colors.text,
    textAlign: "center",
  },
  heroDesc: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.muted,
    textAlign: "center",
    marginTop: 6,
    paddingHorizontal: 24,
  },
  heroStatsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
    gap: 0,
  },
  heroStat: {
    alignItems: "center",
    paddingHorizontal: 20,
  },
  heroStatValue: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    color: Colors.text,
  },
  heroStatLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: Colors.muted,
    marginTop: 2,
  },
  heroStatDivider: {
    width: 1,
    height: 28,
    backgroundColor: Colors.overlay,
  },
  inviteBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.overlay,
  },
  inviteBtnText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.accent,
  },
  inviteCodeBox: {
    marginTop: 12,
    backgroundColor: Colors.surface,
    borderRadius: 10,
    padding: 14,
    alignItems: "center",
    gap: 6,
  },
  inviteCodeLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 10,
    color: Colors.muted,
    letterSpacing: 1.2,
  },
  inviteCodeValue: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
    color: Colors.accent,
    letterSpacing: 3,
  },
  shareBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: Colors.overlay,
    marginTop: 4,
  },
  shareBtnText: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: Colors.text,
  },
  // Section
  section: {
    paddingHorizontal: 16,
    marginTop: 16,
  },
  sectionTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 12,
    color: Colors.muted,
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  // Leaderboard
  leaderRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: 10,
    padding: 10,
    marginBottom: 6,
    gap: 8,
  },
  leaderRowTop: {
    borderWidth: 1,
    borderColor: `${Colors.accent}30`,
  },
  leaderRank: {
    fontFamily: "Inter_700Bold",
    fontSize: 13,
    width: 22,
    textAlign: "center",
  },
  leaderMedal: {
    fontSize: 14,
    marginRight: -2,
  },
  leaderAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  leaderAvatarText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    color: Colors.text,
  },
  leaderInfo: {
    flex: 1,
  },
  leaderName: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.text,
  },
  leaderSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: Colors.muted,
    marginTop: 1,
  },
  leaderElo: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
    color: Colors.text,
  },
  // Member row
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: 10,
    padding: 10,
    marginBottom: 6,
    gap: 10,
  },
  memberAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  memberAvatarText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    color: Colors.text,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.text,
  },
  memberSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: Colors.muted,
    marginTop: 1,
  },
  roleBadge: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  roleBadgeText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 9,
    letterSpacing: 0.8,
  },
  // Game row
  gameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.surface,
    borderRadius: 10,
    padding: 12,
    marginBottom: 6,
  },
  gameRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  gameStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  gameVenue: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.text,
  },
  gameTime: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: Colors.muted,
    marginTop: 2,
  },
  gameRowRight: {
    alignItems: "flex-end",
    gap: 4,
  },
  gameStatusBadge: {
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  gameStatusText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 9,
    letterSpacing: 0.6,
  },
  gamePlayers: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: Colors.muted,
  },
  // Empty
  emptySection: {
    alignItems: "center",
    paddingVertical: 48,
    gap: 10,
  },
  emptySectionText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.muted,
  },
});
