import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Colors from "@/constants/colors";
import {
  Game,
  SkillLevel,
  formatGameTime,
  formatPrice,
  getSkillLabel,
} from "@/constants/mock";

const SKILL_COLORS: Record<SkillLevel, string> = {
  beginner: Colors.blue,
  intermediate: Colors.amber,
  advanced: Colors.red,
  mixed: Colors.accent,
};

interface CityBounds {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
  label: string;
  gridLines: { type: "h" | "v"; position: number; label: string }[];
}

const CITY_BOUNDS: Record<string, CityBounds> = {
  bangkok: {
    minLat: 13.695,
    maxLat: 13.760,
    minLng: 100.515,
    maxLng: 100.600,
    label: "Bangkok",
    gridLines: [
      { type: "h", position: 0.3, label: "Sukhumvit" },
      { type: "h", position: 0.65, label: "Silom" },
      { type: "v", position: 0.4, label: "Asok" },
      { type: "v", position: 0.7, label: "Ekkamai" },
    ],
  },
  bali: {
    minLat: -8.730,
    maxLat: -8.650,
    minLng: 115.130,
    maxLng: 115.220,
    label: "Bali",
    gridLines: [
      { type: "h", position: 0.4, label: "Seminyak" },
      { type: "v", position: 0.35, label: "Canggu" },
      { type: "v", position: 0.7, label: "Kuta" },
    ],
  },
};

function normalizeCoord(
  value: number,
  min: number,
  max: number,
  invert = false
): number {
  const ratio = (value - min) / (max - min);
  return invert ? 1 - ratio : ratio;
}

interface GameMarkerProps {
  game: Game;
  bounds: CityBounds;
  mapWidth: number;
  mapHeight: number;
  isSelected: boolean;
  onPress: (game: Game) => void;
}

function GameMarker({
  game,
  bounds,
  mapWidth,
  mapHeight,
  isSelected,
  onPress,
}: GameMarkerProps) {
  const xRatio = normalizeCoord(game.venue.lng, bounds.minLng, bounds.maxLng);
  const yRatio = normalizeCoord(
    game.venue.lat,
    bounds.minLat,
    bounds.maxLat,
    true
  );

  const MARKER_SIZE = 16;
  const PULSE_SIZE = 28;

  const x = xRatio * mapWidth - MARKER_SIZE / 2;
  const y = yRatio * mapHeight - MARKER_SIZE / 2;
  const color = SKILL_COLORS[game.skillLevel];
  const isFull = game.currentPlayers >= game.maxPlayers;

  return (
    <Pressable
      style={[styles.markerContainer, { left: x, top: y }]}
      onPress={() => {
        Haptics.selectionAsync();
        onPress(game);
      }}
    >
      {isSelected && (
        <View
          style={[
            styles.markerPulse,
            {
              backgroundColor: `${color}22`,
              borderColor: `${color}66`,
              width: PULSE_SIZE,
              height: PULSE_SIZE,
              borderRadius: PULSE_SIZE / 2,
              left: -(PULSE_SIZE - MARKER_SIZE) / 2,
              top: -(PULSE_SIZE - MARKER_SIZE) / 2,
            },
          ]}
        />
      )}
      <View
        style={[
          styles.marker,
          {
            backgroundColor: color,
            width: MARKER_SIZE,
            height: MARKER_SIZE,
            borderRadius: MARKER_SIZE / 2,
            borderWidth: isSelected ? 2.5 : 1.5,
            borderColor: isSelected ? Colors.text : `${color}88`,
            opacity: isFull ? 0.45 : 1,
          },
        ]}
      />
      {isFull && (
        <View style={styles.markerFullDot} />
      )}
    </Pressable>
  );
}

interface MapPanelProps {
  cityId: string;
  games: Game[];
  selectedGame: Game | null;
  onSelectGame: (game: Game | null) => void;
}

