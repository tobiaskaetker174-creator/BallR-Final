import { Ionicons, Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
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
  PROFILE_REVIEWS,
  FOLLOWED_PLAYER_IDS,
  Player,
  Position,
  getEloLabel,
  getReliabilityColor,
  getReliabilityLabel,
  formatTimestamp,
  isEloPublic,
  getEloPercentile,
  getEloBadgeTier,
  ALL_GAMES,
} from "@/constants/mock";
import { fetchPlayerById } from "@/lib/ballrApi";

const FOOT_LABEL: Record<string, string> = { left: "Left foot", right: "Right foot", both: "Both feet" };
const FOOT_ICON: Record<string, string> = { left: "🦶L", right: "🦶R", both: "⚡" };

/* ---------- Fake player generation for unknown IDs ---------- */
const FAKE_NAMES = [
  "James Wilson", "Dan Cooper", "Tom Harrington", "Alex Nguyen", "Chris Palmer",
  "Nick Fabian", "Oliver Chen", "Liam Scott", "Ben Taylor", "Sam Mitchell",
  "Jake Morrison", "Ryan Fletcher", "Luke Edwards", "Max Bennett", "Harry Clarke",
  "Leo Summers", "Kai Anderson", "Ethan Brooks", "Noah Price", "Finn Walker",
];
const FAKE_NATIONALITIES = [
  "British", "Australian", "American", "Canadian", "Dutch",
  "German", "Swedish", "French", "Irish", "South African",
];
const FAKE_POSITIONS: Position[][] = [
  ["MID"], ["FWD"], ["DEF"], ["GK"], ["MID", "FWD"], ["DEF", "MID"],
];
const FAKE_FEET: Array<"left" | "right" | "both"> = ["right", "right", "left", "both", "right", "right"];

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function generateFakePlayer(playerId: string): Player {
  const h = simpleHash(playerId);
  const name = FAKE_NAMES[h % FAKE_NAMES.length];
  const nationality = FAKE_NATIONALITIES[h % FAKE_NATIONALITIES.length];
  const positions = FAKE_POSITIONS[h % FAKE_POSITIONS.length];
  const foot = FAKE_FEET[h % FAKE_FEET.length];
  const elo = 900 + (h % 500);
  const gamesPlayed = 5 + (h % 46);
  const gamesWon = Math.round(gamesPlayed * (0.3 + (h % 40) / 100));
  const gamesLost = Math.round((gamesPlayed - gamesWon) * 0.7);
  const gamesDrawn = gamesPlayed - gamesWon - gamesLost;

  return {
    id: playerId,
    name,
    nationality,
    eloRating: elo,
    eloCalibrated: gamesPlayed >= 5,
    gamesPlayed,
    gamesWon,
    gamesLost,
    gamesDrawn,
    reliabilityScore: 70 + (h % 25),
    noShowCount: h % 3,
    avgSkillRating: 3.0 + ((h % 20) / 10),
    avgSportsmanshipRating: 3.5 + ((h % 15) / 10),
    preferredPositions: positions,
    footPreference: foot,
    bio: "Football enthusiast based in Bangkok.",
    basedIn: "Bangkok",
    memberSince: new Date(Date.now() - (30 + (h % 365)) * 86400000).toISOString(),
  };
}

