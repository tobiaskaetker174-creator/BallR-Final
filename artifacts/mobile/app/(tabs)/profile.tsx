import { Ionicons, Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import WebImage from "@/components/WebImage";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import {
  PLAYERS,
  ELO_HISTORY,
  NOTIFICATIONS,
  PROFILE_REVIEWS,
  WALLET_BALANCE,
  WALLET_ENTRIES,
  WalletEntry,
  FOLLOWED_PLAYER_IDS,
  Crew,
  getEloLabel,
  getReliabilityColor,
  getReliabilityLabel,
  formatTimestamp,
  isEloPublic,
  getEloPercentile,
  CALIBRATION_GAMES,
  getEloBadgeTier,
} from "@/constants/mock";
import { useAuth } from "@/context/AuthContext";
import { useBallrData } from "@/context/BallrDataContext";
import { fetchCrews, fetchPlayerCrews } from "@/lib/ballrApi";
import BallrLogo from "@/components/BallrLogo";

const FOOT_LABEL: Record<string, string> = { left: "Left foot", right: "Right foot", both: "Both feet" };
const FOOT_ICON: Record<string, string> = { left: "🦶L", right: "🦶R", both: "⚡" };

const POSITIONS_LABELS: Record<string, string> = {
  GK: "Goalkeeper",
  DEF: "Defender",
  MID: "Midfielder",
  FWD: "Forward",
};

const AVG_ELO = Math.round(PLAYERS.reduce((s, p) => s + p.eloRating, 0) / PLAYERS.length);
const RANGE_MIN = 600;
const RANGE_MAX = 1800;

function BigAvatar({ name, size = 90, imageUri, ringColor, showBadgeIcon }: { name: string; size?: number; imageUri?: string | null; ringColor?: string; showBadgeIcon?: string }) {
  const initials = name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
  const outerSize = size + 8;
  return (
    <View style={[styles.bigAvatarOuter, { width: outerSize, height: outerSize, borderRadius: outerSize / 2 }, ringColor ? { borderColor: ringColor, borderWidth: 3 } : undefined]}>
      {imageUri ? (
        <WebImage uri={imageUri} style={[styles.bigAvatarInner, { width: size, height: size, borderRadius: size / 2 }]} />
      ) : (
        <View style={[styles.bigAvatarInner, { width: size, height: size, borderRadius: size / 2 }]}>
          <Text style={[styles.bigAvatarInitials, { fontSize: size * 0.36 }]}>{initials}</Text>
        </View>
      )}
      {showBadgeIcon ? (
        <View style={styles.badgeTierIcon}>
          <Text style={{ fontSize: 14 }}>{showBadgeIcon}</Text>
        </View>
      ) : null}
    </View>
  );
}

function StatBox({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <View style={styles.statBox}>
      <Text style={[styles.statBoxValue, color ? { color } : {}]}>{value}</Text>
      {sub && <Text style={styles.statBoxSub}>{sub}</Text>}
      <Text style={styles.statBoxLabel}>{label}</Text>
    </View>
  );
}

function InfoRowItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRowItem}>
      <Text style={styles.infoRowLabel}>{label}</Text>
      <Text style={styles.infoRowValue}>{value}</Text>
    </View>
  );
}

