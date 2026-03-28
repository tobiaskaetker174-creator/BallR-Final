import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Modal,
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
  type Player,
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
  const [showRivalPicker, setShowRivalPicker] = useState(false);
  const [selectedRival, setSelectedRival] = useState<Player | null>(null);

  const ME = user ?? PLAYERS[0];

  const winRate = ME.gamesPlayed > 0 ? Math.round((ME.gamesWon / ME.gamesPlayed) * 100) : 0;
  const eloTier = getEloLabel(ME.eloRating);

  const otherPlayers = PLAYERS.filter((p) => !p.isCurrentUser);
  const rivalData = selectedRival
    ? RIVALS.find((r) => r.rivalPlayer.id === selectedRival.id)
    : null;
  const rivalWinRate = rivalData?.winRate ?? 50;

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
              sub={`${ME.gamesWon}W · ${ME.gamesLost}L · ${ME.gamesDrawn}D`}
              color={Colors.accent}
            />
            <StatCard
              icon="flash-outline"
              label="ELO RATING"
              value={`${ME.eloRating}`}
              sub={`${eloTier.tier} ${eloTier.label}`}
              color={eloTier.color}
            />
            <StatCard
              icon="checkmark-circle-outline"
              label="RELIABILITY"
              value={`${ME.reliabilityScore}%`}
              sub="attendance rate"
              color={getReliabilityColor(ME.reliabilityScore)}
            />
            <StatCard
              icon="star-outline"
              label="SPIRIT RATING"
              value={ME.avgSportsmanshipRating.toFixed(1)}
              sub="avg sportsmanship"
              color={Colors.amber}
            />
          </View>
        </View>

        {ME.ballerScore !== undefined && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>BALLR OF THE MONTH SCORE</Text>
            <View style={styles.botmCard}>
              <View style={styles.botmLeft}>
                <Text style={styles.botmValue}>{ME.ballerScore}</Text>
                <Text style={styles.botmLabel}>pts</Text>
              </View>
              <View style={styles.botmRight}>
                {ME.eloGainThisMonth !== undefined && (
                  <View style={styles.botmStat}>
                    <Text style={styles.botmStatLabel}>ELO gain this month</Text>
                    <Text style={[styles.botmStatValue, {
                      color: ME.eloGainThisMonth >= 0 ? Colors.accent : Colors.red
                    }]}>
                      {ME.eloGainThisMonth >= 0 ? "+" : ""}{ME.eloGainThisMonth}
                    </Text>
                  </View>
                )}
                {ME.winStreak !== undefined && ME.winStreak > 0 && (
                  <View style={styles.botmStat}>
                    <Text style={styles.botmStatLabel}>Win streak</Text>
                    <Text style={[styles.botmStatValue, { color: Colors.amber }]}>
                      🔥 {ME.winStreak} games
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
          <View style={styles.rivalSectionHeader}>
            <Text style={styles.sectionTitle}>YOUR RIVAL</Text>
            <Pressable style={styles.setRivalBtn} onPress={() => setShowRivalPicker(true)}>
              <Ionicons name="person-add-outline" size={13} color={Colors.accent} />
              <Text style={styles.setRivalBtnText}>{selectedRival ? "Change" : "Set Rival"}</Text>
            </Pressable>
          </View>

          {selectedRival ? (
            <>
              <View style={styles.rivalFocusCard}>
                <View style={styles.rivalFocusTop}>
                  <View style={[styles.rivalAvatar, { backgroundColor: Colors.red + "33" }]}>
                    <Text style={[styles.rivalAvatarText, { color: Colors.red }]}>
                      {selectedRival.name.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rivalName}>{selectedRival.name}</Text>
                    <Text style={styles.rivalSub}>
                      {isEloPublic(selectedRival, PLAYERS) ? `${selectedRival.eloRating} ELO · ` : ""}
                      {rivalData ? `${rivalData.timesPlayed} matches` : "Matched opponent"}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => router.push({ pathname: "/player/[id]", params: { id: selectedRival.id } })}
                  >
                    <Ionicons name="chevron-forward" size={16} color={Colors.muted} />
                  </Pressable>
                </View>

                <View style={styles.rivalWinRow}>
                  <View style={styles.rivalWinSide}>
                    <Text style={[styles.rivalWinPct, { color: rivalWinRate >= 50 ? Colors.accent : Colors.red }]}>
                      {rivalWinRate}%
                    </Text>
                    <Text style={styles.rivalWinLabel}>Your win rate vs them</Text>
                  </View>
                  <View style={styles.rivalVsDivider}>
                    <Text style={styles.rivalVsText}>VS</Text>
                  </View>
                  <View style={styles.rivalWinSide}>
                    <Text style={[styles.rivalWinPct, { color: (100 - rivalWinRate) >= 50 ? Colors.red : Colors.accent }]}>
                      {100 - rivalWinRate}%
                    </Text>
                    <Text style={styles.rivalWinLabel}>Their win rate vs you</Text>
                  </View>
                </View>

                <View style={styles.rivalBarOuter}>
                  <View style={[styles.rivalBarFill, { flex: rivalWinRate / 100, backgroundColor: rivalWinRate >= 50 ? Colors.accent : Colors.red }]} />
                  <View style={[styles.rivalBarFill, { flex: (100 - rivalWinRate) / 100, backgroundColor: Colors.overlay }]} />
                </View>
                {rivalData && (
                  <Text style={styles.rivalTrend}>
                    {rivalData.trending === "up" ? "↑ You are improving against them" : rivalData.trending === "down" ? "↓ They have the edge recently" : "→ Evenly matched recently"}
                  </Text>
                )}
              </View>
            </>
          ) : (
            <View style={styles.emptyCard}>
              <Ionicons name="people-outline" size={32} color={Colors.muted} />
              <Text style={styles.emptyText}>Set a rival to track your head-to-head stats.</Text>
              <Pressable style={styles.setRivalEmptyBtn} onPress={() => setShowRivalPicker(true)}>
                <Text style={styles.setRivalEmptyBtnText}>Choose a Rival</Text>
              </Pressable>
            </View>
          )}
        </View>

        <Modal
          visible={showRivalPicker}
          transparent
          animationType="slide"
          onRequestClose={() => setShowRivalPicker(false)}
        >
          <Pressable style={styles.pickerOverlay} onPress={() => setShowRivalPicker(false)}>
            <View style={styles.pickerSheet}>
              <View style={styles.pickerHeader}>
                <Text style={styles.pickerTitle}>Choose Your Rival</Text>
                <Pressable onPress={() => setShowRivalPicker(false)}>
                  <Ionicons name="close" size={20} color={Colors.muted} />
                </Pressable>
              </View>
              <Text style={styles.pickerDesc}>Pick a player you want to track head-to-head.</Text>
              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 380 }}>
                {otherPlayers.map((p) => {
                  const initials = p.name.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase();
                  const isSelected = selectedRival?.id === p.id;
                  const inRivals = RIVALS.some((r) => r.rivalPlayer.id === p.id);
                  return (
                    <Pressable
                      key={p.id}
                      style={[styles.pickerRow, isSelected && styles.pickerRowSelected]}
                      onPress={() => { setSelectedRival(p); setShowRivalPicker(false); }}
                    >
                      <View style={[styles.pickerAvatar, { backgroundColor: Colors.red + "33" }]}>
                        <Text style={[styles.pickerAvatarText, { color: Colors.red }]}>{initials}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.pickerName}>{p.name}</Text>
                        <Text style={styles.pickerSub}>
                          {isEloPublic(p, PLAYERS) ? `${p.eloRating} ELO · ` : ""}{p.gamesPlayed} games
                          {inRivals ? " · Matched before" : ""}
                        </Text>
                      </View>
                      {isSelected && <Ionicons name="checkmark-circle" size={20} color={Colors.accent} />}
                      {!isSelected && <Ionicons name="chevron-forward" size={16} color={Colors.muted} />}
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          </Pressable>
        </Modal>

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

        {RIVALS.length > 0 && (() => {
          const toughest = RIVALS.reduce((min, r) => r.winRate < min.winRate ? r : min, RIVALS[0]);
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
  rivalSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  setRivalBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: `${Colors.accent}22`,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: `${Colors.accent}33`,
  },
  setRivalBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 11, color: Colors.accent },
  rivalFocusCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: `${Colors.red}22`,
  },
  rivalFocusTop: { flexDirection: "row", alignItems: "center", gap: 12 },
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
  rivalWinRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  rivalWinSide: { alignItems: "center", flex: 1 },
  rivalWinPct: { fontFamily: "Inter_700Bold", fontSize: 28 },
  rivalWinLabel: { fontFamily: "Inter_400Regular", fontSize: 10, color: Colors.muted, textAlign: "center" },
  rivalVsDivider: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.overlay,
    alignItems: "center",
    justifyContent: "center",
  },
  rivalVsText: { fontFamily: "Inter_700Bold", fontSize: 11, color: Colors.muted },
  rivalBarOuter: { flexDirection: "row", height: 6, borderRadius: 999, overflow: "hidden" },
  rivalBarFill: {},
  rivalTrend: { fontFamily: "Inter_400Regular", fontSize: 11, color: Colors.muted, textAlign: "center" },
  setRivalEmptyBtn: {
    backgroundColor: `${Colors.accent}22`,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: `${Colors.accent}44`,
  },
  setRivalEmptyBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: Colors.accent },
  pickerOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.65)", justifyContent: "flex-end" },
  pickerSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 34,
  },
  pickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  pickerTitle: { fontFamily: "Inter_700Bold", fontSize: 16, color: Colors.text },
  pickerDesc: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.muted, marginBottom: 14 },
  pickerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: Colors.separator,
  },
  pickerRowSelected: { backgroundColor: `${Colors.accent}11` },
  pickerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  pickerAvatarText: { fontFamily: "Inter_700Bold", fontSize: 13 },
  pickerName: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: Colors.text },
  pickerSub: { fontFamily: "Inter_400Regular", fontSize: 11, color: Colors.muted },
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
});
