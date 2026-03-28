import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { PLAYERS, MedalEntry, BADGE_DEFS, BadgeDef } from "@/constants/mock";

const ME = PLAYERS.find((p) => p.isCurrentUser) ?? PLAYERS[0];

interface MilestoneTier {
  tier: "bronze" | "silver" | "gold";
  label: string;
  icon: string;
  gamesRequired: number;
  eloRequired: number;
  color: string;
  description: string;
}

const MEDAL_TIERS: MilestoneTier[] = [
  {
    tier: "bronze",
    label: "Bronze Baller",
    icon: "🥉",
    gamesRequired: 10,
    eloRequired: 900,
    color: "#CD7F32",
    description: "Play 10 games & reach 900 ELO",
  },
  {
    tier: "silver",
    label: "Silver Baller",
    icon: "🥈",
    gamesRequired: 25,
    eloRequired: 1200,
    color: "#A8A9AD",
    description: "Play 25 games & reach 1200 ELO",
  },
  {
    tier: "gold",
    label: "Gold Baller",
    icon: "🥇",
    gamesRequired: 50,
    eloRequired: 1500,
    color: Colors.amber,
    description: "Play 50 games & reach 1500 ELO",
  },
];

function getTierColor(tier: "gold" | "silver" | "bronze"): string {
  return MEDAL_TIERS.find((t) => t.tier === tier)?.color ?? Colors.amber;
}

function getTierLabel(tier: "gold" | "silver" | "bronze"): string {
  return MEDAL_TIERS.find((t) => t.tier === tier)?.label ?? tier;
}

function getTierIcon(tier: "gold" | "silver" | "bronze"): string {
  return MEDAL_TIERS.find((t) => t.tier === tier)?.icon ?? "🏅";
}

function getShareCaption(tier: "gold" | "silver" | "bronze", city: string): string {
  const icons: Record<string, string> = { gold: "🥇", silver: "🥈", bronze: "🥉" };
  const labels: Record<string, string> = {
    gold: "Gold Baller",
    silver: "Silver Baller",
    bronze: "Bronze Baller",
  };
  return `Just earned my ${icons[tier]} ${labels[tier]} medal on BallR! 🏆⚽ #BallR #${city}`;
}

