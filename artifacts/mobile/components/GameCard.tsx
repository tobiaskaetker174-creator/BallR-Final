import { Ionicons, Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Colors from "@/constants/colors";
import {
  Game,
  formatGameTime,
  formatPrice,
  getSkillColor,
  getSkillLabel,
  getSurfaceIcon,
} from "@/constants/mock";

interface GameCardProps {
  game: Game;
  showJoinButton?: boolean;
  isJoined?: boolean;
}

export function GameCard({ game, showJoinButton = false, isJoined = false }: GameCardProps) {
  const fillPercent = game.currentPlayers / game.maxPlayers;
  const spotsLeft = game.maxPlayers - game.currentPlayers;
  const isFull = game.status === "full" || game.currentPlayers >= game.maxPlayers;
  const skillColor = getSkillColor(game.skillLevel);

  const fillBarColor =
    fillPercent >= 1 ? Colors.red : fillPercent > 0.8 ? Colors.amber : Colors.accent;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed,
      ]}
      onPress={() => router.push({ pathname: "/game/[id]", params: { id: game.id } })}
    >
      <View style={[styles.accentBar, { backgroundColor: skillColor }]} />

      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.venueName} numberOfLines={1}>
            {game.venue.name}
          </Text>
          {isFull ? (
            <View style={styles.fullBadge}>
              <Text style={styles.fullBadgeText}>FULL</Text>
            </View>
          ) : (
            <View style={[styles.skillBadge, { backgroundColor: `${skillColor}20`, borderColor: `${skillColor}50` }]}>
              <Text style={[styles.skillBadgeText, { color: skillColor }]}>
                {getSkillLabel(game.skillLevel)}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.timeRow}>
          <Ionicons name="time-outline" size={13} color={Colors.muted} />
          <Text style={styles.timeText}>{formatGameTime(game.gameTime)}</Text>
          <Text style={styles.durationText}>{game.durationMinutes} min</Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Ionicons name="people-outline" size={13} color={Colors.muted} />
            <Text style={styles.statText}>
              {game.currentPlayers}/{game.maxPlayers}
            </Text>
          </View>
          <View style={styles.statDot} />
          <View style={styles.stat}>
            <Ionicons name="location-outline" size={13} color={Colors.muted} />
            <Text style={styles.statText}>{getSurfaceIcon(game.venue.surfaceType)}</Text>
          </View>
          <View style={styles.statDot} />
          <View style={[styles.priceBadge]}>
            <Text style={styles.priceText}>{formatPrice(game.pricePerPlayer, game.cityId)}</Text>
          </View>
        </View>

        <View style={styles.fillBarContainer}>
          <View style={styles.fillBarTrack}>
            <View
              style={[
                styles.fillBarFill,
                {
                  width: `${Math.min(fillPercent * 100, 100)}%` as any,
                  backgroundColor: fillBarColor,
                },
              ]}
            />
          </View>
          {!isFull && spotsLeft <= 4 && (
            <Text style={styles.spotsText}>Only {spotsLeft} spots left</Text>
          )}
        </View>

        {game.description && (
          <Text style={styles.description} numberOfLines={1}>
            {game.description}
          </Text>
        )}

        {showJoinButton && (
          <Pressable
            style={({ pressed }) => [
              styles.joinButton,
              isJoined && styles.joinedButton,
              pressed && styles.joinButtonPressed,
            ]}
            onPress={() => router.push({ pathname: "/game/[id]", params: { id: game.id } })}
          >
            <Text style={[styles.joinButtonText, isJoined && styles.joinedButtonText]}>
              {isJoined ? "You're In" : "Join Match"}
            </Text>
            {!isJoined && (
              <Feather name="arrow-right" size={14} color={Colors.text} />
            )}
          </Pressable>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.separator,
    flexDirection: "row",
    overflow: "hidden",
    marginBottom: 12,
  },
  cardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
  accentBar: {
    width: 4,
  },
  content: {
    flex: 1,
    padding: 14,
    gap: 6,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  venueName: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    color: Colors.text,
    flex: 1,
    marginRight: 8,
  },
  skillBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
  },
  skillBadgeText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 10,
    letterSpacing: 0.3,
  },
  fullBadge: {
    backgroundColor: `${Colors.red}22`,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: `${Colors.red}44`,
  },
  fullBadgeText: {
    fontFamily: "Inter_700Bold",
    fontSize: 10,
    color: Colors.red,
    letterSpacing: 0.5,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  timeText: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: Colors.muted,
    flex: 1,
  },
  durationText: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: Colors.muted,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  stat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  statText: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.muted,
  },
  statDot: {
    width: 3,
    height: 3,
    borderRadius: 999,
    backgroundColor: Colors.separator,
  },
  priceBadge: {
    backgroundColor: `${Colors.primary}44`,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: "auto",
    borderWidth: 1,
    borderColor: `${Colors.accent}30`,
  },
  priceText: {
    fontFamily: "Inter_700Bold",
    fontSize: 12,
    color: Colors.accent,
  },
  fillBarContainer: {
    gap: 3,
  },
  fillBarTrack: {
    height: 3,
    backgroundColor: Colors.overlay,
    borderRadius: 999,
    overflow: "hidden",
  },
  fillBarFill: {
    height: 3,
    borderRadius: 999,
  },
  spotsText: {
    fontFamily: "Inter_400Regular",
    fontSize: 10,
    color: Colors.amber,
  },
  description: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.muted,
    fontStyle: "italic",
  },
  joinButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 9,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 4,
    borderWidth: 1,
    borderColor: `${Colors.accent}33`,
  },
  joinedButton: {
    backgroundColor: Colors.overlay,
    borderWidth: 1,
    borderColor: Colors.accent,
  },
  joinButtonPressed: {
    opacity: 0.8,
  },
  joinButtonText: {
    fontFamily: "Inter_700Bold",
    fontSize: 13,
    color: Colors.text,
    letterSpacing: 0.3,
  },
  joinedButtonText: {
    color: Colors.accent,
  },
});
