import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import BallrLogo from "@/components/BallrLogo";
import React, { useState } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { POTM_ENTRIES, PotmEntry, PLAYERS, isEloPublic, Player, getFairnessScore } from "@/constants/mock";
import { useBallrData } from "@/context/BallrDataContext";
import { ActivityIndicator } from "react-native";

const CITIES = ["Bangkok", "Bali"];
const MEDAL_ICONS: Record<string, string> = { gold: "🥇", silver: "🥈", bronze: "🥉" };

function PodiumBlock({ entry, rank }: { entry: PotmEntry; rank: number }) {
  const isFirst = rank === 1;
  const isSecond = rank === 2;
  const podiumColor = isFirst ? Colors.amber : isSecond ? Colors.muted : "#C4834A";
  const blockH = isFirst ? 80 : isSecond ? 55 : 44;
  const avatarSize = isFirst ? 60 : 46;

  const initials = entry.player.name
    .split(" ")
    .map((n: string) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const avatarColors = [Colors.primary, Colors.blue, Colors.teal];
  const avatarBg = avatarColors[(rank - 1) % avatarColors.length];
  const medalIcon = rank === 1 ? "🥇" : rank === 2 ? "🥈" : "🥉";

  return (
    <Pressable
      style={[styles.podiumItem, isFirst && styles.podiumItemCenter]}
      onPress={() => router.push({ pathname: "/player/[id]", params: { id: entry.player.id } })}
    >
      <View style={styles.podiumMeta}>
        {isFirst && (
          <View style={styles.winnerBadge}>
            <Text style={styles.winnerBadgeText}>BALLER OF THE MONTH</Text>
          </View>
        )}
        <Text style={styles.podiumMedal}>{medalIcon}</Text>
        <View
          style={[
            styles.podiumAvatar,
            {
              width: avatarSize,
              height: avatarSize,
              borderRadius: avatarSize / 2,
              backgroundColor: avatarBg,
              borderWidth: isFirst ? 2 : 1,
              borderColor: isFirst ? Colors.amber : "transparent",
            },
          ]}
        >
          <Text style={[styles.podiumAvatarInitials, { fontSize: avatarSize * 0.36 }]}>
            {initials}
          </Text>
        </View>
        <Text style={styles.podiumName} numberOfLines={1}>
          {entry.player.name.split(" ")[0]}
        </Text>
        <Text style={[styles.podiumScore, { color: isFirst ? Colors.accent : Colors.text }]}>
          {entry.potmScore}
        </Text>
        <Text style={styles.podiumScoreLabel}>pts</Text>
      </View>
      <View
        style={[
          styles.podiumBlock,
          {
            height: blockH,
            backgroundColor: `${podiumColor}22`,
            borderTopWidth: 2,
            borderTopColor: podiumColor,
          },
        ]}
      >
        <Text style={[styles.podiumRankNum, { color: podiumColor }]}>#{rank}</Text>
      </View>
    </Pressable>
  );
}

function RankRow({ entry, isCurrentUser, mode, eloPeriod }: {
  entry: PotmEntry;
  isCurrentUser?: boolean;
  mode?: RankMode;
  eloPeriod?: EloTimePeriod;
}) {
  const topColors = [Colors.amber, Colors.muted, "#C4834A"];
  const rankColor = entry.rank <= 3 ? topColors[entry.rank - 1] : Colors.muted;
  const medal = entry.rank === 1 ? "🥇" : entry.rank === 2 ? "🥈" : entry.rank === 3 ? "🥉" : null;

  const initials = entry.player.name
    .split(" ")
    .map((n: string) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const avatarColors = [Colors.primary, Colors.blue, Colors.teal, Colors.purple, Colors.amber];
  const avatarBg = avatarColors[entry.rank % avatarColors.length];

  const isEloMode = mode === "elo";
  const isChampionMode = mode === "champion";
  const isMonthMode = eloPeriod === "month";
  const monthGain = entry.player.eloGainThisMonth ?? 0;
  const gainColor = monthGain >= 0 ? Colors.accent : Colors.red;
  const fairnessScore = getFairnessScore(entry.player);
  const isTop10Pct = fairnessScore >= 90;

  return (
    <Pressable
      style={[styles.rankRow, isCurrentUser && styles.rankRowCurrent]}
      onPress={() => router.push({ pathname: "/player/[id]", params: { id: entry.player.id } })}
    >
      <Text style={[styles.rankNum, { color: rankColor }]}>
        {entry.rank < 10 ? `0${entry.rank}` : entry.rank}
      </Text>
      <View style={[styles.rankAvatar, { backgroundColor: avatarBg }]}>
        <Text style={styles.rankAvatarText}>{initials}</Text>
      </View>
      <View style={styles.rankInfo}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
          <Text style={styles.rankName}>
            {entry.player.name}
            {isCurrentUser ? " (You)" : ""}
          </Text>
          {medal && <Text style={{ fontSize: 13 }}>{medal}</Text>}
          {isChampionMode && isTop10Pct && (
            <View style={styles.fairnessTopChip}>
              <Text style={styles.fairnessTopChipText}>TOP 10%</Text>
            </View>
          )}
        </View>
        <Text style={styles.rankSub}>
          {isChampionMode
            ? `${fairnessScore}% reliability · ${entry.gamesPlayed} games`
            : `${isEloPublic(entry.player, PLAYERS) ? `${entry.player.eloRating} elo · ` : ""}${entry.gamesPlayed} games · ${entry.wins}W`}
        </Text>
      </View>
      {isEloMode && isMonthMode ? (
        <Text style={[styles.rankScore, { color: gainColor, fontSize: 13 }]}>
          {monthGain >= 0 ? `+${monthGain}` : monthGain}
        </Text>
      ) : isEloMode ? (
        <Text style={styles.rankElo}>{isEloPublic(entry.player, PLAYERS) ? entry.player.eloRating : "—"}</Text>
      ) : isChampionMode ? (
        <Text style={[styles.rankScore, { color: entry.rank <= 3 ? Colors.amber : Colors.accent }]}>
          {fairnessScore}%
        </Text>
      ) : (
        <>
          <Text style={styles.rankElo}>{isEloPublic(entry.player, PLAYERS) ? entry.player.eloRating : "—"}</Text>
          <Text style={[styles.rankScore, { color: Colors.accent }]}>{entry.potmScore}</Text>
        </>
      )}
    </Pressable>
  );
}

type RankMode = "botm" | "elo" | "champion";
type EloTimePeriod = "month" | "alltime";
type DropdownOption = { id: RankMode; label: string; icon: string };
const DROPDOWN_OPTIONS: DropdownOption[] = [
  { id: "botm", label: "Baller of the Month", icon: "🏆" },
  { id: "elo", label: "ELO Ranking", icon: "⚡" },
  { id: "champion", label: "Fairness Award", icon: "🤝" },
];

export default function LeaderboardScreen() {
  const insets = useSafeAreaInsets();
  const {
    potmBangkok, potmBali, eloBangkok, eloBali,
    players: livePlayers, currentPlayer, isLoadingLeaderboard,
  } = useBallrData();
  const myCity = currentPlayer?.basedIn ?? PLAYERS[0].basedIn ?? "Bangkok";
  const [city, setCity] = useState(CITIES.findIndex((c) => c === myCity) === -1 ? 0 : CITIES.findIndex((c) => c === myCity));
  const [rankMode, setRankMode] = useState<RankMode>("botm");
  const [showDropdown, setShowDropdown] = useState(false);
  const [eloPeriod, setEloPeriod] = useState<EloTimePeriod>("alltime");
  const [showFormula, setShowFormula] = useState(false);
  const [showFairnessFormula, setShowFairnessFormula] = useState(false);
  const [showEloFormula, setShowEloFormula] = useState(false);
  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const bottomPadding = Platform.OS === "web" ? 34 : insets.bottom;

  const cityName = CITIES[city];
  const livePotm = city === 0 ? potmBangkok : potmBali;
  const liveElo = city === 0 ? eloBangkok : eloBali;
  const activePotm = livePotm.length > 0 ? livePotm : POTM_ENTRIES;
  const allPlayers = livePlayers.length > 0 ? livePlayers : PLAYERS;

  const showCityTabs = true;

  const championEntries: PotmEntry[] = [...allPlayers]
    .sort((a, b) => getFairnessScore(b) - getFairnessScore(a))
    .slice(0, 50)
    .map((p, i) => ({
      rank: i + 1,
      player: p,
      potmScore: getFairnessScore(p),
      gamesPlayed: p.gamesPlayed,
      wins: p.gamesWon,
      avgSkillRating: p.avgSportsmanshipRating,
    }));

  const sortedEntries: PotmEntry[] = rankMode === "champion"
    ? championEntries
    : rankMode === "botm"
    ? [...activePotm].sort((a, b) => b.potmScore - a.potmScore)
    : eloPeriod === "month"
      ? liveElo.length > 0
        ? [...liveElo].sort((a, b) => (b.player.eloGainThisMonth ?? 0) - (a.player.eloGainThisMonth ?? 0)).map((e, i) => ({ ...e, rank: i + 1 }))
        : [...activePotm].sort((a, b) => (b.player.eloGainThisMonth ?? 0) - (a.player.eloGainThisMonth ?? 0)).map((e, i) => ({ ...e, rank: i + 1 }))
      : liveElo.length > 0
        ? [...liveElo].sort((a, b) => b.player.eloRating - a.player.eloRating).map((e, i) => ({ ...e, rank: i + 1 }))
        : [...activePotm].sort((a, b) => b.player.eloRating - a.player.eloRating).map((e, i) => ({ ...e, rank: i + 1 }));

  const top3 = sortedEntries.slice(0, 3);
  const rest = sortedEntries.slice(3);

  const now = new Date();
  const month = now.toLocaleString("en-US", { month: "long" }).toUpperCase();
  const year = now.getFullYear();

  return (
    <View style={[styles.container, { paddingTop: topPadding }]}>
      <FlatList
        data={rest}
        keyExtractor={(item) => item.player.id}
        renderItem={({ item }) => (
          <RankRow entry={item} isCurrentUser={item.player.id === (currentPlayer?.id ?? "p0")} mode={rankMode} eloPeriod={eloPeriod} />
        )}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.listContent, { paddingBottom: bottomPadding + 90 }]}
        ListHeaderComponent={
          <>
            <View style={styles.topBar}>
              <Text style={styles.cityLabel}>{cityName.toUpperCase()}</Text>
              <BallrLogo />
              <Pressable style={styles.bellBtn} onPress={() => router.push("/notifications")}>
                <Ionicons name="notifications-outline" size={20} color={Colors.muted} />
              </Pressable>
            </View>

            <View style={{ paddingHorizontal: 16, marginBottom: 4 }}>
              <Pressable
                style={styles.dropdownBtn}
                onPress={() => setShowDropdown((v) => !v)}
              >
                <Text style={styles.dropdownBtnText}>
                  {DROPDOWN_OPTIONS.find((o) => o.id === rankMode)?.icon}{" "}
                  {DROPDOWN_OPTIONS.find((o) => o.id === rankMode)?.label}
                </Text>
                <Ionicons name={showDropdown ? "chevron-up" : "chevron-down"} size={16} color={Colors.muted} />
              </Pressable>
              {showDropdown && (
                <View style={styles.dropdownMenu}>
                  {DROPDOWN_OPTIONS.map((opt) => (
                    <Pressable
                      key={opt.id}
                      style={[styles.dropdownItem, rankMode === opt.id && styles.dropdownItemActive]}
                      onPress={() => { setRankMode(opt.id); setShowDropdown(false); }}
                    >
                      <Text style={styles.dropdownItemIcon}>{opt.icon}</Text>
                      <Text style={[styles.dropdownItemText, rankMode === opt.id && styles.dropdownItemTextActive]}>
                        {opt.label}
                      </Text>
                      {rankMode === opt.id && <Ionicons name="checkmark" size={14} color={Colors.accent} />}
                    </Pressable>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.monthHeader}>
              <Text style={styles.monthSub}>
                {rankMode === "botm" ? "BALLER OF THE MONTH" : rankMode === "champion" ? "COMMUNITY CHAMPION" : "ELO RANKINGS"}
              </Text>
              <Text style={styles.monthTitle}>{rankMode === "botm" ? `${month} ${year}` : rankMode === "champion" ? `${month} ${year}` : "Rankings"}</Text>
            </View>

            {rankMode === "champion" && (
              <View style={styles.championInfoCard}>
                <Text style={styles.championInfoTitle}>Monthly Fairness Award</Text>
                <Text style={styles.championInfoDesc}>
                  Players with the highest reliability & sportsmanship scores earn free game credits each month.
                </Text>
                <View style={styles.championRewards}>
                  {[
                    { rank: "🥇 1st Place", reward: "3 free games" },
                    { rank: "🥈 2nd Place", reward: "2 free games" },
                    { rank: "🥉 3rd Place", reward: "1 free game" },
                    { rank: "Top 10% (≥95)", reward: "1 free game each" },
                  ].map((r, i) => (
                    <View key={i} style={styles.championRewardRow}>
                      <Text style={styles.championRewardRank}>{r.rank}</Text>
                      <View style={styles.championRewardChip}>
                        <Ionicons name="gift-outline" size={11} color={Colors.amber} />
                        <Text style={styles.championRewardText}>{r.reward}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {rankMode === "elo" && (
              <View style={styles.eloPeriodRow}>
                {([
                  { id: "alltime", label: "Ranking" },
                  { id: "month", label: "ELO Gainers" },
                ] as { id: EloTimePeriod; label: string }[]).map((p) => (
                  <Pressable
                    key={p.id}
                    style={[styles.eloPeriodBtn, eloPeriod === p.id && styles.eloPeriodBtnActive]}
                    onPress={() => setEloPeriod(p.id)}
                  >
                    <Text style={[styles.eloPeriodBtnText, eloPeriod === p.id && styles.eloPeriodBtnTextActive]}>
                      {p.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}

            {rankMode === "botm" && (
              <Pressable
                style={styles.formulaToggle}
                onPress={() => setShowFormula((v) => !v)}
              >
                <Ionicons name="information-circle-outline" size={14} color={Colors.muted} />
                <Text style={styles.formulaToggleText}>How is Baller of the Month calculated?</Text>
                <Ionicons
                  name={showFormula ? "chevron-up" : "chevron-down"}
                  size={13}
                  color={Colors.muted}
                />
              </Pressable>
            )}

            {showFormula && (
              <View style={styles.formulaCard}>
                <Text style={styles.formulaTitle}>Baller of the Month Score</Text>
                <Text style={styles.formulaDesc}>
                  A composite monthly score calculated from three factors:
                </Text>
                <View style={styles.formulaRows}>
                  <View style={styles.formulaRow}>
                    <View style={[styles.formulaDot, { backgroundColor: Colors.accent }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.formulaFactor}>Win Rate</Text>
                      <Text style={styles.formulaWeight}>40% of score</Text>
                    </View>
                    <Text style={styles.formulaPct}>40%</Text>
                  </View>
                  <View style={styles.formulaRow}>
                    <View style={[styles.formulaDot, { backgroundColor: Colors.blue }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.formulaFactor}>ELO Rating Improvement</Text>
                      <Text style={styles.formulaWeight}>Monthly ELO gain vs. previous month</Text>
                    </View>
                    <Text style={styles.formulaPct}>30%</Text>
                  </View>
                  <View style={styles.formulaRow}>
                    <View style={[styles.formulaDot, { backgroundColor: Colors.purple }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.formulaFactor}>Community Quality & Reliability</Text>
                      <Text style={styles.formulaWeight}>Peer ratings + attendance record</Text>
                    </View>
                    <Text style={styles.formulaPct}>30%</Text>
                  </View>
                </View>
                <Text style={styles.formulaNote}>
                  Community ratings are factored in but not shown publicly. Rankings update monthly.
                </Text>
              </View>
            )}

            {rankMode === "champion" && (
              <Pressable
                style={styles.formulaToggle}
                onPress={() => setShowFairnessFormula((v) => !v)}
              >
                <Ionicons name="information-circle-outline" size={14} color={Colors.muted} />
                <Text style={styles.formulaToggleText}>How is the Fairness Award calculated?</Text>
                <Ionicons name={showFairnessFormula ? "chevron-up" : "chevron-down"} size={13} color={Colors.muted} />
              </Pressable>
            )}

            {rankMode === "champion" && showFairnessFormula && (
              <View style={styles.formulaCard}>
                <Text style={styles.formulaTitle}>Fairness Award Score</Text>
                <Text style={styles.formulaDesc}>
                  A composite score rewarding reliable, sportsmanlike players:
                </Text>
                <View style={styles.formulaRows}>
                  <View style={styles.formulaRow}>
                    <View style={[styles.formulaDot, { backgroundColor: Colors.accent }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.formulaFactor}>📊 Reliability Score</Text>
                      <Text style={styles.formulaWeight}>Game attendance & credits paid</Text>
                    </View>
                    <Text style={styles.formulaPct}>40%</Text>
                  </View>
                  <View style={styles.formulaRow}>
                    <View style={[styles.formulaDot, { backgroundColor: Colors.blue }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.formulaFactor}>🤝 Sportsmanship Rating</Text>
                      <Text style={styles.formulaWeight}>Community feedback from teammates</Text>
                    </View>
                    <Text style={styles.formulaPct}>40%</Text>
                  </View>
                  <View style={styles.formulaRow}>
                    <View style={[styles.formulaDot, { backgroundColor: Colors.red }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.formulaFactor}>✅ Fair Play Record</Text>
                      <Text style={styles.formulaWeight}>Penalty for no-shows</Text>
                    </View>
                    <Text style={styles.formulaPct}>-20%</Text>
                  </View>
                </View>
                <Text style={styles.formulaNote}>
                  Higher scores = Higher fairness ranking. Top 10 earns free game credits each month.
                </Text>
              </View>
            )}

            {rankMode === "elo" && (
              <Pressable
                style={styles.formulaToggle}
                onPress={() => setShowEloFormula((v) => !v)}
              >
                <Ionicons name="information-circle-outline" size={14} color={Colors.muted} />
                <Text style={styles.formulaToggleText}>How does ELO rating work?</Text>
                <Ionicons
                  name={showEloFormula ? "chevron-up" : "chevron-down"}
                  size={13}
                  color={Colors.muted}
                />
              </Pressable>
            )}

            {rankMode === "elo" && showEloFormula && (
              <View style={styles.formulaCard}>
                <Text style={styles.formulaTitle}>ELO Rating System</Text>
                <Text style={styles.formulaDesc}>
                  ELO measures your relative skill level based on match outcomes:
                </Text>
                <View style={styles.formulaRows}>
                  <View style={styles.formulaRow}>
                    <View style={[styles.formulaDot, { backgroundColor: Colors.accent }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.formulaFactor}>Starting ELO</Text>
                      <Text style={styles.formulaWeight}>All new players begin at 1000 ELO</Text>
                    </View>
                  </View>
                  <View style={styles.formulaRow}>
                    <View style={[styles.formulaDot, { backgroundColor: Colors.blue }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.formulaFactor}>Win vs stronger team</Text>
                      <Text style={styles.formulaWeight}>+15 to +32 ELO depending on gap</Text>
                    </View>
                  </View>
                  <View style={styles.formulaRow}>
                    <View style={[styles.formulaDot, { backgroundColor: Colors.red }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.formulaFactor}>Loss vs weaker team</Text>
                      <Text style={styles.formulaWeight}>-15 to -32 ELO depending on gap</Text>
                    </View>
                  </View>
                  <View style={styles.formulaRow}>
                    <View style={[styles.formulaDot, { backgroundColor: Colors.muted }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.formulaFactor}>Privacy</Text>
                      <Text style={styles.formulaWeight}>ELO is hidden for bottom 30% until calibrated</Text>
                    </View>
                  </View>
                </View>
                <Text style={styles.formulaNote}>
                  This Month view ranks players by ELO gained this month. All Time ranks by current ELO.
                </Text>
              </View>
            )}

            {showCityTabs && (
              <View style={styles.cityTabs}>
                {CITIES.map((c, i) => (
                  <Pressable
                    key={c}
                    style={[styles.cityTab, city === i && styles.cityTabActive]}
                    onPress={() => setCity(i)}
                  >
                    <Text style={[styles.cityTabText, city === i && styles.cityTabTextActive]}>
                      {c}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}

            <View style={styles.podiumContainer}>
              {top3.length >= 2 && <PodiumBlock entry={top3[1]} rank={top3[1].rank} />}
              {top3.length >= 1 && <PodiumBlock entry={top3[0]} rank={top3[0].rank} />}
              {top3.length >= 3 && <PodiumBlock entry={top3[2]} rank={top3[2].rank} />}
            </View>

            <View style={styles.listHeader}>
              <Text style={styles.listHeaderText}>
                {rankMode === "botm" ? "FULL RANKINGS" : rankMode === "champion" ? "FAIRNESS RANKINGS" : eloPeriod === "month" ? "ELO GAIN THIS MONTH" : "ELO LADDER"}
              </Text>
              <View style={styles.listHeaderDivider} />
              <Text style={styles.listHeaderRight}>
                {rankMode === "botm" ? "PTS" : rankMode === "champion" ? "SCORE" : eloPeriod === "month" ? "+ELO" : "ELO"}
              </Text>
            </View>
          </>
        }
        ListFooterComponent={
          <View style={styles.gotmCard}>
            <View style={styles.gotmBadgeRow}>
              <View style={styles.gotmComingSoonBadge}>
                <Text style={styles.gotmComingSoonText}>COMING SOON</Text>
              </View>
            </View>
            <Text style={styles.gotmTitle}>⚽ Goal of the Month</Text>
            <Text style={styles.gotmDesc}>
              Nominate and vote on the best goals each month — featuring Pixelot match footage, timestamps, and community voting. Launching soon!
            </Text>
            <View style={styles.gotmPreviewRow}>
              {["🥇 127 nominations", "🥈 89 nominations", "🥉 54 nominations"].map((t, i) => (
                <View key={i} style={styles.gotmPreviewChip}>
                  <Text style={styles.gotmPreviewChipText}>{t}</Text>
                </View>
              ))}
            </View>
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
    paddingBottom: 12,
  },
  cityLabel: { fontFamily: "Inter_600SemiBold", fontSize: 11, color: Colors.muted, letterSpacing: 1.5 },
  logoText: { fontFamily: "Inter_700Bold", fontSize: 18, color: Colors.text, letterSpacing: 3 },
  bellBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  monthHeader: { alignItems: "center", paddingBottom: 10, gap: 4 },
  monthSub: { fontFamily: "Inter_600SemiBold", fontSize: 10, color: Colors.muted, letterSpacing: 2.5 },
  monthTitle: { fontFamily: "Inter_700Bold", fontSize: 34, color: Colors.text, letterSpacing: -1 },
  cityTabs: {
    flexDirection: "row",
    marginHorizontal: 16,
    backgroundColor: Colors.surface,
    borderRadius: 10,
    padding: 3,
    marginBottom: 24,
  },
  cityTab: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: "center" },
  cityTabActive: { backgroundColor: Colors.primary },
  cityTabText: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: Colors.muted },
  cityTabTextActive: { color: Colors.text },
  podiumContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    marginBottom: 28,
    gap: 6,
  },
  podiumItem: { flex: 1, alignItems: "center" },
  podiumItemCenter: { flex: 1.3 },
  podiumMeta: { alignItems: "center", paddingBottom: 8, gap: 2 },
  podiumMedal: { fontSize: 20, marginBottom: 2 },
  winnerBadge: {
    backgroundColor: `${Colors.accent}22`,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: `${Colors.accent}44`,
    marginBottom: 2,
  },
  winnerBadgeText: { fontFamily: "Inter_700Bold", fontSize: 7, color: Colors.accent, letterSpacing: 1 },
  podiumAvatar: { alignItems: "center", justifyContent: "center" },
  podiumAvatarInitials: { fontFamily: "Inter_700Bold", color: Colors.text },
  podiumName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: Colors.text,
    textAlign: "center",
    marginTop: 2,
  },
  podiumScore: { fontFamily: "Inter_700Bold", fontSize: 20 },
  podiumScoreLabel: { fontFamily: "Inter_400Regular", fontSize: 9, color: Colors.muted },
  podiumBlock: { width: "100%", borderRadius: 6, alignItems: "center", justifyContent: "center" },
  podiumRankNum: { fontFamily: "Inter_700Bold", fontSize: 13, marginTop: 4 },
  rankModeRow: { flexDirection: "row", gap: 10, marginHorizontal: 16, marginBottom: 20 },
  rankModeBtn: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: "center",
    gap: 2,
    borderWidth: 1,
    borderColor: Colors.separator,
  },
  rankModeBtnActive: { backgroundColor: `${Colors.primary}33`, borderColor: Colors.accent },
  rankModeBtnText: { fontFamily: "Inter_700Bold", fontSize: 14, color: Colors.muted },
  rankModeBtnTextActive: { color: Colors.accent },
  rankModeBtnSub: { fontFamily: "Inter_400Regular", fontSize: 10, color: Colors.muted },
  dropdownBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: Colors.overlay,
  },
  dropdownBtnText: { fontFamily: "Inter_700Bold", fontSize: 15, color: Colors.text },
  dropdownMenu: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.overlay,
    overflow: "hidden",
    marginBottom: 8,
  },
  dropdownItem: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: Colors.overlay,
  },
  dropdownItemActive: { backgroundColor: `${Colors.primary}22` },
  dropdownItemIcon: { fontSize: 16 },
  dropdownItemText: { flex: 1, fontFamily: "Inter_500Medium", fontSize: 14, color: Colors.muted },
  dropdownItemTextActive: { color: Colors.accent, fontFamily: "Inter_600SemiBold" },
  eloPeriodRow: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: Colors.surface,
    borderRadius: 10,
    padding: 3,
  },
  eloPeriodBtn: { flex: 1, paddingVertical: 7, borderRadius: 8, alignItems: "center" },
  eloPeriodBtnActive: { backgroundColor: Colors.primary },
  eloPeriodBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 12, color: Colors.muted },
  eloPeriodBtnTextActive: { color: Colors.text },
  formulaToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginHorizontal: 16,
    marginBottom: 10,
    paddingVertical: 8,
  },
  formulaToggleText: { flex: 1, fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.muted },
  formulaCard: {
    backgroundColor: Colors.surface,
    marginHorizontal: 16,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.separator,
  },
  formulaTitle: { fontFamily: "Inter_700Bold", fontSize: 13, color: Colors.text },
  formulaDesc: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.muted },
  formulaRows: { gap: 10 },
  formulaRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  formulaDot: { width: 8, height: 8, borderRadius: 4, marginTop: 4, flexShrink: 0 },
  formulaFactor: { fontFamily: "Inter_600SemiBold", fontSize: 12, color: Colors.text },
  formulaWeight: { fontFamily: "Inter_400Regular", fontSize: 11, color: Colors.muted },
  formulaPct: { fontFamily: "Inter_700Bold", fontSize: 14, color: Colors.accent, minWidth: 36, textAlign: "right" },
  formulaNote: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: Colors.muted,
    fontStyle: "italic",
    lineHeight: 16,
  },
  listHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 10,
  },
  listHeaderText: { fontFamily: "Inter_700Bold", fontSize: 10, color: Colors.muted, letterSpacing: 2 },
  listHeaderDivider: { flex: 1, height: 1, backgroundColor: Colors.separator },
  listHeaderRight: { fontFamily: "Inter_600SemiBold", fontSize: 9, color: Colors.muted, letterSpacing: 1 },
  listContent: { paddingHorizontal: 16 },
  rankRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 11,
    marginBottom: 7,
    gap: 10,
  },
  rankRowCurrent: {
    borderWidth: 1,
    borderColor: `${Colors.accent}44`,
    backgroundColor: `${Colors.primary}18`,
  },
  rankNum: { fontFamily: "Inter_700Bold", fontSize: 13, width: 26, textAlign: "right", color: Colors.muted },
  rankAvatar: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  rankAvatarText: { fontFamily: "Inter_700Bold", fontSize: 13, color: Colors.text },
  rankInfo: { flex: 1, gap: 2 },
  rankName: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: Colors.text },
  rankSub: { fontFamily: "Inter_400Regular", fontSize: 10, color: Colors.muted },
  rankElo: { fontFamily: "Inter_600SemiBold", fontSize: 12, color: Colors.text, minWidth: 35, textAlign: "right" },
  rankScore: { fontFamily: "Inter_700Bold", fontSize: 13, minWidth: 30, textAlign: "right" },
  fairnessTopChip: {
    backgroundColor: `${Colors.accent}22`,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  fairnessTopChipText: { fontFamily: "Inter_700Bold", fontSize: 7, color: Colors.accent, letterSpacing: 0.5 },
  championInfoCard: {
    marginHorizontal: 16,
    backgroundColor: `${Colors.teal}18`,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: `${Colors.teal}44`,
    marginBottom: 20,
    gap: 10,
  },
  championInfoTitle: { fontFamily: "Inter_700Bold", fontSize: 14, color: Colors.text },
  championInfoDesc: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.muted, lineHeight: 18 },
  championRewards: { gap: 8 },
  championRewardRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  championRewardRank: { fontFamily: "Inter_500Medium", fontSize: 12, color: Colors.text },
  championRewardChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: `${Colors.amber}22`,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  championRewardText: { fontFamily: "Inter_600SemiBold", fontSize: 11, color: Colors.amber },
  gotmCard: {
    margin: 16,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.separator,
    gap: 10,
  },
  gotmBadgeRow: { flexDirection: "row" },
  gotmComingSoonBadge: {
    backgroundColor: `${Colors.purple}22`,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: `${Colors.purple}44`,
  },
  gotmComingSoonText: { fontFamily: "Inter_700Bold", fontSize: 9, color: Colors.purple, letterSpacing: 1.5 },
  gotmTitle: { fontFamily: "Inter_700Bold", fontSize: 18, color: Colors.text },
  gotmDesc: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.muted, lineHeight: 18 },
  gotmPreviewRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  gotmPreviewChip: {
    backgroundColor: Colors.overlay,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  gotmPreviewChipText: { fontFamily: "Inter_500Medium", fontSize: 11, color: Colors.muted },
});