function EarnedMedalCard({ entry }: { entry: MedalEntry }) {
  const color = getTierColor(entry.tier);
  const icon = getTierIcon(entry.tier);
  const label = getTierLabel(entry.tier);

  return (
    <View style={[styles.earnedCard, { borderLeftColor: color }]}>
      <View style={styles.earnedCardLeft}>
        <View style={[styles.earnedIconCircle, { backgroundColor: `${color}22`, borderColor: `${color}44` }]}>
          <Text style={styles.earnedIcon}>{icon}</Text>
        </View>
        <View style={styles.earnedTimelineLine} />
      </View>
      <View style={styles.earnedCardBody}>
        <View style={styles.earnedCardTop}>
          <Text style={[styles.earnedLabel, { color }]}>{label.toUpperCase()}</Text>
          <Text style={styles.earnedDate}>{entry.date}</Text>
        </View>
        <Text style={styles.earnedMilestone}>{entry.milestone}</Text>
        <View style={styles.earnedStats}>
          <View style={styles.earnedStat}>
            <Ionicons name="football-outline" size={11} color={Colors.muted} />
            <Text style={styles.earnedStatText}>{entry.gamesCount} games played</Text>
          </View>
          <View style={styles.earnedStatDot} />
          <View style={styles.earnedStat}>
            <Ionicons name="trending-up-outline" size={11} color={Colors.muted} />
            <Text style={styles.earnedStatText}>{entry.eloReached} ELO</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

function LockedMilestoneCard({ tier, player }: { tier: MilestoneTier; player: typeof ME }) {
  const gamesLeft = Math.max(0, tier.gamesRequired - player.gamesPlayed);
  const eloLeft = Math.max(0, tier.eloRequired - player.eloRating);
  const gamesDone = player.gamesPlayed >= tier.gamesRequired;
  const eloDone = player.eloRating >= tier.eloRequired;

  return (
    <View style={styles.lockedCard}>
      <View style={styles.lockedIconCircle}>
        <Text style={styles.lockedIcon}>{tier.icon}</Text>
        <View style={styles.lockOverlay}>
          <Ionicons name="lock-closed" size={10} color={Colors.muted} />
        </View>
      </View>
      <View style={styles.lockedBody}>
        <Text style={styles.lockedLabel}>{tier.label.toUpperCase()}</Text>
        <Text style={styles.lockedDesc}>{tier.description}</Text>
        <View style={styles.lockedProgress}>
          <View style={[styles.lockedProgressItem, gamesDone && styles.lockedProgressItemDone]}>
            <Ionicons
              name={gamesDone ? "checkmark-circle" : "ellipse-outline"}
              size={12}
              color={gamesDone ? Colors.accent : Colors.muted}
            />
            <Text style={[styles.lockedProgressText, gamesDone && { color: Colors.accent }]}>
              {gamesDone ? `${tier.gamesRequired} games ✓` : `${gamesLeft} more game${gamesLeft !== 1 ? "s" : ""}`}
            </Text>
          </View>
          <View style={styles.lockedProgressDot} />
          <View style={[styles.lockedProgressItem, eloDone && styles.lockedProgressItemDone]}>
            <Ionicons
              name={eloDone ? "checkmark-circle" : "ellipse-outline"}
              size={12}
              color={eloDone ? Colors.accent : Colors.muted}
            />
            <Text style={[styles.lockedProgressText, eloDone && { color: Colors.accent }]}>
              {eloDone ? `${tier.eloRequired} ELO ✓` : `${eloLeft} more ELO`}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

async function handleBadgeShare(badge: BadgeDef) {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  try {
    await Share.share({
      message: `Just unlocked the "${badge.name}" ${badge.icon} badge on BallR! ${badge.description}. #BallR #Football`,
    });
  } catch {
    Alert.alert("Sharing unavailable", "Could not open the share sheet on this device.");
  }
}

function BadgeCard({ badge, unlocked }: { badge: BadgeDef; unlocked: boolean }) {
  return (
    <View style={[styles.badgeCard, unlocked ? styles.badgeCardUnlocked : styles.badgeCardLocked]}>
      <View style={styles.badgeIconWrap}>
        <Text style={[styles.badgeIcon, !unlocked && styles.badgeIconLocked]}>{badge.icon}</Text>
        {!unlocked && (
          <View style={styles.badgeLockOverlay}>
            <Ionicons name="lock-closed" size={9} color={Colors.muted} />
          </View>
        )}
        {unlocked && (
          <View style={styles.badgeUnlockedMark}>
            <Ionicons name="checkmark" size={9} color={Colors.accent} />
          </View>
        )}
      </View>
      <Text style={[styles.badgeName, unlocked ? styles.badgeNameUnlocked : styles.badgeNameLocked]} numberOfLines={1}>
        {badge.name}
      </Text>
      <Text style={styles.badgeDesc} numberOfLines={2}>
        {unlocked ? badge.description : `Unlock: ${badge.howToUnlock}`}
      </Text>
      {unlocked && (
        <Pressable
          style={({ pressed }) => [styles.badgeShareBtn, pressed && { opacity: 0.7 }]}
          onPress={() => handleBadgeShare(badge)}
        >
          <Ionicons name="share-social-outline" size={13} color={Colors.accent} />
          <Text style={styles.badgeShareText}>Share</Text>
        </Pressable>
      )}
    </View>
  );
}

export default function AchievementsScreen() {
  const insets = useSafeAreaInsets();
  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const bottomPadding = Platform.OS === "web" ? 34 : insets.bottom;

  const earned = ME.medals ?? [];
  const earnedTierSet = new Set(earned.map((e) => e.tier));

  const lockedTiers = MEDAL_TIERS.filter((t) => !earnedTierSet.has(t.tier));

  const topMedal = ME.medal;
  const topMedalColor = topMedal ? getTierColor(topMedal) : undefined;

  const badgesWithState = BADGE_DEFS.map((b) => ({ badge: b, unlocked: b.isUnlocked(ME) }));
  const unlockedCount = badgesWithState.filter((b) => b.unlocked).length;

  const badgePairs: { badge: BadgeDef; unlocked: boolean }[][] = [];
  for (let i = 0; i < badgesWithState.length; i += 2) {
    badgePairs.push(badgesWithState.slice(i, i + 2));
  }

  async function handleShare() {
    if (!topMedal) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const caption = getShareCaption(topMedal, ME.basedIn);
    try {
      await Share.share({ message: caption });
    } catch {
      Alert.alert("Sharing unavailable", "Could not open the share sheet on this device.");
    }
  }

  return (
    <View style={[styles.container, { paddingTop: topPadding }]}>
      <View style={styles.navBar}>
        <Pressable style={styles.navBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={Colors.text} />
        </Pressable>
        <Text style={styles.navTitle}>ACHIEVEMENTS</Text>
        <View style={styles.navBtn} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPadding + 40 }]}
      >
        <View style={styles.heroSection}>
          <View style={[styles.avatarRing, topMedalColor ? { borderColor: `${topMedalColor}66` } : {}]}>
            <View style={styles.avatarInner}>
              <Text style={styles.avatarInitials}>
                {ME.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()}
              </Text>
            </View>
          </View>
          <Text style={styles.heroName}>{ME.name}</Text>
          {topMedal ? (
            <View style={[styles.topMedalChip, { backgroundColor: `${topMedalColor}22`, borderColor: `${topMedalColor}44` }]}>
              <Text style={styles.topMedalIcon}>{getTierIcon(topMedal)}</Text>
              <Text style={[styles.topMedalLabel, { color: topMedalColor }]}>
                {getTierLabel(topMedal).toUpperCase()}
              </Text>
            </View>
          ) : (
            <View style={styles.noMedalChip}>
              <Ionicons name="ribbon-outline" size={13} color={Colors.muted} />
              <Text style={styles.noMedalText}>No medals yet — keep playing!</Text>
            </View>
          )}
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCell}>
            <Text style={styles.statValue}>{ME.gamesPlayed}</Text>
            <Text style={styles.statLabel}>GAMES</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCell}>
            <Text style={[styles.statValue, { color: Colors.accent }]}>{ME.eloRating}</Text>
            <Text style={styles.statLabel}>ELO</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCell}>
            <Text style={[styles.statValue, { color: Colors.amber }]}>{earned.length}</Text>
            <Text style={styles.statLabel}>MEDALS</Text>
          </View>
        </View>

        {earned.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>EARNED MEDALS</Text>
            <View style={styles.timeline}>
              {[...earned].reverse().map((entry, i) => (
                <EarnedMedalCard key={i} entry={entry} />
              ))}
            </View>
          </View>
        )}

        {lockedTiers.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {earned.length > 0 ? "NEXT MILESTONES" : "HOW TO EARN MEDALS"}
            </Text>
            <View style={styles.lockedList}>
              {lockedTiers.map((tier) => (
                <LockedMilestoneCard key={tier.tier} tier={tier} player={ME} />
              ))}
            </View>
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.badgesSectionHeader}>
            <Text style={styles.sectionTitle}>BADGES</Text>
            <View style={styles.badgesCountChip}>
              <Text style={styles.badgesCountText}>
                {unlockedCount} / {BADGE_DEFS.length} unlocked
              </Text>
            </View>
          </View>
          <View style={styles.badgesGrid}>
            {badgePairs.map((pair, rowIdx) => (
              <View key={rowIdx} style={styles.badgesRow}>
                {pair.map(({ badge, unlocked }) => (
                  <BadgeCard key={badge.id} badge={badge} unlocked={unlocked} />
                ))}
                {pair.length === 1 && <View style={styles.badgeCardEmpty} />}
              </View>
            ))}
          </View>
        </View>

        {topMedal && (
          <View style={styles.shareSection}>
            <Pressable
              style={({ pressed }) => [styles.shareBtn, pressed && { opacity: 0.82 }]}
              onPress={handleShare}
            >
              <Ionicons name="share-social-outline" size={18} color={Colors.text} />
              <Text style={styles.shareBtnText}>SHARE ACHIEVEMENT</Text>
            </Pressable>
            <Text style={styles.shareNote}>
              Opens the native share sheet with a pre-filled caption
            </Text>
          </View>
        )}
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
  scrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  heroSection: {
    alignItems: "center",
    paddingVertical: 20,
    gap: 8,
  },
  avatarRing: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
    borderColor: Colors.separator,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  avatarInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: {
    fontFamily: "Inter_700Bold",
    fontSize: 28,
    color: Colors.text,
  },
  heroName: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    color: Colors.text,
    letterSpacing: -0.3,
  },
  topMedalChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },
  topMedalIcon: {
    fontSize: 16,
  },
  topMedalLabel: {
    fontFamily: "Inter_700Bold",
    fontSize: 11,
    letterSpacing: 1,
  },
  noMedalChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.separator,
  },
  noMedalText: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: Colors.muted,
  },
  statsRow: {
    flexDirection: "row",
    backgroundColor: Colors.surface,
    borderRadius: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: Colors.separator,
  },
  statCell: {
    flex: 1,
    alignItems: "center",
    gap: 3,
  },
  statValue: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
    color: Colors.text,
  },
  statLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 9,
    color: Colors.muted,
    letterSpacing: 1.5,
  },
  statDivider: {
    width: 1,
    height: "60%",
    backgroundColor: Colors.separator,
  },
  section: {
    gap: 12,
    marginTop: 8,
  },
  sectionTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 10,
    color: Colors.muted,
    letterSpacing: 2,
  },
  timeline: {
    gap: 0,
  },
  earnedCard: {
    flexDirection: "row",
    gap: 12,
    paddingBottom: 20,
  },
  earnedCardLeft: {
    alignItems: "center",
    width: 44,
  },
  earnedIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    flexShrink: 0,
  },
  earnedIcon: {
    fontSize: 20,
  },
  earnedTimelineLine: {
    flex: 1,
    width: 2,
    backgroundColor: Colors.separator,
    marginTop: 4,
  },
  earnedCardBody: {
    flex: 1,
    gap: 4,
    paddingTop: 8,
  },
  earnedCardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  earnedLabel: {
    fontFamily: "Inter_700Bold",
    fontSize: 12,
    letterSpacing: 0.5,
  },
  earnedDate: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: Colors.muted,
  },
  earnedMilestone: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.text,
    lineHeight: 18,
  },
  earnedStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  earnedStat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  earnedStatText: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: Colors.muted,
  },
  earnedStatDot: {
    width: 3,
    height: 3,
    borderRadius: 999,
    backgroundColor: Colors.overlay,
  },
  lockedList: {
    gap: 10,
  },
  lockedCard: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.separator,
    opacity: 0.65,
    alignItems: "flex-start",
  },
  lockedIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.overlay,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    position: "relative",
  },
  lockedIcon: {
    fontSize: 20,
    opacity: 0.5,
  },
  lockOverlay: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.separator,
  },
  lockedBody: {
    flex: 1,
    gap: 4,
  },
  lockedLabel: {
    fontFamily: "Inter_700Bold",
    fontSize: 11,
    color: Colors.muted,
    letterSpacing: 1,
  },
  lockedDesc: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.muted,
  },
  lockedProgress: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
    flexWrap: "wrap",
  },
  lockedProgressItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  lockedProgressItemDone: {},
  lockedProgressText: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    color: Colors.muted,
  },
  lockedProgressDot: {
    width: 3,
    height: 3,
    borderRadius: 999,
    backgroundColor: Colors.overlay,
  },
  badgesSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  badgesCountChip: {
    backgroundColor: Colors.overlay,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  badgesCountText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 10,
    color: Colors.accent,
    letterSpacing: 0.5,
  },
  badgesGrid: {
    gap: 10,
  },
  badgesRow: {
    flexDirection: "row",
    gap: 10,
  },
  badgeCard: {
    flex: 1,
    borderRadius: 16,
    padding: 14,
    gap: 6,
    borderWidth: 1,
    minHeight: 130,
  },
  badgeCardUnlocked: {
    backgroundColor: `${Colors.primary}33`,
    borderColor: `${Colors.accent}33`,
  },
  badgeCardLocked: {
    backgroundColor: Colors.surface,
    borderColor: Colors.separator,
    opacity: 0.65,
  },
  badgeCardEmpty: {
    flex: 1,
  },
  badgeIconWrap: {
    position: "relative",
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  badgeIcon: {
    fontSize: 26,
  },
  badgeIconLocked: {
    opacity: 0.4,
  },
  badgeLockOverlay: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.overlay,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.separator,
  },
  badgeUnlockedMark: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: `${Colors.primary}88`,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: `${Colors.accent}66`,
  },
  badgeName: {
    fontFamily: "Inter_700Bold",
    fontSize: 12,
    letterSpacing: 0.3,
  },
  badgeNameUnlocked: {
    color: Colors.accent,
  },
  badgeNameLocked: {
    color: Colors.muted,
  },
  badgeDesc: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: Colors.muted,
    lineHeight: 15,
    flex: 1,
  },
  badgeShareBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  badgeShareText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    color: Colors.accent,
  },
  shareSection: {
    alignItems: "center",
    gap: 8,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.separator,
  },
  shareBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: `${Colors.accent}55`,
  },
  shareBtnText: {
    fontFamily: "Inter_700Bold",
    fontSize: 13,
    color: Colors.text,
    letterSpacing: 1,
  },
  shareNote: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: Colors.muted,
    textAlign: "center",
  },
});