export default function PlayerProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const bottomPadding = Platform.OS === "web" ? 34 : insets.bottom;

  const [apiPlayer, setApiPlayer] = useState<Player | null>(null);

  // Robust player lookup: PLAYERS -> game data -> API -> generated fake player
  const localPlayer: Player | null = (() => {
    // 1. Direct PLAYERS array lookup
    const directMatch = PLAYERS.find((p) => p.id === id);
    if (directMatch) return directMatch;

    // 2. Search through all games for any reference to this player ID
    for (const game of ALL_GAMES) {
      if (game.organizer && game.organizer.id === id) {
        return game.organizer;
      }
      if (game.bookings) {
        const booking = game.bookings.find((b) => b.player.id === id);
        if (booking) return booking.player;
      }
    }

    return null;
  })();

  const [apiDone, setApiDone] = useState(false);

  // 3. Fetch from API if not found locally
  useEffect(() => {
    if (!localPlayer && id && !apiPlayer) {
      fetchPlayerById(id).then((p) => {
        if (p) setApiPlayer(p);
      }).catch(() => {}).finally(() => setApiDone(true));
    } else {
      setApiDone(true);
    }
  }, [id, localPlayer]);

  // 4. Show loading while API fetches, then fall back to fake player
  const player: Player | null = localPlayer ?? apiPlayer ?? (apiDone ? generateFakePlayer(id ?? "unknown") : null);

  if (!player) {
    return (
      <View style={[styles.container, { paddingTop: topPadding, alignItems: "center", justifyContent: "center" }]}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  const isCurrentUser = player.isCurrentUser;
  const eloTier = getEloLabel(player.eloRating, player, PLAYERS);
  const badgeTier = getEloBadgeTier(player, PLAYERS);
  const reliabilityColor = getReliabilityColor(player.reliabilityScore);
  const reliabilityLabel = getReliabilityLabel(player.reliabilityScore);
  const initials = player.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
  const winRate = player.gamesPlayed > 0 ? Math.round((player.gamesWon / player.gamesPlayed) * 100) : 0;
  const eloPublicForPlayer = isCurrentUser || isEloPublic(player, PLAYERS);
  const reviews = PROFILE_REVIEWS.filter((r) => r.status === "accepted" && r.subjectId === player.id);
  const [reviewText, setReviewText] = useState("");
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [isRival, setIsRival] = useState(false);
  const [showCompare, setShowCompare] = useState(false);
  const [isFollowing, setIsFollowing] = useState(FOLLOWED_PLAYER_IDS.has(player.id));

  const me = PLAYERS[0];
  const meWinRate = me.gamesPlayed > 0 ? Math.round((me.gamesWon / me.gamesPlayed) * 100) : 0;

  const POSITIONS_LABELS: Record<string, string> = {
    GK: "Goalkeeper", DEF: "Defender", MID: "Midfielder", FWD: "Forward",
  };

  return (
    <View style={[styles.container, { paddingTop: topPadding }]}>
      <View style={styles.navBar}>
        <Pressable style={styles.navBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={Colors.text} />
        </Pressable>
        <Text style={styles.navTitle}>PLAYER PROFILE</Text>
        {!isCurrentUser && (
          <Pressable
            style={styles.navBtn}
            onPress={() => router.push({ pathname: "/report/[id]", params: { id: player.id } })}
          >
            <Ionicons name="flag-outline" size={18} color={Colors.muted} />
          </Pressable>
        )}
        {isCurrentUser && <View style={styles.navBtn} />}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottomPadding + 30 }}
      >
        <View style={styles.heroSection}>
          <View style={styles.avatarOuter}>
            <View style={[
              styles.avatarInner,
              badgeTier ? { borderWidth: 3, borderColor: badgeTier.ringColor } : undefined,
            ]}>
              <Text style={styles.avatarInitials}>{initials}</Text>
            </View>
            {badgeTier && (
              <View style={styles.eloBadgeIcon}>
                <Text style={{ fontSize: 14 }}>{badgeTier.icon}</Text>
              </View>
            )}
            {player.medal && (
              <View style={styles.medalBubble}>
                <Text style={{ fontSize: 16 }}>
                  {player.medal === "gold" ? "🥇" : player.medal === "silver" ? "🥈" : "🥉"}
                </Text>
              </View>
            )}
          </View>

          <Text style={styles.playerName}>{player.name}</Text>

          <View style={styles.playerSubRow}>
            <Text style={styles.playerSub}>{player.nationality}</Text>
            <Text style={styles.playerSubDot}>·</Text>
            <Text style={styles.playerSub}>{player.basedIn}</Text>
          </View>

          {player.winStreak && player.winStreak > 1 && (
            <View style={styles.streakBadge}>
              <Ionicons name="flame" size={13} color={Colors.amber} />
              <Text style={styles.streakText}>{player.winStreak}-game win streak</Text>
            </View>
          )}

          {eloPublicForPlayer ? (
            <>
              <View style={[styles.eloChip, { backgroundColor: `${eloTier.color}22` }]}>
                <Text style={[styles.eloChipText, { color: eloTier.color }]}>
                  {player.eloRating} ELO · {eloTier.tier} {eloTier.label}
                </Text>
              </View>
              {(() => {
                const pctBelow = Math.round(getEloPercentile(player, PLAYERS) * 100);
                return (
                  <Text style={{ fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.muted, marginTop: 2 }}>
                    ELO is better than{" "}
                    <Text style={{ color: Colors.accent, fontFamily: "Inter_600SemiBold" }}>{pctBelow}%</Text>
                    {" "}of players
                  </Text>
                );
              })()}
            </>
          ) : (
            <View style={[styles.eloChip, { backgroundColor: Colors.overlay, flexDirection: "row", alignItems: "center", gap: 5 }]}>
              <Ionicons name="lock-closed" size={11} color={Colors.muted} />
              <Text style={[styles.eloChipText, { color: Colors.muted }]}>Private ELO</Text>
            </View>
          )}

          {!isCurrentUser && (
            <View style={styles.actionRow}>
              <Pressable
                style={[
                  styles.actionBtn,
                  isFollowing && { backgroundColor: `${Colors.accent}22`, borderColor: Colors.accent },
                ]}
                onPress={() => {
                  setIsFollowing((v) => !v);
                  if (isFollowing) FOLLOWED_PLAYER_IDS.delete(player.id);
                  else FOLLOWED_PLAYER_IDS.add(player.id);
                }}
              >
                <Ionicons
                  name={isFollowing ? "person-remove-outline" : "person-add-outline"}
                  size={15}
                  color={isFollowing ? Colors.accent : Colors.muted}
                />
                <Text style={[styles.actionBtnText, isFollowing && { color: Colors.accent }]}>
                  {isFollowing ? "FOLLOWING" : "FOLLOW"}
                </Text>
              </Pressable>
              <Pressable
                style={[styles.actionBtn, isRival && styles.actionBtnActive]}
                onPress={() => setIsRival((v) => !v)}
              >
                <Ionicons
                  name={isRival ? "flame" : "flame-outline"}
                  size={15}
                  color={isRival ? Colors.red : Colors.muted}
                />
                <Text style={[styles.actionBtnText, isRival && { color: Colors.red }]}>
                  {isRival ? "RIVAL" : "RIVAL"}
                </Text>
              </Pressable>
              <Pressable
                style={styles.actionBtn}
                onPress={() => setShowCompare(true)}
              >
                <Ionicons name="git-compare-outline" size={15} color={Colors.blue} />
                <Text style={[styles.actionBtnText, { color: Colors.blue }]}>COMPARE</Text>
              </Pressable>
            </View>
          )}
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCell}>
            <Text style={styles.statValue}>{player.gamesPlayed}</Text>
            <Text style={styles.statLabel}>GAMES</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCell}>
            <Text style={[styles.statValue, { color: Colors.accent }]}>{winRate}%</Text>
            <Text style={styles.statLabel}>WIN RATE</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCell}>
            <Text style={[styles.statValue, { color: reliabilityColor }]}>{player.reliabilityScore}%</Text>
            <Text style={styles.statLabel}>RELIABILITY</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCell}>
            <Text style={styles.statValue}>{player.avgSportsmanshipRating.toFixed(1)}</Text>
            <Text style={styles.statLabel}>SPIRIT ⭐</Text>
          </View>
        </View>

        {player.bio && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ABOUT</Text>
            <Text style={styles.bioText}>{player.bio}</Text>
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>POSITION</Text>
              <Text style={styles.infoValue}>
                {player.preferredPositions.map((p) => POSITIONS_LABELS[p] ?? p).join(", ")}
              </Text>
            </View>
            {player.footPreference && (
              <>
                <View style={styles.infoSep} />
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>FOOT</Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Text style={{ fontSize: 13 }}>{FOOT_ICON[player.footPreference]}</Text>
                    <Text style={styles.infoValue}>{FOOT_LABEL[player.footPreference]}</Text>
                  </View>
                </View>
              </>
            )}
            <View style={styles.infoSep} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>RELIABILITY</Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <View style={[styles.dot, { backgroundColor: reliabilityColor }]} />
                <Text style={[styles.infoValue, { color: reliabilityColor }]}>
                  {player.reliabilityScore}% · {reliabilityLabel}
                </Text>
              </View>
            </View>
            <View style={styles.infoSep} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>RECORD</Text>
              <Text style={styles.infoValue}>
                {player.gamesWon}W · {player.gamesLost}L · {player.gamesDrawn}D
              </Text>
            </View>
            {player.favoriteTeam && (
              <>
                <View style={styles.infoSep} />
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>SUPPORTS</Text>
                  <Text style={styles.infoValue}>{player.favoriteTeam}</Text>
                </View>
              </>
            )}
            {player.favoritePlayer && (
              <>
                <View style={styles.infoSep} />
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>PLAYS LIKE</Text>
                  <Text style={styles.infoValue}>{player.favoritePlayer}</Text>
                </View>
              </>
            )}
          </View>
        </View>

        {(player.instagram || player.whatsapp) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>SOCIAL LINKS</Text>
            <View style={styles.socialRow}>
              {player.instagram && (
                <View style={styles.socialChip}>
                  <Ionicons name="logo-instagram" size={15} color={Colors.purple} />
                  <Text style={[styles.socialText, { color: Colors.purple }]}>@{player.instagram}</Text>
                </View>
              )}
              {player.whatsapp && (
                <View style={styles.socialChip}>
                  <Ionicons name="logo-whatsapp" size={15} color={Colors.accent} />
                  <Text style={[styles.socialText, { color: Colors.accent }]}>{player.whatsapp}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {player.medals && player.medals.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ACHIEVEMENTS</Text>
            <View style={styles.medalsList}>
              {player.medals.map((entry, i) => {
                const medalColor = entry.tier === "gold"
                  ? Colors.amber
                  : entry.tier === "silver"
                  ? "#A8A9AD"
                  : "#CD7F32";
                const medalIcon = entry.tier === "gold" ? "🥇" : entry.tier === "silver" ? "🥈" : "🥉";
                const medalLabel = entry.tier === "gold"
                  ? "Gold Baller"
                  : entry.tier === "silver"
                  ? "Silver Baller"
                  : "Bronze Baller";
                return (
                  <View key={i} style={[styles.medalsCard, { borderLeftColor: medalColor }]}>
                    <Text style={styles.medalsIcon}>{medalIcon}</Text>
                    <View style={styles.medalsBody}>
                      <View style={styles.medalsTop}>
                        <Text style={[styles.medalsLabel, { color: medalColor }]}>
                          {medalLabel.toUpperCase()}
                        </Text>
                        <Text style={styles.medalsDate}>{entry.date}</Text>
                      </View>
                      <Text style={styles.medalsMilestone}>{entry.milestone}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {reviews.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>COMMUNITY REVIEWS</Text>
            {reviews.map((review) => (
              <View key={review.id} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <View style={styles.reviewAvatar}>
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

        {!isCurrentUser && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>LEAVE A REVIEW</Text>
            {reviewSubmitted ? (
              <View style={styles.reviewSentCard}>
                <Ionicons name="checkmark-circle" size={22} color={Colors.accent} />
                <View>
                  <Text style={styles.reviewSentTitle}>Review sent!</Text>
                  <Text style={styles.reviewSentSub}>
                    {player.name.split(" ")[0]} will approve it before it shows publicly.
                  </Text>
                </View>
              </View>
            ) : (
              <View style={styles.reviewForm}>
                <TextInput
                  style={styles.reviewInput}
                  placeholder={`Share your experience playing with ${player.name.split(" ")[0]}...`}
                  placeholderTextColor={Colors.muted}
                  value={reviewText}
                  onChangeText={setReviewText}
                  multiline
                  numberOfLines={3}
                  maxLength={300}
                  textAlignVertical="top"
                />
                <View style={styles.reviewFormBottom}>
                  <Text style={styles.reviewCharCount}>{reviewText.length}/300</Text>
                  <Pressable
                    style={[styles.reviewSubmitBtn, reviewText.trim().length < 10 && styles.reviewSubmitBtnDisabled]}
                    disabled={reviewText.trim().length < 10}
                    onPress={() => setReviewSubmitted(true)}
                  >
                    <Ionicons name="send" size={13} color={Colors.text} />
                    <Text style={styles.reviewSubmitBtnText}>Submit for Approval</Text>
                  </Pressable>
                </View>
                <Text style={styles.reviewModNote}>
                  Reviews are moderated by the player before appearing publicly.
                </Text>
              </View>
            )}
          </View>
        )}

        {!isCurrentUser && (
          <View style={styles.section}>
            <Pressable
              style={styles.reportBtn}
              onPress={() => router.push({ pathname: "/report/[id]", params: { id: player.id } })}
            >
              <Ionicons name="flag-outline" size={15} color={Colors.muted} />
              <Text style={styles.reportBtnText}>Report this player</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>

      <Modal
        visible={showCompare}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCompare(false)}
      >
        <Pressable style={styles.compareOverlay} onPress={() => setShowCompare(false)}>
          <Pressable style={styles.compareSheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.compareHandle} />
            <View style={styles.compareHeader}>
              <Text style={styles.compareTitle}>HEAD-TO-HEAD COMPARE</Text>
              <Pressable onPress={() => setShowCompare(false)}>
                <Ionicons name="close" size={20} color={Colors.muted} />
              </Pressable>
            </View>

            <View style={styles.comparePlayerRow}>
              <View style={styles.comparePlayer}>
                <View style={[styles.compareDot, { backgroundColor: Colors.primary }]}>
                  <Text style={styles.compareDotText}>
                    {me.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.comparePlayerName} numberOfLines={1}>You</Text>
              </View>
              <Text style={styles.compareVs}>VS</Text>
              <View style={styles.comparePlayer}>
                <View style={[styles.compareDot, { backgroundColor: Colors.red }]}>
                  <Text style={styles.compareDotText}>{initials}</Text>
                </View>
                <Text style={styles.comparePlayerName} numberOfLines={1}>{player.name.split(" ")[0]}</Text>
              </View>
            </View>

            {[
              {
                label: "ELO RATING",
                mine: me.eloRating,
                theirs: eloPublicForPlayer ? player.eloRating : null,
                format: (v: number) => `${v}`,
                higherIsBetter: true,
              },
              {
                label: "WIN RATE",
                mine: meWinRate,
                theirs: winRate,
                format: (v: number) => `${v}%`,
                higherIsBetter: true,
              },
              {
                label: "GAMES PLAYED",
                mine: me.gamesPlayed,
                theirs: player.gamesPlayed,
                format: (v: number) => `${v}`,
                higherIsBetter: true,
              },
              {
                label: "RELIABILITY",
                mine: me.reliabilityScore,
                theirs: player.reliabilityScore,
                format: (v: number) => `${v}%`,
                higherIsBetter: true,
              },
              {
                label: "AVG SKILL",
                mine: me.avgSkillRating,
                theirs: player.avgSkillRating,
                format: (v: number) => v.toFixed(1),
                higherIsBetter: true,
              },
            ].map(({ label, mine, theirs, format, higherIsBetter }) => {
              const mineWins = theirs !== null && (higherIsBetter ? mine > theirs : mine < theirs);
              const theirsWins = theirs !== null && (higherIsBetter ? theirs > mine : theirs < mine);
              return (
                <View key={label} style={styles.compareRow}>
                  <Text style={[styles.compareValue, mineWins && { color: Colors.accent }]}>{format(mine)}</Text>
                  <Text style={styles.compareLabel}>{label}</Text>
                  <Text style={[styles.compareValue, theirsWins && { color: Colors.red }]}>
                    {theirs !== null ? format(theirs) : "—"}
                  </Text>
                </View>
              );
            })}

            <Text style={styles.compareNote}>
              Highlighted values indicate the stronger stat in each category.
            </Text>
          </Pressable>
        </Pressable>
      </Modal>
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
  heroSection: { alignItems: "center", paddingVertical: 24, paddingHorizontal: 16, gap: 6 },
  avatarOuter: {
    position: "relative",
    marginBottom: 4,
  },
  avatarInner: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Colors.accent,
  },
  avatarInitials: { fontFamily: "Inter_700Bold", fontSize: 30, color: Colors.text },
  medalBubble: {
    position: "absolute",
    bottom: -4,
    right: -6,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 2,
  },
  eloBadgeIcon: {
    position: "absolute",
    top: -2,
    right: -2,
    backgroundColor: Colors.surface,
    borderRadius: 11,
    width: 22,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  playerName: { fontFamily: "Inter_700Bold", fontSize: 24, color: Colors.text, letterSpacing: -0.3 },
  playerSubRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  playerSub: { fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.muted },
  playerSubDot: { color: Colors.muted },
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
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 999,
  },
  eloChipText: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 6,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.separator,
  },
  actionBtnActive: {
    borderColor: `${Colors.red}44`,
    backgroundColor: `${Colors.red}11`,
  },
  actionBtnText: {
    fontFamily: "Inter_700Bold",
    fontSize: 10,
    color: Colors.muted,
    letterSpacing: 1,
  },
  statsRow: {
    flexDirection: "row",
    backgroundColor: Colors.surface,
    marginHorizontal: 16,
    borderRadius: 14,
    paddingVertical: 16,
    marginBottom: 20,
  },
  statCell: { flex: 1, alignItems: "center", gap: 3 },
  statValue: { fontFamily: "Inter_700Bold", fontSize: 18, color: Colors.text },
  statLabel: { fontFamily: "Inter_500Medium", fontSize: 9, color: Colors.muted, letterSpacing: 0.5 },
  statDivider: { width: 1, backgroundColor: Colors.separator, marginVertical: 4 },
  section: { paddingHorizontal: 16, marginBottom: 20 },
  sectionTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 10,
    color: Colors.muted,
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  bioText: { fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.muted, lineHeight: 20 },
  infoCard: { backgroundColor: Colors.surface, borderRadius: 14, overflow: "hidden" },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  infoLabel: { fontFamily: "Inter_500Medium", fontSize: 10, color: Colors.muted, letterSpacing: 0.5 },
  infoValue: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: Colors.text },
  infoSep: { height: 1, backgroundColor: Colors.separator, marginHorizontal: 14 },
  dot: { width: 8, height: 8, borderRadius: 4 },
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
    backgroundColor: Colors.blue + "44",
    alignItems: "center",
    justifyContent: "center",
  },
  reviewAvatarText: { fontFamily: "Inter_700Bold", fontSize: 11, color: Colors.blue },
  reviewAuthor: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: Colors.text },
  reviewTime: { fontFamily: "Inter_400Regular", fontSize: 10, color: Colors.muted },
  reviewText: { fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.muted, lineHeight: 19 },
  reportBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: Colors.surface,
    borderRadius: 10,
    paddingVertical: 13,
    borderWidth: 1,
    borderColor: Colors.separator,
  },
  reportBtnText: { fontFamily: "Inter_500Medium", fontSize: 13, color: Colors.muted },
  reviewForm: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    gap: 10,
  },
  reviewInput: {
    backgroundColor: Colors.overlay,
    borderRadius: 10,
    padding: 12,
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.text,
    minHeight: 80,
    textAlignVertical: "top",
  },
  reviewFormBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  reviewCharCount: { fontFamily: "Inter_400Regular", fontSize: 11, color: Colors.muted },
  reviewSubmitBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
  },
  reviewSubmitBtnDisabled: { opacity: 0.4 },
  reviewSubmitBtnText: { fontFamily: "Inter_700Bold", fontSize: 12, color: Colors.text },
  reviewModNote: {
    fontFamily: "Inter_400Regular",
    fontSize: 10,
    color: Colors.muted,
    textAlign: "center",
    lineHeight: 14,
  },
  reviewSentCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: `${Colors.primary}22`,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: `${Colors.accent}33`,
  },
  reviewSentTitle: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: Colors.text },
  reviewSentSub: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.muted, marginTop: 2 },
  compareOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.65)", justifyContent: "flex-end" },
  compareSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 20,
    paddingBottom: 34,
    gap: 0,
  },
  compareHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.overlay,
    alignSelf: "center",
    marginBottom: 16,
  },
  compareHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  compareTitle: { fontFamily: "Inter_700Bold", fontSize: 13, color: Colors.text, letterSpacing: 1.5 },
  comparePlayerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  comparePlayer: { alignItems: "center", gap: 6, flex: 1 },
  compareDot: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  compareDotText: { fontFamily: "Inter_700Bold", fontSize: 16, color: Colors.text },
  comparePlayerName: { fontFamily: "Inter_600SemiBold", fontSize: 12, color: Colors.text },
  compareVs: { fontFamily: "Inter_700Bold", fontSize: 14, color: Colors.muted },
  compareRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.separator,
  },
  compareValue: { fontFamily: "Inter_700Bold", fontSize: 16, color: Colors.text, width: 72 },
  compareLabel: {
    flex: 1,
    textAlign: "center",
    fontFamily: "Inter_500Medium",
    fontSize: 9,
    color: Colors.muted,
    letterSpacing: 1,
  },
  compareNote: {
    fontFamily: "Inter_400Regular",
    fontSize: 10,
    color: Colors.muted,
    textAlign: "center",
    marginTop: 14,
    lineHeight: 14,
  },
  medalsList: {
    gap: 8,
  },
  medalsCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 3,
    borderWidth: 1,
    borderColor: Colors.separator,
  },
  medalsIcon: {
    fontSize: 22,
    lineHeight: 28,
  },
  medalsBody: {
    flex: 1,
    gap: 2,
  },
  medalsTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  medalsLabel: {
    fontFamily: "Inter_700Bold",
    fontSize: 11,
    letterSpacing: 0.5,
  },
  medalsDate: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: Colors.muted,
  },
  medalsMilestone: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.muted,
    lineHeight: 17,
  },
});