function MapPanel({ cityId, games, selectedGame, onSelectGame }: MapPanelProps) {
  const bounds = CITY_BOUNDS[cityId];
  const MAP_WIDTH = 320;
  const MAP_HEIGHT = 220;

  return (
    <View style={styles.mapPanel}>
      <View style={styles.mapCityLabel}>
        <Ionicons name="location" size={10} color={Colors.accent} />
        <Text style={styles.mapCityLabelText}>{bounds.label.toUpperCase()}</Text>
      </View>

      <View
        style={[styles.mapCanvas, { width: MAP_WIDTH, height: MAP_HEIGHT }]}
      >
        {bounds.gridLines.map((gl, i) => (
          <View key={i} pointerEvents="none">
            {gl.type === "h" ? (
              <View
                style={[
                  styles.gridLineH,
                  { top: gl.position * MAP_HEIGHT },
                ]}
              />
            ) : (
              <View
                style={[
                  styles.gridLineV,
                  { left: gl.position * MAP_WIDTH },
                ]}
              />
            )}
            <Text
              style={[
                styles.gridLabel,
                gl.type === "h"
                  ? { top: gl.position * MAP_HEIGHT - 12, left: 6 }
                  : { left: gl.position * MAP_WIDTH + 4, top: 4 },
              ]}
            >
              {gl.label}
            </Text>
          </View>
        ))}

        {games.map((game) => (
          <GameMarker
            key={game.id}
            game={game}
            bounds={bounds}
            mapWidth={MAP_WIDTH}
            mapHeight={MAP_HEIGHT}
            isSelected={selectedGame?.id === game.id}
            onPress={(g) =>
              onSelectGame(selectedGame?.id === g.id ? null : g)
            }
          />
        ))}

        {games.length === 0 && (
          <View style={styles.mapEmpty}>
            <Text style={styles.mapEmptyText}>No games in {bounds.label}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

interface SkillLegendItem {
  level: SkillLevel;
  label: string;
}

const LEGEND_ITEMS: SkillLegendItem[] = [
  { level: "beginner", label: "Beginner" },
  { level: "intermediate", label: "Intermediate" },
  { level: "advanced", label: "Advanced" },
  { level: "mixed", label: "Mixed" },
];

interface Props {
  games: Game[];
  selectedCity: string;
}

export default function GameMapView({ games, selectedCity }: Props) {
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);

  const bangkokGames = games.filter((g) => g.cityId === "bangkok");
  const baliGames = games.filter((g) => g.cityId === "bali");

  const showBangkok = selectedCity === "all" || selectedCity === "bangkok";
  const showBali = selectedCity === "all" || selectedCity === "bali";

  function handleSelectGame(game: Game | null) {
    setSelectedGame(game);
  }

  const spotsLeft = selectedGame
    ? selectedGame.maxPlayers - selectedGame.currentPlayers
    : 0;

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.legend}>
          {LEGEND_ITEMS.map((item) => (
            <View key={item.level} style={styles.legendItem}>
              <View
                style={[
                  styles.legendDot,
                  { backgroundColor: SKILL_COLORS[item.level] },
                ]}
              />
              <Text style={styles.legendText}>{item.label}</Text>
            </View>
          ))}
        </View>

        {showBangkok && (
          <MapPanel
            cityId="bangkok"
            games={bangkokGames}
            selectedGame={selectedGame}
            onSelectGame={handleSelectGame}
          />
        )}

        {showBali && (
          <MapPanel
            cityId="bali"
            games={baliGames}
            selectedGame={selectedGame}
            onSelectGame={handleSelectGame}
          />
        )}

        {games.length === 0 && (
          <View style={styles.empty}>
            <Ionicons name="map-outline" size={36} color={Colors.muted} />
            <Text style={styles.emptyTitle}>No games on map</Text>
            <Text style={styles.emptyBody}>Try adjusting your filters</Text>
          </View>
        )}

        <View style={{ height: selectedGame ? 200 : 20 }} />
      </ScrollView>

      {selectedGame && (
        <View style={styles.popup}>
          <View style={styles.popupHandle} />

          <View style={styles.popupTop}>
            <View style={styles.popupLeft}>
              <View style={styles.popupSkillRow}>
                <View
                  style={[
                    styles.popupSkillDot,
                    {
                      backgroundColor:
                        SKILL_COLORS[selectedGame.skillLevel],
                    },
                  ]}
                />
                <Text style={styles.popupSkillLabel}>
                  {getSkillLabel(selectedGame.skillLevel).toUpperCase()}
                </Text>
              </View>
              <Text style={styles.popupVenue} numberOfLines={1}>
                {selectedGame.venue.name}
              </Text>
            </View>
            <Pressable
              style={styles.popupClose}
              onPress={() => setSelectedGame(null)}
            >
              <Ionicons name="close" size={18} color={Colors.muted} />
            </Pressable>
          </View>

          <View style={styles.popupMeta}>
            <View style={styles.popupMetaItem}>
              <Ionicons name="time-outline" size={13} color={Colors.muted} />
              <Text style={styles.popupMetaText}>
                {formatGameTime(selectedGame.gameTime)}
              </Text>
            </View>
            <View style={styles.popupMetaDot} />
            <View style={styles.popupMetaItem}>
              <Ionicons name="people-outline" size={13} color={Colors.muted} />
              <Text style={styles.popupMetaText}>
                {selectedGame.currentPlayers}/{selectedGame.maxPlayers}
              </Text>
            </View>
            <View style={styles.popupMetaDot} />
            <View style={styles.popupMetaItem}>
              <Ionicons
                name="location-outline"
                size={13}
                color={Colors.muted}
              />
              <Text style={styles.popupMetaText} numberOfLines={1}>
                {selectedGame.venue.address.split(",")[0]}
              </Text>
            </View>
          </View>

          <View style={styles.popupBottom}>
            <View style={styles.popupPriceBlock}>
              <Text style={styles.popupPrice}>
                {formatPrice(
                  selectedGame.pricePerPlayer,
                  selectedGame.cityId
                )}
              </Text>
              <Text style={styles.popupPriceLabel}>per player</Text>
            </View>

            <View style={styles.popupSpotsRow}>
              {spotsLeft > 0 ? (
                <View style={styles.popupSpotsBadge}>
                  <Ionicons
                    name="checkmark-circle"
                    size={11}
                    color={Colors.accent}
                  />
                  <Text style={styles.popupSpotsText}>
                    {spotsLeft} spot{spotsLeft !== 1 ? "s" : ""} left
                  </Text>
                </View>
              ) : (
                <View
                  style={[
                    styles.popupSpotsBadge,
                    { backgroundColor: `${Colors.red}18` },
                  ]}
                >
                  <Ionicons name="close-circle" size={11} color={Colors.red} />
                  <Text style={[styles.popupSpotsText, { color: Colors.red }]}>
                    Full
                  </Text>
                </View>
              )}
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.popupViewBtn,
                pressed && { opacity: 0.8 },
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push({
                  pathname: "/game/[id]",
                  params: { id: selectedGame.id },
                });
              }}
            >
              <Text style={styles.popupViewBtnText}>VIEW GAME</Text>
              <Ionicons name="arrow-forward" size={13} color={Colors.text} />
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
    gap: 16,
  },
  legend: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    paddingVertical: 4,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  legendDot: {
    width: 9,
    height: 9,
    borderRadius: 999,
  },
  legendText: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    color: Colors.muted,
  },
  mapPanel: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.separator,
  },
  mapCityLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 8,
  },
  mapCityLabelText: {
    fontFamily: "Inter_700Bold",
    fontSize: 10,
    color: Colors.accent,
    letterSpacing: 1.5,
  },
  mapCanvas: {
    position: "relative",
    backgroundColor: "#1A1F1A",
    marginHorizontal: 14,
    marginBottom: 14,
    borderRadius: 10,
    overflow: "hidden",
    alignSelf: "stretch",
  },
  gridLineH: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(161,212,148,0.07)",
  },
  gridLineV: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: "rgba(161,212,148,0.07)",
  },
  gridLabel: {
    position: "absolute",
    fontFamily: "Inter_400Regular",
    fontSize: 8,
    color: "rgba(140,135,130,0.5)",
  },
  markerContainer: {
    position: "absolute",
  },
  markerPulse: {
    position: "absolute",
    borderWidth: 1.5,
  },
  marker: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 3,
    elevation: 4,
  },
  markerFullDot: {
    position: "absolute",
    top: 4,
    left: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  mapEmpty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  mapEmptyText: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.muted,
  },
  empty: {
    alignItems: "center",
    paddingTop: 60,
    gap: 10,
  },
  emptyTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: Colors.text,
  },
  emptyBody: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.muted,
  },
  popup: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 18,
    paddingBottom: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: Colors.separator,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
    gap: 10,
  },
  popupHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.overlay,
    alignSelf: "center",
    marginBottom: 4,
  },
  popupTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  popupLeft: {
    flex: 1,
    gap: 3,
  },
  popupSkillRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  popupSkillDot: {
    width: 7,
    height: 7,
    borderRadius: 999,
  },
  popupSkillLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 9,
    color: Colors.muted,
    letterSpacing: 1,
  },
  popupVenue: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: Colors.text,
    letterSpacing: -0.2,
  },
  popupClose: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 15,
    backgroundColor: Colors.overlay,
    marginLeft: 8,
  },
  popupMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  popupMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  popupMetaText: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.muted,
  },
  popupMetaDot: {
    width: 3,
    height: 3,
    borderRadius: 999,
    backgroundColor: Colors.overlay,
  },
  popupBottom: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  popupPriceBlock: {
    gap: 1,
  },
  popupPrice: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: Colors.accent,
  },
  popupPriceLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 10,
    color: Colors.muted,
  },
  popupSpotsRow: {
    flex: 1,
  },
  popupSpotsBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: `${Colors.accent}18`,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    alignSelf: "flex-start",
  },
  popupSpotsText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    color: Colors.accent,
  },
  popupViewBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  popupViewBtnText: {
    fontFamily: "Inter_700Bold",
    fontSize: 12,
    color: Colors.text,
    letterSpacing: 0.5,
  },
});