function EloRangeVisual({
  currentElo,
  onInfoPress,
  allPlayers,
}: {
  currentElo: number;
  onInfoPress: () => void;
  allPlayers?: import("@/constants/mock").Player[];
}) {
  const playerPool = allPlayers && allPlayers.length > 0 ? allPlayers : PLAYERS;
  const avgElo = Math.round(playerPool.reduce((s, p) => s + p.eloRating, 0) / playerPool.length);
  const pct = Math.max(0, Math.min(1, (currentElo - RANGE_MIN) / (RANGE_MAX - RANGE_MIN)));
  const avgPct = Math.max(0, Math.min(1, (avgElo - RANGE_MIN) / (RANGE_MAX - RANGE_MIN)));
  const playersBelow = playerPool.filter((p) => p.eloRating < currentElo).length;
  const betterThanPct = playerPool.length > 1 ? Math.min(99, Math.max(0, Math.round((playersBelow / (playerPool.length - 1)) * 100))) : 0;
  const aboveAvg = currentElo >= avgElo;

  return (
    <View style={styles.eloRangeCard}>
      <View style={styles.eloRangeTitleRow}>
        <Text style={styles.eloRangeTitle}>YOUR ELO POSITION</Text>
        <Pressable onPress={onInfoPress} style={styles.eloInfoBtn}>
          <Ionicons name="information-circle-outline" size={16} color={Colors.muted} />
        </Pressable>
      </View>

      <View style={styles.eloRangeBarOuter}>
        <View style={[styles.eloRangeBarFill, { width: `${pct * 100}%` as `${number}%` }]} />
        <View style={[styles.eloAvgLine, { left: `${avgPct * 100}%` as `${number}%` }]} />
        <View style={[styles.eloRangeMarker, { left: `${Math.max(0, Math.min(96, pct * 100))}%` as `${number}%` }]} />
      </View>

      <View style={styles.eloRangeLabels}>
        <View style={[styles.eloAvgLabelBox, { left: `${avgPct * 100}%` as `${number}%` }]}>
          <Text style={styles.eloAvgLabelText}>Avg {avgElo}</Text>
        </View>
      </View>

      <View style={styles.eloRangeBottom}>
        <Text style={styles.eloRangeYouText}>
          {aboveAvg ? "▲" : "▼"} {currentElo} ELO · {aboveAvg ? "Above" : "Below"} average
        </Text>
        <Text style={styles.eloRangePercent}>Your ELO is better than {betterThanPct}% of players</Text>
      </View>
    </View>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, isLoggedIn, logout, updateProfile } = useAuth();
  const { currentPlayer, players: apiPlayers, eloHistory: liveEloHistory, notifications: liveNotifications } = useBallrData();
  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const bottomPadding = Platform.OS === "web" ? 34 : insets.bottom;
  const ME = user ?? currentPlayer ?? PLAYERS[0];
  const [showReviews, setShowReviews] = useState(false);
  const [showEloInfo, setShowEloInfo] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editBio, setEditBio] = useState(ME.bio ?? "");
  const [editPositions, setEditPositions] = useState<string[]>([...ME.preferredPositions]);
  const [editFootPreference, setEditFootPreference] = useState<"left" | "right" | "both">(ME.footPreference ?? "right");
  const [localAvatarUri, setLocalAvatarUri] = useState<string | null>(null);
  const [localBannerUri, setLocalBannerUri] = useState<string | null>(null);
  const [myCrews, setMyCrews] = useState<Crew[]>([]);

  React.useEffect(() => {
    if (ME?.id) {
      fetchPlayerCrews(ME.id)
        .then((crews) => setMyCrews(crews.slice(0, 5)))
        .catch(() => {
          // Fallback: fetch all crews if player-specific endpoint fails
          fetchCrews().then((crews) => setMyCrews(crews.slice(0, 5))).catch(() => {});
        });
    }
  }, [ME?.id]);

  const pickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      setLocalAvatarUri(result.assets[0].uri);
    }
  };

  const pickBanner = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      setLocalBannerUri(result.assets[0].uri);
    }
  };
  const activeNotifications = liveNotifications.length > 0 ? liveNotifications : NOTIFICATIONS;
  const unreadCount = activeNotifications.filter((n) => !n.read).length;
  const activeEloHistory = liveEloHistory.length > 0 ? liveEloHistory : ELO_HISTORY;

  const allPlayersForRanking = apiPlayers.length > 0 ? apiPlayers : PLAYERS;
  const eloPublic = isEloPublic(ME, allPlayersForRanking);
  const eloTier = getEloLabel(ME.eloRating, ME, allPlayersForRanking);
  const reliabilityColor = getReliabilityColor(ME.reliabilityScore);
  const reliabilityLabel = getReliabilityLabel(ME.reliabilityScore);
  const calibrationGamesLeft = Math.max(0, CALIBRATION_GAMES - ME.gamesPlayed);
  const badgeTier = getEloBadgeTier(ME, allPlayersForRanking);
  const winRate = ME.gamesPlayed > 0 ? Math.round((ME.gamesWon / ME.gamesPlayed) * 100) : 0;
  const acceptedReviews = PROFILE_REVIEWS.filter((r) => r.status === "accepted");
  const pendingReviews = PROFILE_REVIEWS.filter((r) => r.status === "pending");

  if (!isLoggedIn) {
    return (
      <View style={[styles.container, { paddingTop: topPadding }]}>
        <View style={styles.headerRow}>
          <Text style={styles.cityLabel}>BANGKOK</Text>
          <BallrLogo />
          <View style={{ width: 36 }} />
        </View>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 40, gap: 14 }}>
          <Ionicons name="person-circle-outline" size={52} color={Colors.muted} style={{ marginBottom: 8 }} />
          <Text style={{ fontFamily: "Inter_700Bold", fontSize: 22, color: Colors.text, textAlign: "center" }}>Your Profile</Text>
          <Text style={{ fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.muted, textAlign: "center", lineHeight: 19 }}>
            Log in to view your profile, stats, ELO rating, and match history.
          </Text>
          <Pressable
            style={{ flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 13, borderRadius: 12, marginTop: 6 }}
            onPress={() => router.push("/auth")}
          >
            <Ionicons name="person-outline" size={16} color={Colors.text} />
            <Text style={{ fontFamily: "Inter_700Bold", fontSize: 14, color: Colors.text }}>Log In to BallR</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <>
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: bottomPadding + 90 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.header, { paddingTop: topPadding }]}>
        <View style={styles.headerRow}>
          <Text style={styles.cityLabel}>{ME.basedIn?.toUpperCase() ?? "BANGKOK"}</Text>
          <BallrLogo />
          <View style={styles.headerIconGroup}>
            <Pressable style={styles.iconBtn} onPress={() => router.push("/wallet")}>
              <Ionicons name="wallet-outline" size={20} color={Colors.muted} />
            </Pressable>
            <Pressable style={styles.iconBtn} onPress={() => router.push("/notifications")}>
              <Ionicons name="notifications-outline" size={20} color={Colors.muted} />
              {unreadCount > 0 && (
                <View style={styles.bellBadge}>
                  <Text style={styles.bellBadgeText}>{unreadCount > 9 ? "9+" : unreadCount}</Text>
                </View>
              )}
            </Pressable>
          </View>
        </View>
      </View>

      <View style={styles.profileHero}>
        {/* Banner */}
        <View style={styles.bannerContainer}>
          {(localBannerUri ?? ME.bannerImageUrl) ? (
            <WebImage uri={(localBannerUri ?? ME.bannerImageUrl)!} style={styles.bannerImage} />
          ) : (
            <View style={styles.bannerPlaceholder} />
          )}
          <Pressable style={styles.bannerEditBtn} onPress={pickBanner}>
            <Ionicons name="image-outline" size={13} color={Colors.text} />
          </Pressable>
        </View>

        <View style={styles.avatarOverBanner}>
          <BigAvatar name={ME.name} size={90} imageUri={localAvatarUri ?? ME.profileImageUrl} ringColor={badgeTier?.ringColor} showBadgeIcon={badgeTier?.icon} />
          <Pressable style={styles.cameraBtn} onPress={pickAvatar}>
            <Ionicons name="camera-outline" size={14} color={Colors.text} />
          </Pressable>
        </View>

        <Text style={styles.profileName}>{ME.name}</Text>
        <View style={styles.profileSubRow}>
          <Text style={styles.profileSub}>{ME.nationality}</Text>
          <Text style={styles.profileSubDot}>·</Text>
          <Text style={styles.profileSub}>{ME.basedIn}</Text>
        </View>

        {ME.medal && (
          <Pressable
            style={({ pressed }) => [styles.medalBadge, pressed && { opacity: 0.75 }]}
            onPress={() => router.push("/achievements")}
          >
            <Text style={styles.medalIcon}>
              {ME.medal === "gold" ? "🥇" : ME.medal === "silver" ? "🥈" : "🥉"}
            </Text>
            <Text style={styles.medalText}>
              {ME.medal === "gold" ? "Gold" : ME.medal === "silver" ? "Silver" : "Bronze"} Baller
            </Text>
            <Ionicons name="chevron-forward" size={12} color={Colors.amber} />
          </Pressable>
        )}

        {ME.winStreak && ME.winStreak > 1 && (
          <View style={styles.streakBadge}>
            <Ionicons name="flame" size={13} color={Colors.amber} />
            <Text style={styles.streakText}>{ME.winStreak}-game win streak!</Text>
          </View>
        )}

        <View style={[styles.eloChip, { backgroundColor: `${eloTier.color}22`, flexDirection: "row", alignItems: "center", gap: 6 }]}>
          <Text style={[styles.eloChipText, { color: eloTier.color }]}>
            {ME.eloRating} ELO{eloTier.label ? ` · ${eloTier.tier} ${eloTier.label}` : ""}
          </Text>
          {!eloPublic && (
            <Ionicons name="lock-closed" size={11} color={Colors.muted} />
          )}
        </View>

        <Pressable
          style={styles.followingChip}
          onPress={() => router.push("/following")}
        >
          <Ionicons name="people-outline" size={13} color={Colors.teal} />
          <Text style={styles.followingChipText}>
            {FOLLOWED_PLAYER_IDS.size} Following
          </Text>
          <Ionicons name="chevron-forward" size={11} color={Colors.muted} />
        </Pressable>
      </View>

      {myCrews.length > 0 && (
        <View style={styles.myCrewsSection}>
          <Text style={styles.myCrewsSectionTitle}>MY CREWS</Text>
          {myCrews.map((crew) => (
            <Pressable
              key={crew.id}
              style={styles.myCrewCard}
              onPress={() => router.push({ pathname: "/crew/[id]", params: { id: crew.id } })}
            >
              <View style={[styles.myCrewColorDot, { backgroundColor: crew.primaryColor || Colors.primary }]} />
              <View style={styles.myCrewInfo}>
                <Text style={styles.myCrewName} numberOfLines={1}>{crew.name}</Text>
                <Text style={styles.myCrewSub}>{crew.memberCount} members · {crew.gameCount} games</Text>
              </View>
              <View style={styles.myCrewElo}>
                <Text style={styles.myCrewEloValue}>{crew.avgElo}</Text>
                <Text style={styles.myCrewEloLabel}>ELO</Text>
              </View>
            </Pressable>
          ))}
        </View>
      )}

      {ME.ballerScore !== undefined && (
        <View style={styles.ballerScoreCard}>
          <View style={styles.ballerScoreLeft}>
            <Text style={styles.ballerScoreLabel}>BALLR SCORE</Text>
            <Text style={styles.ballerScoreDesc}>Monthly composite rank — separate from ELO</Text>
          </View>
          <View style={styles.ballerScoreRight}>
            <Text style={styles.ballerScoreValue}>{ME.ballerScore}</Text>
            {ME.eloGainThisMonth !== undefined && (
              <Text style={[styles.ballerGain, { color: ME.eloGainThisMonth >= 0 ? Colors.accent : Colors.red }]}>
                {ME.eloGainThisMonth >= 0 ? "+" : ""}{ME.eloGainThisMonth} this month
              </Text>
            )}
          </View>
        </View>
      )}

      <View style={styles.statsRow}>
        <StatBox
          label="RELIABILITY"
          value={`${ME.reliabilityScore}%`}
          sub={reliabilityLabel}
          color={reliabilityColor}
        />
        <View style={styles.statDivider} />
        <StatBox
          label="GAMES PLAYED"
          value={`${ME.gamesPlayed}`}
          sub={`${ME.gamesWon}W · ${ME.gamesLost}L · ${ME.gamesDrawn}D`}
        />
        <View style={styles.statDivider} />
        <StatBox
          label="WIN RATE"
          value={`${winRate}%`}
          sub={ME.avgSportsmanshipRating.toFixed(1) + " ⭐ spirit"}
        />
      </View>

      {ME.gamesPlayed < CALIBRATION_GAMES && (
        <View style={styles.calibrationCard}>
          <View style={styles.calibrationHeader}>
            <Ionicons name="analytics-outline" size={16} color={Colors.accent} />
            <Text style={styles.calibrationTitle}>Calibration Period</Text>
          </View>
          <Text style={styles.calibrationSub}>
            Play {calibrationGamesLeft} more game{calibrationGamesLeft !== 1 ? "s" : ""} to unlock your full rating profile.
          </Text>
          <View style={styles.calibrationTrack}>
            <View style={[styles.calibrationFill, { width: `${Math.round((ME.gamesPlayed / CALIBRATION_GAMES) * 100)}%` as `${number}%` }]} />
          </View>
          <Text style={styles.calibrationCount}>{ME.gamesPlayed}/{CALIBRATION_GAMES} games</Text>
        </View>
      )}

      <EloRangeVisual currentElo={ME.eloRating} onInfoPress={() => setShowEloInfo(true)} allPlayers={allPlayersForRanking} />

      {ME.bio && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PLAYER BIO</Text>
          <Text style={styles.bioText}>{ME.bio}</Text>
        </View>
      )}

      <View style={styles.section}>
        <View style={styles.infoCard}>
          <InfoRowItem
            label="PREFERRED POSITION"
            value={ME.preferredPositions.map((p) => POSITIONS_LABELS[p] ?? p).join(", ")}
          />
          {ME.footPreference && (
            <>
              <View style={styles.infoSep} />
              <View style={styles.infoRowItem}>
                <Text style={styles.infoRowLabel}>FOOT</Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Text style={{ fontSize: 13 }}>{FOOT_ICON[ME.footPreference]}</Text>
                  <Text style={styles.infoRowValue}>{FOOT_LABEL[ME.footPreference]}</Text>
                </View>
              </View>
            </>
          )}
          <View style={styles.infoSep} />
          <InfoRowItem label="BASED IN" value={ME.basedIn} />
          <View style={styles.infoSep} />
          <InfoRowItem label="MEMBER SINCE" value={ME.memberSince} />
          {ME.favoriteTeam && (
            <>
              <View style={styles.infoSep} />
              <InfoRowItem label="FAVORITE TEAM" value={ME.favoriteTeam} />
            </>
          )}
          {ME.favoritePlayer && (
            <>
              <View style={styles.infoSep} />
              <InfoRowItem label="PLAYS LIKE" value={ME.favoritePlayer} />
            </>
          )}
          <View style={styles.infoSep} />
          <View style={styles.infoRowItem}>
            <Text style={styles.infoRowLabel}>RELIABILITY</Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <View style={[styles.reliabilityDot, { backgroundColor: reliabilityColor }]} />
              <Text style={[styles.infoRowValue, { color: reliabilityColor }]}>
                {ME.reliabilityScore}% · {reliabilityLabel}
              </Text>
            </View>
          </View>
          {ME.noShowCount > 0 && (
            <>
              <View style={styles.infoSep} />
              <InfoRowItem label="NO-SHOWS" value={`${ME.noShowCount} total`} />
            </>
          )}
        </View>
      </View>

      {(ME.instagram || ME.whatsapp) && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SOCIAL LINKS</Text>
          <View style={styles.socialRow}>
            {ME.instagram && (
              <View style={styles.socialChip}>
                <Ionicons name="logo-instagram" size={15} color={Colors.purple} />
                <Text style={[styles.socialText, { color: Colors.purple }]}>@{ME.instagram}</Text>
              </View>
            )}
            {ME.whatsapp && (
              <View style={styles.socialChip}>
                <Ionicons name="logo-whatsapp" size={15} color={Colors.accent} />
                <Text style={[styles.socialText, { color: Colors.accent }]}>{ME.whatsapp}</Text>
              </View>
            )}
          </View>
        </View>
      )}

      <View style={styles.section}>
        <Pressable
          style={styles.analyticsBtn}
          onPress={() => router.push("/analytics")}
        >
          <Ionicons name="bar-chart-outline" size={18} color={Colors.accent} />
          <View style={{ flex: 1 }}>
            <Text style={styles.analyticsBtnTitle}>My Analytics</Text>
            <Text style={styles.analyticsBtnSub}>Best teammates, rivals & personal stats</Text>
          </View>
          <Feather name="arrow-right" size={15} color={Colors.accent} />
        </Pressable>
      </View>

      {eloPublic && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ELO HISTORY (Last 10 Games)</Text>
          <View style={styles.eloChartWrapper}>
            <View style={styles.eloChart}>
              {activeEloHistory.map((entry, i) => {
                const allElos = activeEloHistory.map((e) => Math.min(e.eloBefore, e.eloAfter));
                const maxElo = Math.max(...activeEloHistory.map((e) => Math.max(e.eloBefore, e.eloAfter)));
                const minElo = Math.min(...allElos);
                const range = maxElo - minElo || 1;
                const heightPct = ((entry.eloAfter - minElo) / range) * 60 + 10;
                const barColor = entry.change > 0 ? Colors.accent : entry.change < 0 ? Colors.red : Colors.amber;
                return (
                  <View key={i} style={styles.eloBarCol}>
                    <View style={[styles.eloBar, { height: heightPct, backgroundColor: barColor }]} />
                    <Text style={styles.eloBarChange}>
                      {entry.change > 0 ? `+${entry.change}` : entry.change}
                    </Text>
                  </View>
                );
              })}
            </View>
            <View style={styles.eloChartLegend}>
              <View style={styles.eloLegendItem}>
                <View style={[styles.eloLegendDot, { backgroundColor: Colors.accent }]} />
                <Text style={styles.eloLegendText}>Win</Text>
              </View>
              <View style={styles.eloLegendItem}>
                <View style={[styles.eloLegendDot, { backgroundColor: Colors.red }]} />
                <Text style={styles.eloLegendText}>Loss</Text>
              </View>
              <View style={styles.eloLegendItem}>
                <View style={[styles.eloLegendDot, { backgroundColor: Colors.amber }]} />
                <Text style={styles.eloLegendText}>Draw</Text>
              </View>
            </View>
          </View>

          <View style={styles.eloHistoryList}>
            {activeEloHistory.slice(0, 5).map((entry, i) => (
              <View key={i} style={styles.eloHistoryRow}>
                <View style={[styles.eloHistoryDot, {
                  backgroundColor: entry.change > 0 ? Colors.accent : entry.change < 0 ? Colors.red : Colors.amber
                }]} />
                <Text style={styles.eloHistoryVenue} numberOfLines={1}>{entry.venueName}</Text>
                <Text style={[
                  styles.eloHistoryChange,
                  { color: entry.change > 0 ? Colors.accent : entry.change < 0 ? Colors.red : Colors.amber }
                ]}>
                  {entry.change > 0 ? `+${entry.change}` : entry.change}
                </Text>
                <Text style={styles.eloHistoryFinal}>{entry.eloAfter}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {acceptedReviews.length > 0 && (
        <View style={styles.section}>
          <View style={styles.reviewsHeader}>
            <Text style={styles.sectionTitle}>PLAYER REVIEWS</Text>
            {pendingReviews.length > 0 && (
              <Pressable
                style={styles.pendingBadge}
                onPress={() => router.push("/reviews")}
              >
                <Text style={styles.pendingBadgeText}>{pendingReviews.length} pending</Text>
              </Pressable>
            )}
          </View>
          {acceptedReviews.map((review) => (
            <View key={review.id} style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <View style={[styles.reviewAvatar, { backgroundColor: Colors.blue + "44" }]}>
                  <Text style={styles.reviewAvatarText}>
                    {review.author.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.reviewAuthor}>{review.author.name}</Text>
                  <Text style={styles.reviewTime}>{formatTimestamp(review.createdAt)}</Text>
                </View>
              </View>
              <Text style={styles.reviewText}>{review.text}</Text>
            </View>
          ))}
        </View>
      )}

      {isLoggedIn && (
        <View style={styles.section}>
          <View style={styles.walletCard}>
            <View style={styles.walletHeader}>
              <View style={styles.walletIconWrap}>
                <Ionicons name="wallet-outline" size={20} color={Colors.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.walletLabel}>BallR Wallet</Text>
                <Text style={styles.walletBalance}>฿{WALLET_BALANCE}</Text>
              </View>
              <Pressable
                style={styles.walletTopUpBtn}
                onPress={() => router.push("/wallet")}
              >
                <Ionicons name="add" size={14} color={Colors.text} />
                <Text style={styles.walletTopUpText}>Top Up</Text>
              </Pressable>
            </View>
            <View style={styles.walletDivider} />
            {WALLET_ENTRIES.slice(0, 4).map((entry: WalletEntry, i: number) => (
              <View
                key={entry.id}
                style={[
                  styles.walletEntry,
                  i < Math.min(WALLET_ENTRIES.length, 4) - 1 && { borderBottomWidth: 1, borderBottomColor: Colors.separator },
                ]}
              >
                <View style={styles.walletEntryIcon}>
                  <Ionicons
                    name={
                      entry.type === "game_payment" ? "football-outline" :
                      entry.type === "referral_credit" ? "people-outline" :
                      entry.type === "top_up" ? "add-circle-outline" : "gift-outline"
                    }
                    size={14}
                    color={entry.amount > 0 ? Colors.accent : Colors.muted}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.walletEntryLabel}>{entry.label}</Text>
                  <Text style={styles.walletEntryDate}>{entry.date}</Text>
                </View>
                <Text style={[
                  styles.walletEntryAmount,
                  { color: entry.amount > 0 ? Colors.accent : Colors.red },
                ]}>
                  {entry.amount > 0 ? `+฿${entry.amount}` : `-฿${Math.abs(entry.amount)}`}
                </Text>
              </View>
            ))}
            <Pressable
              style={styles.walletViewAll}
              onPress={() => router.push("/wallet")}
            >
              <Text style={styles.walletViewAllText}>View Full History</Text>
              <Feather name="arrow-right" size={12} color={Colors.muted} />
            </Pressable>
          </View>
        </View>
      )}

      {isLoggedIn ? (
        <View style={styles.section}>
          <Pressable style={styles.editBtn} onPress={() => setShowEditProfile(true)}>
            <Feather name="edit-2" size={14} color={Colors.accent} />
            <Text style={styles.editBtnText}>EDIT PROFILE</Text>
            <Feather name="arrow-right" size={14} color={Colors.accent} />
          </Pressable>
          <Pressable
            style={[styles.editBtn, { marginTop: 10 }]}
            onPress={() => router.push("/referral")}
          >
            <Ionicons name="people-outline" size={14} color={Colors.accent} />
            <Text style={styles.editBtnText}>REFER A FRIEND</Text>
            <Feather name="arrow-right" size={14} color={Colors.accent} />
          </Pressable>
          <Pressable style={[styles.editBtn, styles.logoutBtn, { marginTop: 10 }]} onPress={logout}>
            <Ionicons name="log-out-outline" size={14} color={Colors.muted} />
            <Text style={[styles.editBtnText, { color: Colors.muted }]}>LOG OUT</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.section}>
          <Pressable style={styles.loginPromptBtn} onPress={() => router.push("/auth")}>
            <Ionicons name="person-outline" size={16} color={Colors.text} />
            <Text style={styles.loginPromptBtnText}>Log In to Your Account</Text>
          </Pressable>
        </View>
      )}
    </ScrollView>

    <Modal
      visible={showEditProfile}
      transparent
      animationType="slide"
      onRequestClose={() => setShowEditProfile(false)}
    >
      <Pressable style={styles.eloModalOverlay} onPress={() => setShowEditProfile(false)}>
        <Pressable style={[styles.eloModalCard, { maxHeight: "80%" }]} onPress={(e) => e.stopPropagation()}>
          <View style={styles.eloModalHeader}>
            <Text style={styles.eloModalTitle}>Edit Profile</Text>
            <Pressable onPress={() => setShowEditProfile(false)}>
              <Ionicons name="close" size={20} color={Colors.muted} />
            </Pressable>
          </View>

          <Text style={[styles.eloModalRowLabel, { marginBottom: 8 }]}>PHOTOS</Text>
          <View style={{ flexDirection: "row", gap: 10, marginBottom: 16 }}>
            <Pressable
              style={styles.editPhotoBtn}
              onPress={pickAvatar}
            >
              {(localAvatarUri ?? ME.profileImageUrl) ? (
                <WebImage uri={(localAvatarUri ?? ME.profileImageUrl)!} style={{ width: 48, height: 48, borderRadius: 24 }} />
              ) : (
                <Ionicons name="person-circle-outline" size={32} color={Colors.muted} />
              )}
              <Text style={styles.editPhotoBtnLabel}>Change Photo</Text>
            </Pressable>
            <Pressable
              style={[styles.editPhotoBtn, { flex: 1 }]}
              onPress={pickBanner}
            >
              {(localBannerUri ?? ME.bannerImageUrl) ? (
                <WebImage uri={(localBannerUri ?? ME.bannerImageUrl)!} style={styles.bannerThumbImg} />
              ) : (
                <>
                  <Ionicons name="image-outline" size={22} color={Colors.muted} />
                  <Text style={styles.editPhotoBtnLabel}>Change Banner</Text>
                </>
              )}
            </Pressable>
          </View>

          <Text style={[styles.eloModalRowLabel, { marginBottom: 4 }]}>BIO</Text>
          <TextInput
            style={styles.editBioInput}
            value={editBio}
            onChangeText={setEditBio}
            placeholder="Add a short bio…"
            placeholderTextColor={Colors.muted}
            multiline
            numberOfLines={3}
          />

          <Text style={[styles.eloModalRowLabel, { marginTop: 14, marginBottom: 8 }]}>PREFERRED POSITIONS</Text>
          <View style={styles.editPositionsRow}>
            {["GK", "DEF", "MID", "FWD"].map((pos) => {
              const selected = editPositions.includes(pos);
              return (
                <Pressable
                  key={pos}
                  style={[styles.editPosChip, selected && styles.editPosChipSelected]}
                  onPress={() =>
                    setEditPositions((prev) =>
                      prev.includes(pos) ? prev.filter((p) => p !== pos) : [...prev, pos]
                    )
                  }
                >
                  <Text style={[styles.editPosChipText, selected && styles.editPosChipTextSelected]}>{pos}</Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={[styles.eloModalRowLabel, { marginTop: 16, marginBottom: 8 }]}>PREFERRED FOOT</Text>
          <View style={styles.editPositionsRow}>
            {(["left", "right", "both"] as const).map((foot) => {
              const selected = editFootPreference === foot;
              return (
                <Pressable
                  key={foot}
                  style={[styles.editPosChip, selected && styles.editPosChipSelected, { flex: 1 }]}
                  onPress={() => setEditFootPreference(foot)}
                >
                  <Text style={{ fontSize: 12, textAlign: "center" }}>{FOOT_ICON[foot]}</Text>
                  <Text style={[styles.editPosChipText, selected && styles.editPosChipTextSelected, { textTransform: "capitalize" }]}>
                    {foot}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Pressable
            style={styles.editSaveBtn}
            onPress={() => {
              updateProfile({
                bio: editBio,
                preferredPositions: editPositions,
                footPreference: editFootPreference,
                ...(localAvatarUri ? { profileImageUrl: localAvatarUri } : {}),
                ...(localBannerUri ? { bannerImageUrl: localBannerUri } : {}),
              });
              setShowEditProfile(false);
            }}
          >
            <Text style={styles.editSaveBtnText}>SAVE CHANGES</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>

    <Modal
      visible={showEloInfo}
      transparent
      animationType="fade"
      onRequestClose={() => setShowEloInfo(false)}
    >
      <Pressable style={styles.eloModalOverlay} onPress={() => setShowEloInfo(false)}>
        <Pressable style={styles.eloModalCard} onPress={(e) => e.stopPropagation()}>
          <View style={styles.eloModalHeader}>
            <Text style={styles.eloModalTitle}>How ELO Works</Text>
            <Pressable onPress={() => setShowEloInfo(false)}>
              <Ionicons name="close" size={20} color={Colors.muted} />
            </Pressable>
          </View>
          {[
            { icon: "flash-outline", label: "Starting ELO", value: "All new players begin at 1000 ELO." },
            { icon: "football-outline", label: "Calibration", value: `First ${CALIBRATION_GAMES} games are your calibration period. Play matches to unlock your public rating.` },
            { icon: "trending-up-outline", label: "Win vs stronger team", value: "+15 to +32 ELO depending on team strength gap." },
            { icon: "trending-down-outline", label: "Loss vs weaker team", value: "-15 to -32 ELO depending on team strength gap." },
            { icon: "remove-outline", label: "Win vs equal team", value: "+20 ELO. Draw vs equal team: ±0 ELO." },
            { icon: "close-circle-outline", label: "No-show penalty", value: "-30 ELO per missed game." },
            { icon: "lock-closed-outline", label: "Privacy", value: "ELO is public only if you rank above the bottom 30% of all players. Below that, only you can see your score." },
          ].map((row, i) => (
            <View key={i} style={styles.eloModalRow}>
              <View style={styles.eloModalRowIcon}>
                <Ionicons name={row.icon as any} size={16} color={Colors.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.eloModalRowLabel}>{row.label}</Text>
                <Text style={styles.eloModalRowValue}>{row.value}</Text>
              </View>
            </View>
          ))}
        </Pressable>
      </Pressable>
    </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.base },
  header: { paddingHorizontal: 16, paddingBottom: 8 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  cityLabel: { fontFamily: "Inter_600SemiBold", fontSize: 11, color: Colors.muted, letterSpacing: 1.5 },
  logoText: { fontFamily: "Inter_700Bold", fontSize: 18, color: Colors.text, letterSpacing: 3 },
  headerIconGroup: { flexDirection: "row", alignItems: "center", gap: 4 },
  iconBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center", position: "relative" },
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
  profileHero: { alignItems: "center", paddingBottom: 16, gap: 5 },
  bannerContainer: {
    width: "100%",
    height: 110,
    position: "relative",
    marginBottom: 0,
  },
  bannerImage: { width: "100%", height: 110 },
  bannerPlaceholder: {
    width: "100%",
    height: 110,
    backgroundColor: Colors.overlay,
  },
  bannerEditBtn: {
    position: "absolute",
    top: 8,
    right: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarOverBanner: {
    position: "relative",
    marginTop: -46,
  },
  cameraBtn: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Colors.base,
  },
  bigAvatarOuter: {
    borderWidth: 2,
    borderColor: Colors.accent,
    padding: 2,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
    position: "relative",
  },
  badgeTierIcon: {
    position: "absolute",
    bottom: -2,
    right: -2,
    backgroundColor: Colors.surface,
    borderRadius: 11,
    width: 22,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  bigAvatarInner: { backgroundColor: Colors.primary, alignItems: "center", justifyContent: "center" },
  bigAvatarInitials: { fontFamily: "Inter_700Bold", color: Colors.text },
  profileName: { fontFamily: "Inter_700Bold", fontSize: 26, color: Colors.text, letterSpacing: -0.5 },
  profileSubRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  profileSub: { fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.muted },
  profileSubDot: { color: Colors.muted },
  medalBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: `${Colors.amber}22`,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: `${Colors.amber}44`,
  },
  medalIcon: { fontSize: 16 },
  medalText: { fontFamily: "Inter_700Bold", fontSize: 11, color: Colors.amber },
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: `${Colors.amber}15`,
  },
  streakText: { fontFamily: "Inter_600SemiBold", fontSize: 11, color: Colors.amber },
  eloChip: {
    backgroundColor: `${Colors.primary}44`,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 999,
    marginTop: 2,
  },
  eloChipProtected: { backgroundColor: `${Colors.accent}22` },
  eloChipText: { fontFamily: "Inter_600SemiBold", fontSize: 12, color: Colors.accent },
  followingChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: `${Colors.teal}18`,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    marginTop: 2,
  },
  followingChipText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: Colors.teal,
  },
  ballerScoreCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: `${Colors.primary}22`,
    marginHorizontal: 16,
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: `${Colors.accent}33`,
  },
  ballerScoreLeft: { flex: 1, gap: 3 },
  ballerScoreLabel: { fontFamily: "Inter_700Bold", fontSize: 10, color: Colors.muted, letterSpacing: 1.5 },
  ballerScoreDesc: { fontFamily: "Inter_400Regular", fontSize: 11, color: Colors.muted },
  ballerScoreRight: { alignItems: "flex-end", gap: 2 },
  ballerScoreValue: { fontFamily: "Inter_700Bold", fontSize: 32, color: Colors.accent },
  ballerGain: { fontFamily: "Inter_600SemiBold", fontSize: 11 },
  statsRow: {
    flexDirection: "row",
    backgroundColor: Colors.surface,
    marginHorizontal: 16,
    borderRadius: 14,
    paddingVertical: 16,
    marginBottom: 16,
  },
  statBox: { flex: 1, alignItems: "center", gap: 2 },
  statBoxValue: { fontFamily: "Inter_700Bold", fontSize: 20, color: Colors.accent },
  statBoxSub: { fontFamily: "Inter_400Regular", fontSize: 9, color: Colors.muted },
  statBoxLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 9,
    color: Colors.muted,
    letterSpacing: 0.5,
    marginTop: 2,
    textAlign: "center",
  },
  statDivider: { width: 1, backgroundColor: Colors.separator, marginVertical: 4 },
  calibrationCard: {
    backgroundColor: `${Colors.primary}22`,
    marginHorizontal: 16,
    borderRadius: 14,
    padding: 14,
    gap: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: `${Colors.accent}33`,
  },
  calibrationHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  calibrationTitle: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: Colors.accent },
  calibrationSub: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.muted, lineHeight: 17 },
  calibrationTrack: { height: 6, backgroundColor: Colors.overlay, borderRadius: 999, overflow: "hidden" },
  calibrationFill: { height: 6, backgroundColor: Colors.accent, borderRadius: 999 },
  calibrationCount: { fontFamily: "Inter_400Regular", fontSize: 10, color: Colors.muted, textAlign: "right" },
  eloRangeCard: {
    backgroundColor: Colors.surface,
    marginHorizontal: 16,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    gap: 8,
  },
  eloRangeTitleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  eloRangeTitle: { fontFamily: "Inter_600SemiBold", fontSize: 9, color: Colors.muted, letterSpacing: 1.5 },
  eloInfoBtn: { padding: 2 },
  eloRangeBarOuter: {
    height: 8,
    backgroundColor: Colors.overlay,
    borderRadius: 999,
    overflow: "visible",
    position: "relative",
    marginTop: 4,
  },
  eloRangeBarFill: { height: 8, backgroundColor: `${Colors.accent}44`, borderRadius: 999 },
  eloAvgLine: {
    position: "absolute",
    top: -4,
    width: 2,
    height: 16,
    backgroundColor: Colors.muted,
    borderRadius: 1,
  },
  eloRangeMarker: {
    position: "absolute",
    top: -5,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.accent,
    marginLeft: -9,
    borderWidth: 2,
    borderColor: Colors.base,
  },
  eloRangeLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    position: "relative",
    marginTop: 6,
  },
  eloRangeLabelMin: { fontFamily: "Inter_400Regular", fontSize: 9, color: Colors.muted },
  eloRangeLabelMax: { fontFamily: "Inter_400Regular", fontSize: 9, color: Colors.muted },
  eloAvgLabelBox: {
    position: "absolute",
    alignItems: "center",
    top: 0,
    transform: [{ translateX: -20 }],
  },
  eloAvgLabelText: { fontFamily: "Inter_400Regular", fontSize: 9, color: Colors.muted },
  eloRangeBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  eloRangeYouText: { fontFamily: "Inter_700Bold", fontSize: 12, color: Colors.accent },
  eloRangePercent: { fontFamily: "Inter_400Regular", fontSize: 11, color: Colors.muted },
  eloModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  eloModalCard: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 20,
    width: "100%",
    gap: 0,
  },
  eloModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  eloModalTitle: { fontFamily: "Inter_700Bold", fontSize: 16, color: Colors.text },
  eloModalRow: {
    flexDirection: "row",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.separator,
  },
  eloModalRowIcon: {
    width: 30,
    height: 30,
    backgroundColor: `${Colors.accent}22`,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  eloModalRowLabel: { fontFamily: "Inter_600SemiBold", fontSize: 12, color: Colors.text, marginBottom: 2 },
  eloModalRowValue: { fontFamily: "Inter_400Regular", fontSize: 11, color: Colors.muted, lineHeight: 16 },
  section: { paddingHorizontal: 16, marginBottom: 16 },
  sectionTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 10,
    color: Colors.muted,
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  bioText: { fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.muted, lineHeight: 20 },
  infoCard: { backgroundColor: Colors.surface, borderRadius: 14, overflow: "hidden" },
  infoRowItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  infoRowLabel: { fontFamily: "Inter_500Medium", fontSize: 10, color: Colors.muted, letterSpacing: 0.5 },
  infoRowValue: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: Colors.text },
  reliabilityDot: { width: 8, height: 8, borderRadius: 4 },
  infoSep: { height: 1, backgroundColor: Colors.separator, marginHorizontal: 14 },
  socialRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  socialChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.separator,
  },
  socialText: { fontFamily: "Inter_500Medium", fontSize: 13 },
  analyticsBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: `${Colors.primary}22`,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: `${Colors.accent}33`,
  },
  analyticsBtnTitle: { fontFamily: "Inter_700Bold", fontSize: 14, color: Colors.accent },
  analyticsBtnSub: { fontFamily: "Inter_400Regular", fontSize: 11, color: Colors.muted },
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
  eloHistoryList: { backgroundColor: Colors.surface, borderRadius: 12, overflow: "hidden" },
  eloHistoryRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: Colors.separator,
    gap: 10,
  },
  eloHistoryDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  eloHistoryVenue: { flex: 1, fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.muted },
  eloHistoryChange: { fontFamily: "Inter_700Bold", fontSize: 12, minWidth: 36, textAlign: "right" },
  eloHistoryFinal: { fontFamily: "Inter_600SemiBold", fontSize: 12, color: Colors.text, minWidth: 36, textAlign: "right" },
  reviewsHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  pendingBadge: {
    backgroundColor: `${Colors.amber}22`,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: `${Colors.amber}44`,
  },
  pendingBadgeText: { fontFamily: "Inter_600SemiBold", fontSize: 11, color: Colors.amber },
  reviewCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 13,
    marginBottom: 8,
    gap: 8,
  },
  reviewHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  reviewAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  reviewAvatarText: { fontFamily: "Inter_700Bold", fontSize: 11, color: Colors.blue },
  reviewAuthor: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: Colors.text },
  reviewTime: { fontFamily: "Inter_400Regular", fontSize: 10, color: Colors.muted },
  reviewText: { fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.muted, lineHeight: 19 },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.surface,
    borderRadius: 10,
    paddingVertical: 13,
    borderWidth: 1,
    borderColor: `${Colors.accent}44`,
  },
  logoutBtn: { borderColor: Colors.separator },
  editBtnText: {
    fontFamily: "Inter_700Bold",
    fontSize: 11,
    color: Colors.accent,
    letterSpacing: 1.5,
    flex: 1,
    textAlign: "center",
  },
  loginPromptBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  loginPromptBtnText: { fontFamily: "Inter_700Bold", fontSize: 14, color: Colors.text },
  editBioInput: {
    backgroundColor: Colors.surface,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.separator,
    minHeight: 70,
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.text,
    lineHeight: 19,
    textAlignVertical: "top",
  },
  editPositionsRow: { flexDirection: "row", gap: 10, flexWrap: "wrap", marginBottom: 4 },
  editPosChip: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.separator,
    backgroundColor: Colors.surface,
  },
  editPosChipSelected: { backgroundColor: `${Colors.primary}44`, borderColor: Colors.accent },
  editPosChipText: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: Colors.muted },
  editPosChipTextSelected: { color: Colors.accent },
  editPhotoBtn: {
    width: 72,
    height: 72,
    backgroundColor: Colors.overlay,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.separator,
    gap: 4,
    overflow: "hidden",
  },
  editPhotoBtnLabel: { fontFamily: "Inter_400Regular", fontSize: 9, color: Colors.muted, textAlign: "center" },
  bannerThumbImg: { width: "100%", height: 48, borderRadius: 8 },
  editSaveBtn: {
    marginTop: 20,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  editSaveBtnText: { fontFamily: "Inter_700Bold", fontSize: 13, color: Colors.text, letterSpacing: 1.5 },
  walletCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: `${Colors.accent}33`,
  },
  walletHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
  },
  walletIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: `${Colors.primary}44`,
    alignItems: "center",
    justifyContent: "center",
  },
  walletLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    color: Colors.muted,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  walletBalance: {
    fontFamily: "Inter_700Bold",
    fontSize: 26,
    color: Colors.accent,
  },
  walletTopUpBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  walletTopUpText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: Colors.text,
  },
  walletDivider: {
    height: 1,
    backgroundColor: Colors.separator,
  },
  walletEntry: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  walletEntryIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.overlay,
    alignItems: "center",
    justifyContent: "center",
  },
  walletEntryLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.text,
    marginBottom: 1,
  },
  walletEntryDate: {
    fontFamily: "Inter_400Regular",
    fontSize: 10,
    color: Colors.muted,
  },
  walletEntryAmount: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
  },
  walletViewAll: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.separator,
  },
  walletViewAllText: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: Colors.muted,
  },
  myCrewsSection: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
  },
  myCrewsSectionTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 11,
    color: Colors.muted,
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  myCrewCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: 10,
    padding: 12,
    marginBottom: 6,
    gap: 10,
  },
  myCrewColorDot: {
    width: 8,
    height: 32,
    borderRadius: 4,
  },
  myCrewInfo: {
    flex: 1,
  },
  myCrewName: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: Colors.text,
  },
  myCrewSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: Colors.muted,
    marginTop: 2,
  },
  myCrewElo: {
    alignItems: "center",
  },
  myCrewEloValue: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: Colors.accent,
  },
  myCrewEloLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 9,
    color: Colors.muted,
    letterSpacing: 0.5,
  },
});
