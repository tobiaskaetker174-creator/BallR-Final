import { Ionicons, Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { ComponentProps } from "react";
import {
  Linking,
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
  VENUES_LIST,
  Game,
  formatGameTime,
  formatPrice,
  getSkillColor,
  getSkillLabel,
  getSurfaceIcon,
} from "@/constants/mock";

const AMENITY_ICONS: Record<string, { icon: ComponentProps<typeof Ionicons>["name"]; label: string }> = {
  changing_rooms: { icon: "shirt-outline", label: "Changing Rooms" },
  showers: { icon: "water-outline", label: "Showers" },
  parking: { icon: "car-outline", label: "Parking" },
  lights: { icon: "flashlight-outline", label: "Floodlights" },
  bar: { icon: "beer-outline", label: "Bar" },
};

function MiniGameCard({ game }: { game: Game }) {
  const skillColor = getSkillColor(game.skillLevel);
  const isFull = game.status === "full" || game.currentPlayers >= game.maxPlayers;
  const isCompleted = game.status === "completed";

  return (
    <Pressable
      style={({ pressed }) => [styles.miniCard, pressed && { opacity: 0.8 }]}
      onPress={() => router.push({ pathname: "/game/[id]", params: { id: game.id } })}
    >
      <View style={styles.miniCardLeft}>
        <View style={styles.miniCardTopRow}>
          <View style={[styles.skillDot, { backgroundColor: skillColor }]} />
          <Text style={styles.miniCardSkill}>{getSkillLabel(game.skillLevel).toUpperCase()}</Text>
          {isCompleted && (
            <View style={styles.completedBadge}>
              <Text style={styles.completedBadgeText}>COMPLETED</Text>
            </View>
          )}
          {isFull && !isCompleted && (
            <View style={styles.fullBadge}>
              <Text style={styles.fullBadgeText}>FULL</Text>
            </View>
          )}
        </View>
        <Text style={styles.miniCardTime}>{formatGameTime(game.gameTime)}</Text>
        <View style={styles.miniCardMeta}>
          <Ionicons name="people-outline" size={11} color={Colors.muted} />
          <Text style={styles.miniCardMetaText}>{game.currentPlayers}/{game.maxPlayers} players</Text>
          <View style={styles.miniCardDot} />
          <Ionicons name="time-outline" size={11} color={Colors.muted} />
          <Text style={styles.miniCardMetaText}>{game.durationMinutes}min</Text>
        </View>
      </View>
      <View style={styles.miniCardRight}>
        <Text style={styles.miniCardPrice}>{formatPrice(game.pricePerPlayer, game.cityId)}</Text>
        <Ionicons name="chevron-forward" size={14} color={Colors.muted} />
      </View>
    </Pressable>
  );
}

export default function VenueDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const bottomPadding = Platform.OS === "web" ? 34 : insets.bottom;

  const venue = VENUES_LIST.find((v) => v.id === id);

  if (!venue) {
    return (
      <View style={[styles.container, { paddingTop: topPadding }]}>
        <View style={styles.navBar}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.navBtn, pressed && { opacity: 0.7 }]}
          >
            <Ionicons name="arrow-back" size={20} color={Colors.text} />
          </Pressable>
          <Text style={styles.navTitle}>VENUE</Text>
          <View style={styles.navBtn} />
        </View>
        <View style={styles.notFound}>
          <Ionicons name="location-outline" size={40} color={Colors.muted} />
          <Text style={styles.notFoundText}>Venue not found</Text>
        </View>
      </View>
    );
  }

  const allVenueGames = ALL_GAMES.filter((g) => g.venue.id === venue.id);
  const upcomingGames = allVenueGames
    .filter((g) => g.status === "upcoming" || g.status === "full" || g.status === "in_progress")
    .sort((a, b) => new Date(a.gameTime).getTime() - new Date(b.gameTime).getTime());
  const pastGames = allVenueGames
    .filter((g) => g.status === "completed")
    .sort((a, b) => new Date(b.gameTime).getTime() - new Date(a.gameTime).getTime())
    .slice(0, 3);

  const initials = venue.name
    .split(" ")
    .filter((w) => w.length > 2)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

  const surfaceLabel = getSurfaceIcon(venue.surfaceType);
  const cityLabel = venue.cityId === "bangkok" ? "Bangkok" : "Bali";

  return (
    <View style={[styles.container, { paddingTop: topPadding }]}>
      <View style={styles.navBar}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.navBtn, pressed && { opacity: 0.7 }]}
        >
          <Ionicons name="arrow-back" size={20} color={Colors.text} />
        </Pressable>
        <Text style={styles.navTitle}>VENUE</Text>
        <View style={styles.navBtn} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottomPadding + 24 }}
      >
        <View style={styles.hero}>
          <LinearGradient
            colors={[Colors.primary, "#1A3A17"]}
            style={styles.heroGradient}
          />
          <View style={styles.heroInitials}>
            <Text style={styles.heroInitialsText}>{initials}</Text>
          </View>
          <LinearGradient
            colors={["transparent", "rgba(20,19,18,0.9)"]}
            style={styles.heroBottomGradient}
          />
          <View style={styles.heroOverlay}>
            <View style={styles.heroBadgeRow}>
              <View style={styles.cityBadge}>
                <Ionicons name="location-outline" size={11} color={Colors.accent} />
                <Text style={styles.cityBadgeText}>{cityLabel}</Text>
              </View>
              <View style={[styles.surfaceBadge, {
                backgroundColor:
                  venue.surfaceType === "grass" ? `${Colors.accent}22` :
                  venue.surfaceType === "turf" ? `${Colors.teal}22` :
                  `${Colors.purple}22`,
              }]}>
                <Text style={[styles.surfaceBadgeText, {
                  color:
                    venue.surfaceType === "grass" ? Colors.accent :
                    venue.surfaceType === "turf" ? Colors.teal :
                    Colors.purple,
                }]}>
                  {surfaceLabel.toUpperCase()}
                </Text>
              </View>
            </View>
            <Text style={styles.heroName}>{venue.name}</Text>
            <Text style={styles.heroAddress}>{venue.address}</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          {venue.capacity && (
            <View style={styles.statCell}>
              <Ionicons name="people-outline" size={16} color={Colors.accent} />
              <Text style={styles.statValue}>{venue.capacity}</Text>
              <Text style={styles.statLabel}>CAPACITY</Text>
            </View>
          )}
          <View style={styles.statCell}>
            <Ionicons name="football-outline" size={16} color={Colors.accent} />
            <Text style={styles.statValue}>{allVenueGames.length}</Text>
            <Text style={styles.statLabel}>GAMES HOSTED</Text>
          </View>
          <View style={styles.statCell}>
            <Ionicons name="location-outline" size={16} color={Colors.accent} />
            <Text style={styles.statValue}>{venue.amenities.length}</Text>
            <Text style={styles.statLabel}>AMENITIES</Text>
          </View>
        </View>

        {venue.amenities.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>AMENITIES</Text>
            <View style={styles.amenitiesGrid}>
              {venue.amenities.map((a) => {
                const info = AMENITY_ICONS[a];
                if (!info) return null;
                return (
                  <View key={a} style={styles.amenityChip}>
                    <Ionicons name={info.icon} size={16} color={Colors.accent} />
                    <Text style={styles.amenityText}>{info.label}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>LOCATION</Text>
          <View style={styles.mapPlaceholder}>
            <Ionicons name="map-outline" size={28} color={Colors.muted} />
            <Text style={styles.mapAddress}>{venue.address}</Text>
            <View style={styles.coordRow}>
              <Ionicons name="compass-outline" size={12} color={Colors.muted} />
              <Text style={styles.coordText}>{venue.lat.toFixed(4)}, {venue.lng.toFixed(4)}</Text>
            </View>
          </View>
        </View>

        {venue.communityLink && (
          <View style={styles.section}>
            <Pressable
              style={styles.communityChatBtn}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                Linking.openURL(venue.communityLink!);
              }}
            >
              <Ionicons
                name={venue.communityType === "whatsapp" ? "logo-whatsapp" : "send-outline"}
                size={22}
                color={venue.communityType === "whatsapp" ? "#25D366" : "#0088cc"}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.communityChatTitle}>
                  {venue.communityType === "whatsapp" ? "WhatsApp Community" : "Telegram Community"}
                </Text>
                <Text style={styles.communityChatSub}>{venue.name} · Open to all players</Text>
              </View>
              <Feather name="arrow-right" size={15} color={Colors.muted} />
            </Pressable>
          </View>
        )}

        {upcomingGames.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>UPCOMING GAMES ({upcomingGames.length})</Text>
            {upcomingGames.map((g) => (
              <MiniGameCard key={g.id} game={g} />
            ))}
          </View>
        )}

        {pastGames.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>RECENT GAMES</Text>
            {pastGames.map((g) => (
              <MiniGameCard key={g.id} game={g} />
            ))}
          </View>
        )}

        {upcomingGames.length === 0 && pastGames.length === 0 && (
          <View style={styles.emptyGames}>
            <Ionicons name="football-outline" size={32} color={Colors.muted} />
            <Text style={styles.emptyGamesText}>No games at this venue yet</Text>
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
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  navTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 13,
    letterSpacing: 2,
    color: Colors.text,
  },
  notFound: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  notFoundText: {
    fontFamily: "Inter_500Medium",
    fontSize: 16,
    color: Colors.muted,
  },
  hero: {
    height: 200,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    overflow: "hidden",
    position: "relative",
  },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  heroInitials: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  heroInitialsText: {
    fontFamily: "Inter_700Bold",
    fontSize: 64,
    color: "rgba(255,255,255,0.12)",
    letterSpacing: 4,
  },
  heroBottomGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  heroOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  heroBadgeRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  cityBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(20,19,18,0.5)",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  cityBadgeText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    color: Colors.accent,
  },
  surfaceBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  surfaceBadgeText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
  },
  heroName: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
    color: Colors.text,
    marginBottom: 2,
  },
  heroAddress: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.muted,
  },
  statsRow: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  statCell: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  statValue: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    color: Colors.text,
  },
  statLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 10,
    color: Colors.muted,
    letterSpacing: 0.5,
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 11,
    letterSpacing: 1.5,
    color: Colors.muted,
    marginBottom: 10,
  },
  amenitiesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  amenityChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.surface,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  amenityText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.text,
  },
  mapPlaceholder: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    gap: 8,
  },
  mapAddress: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: Colors.text,
    textAlign: "center",
  },
  coordRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  coordText: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.muted,
  },
  communityChatBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
  },
  communityChatTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.text,
    marginBottom: 2,
  },
  communityChatSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.muted,
  },
  miniCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  miniCardLeft: {
    flex: 1,
    gap: 4,
  },
  miniCardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  skillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  miniCardSkill: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 10,
    letterSpacing: 0.8,
    color: Colors.muted,
  },
  completedBadge: {
    backgroundColor: `${Colors.accent}22`,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  completedBadgeText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 9,
    color: Colors.accent,
    letterSpacing: 0.5,
  },
  fullBadge: {
    backgroundColor: `${Colors.red}22`,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  fullBadgeText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 9,
    color: Colors.red,
    letterSpacing: 0.5,
  },
  miniCardTime: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.text,
  },
  miniCardMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  miniCardMetaText: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.muted,
  },
  miniCardDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Colors.muted,
    marginHorizontal: 2,
  },
  miniCardRight: {
    alignItems: "flex-end",
    gap: 4,
  },
  miniCardPrice: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
    color: Colors.accent,
  },
  emptyGames: {
    alignItems: "center",
    padding: 32,
    gap: 10,
  },
  emptyGamesText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: Colors.muted,
  },
});
