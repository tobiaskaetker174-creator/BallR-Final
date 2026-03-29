import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState, useMemo } from "react";
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
  ELO_HISTORY,
  RIVALS,
  BEST_TEAMMATES,
  getEloLabel,
  getReliabilityColor,
  isEloPublic,
  getPlayerLeagues,
  LEAGUE_GAMES,
  League,
} from "@/constants/mock";
import { useAuth } from "@/context/AuthContext";

function StatCard({ icon, label, value, sub, color }: {
  icon: string; label: string; value: string; sub?: string; color?: string;
}) {
  return (
    <View style={styles.statCard}>
      <Ionicons name={icon as any} size={20} color={color ?? Colors.accent} />
      <Text style={[styles.statCardValue, color ? { color } : {}]}>{value}</Text>
      {sub && <Text style={styles.statCardSub}>{sub}</Text>}
      <Text style={styles.statCardLabel}>{label}</Text>
    </View>
  );
}

export default function AnalyticsScreen() {
  const insets = useSafeAreaInsets();
  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const bottomPadding = Platform.OS === "web" ? 34 : insets.bottom;
  const { user, isLoggedIn } = useAuth();

  const ME = user ?? PLAYERS[0];

  // League toggle state: null = city-wide (Bangkok), or a league object
  const myLeagues = useMemo(() => getPlayerLeagues(ME.id), [ME.id]);
  const privateLeagues = useMemo(() => myLeagues.filter((l) => l.type === "private"), [myLeagues]);
  const [selectedLeague, setSelectedLeague] = useState<League | null>(null);

  // Compute stats based on selected league or city-wide
  const leagueStats = useMemo(() => {
    if (!selectedLeague) {
      // City-wide stats — use existing player data
      return {
        gamesPlayed: ME.gamesPlayed,
        gamesWon: ME.gamesWon,
        gamesLost: ME.gamesLost,
        gamesDrawn: ME.gamesDrawn,
        winRate: ME.gamesPlayed > 0 ? Math.round((ME.gamesWon / ME.gamesPlayed) * 100) : 0,
        reliability: ME.reliabilityScore,
        sportsmanship: ME.avgSportsmanshipRating,
        eloRating: ME.eloRating,
        ballerScore: ME.ballerScore,
        eloGain: ME.eloGainThisMonth,
        winStreak: ME.winStreak,
      };
    }
    // League-specific stats
    const leagueGames = LEAGUE_GAMES.filter(
      (g) => g.leagueId === selectedLeague.id && g.status === "completed"
    );
    let wins = 0;
    let losses = 0;
    let draws = 0;
    let gamesAttended = 0;
    leagueGames.forEach((game) => {
      const myBooking = game.bookings.find((b) => b.player.id === ME.id);
      if (!myBooking) return;
      gamesAttended++;
      const myTeam = myBooking.teamAssignment;
      if (game.winningTeam === "draw") {
        draws++;
      } else if (game.winningTeam === myTeam) {
        wins++;
      } else if (game.winningTeam) {
        losses++;
      }
    });
    const played = wins + losses + draws;
    // Calculate league-specific reliability (% of league games attended)
    const totalLeagueGames = leagueGames.length;
    const leagueReliability = totalLeagueGames > 0 ? Math.round((gamesAttended / totalLeagueGames) * 100) : 100;
    // Simulate league-specific sportsmanship (slightly different from overall)
    const leagueSportsmanship = played > 0 ? Math.min(5.0, Math.max(3.0, 4.2 + (wins - losses) * 0.05)) : ME.avgSportsmanshipRating;
    // League-specific ELO gain (approximate)
    const leagueEloGain = Math.round((wins - losses) * 15);
    // League-specific win streak
    let streak = 0;
    const sortedGames = [...leagueGames].sort((a, b) => new Date(b.gameTime).getTime() - new Date(a.gameTime).getTime());
    for (const g of sortedGames) {
      const myB = g.bookings.find((b) => b.player.id === ME.id);
      if (!myB) break;
      if (g.winningTeam === myB.teamAssignment) streak++;
      else break;
    }
    return {
      gamesPlayed: played,
      gamesWon: wins,
      gamesLost: losses,
      gamesDrawn: draws,
      winRate: played > 0 ? Math.round((wins / played) * 100) : 0,
      reliability: leagueReliability,
      sportsmanship: Math.round(leagueSportsmanship * 10) / 10,
      eloRating: ME.eloRating,
      ballerScore: played > 0 ? Math.round(wins * 8 + draws * 3 + leagueEloGain * 0.5) : 0,
      eloGain: leagueEloGain,
      winStreak: streak,
    };
  }, [selectedLeague, ME]);

  // Compute league-specific rivals
  const leagueRivals = useMemo(() => {
    if (!selectedLeague) return RIVALS;
    const leagueGames = LEAGUE_GAMES.filter(
      (g) => g.leagueId === selectedLeague.id && g.status === "completed"
    );
    const rivalMap = new Map<string, { opponent: typeof PLAYERS[0]; wins: number; total: number }>();
    leagueGames.forEach((game) => {
      const myBooking = game.bookings.find((b) => b.player.id === ME.id);
      if (!myBooking) return;
      const myTeam = myBooking.teamAssignment;
      const opponents = game.bookings.filter((b) => b.teamAssignment !== myTeam && b.teamAssignment !== "none");
      const didWin = game.winningTeam === myTeam;
      opponents.forEach((opp) => {
        const existing = rivalMap.get(opp.player.id);
        if (existing) {
          existing.total++;
          if (didWin) existing.wins++;
        } else {
          rivalMap.set(opp.player.id, { opponent: opp.player, wins: didWin ? 1 : 0, total: 1 });
        }
      });
    });
    return Array.from(rivalMap.values())
      .filter((r) => r.total >= 2)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)
      .map((r) => ({
        rivalPlayer: r.opponent,
        winRate: r.total > 0 ? Math.round((r.wins / r.total) * 100) : 0,
        timesPlayed: r.total,
        trending: "stable" as const,
      }));
  }, [selectedLeague, ME.id]);

  const winRate = leagueStats.winRate;
  const eloTier = getEloLabel(ME.eloRating, ME, PLAYERS);

  if (!isLoggedIn) {
    return (
      <View style={[styles.container, { paddingTop: topPadding }]}>
        <View style={styles.navBar}>
          <Pressable style={styles.navBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color={Colors.text} />
          </Pressable>
          <Text style={styles.navTitle}>MY ANALYTICS</Text>
          <View style={styles.navBtn} />
        </View>
        <View style={styles.authGate}>
          <Ionicons name="lock-closed-outline" size={48} color={Colors.muted} />
          <Text style={styles.authGateTitle}>Log In to View Analytics</Text>
          <Text style={styles.authGateDesc}>
            Your personal stats, rivals, best teammates, and ELO history live here.
          </Text>
          <Pressable style={styles.authGateBtn} onPress={() => router.push("/auth")}>
            <Ionicons name="person-outline" size={16} color={Colors.text} />
            <Text style={styles.authGateBtnText}>Log In</Text>
          </Pressable>
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
        <Text style={styles.navTitle}>MY ANALYTICS</Text>
        <View style={styles.navBtn} />
      </View>

      {privateLeagues.length > 0 && (
        <View style={styles.leagueToggleRow}>
          <Pressable
            style={[
              styles.leagueToggleBtn,
              !selectedLeague && styles.leagueToggleBtnActive,
            ]}
            onPress={() => setSelectedLeague(null)}
          >
            <Ionicons
              name="globe-outline"
              size={13}
              color={!selectedLeague ? Colors.base : Colors.muted}
            />
            <Text
              style={[
                styles.leagueToggleText,
                !selectedLeague && styles.leagueToggleTextActive,
              ]}
            >
              Bangkok
            </Text>
          </Pressable>
          {privateLeagues.map((league) => (
            <Pressable
              key={league.id}
              style={[
                styles.leagueToggleBtn,
                selectedLeague?.id === league.id && styles.leagueToggleBtnActive,
              ]}
              onPress={() => setSelectedLeague(league)}
            >
              <Ionicons
                name="shield-outline"
                size={13}
                color={selectedLeague?.id === league.id ? Colors.base : Colors.muted}
              />
              <Text
                style={[
                  styles.leagueToggleText,
                  selectedLeague?.id === league.id && styles.leagueToggleTextActive,
                ]}
              >
                {league.name}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottomPadding + 30, gap: 0 }}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PERFORMANCE OVERVIEW</Text>
          <View style={styles.statsGrid}>
            <StatCard
              icon="trophy-outline"
              label="WIN RATE"
              value={`${winRate}%`}
              sub={`${leagueStats.gamesWon}W · ${leagueStats.gamesLost}L · ${leagueStats.gamesDrawn}D`}
              color={Colors.accent}
            />
            <StatCard
              icon="flash-outline"
              label="ELO RATING"
              value={`${leagueStats.eloRating}`}
              sub={eloTier.label ? `${eloTier.tier} ${eloTier.label}` : undefined}
              color={eloTier.color}
            />
            <StatCard
              icon="checkmark-circle-outline"
              label="RELIABILITY"
              value={`${leagueStats.reliability}%`}
              sub="attendance rate"
              color={getReliabilityColor(leagueStats.reliability)}
            />
            <StatCard
              icon="star-outline"
              label="SPIRIT RATING"
              value={leagueStats.sportsmanship.toFixed(1)}
              sub="avg sportsmanship"
              color={Colors.amber}
            />
          </View>
        </View>

        {leagueStats.ballerScore !== undefined && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>BALLR OF THE MONTH SCORE</Text>
            <View style={styles.botmCard}>
              <View style={styles.botmLeft}>
                <Text style={styles.botmValue}>{leagueStats.ballerScore}</Text>
                <Text style={styles.botmLabel}>pts</Text>
              </View>
              <View style={styles.botmRight}>
                {leagueStats.eloGain !== undefined && (
                  <View style={styles.botmStat}>
                    <Text style={styles.botmStatLabel}>ELO gain this month</Text>
                    <Text style={[styles.botmStatValue, {
                      color: leagueStats.eloGain >= 0 ? Colors.accent : Colors.red
                    }]}>
                      {leagueStats.eloGain >= 0 ? "+" : ""}{leagueStats.eloGain}
                    </Text>
                  </View>
                )}
                {leagueStats.winStreak !== undefined && leagueStats.winStreak > 0 && (
                  <View style={styles.botmStat}>
                    <Text style={styles.botmStatLabel}>Win streak</Text>
                    <Text style={[styles.botmStatValue, { color: Colors.amber }]}>
                      🔥 {leagueStats.winStreak} games
                    </Text>
                  </View>
                )}
              </View>
            </View>
            <View style={styles.botmBreakdown}>
              <Text style={styles.botmBreakdownTitle}>Score Breakdown</Text>
              <View style={styles.botmBar}>
                <View style={[styles.botmBarFill, { flex: 0.4, backgroundColor: Colors.accent }]}>
                  <Text style={styles.botmBarLabel}>Win Rate 40%</Text>
                </View>
                <View style={[styles.botmBarFill, { flex: 0.3, backgroundColor: Colors.blue }]}>
                  <Text style={styles.botmBarLabel}>ELO 30%</Text>
                </View>
                <View style={[styles.botmBarFill, { flex: 0.3, backgroundColor: Colors.purple }]}>
                  <Text style={styles.botmBarLabel}>Community 30%</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ELO HISTORY (Last 10 Games)</Text>
          <View style={styles.eloHistoryCard}>
            {(() => {
              const maxChange = Math.max(...ELO_HISTORY.map((e) => Math.abs(e.change)));
              return ELO_HISTORY.map((entry, i) => {
                const barColor = entry.change > 0 ? Colors.accent : entry.change < 0 ? Colors.red : Colors.muted;
                const barWidthPct = (Math.abs(entry.change) / (maxChange || 1)) * 55;
                const date = new Date(entry.date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
                const resultLabel = entry.reason === "win" ? "W" : entry.reason === "loss" ? "L" : entry.reason === "no_show" ? "NS" : "D";
                return (
                  <View key={i} style={[styles.eloHRow, i < ELO_HISTORY.length - 1 && styles.eloHRowBorder]}>
                    <View style={styles.eloHLeft}>
                      <Text style={styles.eloHVenue} numberOfLines={1}>{entry.venueName}</Text>
                      <Text style={styles.eloHDate}>{date}</Text>
                    </View>
                    <View style={styles.eloHBarContainer}>
                      <View style={[styles.eloHBar, { width: `${barWidthPct}%` as `${number}%`, backgroundColor: barColor }]} />
                    </View>
                    <View style={[styles.eloHResultBadge, { backgroundColor: barColor + "22" }]}>
                      <Text style={[styles.eloHResultText, { color: barColor }]}>{resultLabel}</Text>
                    </View>
                    <Text style={[styles.eloHChange, { color: barColor }]}>
                      {entry.change > 0 ? `+${entry.change}` : entry.change}
                    </Text>
                    <Text style={styles.eloHFinal}>{entry.eloAfter}</Text>
                  </View>
                );
              });
            })()}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>YOUR RIVALS</Text>
          <Text style={styles.sectionDesc}>
            Players you've gone head-to-head against the most.
          </Text>
          {leagueRivals.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="people-outline" size={32} color={Colors.muted} />
              <Text style={styles.emptyText}>Play more games to discover your rivals!</Text>
            </View>
          ) : (
            leagueRivals.map((rival, i) => {
              const rp = rival.rivalPlayer;
              const initials = rp.name.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase();
              return (
                <Pressable
                  key={i}
                  style={styles.rivalCard}
                  onPress={() => router.push({ pathname: "/player/[id]", params: { id: rp.id } })}
                >
                  <View style={[styles.rivalAvatar, { backgroundColor: Colors.red + "33" }]}>
                    <Text style={[styles.rivalAvatarText, { color: Colors.red }]}>{initials}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rivalName}>{rp.name}</Text>
                    <Text style={styles.rivalSub}>
                      {isEloPublic(rp, PLAYERS) ? `${rp.eloRating} ELO · ` : ""}
                      {rival.timesPlayed} matches · {rival.trending === "up" ? "📈" : rival.trending === "down" ? "📉" : "➡️"} {rival.trending}
                    </Text>
                  </View>
                  <View style={styles.teammateWin}>
                    <Text style={[styles.teammateWinPct, { color: rival.winRate >= 50 ? Colors.accent : Colors.red }]}>{rival.winRate}%</Text>
                    <Text style={styles.teammateWinLabel}>win</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={14} color={Colors.muted} />
                </Pressable>
              );
            })
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>BEST TEAMMATES</Text>
          <Text style={styles.sectionDesc}>
            Your most synergistic partners — players you win with the most.
          </Text>
          {BEST_TEAMMATES.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="heart-outline" size={32} color={Colors.muted} />
              <Text style={styles.emptyText}>Play more games to discover your best teammates!</Text>
            </View>
          ) : (
            BEST_TEAMMATES.map((teammate, i) => {
              const tp = teammate.player;
              const initials = tp.name.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase();
              const avatarColors = [Colors.primary, Colors.blue, Colors.teal];
              const avatarBg = avatarColors[i % avatarColors.length];
              return (
                <Pressable
                  key={i}
                  style={styles.teammateCard}
                  onPress={() => router.push({ pathname: "/player/[id]", params: { id: tp.id } })}
                >
                  <View style={[styles.teammateAvatar, { backgroundColor: avatarBg + "44" }]}>
                    <Text style={[styles.teammateAvatarText, { color: avatarBg }]}>{initials}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.teammateName}>{tp.name}</Text>
                    <Text style={styles.teammateSub}>{teammate.timesPlayedTogether} games together</Text>
                  </View>
                  <View style={styles.teammateWin}>
                    <Text style={styles.teammateWinPct}>{teammate.winRate}%</Text>
                    <Text style={styles.teammateWinLabel}>win</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={14} color={Colors.muted} />
                </Pressable>
              );
            })
          )}
        </View>

        {leagueRivals.length > 0 && (() => {
          const toughest = leagueRivals.reduce((min, r) => r.winRate < min.winRate ? r : min, leagueRivals[0]);
          const tp = toughest.rivalPlayer;
          const initials = tp.name.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase();
          return (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>TOUGHEST OPPONENT</Text>
              <Text style={styles.sectionDesc}>
                The rival you struggle against the most — lowest win rate head-to-head.
              </Text>
              <Pressable
                style={styles.toughCard}
                onPress={() => router.push({ pathname: "/player/[id]", params: { id: tp.id } })}
              >
                <View style={[styles.teammateAvatar, { backgroundColor: Colors.red + "33" }]}>
                  <Text style={[styles.teammateAvatarText, { color: Colors.red }]}>{initials}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.teammateName}>{tp.name}</Text>
                  <Text style={styles.teammateSub}>{toughest.timesPlayed} games played · {toughest.trending === "up" ? "📈" : toughest.trending === "down" ? "📉" : "➡️"} {toughest.trending}</Text>
                </View>
                <View style={styles.teammateWin}>
                  <Text style={[styles.teammateWinPct, { color: Colors.red }]}>{toughest.winRate}%</Text>
                  <Text style={styles.teammateWinLabel}>win</Text>
                </View>
                <Ionicons name="chevron-forward" size={14} color={Colors.muted} />
              </Pressable>
            </View>
          );
        })()}
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
  authGate: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 14,
  },
  authGateTitle: { fontFamily: "Inter_700Bold", fontSize: 20, color: Colors.text, textAlign: "center" },
  authGateDesc: { fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.muted, textAlign: "center", lineHeight: 20 },
  authGateBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 13,
    borderRadius: 12,
    marginTop: 4,
  },
  authGateBtnText: { fontFamily: "Inter_700Bold", fontSize: 14, color: Colors.text },
  section: { paddingHorizontal: 16, marginBottom: 24 },
  sectionTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 10,
    color: Colors.muted,
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  sectionDesc: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.muted,
    marginBottom: 12,
    lineHeight: 17,
  },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  statCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    gap: 3,
  },
  statCardValue: { fontFamily: "Inter_700Bold", fontSize: 22, color: Colors.accent },
  statCardSub: { fontFamily: "Inter_400Regular", fontSize: 10, color: Colors.muted, textAlign: "center" },
  statCardLabel: { fontFamily: "Inter_500Medium", fontSize: 9, color: Colors.muted, letterSpacing: 0.5, marginTop: 1, textAlign: "center" },
  botmCard: {
    backgroundColor: `${Colors.primary}22`,
    borderRadius: 14,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: `${Colors.accent}33`,
  },
  botmLeft: { alignItems: "center" },
  botmValue: { fontFamily: "Inter_700Bold", fontSize: 48, color: Colors.accent, lineHeight: 52 },
  botmLabel: { fontFamily: "Inter_400Regular", fontSize: 11, color: Colors.muted },
  botmRight: { flex: 1, gap: 10 },
  botmStat: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  botmStatLabel: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.muted },
  botmStatValue: { fontFamily: "Inter_700Bold", fontSize: 14 },
  botmBreakdown: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  botmBreakdownTitle: { fontFamily: "Inter_600SemiBold", fontSize: 11, color: Colors.muted },
  botmBar: {
    height: 22,
    flexDirection: "row",
    borderRadius: 8,
    overflow: "hidden",
    gap: 2,
  },
  botmBarFill: { alignItems: "center", justifyContent: "center" },
  botmBarLabel: { fontFamily: "Inter_700Bold", fontSize: 8, color: Colors.text },
  eloChartWrapper: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    gap: 12,
  },
  eloChart: { flexDirection: "row", alignItems: "flex-end", gap: 6, height: 80 },
  eloBarCol: { flex: 1, alignItems: "center", justifyContent: "flex-end", gap: 2 },
  eloBar: { width: "100%", borderRadius: 4, minHeight: 8 },
  eloBarChange: { fontFamily: "Inter_400Regular", fontSize: 8, color: Colors.muted },
  eloChartLegend: { flexDirection: "row", justifyContent: "center", gap: 16 },
  eloLegendItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  eloLegendDot: { width: 8, height: 8, borderRadius: 4 },
  eloLegendText: { fontFamily: "Inter_400Regular", fontSize: 11, color: Colors.muted },
  eloHistoryCard: { backgroundColor: Colors.surface, borderRadius: 14, overflow: "hidden" },
  eloHRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 8,
  },
  eloHRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.separator },
  eloHLeft: { width: 90 },
  eloHVenue: { fontFamily: "Inter_500Medium", fontSize: 11, color: Colors.text, marginBottom: 1 },
  eloHDate: { fontFamily: "Inter_400Regular", fontSize: 9, color: Colors.muted },
  eloHBarContainer: { flex: 1, height: 8, backgroundColor: Colors.overlay, borderRadius: 4, overflow: "hidden" },
  eloHBar: { height: 8, borderRadius: 4 },
  eloHResultBadge: {
    width: 24,
    height: 20,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  eloHResultText: { fontFamily: "Inter_700Bold", fontSize: 9 },
  eloHChange: { fontFamily: "Inter_700Bold", fontSize: 12, minWidth: 30, textAlign: "right" },
  eloHFinal: { fontFamily: "Inter_400Regular", fontSize: 11, color: Colors.muted, minWidth: 34, textAlign: "right" },
  emptyCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 24,
    alignItems: "center",
    gap: 10,
  },
  emptyText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.muted,
    textAlign: "center",
    lineHeight: 19,
  },
  rivalCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 13,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: `${Colors.red}22`,
  },
  rivalAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  rivalAvatarText: { fontFamily: "Inter_700Bold", fontSize: 14 },
  rivalName: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: Colors.text },
  rivalSub: { fontFamily: "Inter_400Regular", fontSize: 11, color: Colors.muted },
  teammateCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 13,
    marginBottom: 8,
  },
  teammateAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  teammateAvatarText: { fontFamily: "Inter_700Bold", fontSize: 14 },
  teammateName: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: Colors.text },
  teammateSub: { fontFamily: "Inter_400Regular", fontSize: 11, color: Colors.muted },
  teammateWin: { alignItems: "center" },
  teammateWinPct: { fontFamily: "Inter_700Bold", fontSize: 18, color: Colors.accent },
  teammateWinLabel: { fontFamily: "Inter_400Regular", fontSize: 9, color: Colors.muted },
  toughCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: `${Colors.red}11`,
    borderRadius: 12,
    padding: 13,
    borderWidth: 1,
    borderColor: `${Colors.red}22`,
  },
  leagueToggleRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 12,
  },
  leagueToggleBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.overlay,
  },
  leagueToggleBtnActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  leagueToggleText: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: Colors.muted,
  },
  leagueToggleTextActive: {
    color: Colors.base,
    fontFamily: "Inter_600SemiBold",
  },
});
