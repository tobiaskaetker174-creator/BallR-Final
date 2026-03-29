import { Ionicons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { ComponentProps, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Linking,
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
  ALL_GAMES,
  MY_GAMES_IDS,
  PLAYERS,
  Game,
  formatGameTime,
  formatPrice,
  getSkillColor,
  getSkillLabel,
  VENUE_STATS,
} from "@/constants/mock";
import { useAuth } from "@/context/AuthContext";
import { useBallrData } from "@/context/BallrDataContext";
import { fetchGameById } from "@/lib/ballrApi";

const AMENITY_ICONS: Record<string, { icon: ComponentProps<typeof Ionicons>["name"]; label: string }> = {
  changing_rooms: { icon: "shirt-outline", label: "Changing Rooms" },
  showers: { icon: "water-outline", label: "Showers" },
  parking: { icon: "car-outline", label: "Parking" },
  lights: { icon: "flashlight-outline", label: "Floodlights" },
  bar: { icon: "beer-outline", label: "Bar" },
};

function PaymentModal({
  visible,
  game,
  onClose,
  onSuccess,
}: {
  visible: boolean;
  game: Game | undefined;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [step, setStep] = useState<"review" | "paying" | "success">("review");

  const handlePay = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setStep("paying");
    await new Promise((r) => setTimeout(r, 1500));
    setStep("success");
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleClose = () => {
    setStep("review");
    onClose();
  };

  if (!game) return null;
  const price = formatPrice(game.pricePerPlayer, game.cityId);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <Pressable style={styles.modalOverlay} onPress={handleClose} />
      <View style={styles.modalSheet}>
        {step === "review" && (
          <>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Confirm Booking</Text>
            <View style={styles.modalGameCard}>
              <Ionicons name="football-outline" size={24} color={Colors.accent} />
              <View style={{ flex: 1 }}>
                <Text style={styles.modalGameName}>{game.venue.name}</Text>
                <Text style={styles.modalGameTime}>{formatGameTime(game.gameTime)} · {game.durationMinutes}min</Text>
              </View>
            </View>
            <View style={styles.modalBreakdown}>
              <View style={styles.modalRow}>
                <Text style={styles.modalRowLabel}>Entry fee</Text>
                <Text style={styles.modalRowValue}>{price}</Text>
              </View>
              <View style={styles.modalRow}>
                <Text style={styles.modalRowLabel}>Processing fee</Text>
                <Text style={styles.modalRowValue}>{game.cityId === "bangkok" ? "฿0" : "Rp0"}</Text>
              </View>
              <View style={[styles.modalRow, styles.modalRowTotal]}>
                <Text style={styles.modalRowTotalLabel}>Total</Text>
                <Text style={styles.modalRowTotalValue}>{price}</Text>
              </View>
            </View>
            <View style={styles.modalInfo}>
              <Ionicons name="information-circle-outline" size={14} color={Colors.muted} />
              <Text style={styles.modalInfoText}>
                Full refund available until {game.cutoffHours ?? 2} hours before kick-off. Payment commits your spot.
              </Text>
            </View>
            <Pressable
              style={({ pressed }) => [styles.modalPayBtn, pressed && { opacity: 0.85 }]}
              onPress={handlePay}
            >
              <Ionicons name="lock-closed" size={15} color={Colors.text} />
              <Text style={styles.modalPayBtnText}>Pay {price} · Secure</Text>
            </Pressable>
          </>
        )}

        {step === "paying" && (
          <View style={styles.payingState}>
            <ActivityIndicator size="large" color={Colors.accent} />
            <Text style={styles.payingText}>Processing payment...</Text>
          </View>
        )}

        {step === "success" && (
          <View style={styles.successState}>
            <Ionicons name="checkmark-circle" size={72} color={Colors.accent} />
            <Text style={styles.successTitle}>You're In! 🎉</Text>
            <Text style={styles.successSub}>
              Your spot is confirmed for {game.venue.name}.{"\n"}
              Check your email for confirmation details.
            </Text>
            <Pressable
              style={styles.successBtn}
              onPress={() => {
                onSuccess();
                handleClose();
              }}
            >
              <Text style={styles.successBtnText}>View Game</Text>
            </Pressable>
          </View>
        )}
      </View>
    </Modal>
  );
}

export default function GameDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { user, isLoggedIn } = useAuth();
  const { games: liveGames } = useBallrData();
  const [isJoined, setIsJoined] = useState(MY_GAMES_IDS.has(id ?? ""));
  const [showPayment, setShowPayment] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [apiGame, setApiGame] = useState<Game | null>(null);
  const [isLoadingApi, setIsLoadingApi] = useState(false);

  const allGames = liveGames.length > 0 ? liveGames : ALL_GAMES;
  const game = allGames.find((g) => g.id === id) ?? ALL_GAMES.find((g) => g.id === id) ?? apiGame;
  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const bottomPadding = Platform.OS === "web" ? 34 : insets.bottom;

  // Fetch from API if not found in local data
  useEffect(() => {
    if (!game && id && !isLoadingApi) {
      setIsLoadingApi(true);
      fetchGameById(id).then((g) => {
        if (g) setApiGame(g);
      }).catch(() => {}).finally(() => setIsLoadingApi(false));
    }
  }, [id, game]);

  if (!game) {
    return (
      <View style={[styles.container, { paddingTop: topPadding }]}>
        {isLoadingApi ? (
          <View style={styles.notFound}>
            <ActivityIndicator size="large" color={Colors.accent} />
          </View>
        ) : (
          <View style={styles.notFound}>
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => [styles.navBtn, pressed && { opacity: 0.7 }]}
            >
              <Ionicons name="arrow-back" size={20} color={Colors.text} />
            </Pressable>
            <Ionicons name="football-outline" size={40} color={Colors.muted} style={{ marginTop: 40 }} />
            <Text style={styles.notFoundText}>Game not found</Text>
            <Pressable onPress={() => router.push("/")} style={{ marginTop: 16, paddingVertical: 10, paddingHorizontal: 20, backgroundColor: Colors.primary, borderRadius: 8 }}>
              <Text style={{ color: Colors.text, fontFamily: "Inter_600SemiBold", fontSize: 14 }}>Back to Discover</Text>
            </Pressable>
          </View>
        )}
      </View>
    );
  }

  const skillColor = getSkillColor(game.skillLevel);
  const isFull = game.status === "full" || game.currentPlayers >= game.maxPlayers;
  const fillPct = (game.currentPlayers / game.maxPlayers) * 100;
  const isOrganizer = game.organizer.id === "p0";
  const bookingElos = game.bookings.map((b) => b.player.eloRating);
  const computedMinElo = bookingElos.length > 0 ? Math.min(...bookingElos) : game.minElo;
  const computedMaxElo = bookingElos.length > 0 ? Math.max(...bookingElos) : game.maxElo;
  const computedAvgElo = bookingElos.length > 0
    ? Math.round(bookingElos.reduce((s, e) => s + e, 0) / bookingElos.length)
    : game.avgElo;
  const blueTeam = game.bookings.filter((b) => b.teamAssignment === "blue");
  const redTeam = game.bookings.filter((b) => b.teamAssignment === "red");
  const unassigned = game.bookings.filter((b) => b.teamAssignment === "none");

  return (
    <View style={[styles.container, { paddingTop: topPadding }]}>
      <View style={styles.navBar}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.navBtn, pressed && { opacity: 0.7 }]}
        >
          <Ionicons name="arrow-back" size={20} color={Colors.text} />
        </Pressable>
        <Text style={styles.navTitle}>BALLR</Text>
        <Pressable
          style={styles.navBtn}
          onPress={() => router.push({ pathname: "/chat/[id]", params: { id: game.id } })}
        >
          <Ionicons name="chatbubble-outline" size={18} color={Colors.muted} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottomPadding + 90 }}
      >
        <View style={styles.heroContainer}>
          <Image
            source={game.venue.imageUrl ? { uri: game.venue.imageUrl } : require("../../assets/images/venue_pitch.jpg")}
            style={styles.heroImage}
            resizeMode="cover"
          />
          <LinearGradient
            colors={["rgba(20,19,18,0.3)", "rgba(20,19,18,0.95)"]}
            style={styles.heroGradient}
          />
          <View style={styles.heroOverlay}>
            <View style={[styles.skillBadge, { backgroundColor: `${skillColor}33`, borderColor: `${skillColor}66` }]}>
              <View style={[styles.skillDot, { backgroundColor: skillColor }]} />
              <Text style={[styles.skillBadgeText, { color: skillColor }]}>
                {getSkillLabel(game.skillLevel)}
              </Text>
            </View>
            <Pressable
              onPress={() => router.push({ pathname: "/venue/[id]", params: { id: game.venue.id } })}
              style={({ pressed }) => [pressed && { opacity: 0.75 }]}
            >
              <Text style={styles.heroVenueName}>{game.venue.name}</Text>
            </Pressable>
            <Text style={styles.heroAddress}>{game.venue.address}</Text>
          </View>
        </View>

        <View style={styles.infoStrip}>
          <View style={styles.infoStripCell}>
            <Ionicons name="time-outline" size={14} color={Colors.accent} />
            <Text style={styles.infoStripLabel}>TIME</Text>
            <Text style={styles.infoStripValue}>{formatGameTime(game.gameTime)}</Text>
          </View>
          <View style={styles.infoStripSep} />
          <View style={styles.infoStripCell}>
            <Ionicons name="hourglass-outline" size={14} color={Colors.accent} />
            <Text style={styles.infoStripLabel}>DURATION</Text>
            <Text style={styles.infoStripValue}>{game.durationMinutes}min</Text>
          </View>
          <View style={styles.infoStripSep} />
          <View style={styles.infoStripCell}>
            <Ionicons name="people-outline" size={14} color={Colors.accent} />
            <Text style={styles.infoStripLabel}>PLAYERS</Text>
            <Text style={styles.infoStripValue}>{game.currentPlayers}/{game.maxPlayers}</Text>
          </View>
        </View>

        <View style={styles.eloStrip}>
          <View style={styles.eloStripRow}>
            <Text style={styles.eloStripLabel}>ELO RANGE</Text>
            <Text style={styles.eloStripNum}>⚡ {computedMinElo}–{computedMaxElo} · Avg {computedAvgElo}</Text>
          </View>
          {(() => {
            // Always use current user's ELO from auth context or fresh PLAYERS[0]
            const myElo = user?.eloRating ?? 1350;
            // Expand range to include user's ELO if outside game range
            const rangeMin = Math.min(computedMinElo, myElo);
            const rangeMax = Math.max(computedMaxElo, myElo);
            const rangeSpan = rangeMax - rangeMin || 1;
            // Calculate positions as percentage of expanded range
            const myMarkerPct = Math.max(2, Math.min(98, ((myElo - rangeMin) / rangeSpan) * 100));
            const avgMarkerPct = Math.max(2, Math.min(98, ((computedAvgElo - rangeMin) / rangeSpan) * 100));
            // Fill bar goes from left edge to user's position
            const fillPct = myMarkerPct;
            // Calculate percentile vs signed-up players
            const playersBelow = bookingElos.filter((e) => e < myElo).length;
            const pctBetter = bookingElos.length > 0
              ? Math.round((playersBelow / bookingElos.length) * 100)
              : null;
            const betterOrWorse = pctBetter === null
              ? null
              : { label: `better than ${pctBetter}% of signed-up players`, color: pctBetter >= 50 ? Colors.accent : Colors.muted };
            return (
              <View style={styles.eloRangeTrackContainer}>
                <View style={styles.eloRangeTrack}>
                  <View style={[styles.eloRangeFill, { width: `${Math.round(fillPct)}%` as `${number}%` }]} />
                  <View style={[styles.eloRangeAvgLine, { left: `${Math.round(avgMarkerPct)}%` as `${number}%` }]} />
                  <View style={[styles.eloRangeMarkerLine, { left: `${Math.round(myMarkerPct)}%` as `${number}%` }]}>
                    <View style={styles.eloRangeMarkerDot} />
                  </View>
                </View>
                <View style={styles.eloRangeLabelRow}>
                  <Text style={styles.eloRangeMinLabel}>{computedMinElo}</Text>
                  <Text style={styles.eloRangeMyLabel}>You {myElo}</Text>
                  <Text style={styles.eloRangeMaxLabel}>{computedMaxElo}</Text>
                </View>
                {betterOrWorse && (
                  <Text style={styles.eloPctLine}>
                    Your ELO is{" "}
                    <Text style={{ color: betterOrWorse.color, fontFamily: "Inter_600SemiBold" }}>
                      {betterOrWorse.label}
                    </Text>
                  </Text>
                )}
              </View>
            );
          })()}
          <Text style={styles.eloStripCount}>
            {game.maxPlayers - game.currentPlayers} spots remaining · Cutoff 2h before kick-off
          </Text>
        </View>

        {(() => {
          const bookingPlayers = game.bookings.map((b) => b.player);
          const myElo = user?.eloRating ?? PLAYERS[0].eloRating;
          const allElos = bookingPlayers.map((p) => p.eloRating);
          if (allElos.length === 0) return null;
          const minElo = Math.min(...allElos);
          const maxElo = Math.max(...allElos);
          const range = maxElo - minElo || 1;
          const myPct = Math.max(0, Math.min(1, (myElo - minElo) / range));
          const amIIn = bookingPlayers.some((p) => p.id === "p0");
          if (!amIIn) return null;
          return (
            <View style={styles.inGameEloCard}>
              <Text style={styles.inGameEloTitle}>YOUR ELO IN THIS GAME</Text>
              <View style={styles.inGameEloBarOuter}>
                <View style={styles.inGameEloBarFill} />
                <View style={[styles.inGameEloMarker, { left: `${Math.max(0, Math.min(94, myPct * 100))}%` as `${number}%` }]} />
              </View>
              <View style={styles.inGameEloLabels}>
                <Text style={styles.inGameEloMin}>Lowest {minElo}</Text>
                <Text style={styles.inGameEloYou}>You {myElo}</Text>
                <Text style={styles.inGameEloMax}>Highest {maxElo}</Text>
              </View>
            </View>
          );
        })()}

        <View style={styles.organizerCard}>
          <Text style={styles.sectionTitle}>ORGANIZER</Text>
          <Pressable
            style={styles.organizerRow}
            onPress={() => router.push({ pathname: "/player/[id]", params: { id: game.organizer.id } })}
          >
            <View style={[styles.orgAvatar, { backgroundColor: Colors.primary, overflow: "hidden" }]}>
              {game.organizer.profileImageUrl ? (
                <Image source={{ uri: game.organizer.profileImageUrl }} style={{ width: 40, height: 40, borderRadius: 20 }} />
              ) : (
                <Text style={styles.orgAvatarText}>
                  {game.organizer.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                </Text>
              )}
            </View>
            <View style={styles.orgInfo}>
              <Text style={styles.orgName}>{game.organizer.name}</Text>
              <Text style={styles.orgMeta}>
                {game.organizer.eloRating} Elo · {game.organizer.reliabilityScore}% reliable
              </Text>
            </View>
            {isOrganizer && (
              <Pressable
                style={styles.orgPanelBtn}
                onPress={() => router.push({ pathname: "/organizer/[id]", params: { id: game.id } })}
              >
                <Feather name="settings" size={13} color={Colors.accent} />
                <Text style={styles.orgPanelBtnText}>Panel</Text>
              </Pressable>
            )}
          </Pressable>
        </View>

        {game.teamsBalanced && (blueTeam.length > 0 || redTeam.length > 0) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>TEAMS</Text>
            <View style={styles.teamsRow}>
              <View style={[styles.teamCol, { borderTopColor: Colors.blue }]}>
                <Text style={[styles.teamHeader, { color: Colors.blue }]}>Team Blue 🔵</Text>
                <Text style={styles.teamAvgElo}>
                  Avg {Math.round(blueTeam.reduce((s, b) => s + b.player.eloRating, 0) / blueTeam.length)} Elo
                </Text>
                {blueTeam.map((b) => (
                  <Pressable
                    key={b.id}
                    style={styles.teamPlayerRow}
                    onPress={() => router.push({ pathname: "/player/[id]", params: { id: b.player.id } })}
                  >
                    <View style={[styles.miniAvatar, { backgroundColor: Colors.blue + "44", overflow: "hidden" }]}>
                      {b.player.profileImageUrl ? (
                        <Image source={{ uri: b.player.profileImageUrl }} style={{ width: 28, height: 28, borderRadius: 14 }} />
                      ) : (
                        <Text style={styles.miniAvatarText}>
                          {b.player.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                        </Text>
                      )}
                    </View>
                    <Text style={styles.teamPlayerName} numberOfLines={1}>{b.player.name}</Text>
                    {b.player.medal && (
                      <Text style={styles.medalIcon}>
                        {b.player.medal === "gold" ? "🥇" : b.player.medal === "silver" ? "🥈" : "🥉"}
                      </Text>
                    )}
                    <Ionicons name="chevron-forward" size={10} color={Colors.muted} />
                  </Pressable>
                ))}
              </View>
              <View style={[styles.teamCol, { borderTopColor: Colors.red }]}>
                <Text style={[styles.teamHeader, { color: Colors.red }]}>Team Red 🔴</Text>
                <Text style={styles.teamAvgElo}>
                  Avg {redTeam.length > 0 ? Math.round(redTeam.reduce((s, b) => s + b.player.eloRating, 0) / redTeam.length) : "--"} Elo
                </Text>
                {redTeam.map((b) => (
                  <Pressable
                    key={b.id}
                    style={styles.teamPlayerRow}
                    onPress={() => router.push({ pathname: "/player/[id]", params: { id: b.player.id } })}
                  >
                    <View style={[styles.miniAvatar, { backgroundColor: Colors.red + "44", overflow: "hidden" }]}>
                      {b.player.profileImageUrl ? (
                        <Image source={{ uri: b.player.profileImageUrl }} style={{ width: 28, height: 28, borderRadius: 14 }} />
                      ) : (
                        <Text style={styles.miniAvatarText}>
                          {b.player.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                        </Text>
                      )}
                    </View>
                    <Text style={styles.teamPlayerName} numberOfLines={1}>{b.player.name}</Text>
                    {b.player.medal && (
                      <Text style={styles.medalIcon}>
                        {b.player.medal === "gold" ? "🥇" : b.player.medal === "silver" ? "🥈" : "🥉"}
                      </Text>
                    )}
                    <Ionicons name="chevron-forward" size={10} color={Colors.muted} />
                  </Pressable>
                ))}
              </View>
            </View>
          </View>
        )}

        {(() => {
          const playersToShow = !game.teamsBalanced ? game.bookings : unassigned;
          if (playersToShow.length === 0) return null;
          return (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>BOOKED PLAYERS ({playersToShow.length})</Text>
            <View style={styles.playersList}>
              {playersToShow.map((b) => (
                <Pressable
                  key={b.id}
                  style={styles.playerRow}
                  onPress={() => router.push({ pathname: "/player/[id]", params: { id: b.player.id } })}
                >
                  <View style={[styles.playerAvatar, { backgroundColor: Colors.primary + "88", overflow: "hidden" }]}>
                    {b.player.profileImageUrl ? (
                      <Image source={{ uri: b.player.profileImageUrl }} style={{ width: 32, height: 32, borderRadius: 16 }} />
                    ) : (
                      <Text style={styles.playerAvatarText}>
                        {b.player.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                      </Text>
                    )}
                  </View>
                  <Text style={styles.playerName} numberOfLines={1}>{b.player.name}</Text>
                  {b.player.medal && (
                    <Text style={styles.medalIcon}>
                      {b.player.medal === "gold" ? "🥇" : b.player.medal === "silver" ? "🥈" : "🥉"}
                    </Text>
                  )}
                  <Text style={styles.playerElo}>{b.player.eloRating}</Text>
                  <Ionicons name="chevron-forward" size={12} color={Colors.muted} />
                </Pressable>
              ))}
            </View>
          </View>
          );
        })()}

        {game.aiAssignmentCalculated && game.aiAssignment && (
          <View style={styles.section}>
            <View style={styles.aiBanner}>
              <View style={styles.aiBannerLeft}>
                <Ionicons name="sparkles" size={16} color={Colors.accent} />
                <Text style={styles.aiBannerText}>Teams calculated by AI</Text>
              </View>
              <Pressable
                style={styles.aiViewBtn}
                onPress={() => setShowAiModal(true)}
              >
                <Text style={styles.aiViewBtnText}>View Optimal Lineup</Text>
              </Pressable>
            </View>
          </View>
        )}

        {isJoined && (
          <View style={styles.section}>
            <Pressable
              style={styles.carpoolCard}
              onPress={() => router.push({ pathname: "/carpool/[id]", params: { id: game.id } })}
            >
              <View style={styles.carpoolLeft}>
                <Ionicons name="car-outline" size={20} color={Colors.teal} />
                <View>
                  <Text style={styles.carpoolTitle}>Carpooling</Text>
                  <Text style={styles.carpoolSub}>
                    {game.carpoolOffers && game.carpoolOffers.length > 0
                      ? `${game.carpoolOffers.length} rides available`
                      : "Offer or join a ride"}
                  </Text>
                </View>
              </View>
              <Feather name="arrow-right" size={16} color={Colors.teal} />
            </Pressable>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>VENUE LOCATION</Text>
          <View style={styles.mapPlaceholder}>
            <Ionicons name="map-outline" size={28} color={Colors.muted} />
            <Text style={styles.mapText}>{game.venue.address}</Text>
            <Pressable style={styles.directionsBtn}>
              <Ionicons name="navigate-outline" size={12} color={Colors.accent} />
              <Text style={styles.directionsBtnText}>Get Directions</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>VENUE AMENITIES</Text>
          <View style={styles.amenitiesGrid}>
            {game.venue.amenities.map((a) => {
              const info = AMENITY_ICONS[a];
              if (!info) return null;
              return (
                <View key={a} style={styles.amenityChip}>
                  <Ionicons name={info.icon} size={14} color={Colors.accent} />
                  <Text style={styles.amenityText}>{info.label}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {(() => {
          const stats = VENUE_STATS[game.venue.id];
          if (!stats) return null;
          return (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>VENUE STATISTICS</Text>
              <View style={{ backgroundColor: Colors.surface, borderRadius: 12, padding: 14, gap: 10 }}>
                <View style={{ flexDirection: "row", gap: 10 }}>
                  <View style={{ flex: 1, backgroundColor: Colors.overlay, borderRadius: 8, padding: 10, alignItems: "center" }}>
                    <Text style={{ fontFamily: "Inter_700Bold", fontSize: 20, color: Colors.accent }}>{stats.totalGamesPlayed}</Text>
                    <Text style={{ fontFamily: "Inter_400Regular", fontSize: 11, color: Colors.muted, marginTop: 2 }}>Games Played</Text>
                  </View>
                  <View style={{ flex: 1, backgroundColor: Colors.overlay, borderRadius: 8, padding: 10, alignItems: "center" }}>
                    <Text style={{ fontFamily: "Inter_700Bold", fontSize: 16, color: Colors.text }}>{stats.mostActiveDay}</Text>
                    <Text style={{ fontFamily: "Inter_400Regular", fontSize: 11, color: Colors.muted, marginTop: 2 }}>Most Active</Text>
                  </View>
                  <View style={{ flex: 1, backgroundColor: Colors.overlay, borderRadius: 8, padding: 10, alignItems: "center" }}>
                    <Text style={{ fontFamily: "Inter_700Bold", fontSize: 16, color: Colors.text }}>{stats.peakTime}</Text>
                    <Text style={{ fontFamily: "Inter_400Regular", fontSize: 11, color: Colors.muted, marginTop: 2 }}>Peak Time</Text>
                  </View>
                </View>
                <View style={{ gap: 4 }}>
                  <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 11, color: Colors.muted, letterSpacing: 1 }}>TOP PLAYERS HERE</Text>
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 2 }}>
                    {stats.topPlayers.map((name, i) => (
                      <View key={i} style={{ backgroundColor: `${Colors.primary}33`, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 }}>
                        <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 12, color: Colors.accent }}>{i === 0 ? "⭐ " : ""}{name}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            </View>
          );
        })()}

        {game.venue.communityLink && (
          <View style={styles.section}>
            <Pressable
              style={styles.communityChatBtn}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                Linking.openURL(game.venue.communityLink!);
              }}
            >
              <Ionicons
                name={game.venue.communityType === "whatsapp" ? "logo-whatsapp" : "send-outline"}
                size={20}
                color={game.venue.communityType === "whatsapp" ? "#25D366" : "#0088cc"}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.communityChatTitle}>
                  {game.venue.communityType === "whatsapp" ? "WhatsApp Community" : "Telegram Community"}
                </Text>
                <Text style={styles.communityChatSub}>{game.venue.name} · Open to all players</Text>
              </View>
              <Feather name="arrow-right" size={15} color={Colors.muted} />
            </Pressable>
          </View>
        )}

        {isJoined && (
          <View style={styles.section}>
            <Pressable
              style={styles.chatBtn}
              onPress={() => router.push({ pathname: "/chat/[id]", params: { id: game.id } })}
            >
              <Ionicons name="chatbubbles-outline" size={18} color={Colors.accent} />
              <Text style={styles.chatBtnText}>Open Game Chat</Text>
              <Feather name="arrow-right" size={15} color={Colors.accent} />
            </Pressable>
          </View>
        )}

        {game.status === "completed" && (
          <View style={styles.section}>
            <Pressable
              style={styles.matchStatsBtn}
              onPress={() => router.push({ pathname: "/match-stats/[id]", params: { id: game.id } })}
            >
              <Ionicons name="stats-chart" size={18} color={Colors.accent} />
              <View style={{ flex: 1 }}>
                <Text style={styles.matchStatsBtnTitle}>Match Stats</Text>
                <Text style={styles.matchStatsBtnSub}>Goals · Cards · MVP voting</Text>
              </View>
              <Feather name="arrow-right" size={15} color={Colors.accent} />
            </Pressable>
          </View>
        )}
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: Math.max(bottomPadding, 12) + 8 }]}>
        {game.status === "completed" || game.status === "canceled" ? (
          game.status === "canceled" ? (
            <View style={styles.disabledBtn}>
              <Ionicons name="close-circle-outline" size={16} color={Colors.muted} />
              <Text style={styles.disabledBtnText}>Game Cancelled</Text>
            </View>
          ) : isJoined ? (
            <Pressable
              style={({ pressed }) => [styles.rateBtn, pressed && { opacity: 0.85 }]}
              onPress={() => router.push({ pathname: "/rate/[id]", params: { id: game.id } })}
            >
              <Ionicons name="star-outline" size={16} color={Colors.text} />
              <Text style={styles.rateBtnText}>Rate Your Teammates</Text>
              <Feather name="arrow-right" size={16} color={Colors.text} />
            </Pressable>
          ) : (
            <View style={styles.disabledBtn}>
              <Ionicons name="trophy-outline" size={16} color={Colors.muted} />
              <Text style={styles.disabledBtnText}>Match Completed</Text>
            </View>
          )
        ) : isJoined ? (
          <View style={styles.joinedBar}>
            <View style={styles.joinedBadge}>
              <Ionicons name="checkmark-circle" size={18} color={Colors.accent} />
              <Text style={styles.joinedBadgeText}>You're In!</Text>
            </View>
            <Pressable
              style={styles.leaveBtn}
              onPress={() => setShowLeaveConfirm(true)}
            >
              <Text style={styles.leaveBtnText}>Leave</Text>
            </Pressable>
          </View>
        ) : isFull ? (
          <View style={styles.disabledBtn}>
            <Text style={styles.disabledBtnText}>Game Full</Text>
          </View>
        ) : !isLoggedIn ? (
          <Pressable
            style={styles.loginBtn}
            onPress={() => router.push("/auth")}
          >
            <Ionicons name="person-outline" size={16} color={Colors.text} />
            <Text style={styles.bookBtnText}>Log In to Join</Text>
          </Pressable>
        ) : (
          <Pressable
            style={({ pressed }) => [styles.bookBtn, pressed && { opacity: 0.85 }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowPayment(true);
            }}
          >
            <Text style={styles.bookBtnText}>Book Now · {formatPrice(game.pricePerPlayer, game.cityId)}</Text>
            <Feather name="arrow-right" size={16} color={Colors.text} />
          </Pressable>
        )}
      </View>

      <PaymentModal
        visible={showPayment}
        game={game}
        onClose={() => setShowPayment(false)}
        onSuccess={() => setIsJoined(true)}
      />

      <Modal visible={showLeaveConfirm} transparent animationType="fade" onRequestClose={() => setShowLeaveConfirm(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowLeaveConfirm(false)} />
        <View style={styles.confirmSheet}>
          <Text style={styles.confirmTitle}>Leave this game?</Text>
          <Text style={styles.confirmSub}>
            You'll receive a full refund minus the Stripe fee (~3%). This may take 5-7 business days.
          </Text>
          <View style={styles.confirmBtns}>
            <Pressable style={styles.confirmCancel} onPress={() => setShowLeaveConfirm(false)}>
              <Text style={styles.confirmCancelText}>Keep Spot</Text>
            </Pressable>
            <Pressable
              style={styles.confirmLeave}
              onPress={() => {
                setIsJoined(false);
                setShowLeaveConfirm(false);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              <Text style={styles.confirmLeaveText}>Leave & Refund</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal visible={showAiModal} transparent animationType="slide" onRequestClose={() => setShowAiModal(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowAiModal(false)} />
        <View style={[styles.modalSheet, { maxHeight: "88%" }]}>
          <View style={styles.modalHandle} />
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <Ionicons name="sparkles" size={18} color={Colors.accent} />
            <Text style={styles.modalTitle}>AI Optimal Lineup</Text>
            <View style={{ flex: 1 }} />
            {game?.aiAssignment && (
              <View style={styles.aiBalancePill}>
                <Text style={styles.aiBalancePillText}>⚡ {game.aiAssignment.balanceScore}/100</Text>
              </View>
            )}
          </View>
          {game?.aiAssignment && (
            <>
              {/* Horizontal pitch visual */}
              <View style={styles.pitchContainer}>
                <View style={styles.pitchField}>
                  <View style={styles.pitchCenterLine} />
                  <View style={styles.pitchCenterCircle} />
                  {/* Blue side (left) — grouped by preferred position */}
                  <View style={[styles.pitchHalf, { left: 0 }]}>
                    {(() => {
                      const blueNames = game.aiAssignment.teamBlue;
                      const positions = ["GK", "DEF", "MID", "FWD"];
                      const grouped: Record<string, string[]> = { GK: [], DEF: [], MID: [], FWD: [] };
                      for (const name of blueNames) {
                        const p = PLAYERS.find((pl) => pl.name === name);
                        const pos = p?.preferredPositions[0] ?? "MID";
                        (grouped[pos] ?? grouped["MID"]).push(name);
                      }
                      return positions.map((pos) => {
                        const players = grouped[pos] ?? [];
                        if (players.length === 0) return null;
                        return (
                          <View key={pos} style={styles.pitchPositionCol}>
                            {players.map((name, ni) => {
                              const p = PLAYERS.find((pl) => pl.name === name);
                              const foot = p?.footPreference;
                              const footEmoji = foot === "left" ? "L" : foot === "both" ? "★" : "R";
                              return (
                                <View key={ni} style={styles.pitchPlayerDot}>
                                  <View style={[styles.pitchDotCircle, { backgroundColor: Colors.blue }]}>
                                    <Text style={styles.pitchDotText}>{name.split(" ")[0].slice(0, 3)}</Text>
                                  </View>
                                  <Text style={styles.pitchPosLabel}>{pos}</Text>
                                  {foot && (
                                    <Text style={[styles.pitchFootBadge, foot === "left" ? { color: Colors.amber } : foot === "both" ? { color: Colors.accent } : {}]}>
                                      {footEmoji}
                                    </Text>
                                  )}
                                </View>
                              );
                            })}
                          </View>
                        );
                      });
                    })()}
                  </View>
                  {/* Red side (right) — grouped by preferred position */}
                  <View style={[styles.pitchHalf, { right: 0, flexDirection: "row-reverse" }]}>
                    {(() => {
                      const redNames = game.aiAssignment.teamRed;
                      const positions = ["GK", "DEF", "MID", "FWD"];
                      const grouped: Record<string, string[]> = { GK: [], DEF: [], MID: [], FWD: [] };
                      for (const name of redNames) {
                        const p = PLAYERS.find((pl) => pl.name === name);
                        const pos = p?.preferredPositions[0] ?? "MID";
                        (grouped[pos] ?? grouped["MID"]).push(name);
                      }
                      return positions.map((pos) => {
                        const players = grouped[pos] ?? [];
                        if (players.length === 0) return null;
                        return (
                          <View key={pos} style={styles.pitchPositionCol}>
                            {players.map((name, ni) => {
                              const p = PLAYERS.find((pl) => pl.name === name);
                              const foot = p?.footPreference;
                              const footEmoji = foot === "left" ? "L" : foot === "both" ? "★" : "R";
                              return (
                                <View key={ni} style={styles.pitchPlayerDot}>
                                  <View style={[styles.pitchDotCircle, { backgroundColor: Colors.red }]}>
                                    <Text style={styles.pitchDotText}>{name.split(" ")[0].slice(0, 3)}</Text>
                                  </View>
                                  <Text style={styles.pitchPosLabel}>{pos}</Text>
                                  {foot && (
                                    <Text style={[styles.pitchFootBadge, foot === "left" ? { color: Colors.amber } : foot === "both" ? { color: Colors.accent } : {}]}>
                                      {footEmoji}
                                    </Text>
                                  )}
                                </View>
                              );
                            })}
                          </View>
                        );
                      });
                    })()}
                  </View>
                </View>
                <View style={styles.pitchTeamLabels}>
                  <Text style={[styles.pitchTeamLabel, { color: Colors.blue }]}>🔵 Blue</Text>
                  <Text style={[styles.pitchTeamLabel, { color: Colors.red }]}>Red 🔴</Text>
                </View>
              </View>

              {/* Match Prediction */}
              {(() => {
                const blueBookings = game.bookings.filter((b) => b.teamAssignment === "blue");
                const redBookings = game.bookings.filter((b) => b.teamAssignment === "red");
                const blueAvg = blueBookings.length > 0
                  ? Math.round(blueBookings.reduce((s, b) => s + b.player.eloRating, 0) / blueBookings.length)
                  : game.avgElo;
                const redAvg = redBookings.length > 0
                  ? Math.round(redBookings.reduce((s, b) => s + b.player.eloRating, 0) / redBookings.length)
                  : game.avgElo;
                const diff = blueAvg - redAvg;
                const blueWinChance = Math.round(50 + Math.min(35, Math.max(-35, diff / 10)));
                const redWinChance = 100 - blueWinChance;
                const blueOdds = (100 / blueWinChance).toFixed(2);
                const redOdds = (100 / redWinChance).toFixed(2);
                return (
                  <View style={styles.predictionCard}>
                    <Text style={styles.predictionTitle}>MATCH PREDICTION</Text>
                    <View style={styles.predictionRow}>
                      <View style={styles.predictionSide}>
                        <Text style={[styles.predictionTeam, { color: Colors.blue }]}>Blue</Text>
                        <Text style={styles.predictionAvgElo}>Avg {blueAvg} ELO</Text>
                        <Text style={styles.predictionChance}>{blueWinChance}%</Text>
                        <Text style={styles.predictionOdds}>{blueOdds}x</Text>
                      </View>
                      <View style={styles.predictionVs}>
                        <Text style={styles.predictionVsText}>VS</Text>
                        <Text style={styles.predictionDraw}>Draw ~{Math.round(blueWinChance * redWinChance / 100)}%</Text>
                      </View>
                      <View style={styles.predictionSide}>
                        <Text style={[styles.predictionTeam, { color: Colors.red }]}>Red</Text>
                        <Text style={styles.predictionAvgElo}>Avg {redAvg} ELO</Text>
                        <Text style={styles.predictionChance}>{redWinChance}%</Text>
                        <Text style={styles.predictionOdds}>{redOdds}x</Text>
                      </View>
                    </View>
                    <View style={styles.predictionBar}>
                      <View style={[styles.predictionBarBlue, { flex: blueWinChance }]} />
                      <View style={[styles.predictionBarRed, { flex: redWinChance }]} />
                    </View>
                  </View>
                );
              })()}

              <View style={styles.aiReasoningCard}>
                <Ionicons name="information-circle-outline" size={13} color={Colors.muted} />
                <Text style={styles.aiReasoningText}>{game.aiAssignment.reasoning}</Text>
              </View>
            </>
          )}
          <Pressable style={styles.modalPayBtn} onPress={() => setShowAiModal(false)}>
            <Text style={styles.modalPayBtnText}>Got It</Text>
          </Pressable>
        </View>
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
    paddingBottom: 8,
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
    fontSize: 16,
    color: Colors.text,
    letterSpacing: 3,
  },
  scroll: { flex: 1 },
  notFound: { flex: 1, alignItems: "center", justifyContent: "center" },
  notFoundText: { fontFamily: "Inter_600SemiBold", fontSize: 16, color: Colors.muted },
  heroContainer: {
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: "hidden",
    height: 180,
    marginBottom: 14,
  },
  heroImage: { width: "100%", height: "100%" },
  heroGradient: { position: "absolute", inset: 0 },
  heroOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 14,
    gap: 4,
  },
  skillBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-start",
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    marginBottom: 4,
  },
  skillDot: { width: 5, height: 5, borderRadius: 3 },
  skillBadgeText: { fontFamily: "Inter_600SemiBold", fontSize: 10, letterSpacing: 0.3 },
  heroVenueName: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
    color: Colors.text,
    letterSpacing: -0.3,
  },
  heroAddress: { fontFamily: "Inter_400Regular", fontSize: 12, color: "rgba(230,226,223,0.7)" },
  infoStrip: {
    flexDirection: "row",
    backgroundColor: Colors.surface,
    marginHorizontal: 16,
    borderRadius: 14,
    marginBottom: 12,
    overflow: "hidden",
  },
  infoStripCell: { flex: 1, alignItems: "center", paddingVertical: 14, gap: 3 },
  infoStripLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 9,
    color: Colors.muted,
    letterSpacing: 0.8,
    marginTop: 2,
  },
  infoStripValue: { fontFamily: "Inter_700Bold", fontSize: 11, color: Colors.text, textAlign: "center" },
  infoStripSep: { width: 1, backgroundColor: Colors.separator, marginVertical: 14 },
  eloStrip: {
    backgroundColor: Colors.surface,
    marginHorizontal: 16,
    borderRadius: 14,
    padding: 14,
    gap: 6,
    marginBottom: 12,
  },
  eloStripRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  eloStripLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 9,
    color: Colors.muted,
    letterSpacing: 1.5,
  },
  eloStripNum: { fontFamily: "Inter_700Bold", fontSize: 12, color: Colors.text },
  eloRangeTrackContainer: { marginVertical: 6 },
  eloRangeTrack: {
    height: 6,
    backgroundColor: Colors.overlay,
    borderRadius: 999,
    position: "relative",
    overflow: "visible",
  },
  eloRangeFill: {
    position: "absolute",
    top: 0,
    left: 0,
    height: 6,
    borderRadius: 999,
    backgroundColor: Colors.primary,
  },
  eloRangeAvgLine: {
    position: "absolute",
    top: -2,
    width: 2,
    height: 10,
    backgroundColor: Colors.muted,
    borderRadius: 1,
    opacity: 0.5,
  },
  eloRangeMarkerLine: {
    position: "absolute",
    top: -3,
    width: 2,
    height: 12,
    backgroundColor: Colors.accent,
    borderRadius: 1,
    alignItems: "center",
  },
  eloRangeMarkerDot: {
    position: "absolute",
    top: -4,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.accent,
    borderWidth: 2,
    borderColor: Colors.surface,
    left: -4,
  },
  eloRangeLabelRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 8 },
  eloRangeMinLabel: { fontFamily: "Inter_400Regular", fontSize: 9, color: Colors.muted },
  eloRangeMyLabel: { fontFamily: "Inter_600SemiBold", fontSize: 9, color: Colors.accent },
  eloRangeMaxLabel: { fontFamily: "Inter_400Regular", fontSize: 9, color: Colors.muted },
  eloPctLine: { fontFamily: "Inter_400Regular", fontSize: 11, color: Colors.muted, marginTop: 8 },
  eloStripCount: { fontFamily: "Inter_400Regular", fontSize: 11, color: Colors.muted },
  section: { paddingHorizontal: 16, marginBottom: 14 },
  sectionTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 9,
    color: Colors.muted,
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  organizerCard: { paddingHorizontal: 16, marginBottom: 14 },
  organizerRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  orgAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  orgAvatarText: { fontFamily: "Inter_700Bold", fontSize: 14, color: Colors.text },
  orgInfo: { flex: 1 },
  orgName: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: Colors.text },
  orgMeta: { fontFamily: "Inter_400Regular", fontSize: 11, color: Colors.muted },
  orgPanelBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: `${Colors.accent}22`,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  orgPanelBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 11, color: Colors.accent },
  teamsRow: { flexDirection: "row", gap: 10 },
  teamCol: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 12,
    borderTopWidth: 2,
    gap: 5,
  },
  teamHeader: { fontFamily: "Inter_700Bold", fontSize: 12 },
  teamAvgElo: { fontFamily: "Inter_600SemiBold", fontSize: 10, color: Colors.muted, marginBottom: 4 },
  teamPlayerRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  miniAvatar: { width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  miniAvatarText: { fontFamily: "Inter_700Bold", fontSize: 8, color: Colors.text },
  teamPlayerName: { flex: 1, fontFamily: "Inter_400Regular", fontSize: 11, color: Colors.muted },
  playersList: { backgroundColor: Colors.surface, borderRadius: 12, overflow: "hidden" },
  playerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.separator,
    gap: 9,
  },
  playerAvatar: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  playerAvatarText: { fontFamily: "Inter_700Bold", fontSize: 11, color: Colors.text },
  playerName: { flex: 1, fontFamily: "Inter_500Medium", fontSize: 13, color: Colors.text },
  playerElo: { fontFamily: "Inter_600SemiBold", fontSize: 11, color: Colors.muted },
  mapPlaceholder: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    height: 110,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  mapText: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.muted,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  directionsBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  directionsBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    color: Colors.accent,
  },
  amenitiesGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  amenityChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: Colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
  },
  amenityText: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.muted },
  chatBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: `${Colors.accent}33`,
  },
  chatBtnText: {
    flex: 1,
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.accent,
  },
  bottomBar: {
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.separator,
  },
  bookBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  loginBtn: {
    backgroundColor: Colors.overlay,
    borderRadius: 12,
    paddingVertical: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.separator,
  },
  bookBtnText: { fontFamily: "Inter_700Bold", fontSize: 15, color: Colors.text, letterSpacing: 0.3 },
  disabledBtn: {
    backgroundColor: Colors.overlay,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  disabledBtnText: { fontFamily: "Inter_700Bold", fontSize: 15, color: Colors.muted },
  rateBtn: {
    backgroundColor: Colors.amber,
    borderRadius: 14,
    paddingVertical: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  rateBtnText: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    color: Colors.text,
    letterSpacing: 0.3,
  },
  joinedBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  joinedBadge: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: `${Colors.primary}33`,
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: `${Colors.accent}55`,
  },
  joinedBadgeText: { fontFamily: "Inter_700Bold", fontSize: 15, color: Colors.accent },
  leaveBtn: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.overlay,
    borderWidth: 1,
    borderColor: `${Colors.red}44`,
  },
  leaveBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: Colors.red },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  modalSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    gap: 16,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.overlay,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 4,
  },
  modalTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
    color: Colors.text,
    textAlign: "center",
  },
  modalGameCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.overlay,
    borderRadius: 12,
    padding: 14,
    gap: 12,
  },
  modalGameName: { fontFamily: "Inter_700Bold", fontSize: 14, color: Colors.text },
  modalGameTime: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.muted, marginTop: 2 },
  modalBreakdown: { gap: 10 },
  modalRow: { flexDirection: "row", justifyContent: "space-between" },
  modalRowLabel: { fontFamily: "Inter_400Regular", fontSize: 14, color: Colors.muted },
  modalRowValue: { fontFamily: "Inter_500Medium", fontSize: 14, color: Colors.text },
  modalRowTotal: {
    borderTopWidth: 1,
    borderTopColor: Colors.separator,
    paddingTop: 10,
    marginTop: 2,
  },
  modalRowTotalLabel: { fontFamily: "Inter_700Bold", fontSize: 15, color: Colors.text },
  modalRowTotalValue: { fontFamily: "Inter_700Bold", fontSize: 18, color: Colors.accent },
  modalInfo: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    backgroundColor: Colors.overlay,
    borderRadius: 10,
    padding: 10,
  },
  modalInfoText: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.muted,
    lineHeight: 17,
  },
  modalPayBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  modalPayBtnText: { fontFamily: "Inter_700Bold", fontSize: 16, color: Colors.text },
  payingState: { alignItems: "center", paddingVertical: 40, gap: 16 },
  payingText: { fontFamily: "Inter_500Medium", fontSize: 15, color: Colors.muted },
  successState: { alignItems: "center", paddingVertical: 20, gap: 12 },
  successTitle: { fontFamily: "Inter_700Bold", fontSize: 24, color: Colors.text },
  successSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.muted,
    textAlign: "center",
    lineHeight: 20,
  },
  successBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 40,
    marginTop: 8,
  },
  successBtnText: { fontFamily: "Inter_700Bold", fontSize: 15, color: Colors.text },
  confirmSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 36,
    gap: 14,
  },
  confirmTitle: { fontFamily: "Inter_700Bold", fontSize: 20, color: Colors.text },
  confirmSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.muted,
    lineHeight: 20,
  },
  confirmBtns: { flexDirection: "row", gap: 10 },
  confirmCancel: {
    flex: 1,
    backgroundColor: Colors.overlay,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  confirmCancelText: { fontFamily: "Inter_700Bold", fontSize: 14, color: Colors.text },
  confirmLeave: {
    flex: 1,
    backgroundColor: `${Colors.red}22`,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: `${Colors.red}55`,
  },
  confirmLeaveText: { fontFamily: "Inter_700Bold", fontSize: 14, color: Colors.red },
  aiBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: `${Colors.accent}15`,
    borderRadius: 12,
    padding: 13,
    borderWidth: 1,
    borderColor: `${Colors.accent}33`,
  },
  aiBannerLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  aiBannerText: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: Colors.accent },
  aiViewBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  aiViewBtnText: { fontFamily: "Inter_700Bold", fontSize: 11, color: Colors.text },
  carpoolCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: `${Colors.teal}33`,
  },
  carpoolLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  carpoolTitle: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: Colors.text },
  carpoolSub: { fontFamily: "Inter_400Regular", fontSize: 11, color: Colors.muted },
  carpoolModalSub: { fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.muted, marginBottom: 4 },
  carpoolOfferCard: {
    backgroundColor: Colors.overlay,
    borderRadius: 12,
    padding: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: `${Colors.teal}22`,
  },
  carpoolOfferTop: { flexDirection: "row", alignItems: "center", gap: 10 },
  carpoolDriverAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  carpoolDriverInitials: { fontFamily: "Inter_700Bold", fontSize: 13 },
  carpoolDriverName: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: Colors.text },
  carpoolDeparture: { fontFamily: "Inter_400Regular", fontSize: 11, color: Colors.muted },
  carpoolSeats: {
    backgroundColor: `${Colors.teal}22`,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  carpoolSeatsText: { fontFamily: "Inter_600SemiBold", fontSize: 11, color: Colors.teal },
  carpoolMeetPoint: { flexDirection: "row", alignItems: "center", gap: 5 },
  carpoolMeetPointText: { fontFamily: "Inter_400Regular", fontSize: 11, color: Colors.muted },
  carpoolJoinBtn: {
    backgroundColor: Colors.teal,
    borderRadius: 8,
    paddingVertical: 9,
    alignItems: "center",
  },
  carpoolJoinBtnText: { fontFamily: "Inter_700Bold", fontSize: 13, color: Colors.text },
  aiBalanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: Colors.overlay,
    borderRadius: 10,
    padding: 12,
    marginVertical: 12,
  },
  aiBalanceLabel: { fontFamily: "Inter_500Medium", fontSize: 13, color: Colors.muted },
  aiBalanceScore: { fontFamily: "Inter_700Bold", fontSize: 18, color: Colors.accent },
  aiTeamsRow: { flexDirection: "row", gap: 10, marginBottom: 12 },
  aiTeamCol: {
    flex: 1,
    backgroundColor: Colors.overlay,
    borderRadius: 10,
    padding: 10,
    borderTopWidth: 2,
    gap: 4,
  },
  aiTeamHeader: { fontFamily: "Inter_700Bold", fontSize: 12, marginBottom: 4 },
  aiPlayerName: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.text },
  aiReasoningCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    backgroundColor: `${Colors.primary}22`,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  aiReasoningText: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: Colors.muted,
    lineHeight: 16,
  },
  medalIcon: { fontSize: 14 },
  inGameEloCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    gap: 8,
  },
  inGameEloTitle: { fontFamily: "Inter_700Bold", fontSize: 10, color: Colors.muted, letterSpacing: 1.5 },
  inGameEloBarOuter: {
    height: 8,
    backgroundColor: Colors.overlay,
    borderRadius: 999,
    position: "relative",
    overflow: "visible",
  },
  inGameEloBarFill: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: "100%",
    backgroundColor: `${Colors.accent}33`,
    borderRadius: 999,
  },
  inGameEloMarker: {
    position: "absolute",
    top: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.accent,
    borderWidth: 2,
    borderColor: Colors.base,
  },
  inGameEloLabels: { flexDirection: "row", justifyContent: "space-between" },
  inGameEloMin: { fontFamily: "Inter_400Regular", fontSize: 10, color: Colors.muted },
  inGameEloYou: { fontFamily: "Inter_700Bold", fontSize: 10, color: Colors.accent },
  inGameEloMax: { fontFamily: "Inter_400Regular", fontSize: 10, color: Colors.muted },
  aiBalancePill: {
    backgroundColor: `${Colors.accent}22`,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: `${Colors.accent}33`,
  },
  aiBalancePillText: { fontFamily: "Inter_700Bold", fontSize: 11, color: Colors.accent },
  pitchContainer: { marginBottom: 12 },
  pitchField: {
    backgroundColor: "#1a4a1a",
    borderRadius: 10,
    height: 150,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#2d6a2d",
    position: "relative",
  },
  pitchCenterLine: {
    position: "absolute",
    left: "50%" as any,
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  pitchCenterCircle: {
    position: "absolute",
    left: "50%" as any,
    top: "50%" as any,
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    marginLeft: -20,
    marginTop: -20,
  },
  pitchHalf: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: "50%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 4,
  },
  pitchPositionCol: {
    alignItems: "center",
    justifyContent: "space-around",
    flex: 1,
    gap: 4,
  },
  pitchPlayerDot: { alignItems: "center", gap: 2 },
  pitchDotCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  pitchDotText: { fontFamily: "Inter_700Bold", fontSize: 6, color: Colors.text },
  pitchPosLabel: { fontFamily: "Inter_700Bold", fontSize: 7, color: "rgba(255,255,255,0.6)" },
  pitchFootBadge: { fontFamily: "Inter_700Bold", fontSize: 6, color: "rgba(255,255,255,0.5)" },
  pitchTeamLabels: { flexDirection: "row", justifyContent: "space-between", marginTop: 6, paddingHorizontal: 4 },
  pitchTeamLabel: { fontFamily: "Inter_700Bold", fontSize: 11 },
  predictionCard: {
    backgroundColor: Colors.overlay,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    gap: 12,
  },
  predictionTitle: { fontFamily: "Inter_700Bold", fontSize: 10, color: Colors.muted, letterSpacing: 1.5 },
  predictionRow: { flexDirection: "row", alignItems: "center" },
  predictionSide: { flex: 1, alignItems: "center", gap: 2 },
  predictionTeam: { fontFamily: "Inter_700Bold", fontSize: 14 },
  predictionAvgElo: { fontFamily: "Inter_400Regular", fontSize: 10, color: Colors.muted },
  predictionChance: { fontFamily: "Inter_700Bold", fontSize: 26, color: Colors.text },
  predictionOdds: { fontFamily: "Inter_400Regular", fontSize: 10, color: Colors.muted },
  predictionVs: { alignItems: "center", paddingHorizontal: 8, gap: 4 },
  predictionVsText: { fontFamily: "Inter_700Bold", fontSize: 12, color: Colors.muted },
  predictionDraw: { fontFamily: "Inter_400Regular", fontSize: 9, color: Colors.muted, textAlign: "center" },
  predictionBar: { flexDirection: "row", height: 6, borderRadius: 999, overflow: "hidden" },
  predictionBarBlue: { backgroundColor: Colors.blue },
  predictionBarRed: { backgroundColor: Colors.red },
  communityChatBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.separator,
  },
  communityChatTitle: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: Colors.text },
  communityChatSub: { fontFamily: "Inter_400Regular", fontSize: 11, color: Colors.muted, marginTop: 1 },
  matchStatsBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.accent + "44",
  },
  matchStatsBtnTitle: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: Colors.accent },
  matchStatsBtnSub: { fontFamily: "Inter_400Regular", fontSize: 11, color: Colors.muted, marginTop: 1 },
});
