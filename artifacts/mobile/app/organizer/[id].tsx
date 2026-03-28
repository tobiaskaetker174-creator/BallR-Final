import { Ionicons, Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
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
import { GAMES, formatGameTime, getSkillColor } from "@/constants/mock";

type WinTeam = "blue" | "red" | "draw" | null;

export default function OrganizerPanelScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const bottomPadding = Platform.OS === "web" ? 20 : insets.bottom;

  const game = GAMES.find((g) => g.id === id);
  const [winner, setWinner] = useState<WinTeam>(null);
  const [noShows, setNoShows] = useState<Set<string>>(new Set());
  const [scoreBlue, setScoreBlue] = useState(0);
  const [scoreRed, setScoreRed] = useState(0);
  const [topScorer, setTopScorer] = useState("");
  const [completing, setCompleting] = useState(false);
  const [completed, setCompleted] = useState(false);

  if (!game) {
    return (
      <View style={[styles.container, { paddingTop: topPadding }]}>
        <Pressable style={[styles.backBtn, { margin: 16 }]} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={Colors.text} />
        </Pressable>
        <Text style={{ color: Colors.muted, textAlign: "center" }}>Game not found</Text>
      </View>
    );
  }

  const toggleNoShow = (playerId: string) => {
    Haptics.selectionAsync();
    setNoShows((prev) => {
      const next = new Set(prev);
      if (next.has(playerId)) next.delete(playerId);
      else next.add(playerId);
      return next;
    });
  };

  const handleComplete = async () => {
    if (!winner) {
      Alert.alert("Select winner", "Please select the winning team or a draw before completing.");
      return;
    }
    setCompleting(true);
    await new Promise((r) => setTimeout(r, 1200));
    setCompleting(false);
    setCompleted(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleCancel = () => {
    Alert.alert(
      "Cancel Game?",
      "All players will be refunded. This cannot be undone.",
      [
        { text: "Keep Game", style: "cancel" },
        { text: "Cancel Game", style: "destructive", onPress: () => router.back() },
      ]
    );
  };

  if (completed) {
    return (
      <View style={[styles.container, { paddingTop: topPadding }]}>
        <View style={styles.doneState}>
          <Ionicons name="trophy" size={72} color={Colors.amber} />
          <Text style={styles.doneTitle}>Game Completed!</Text>
          <Text style={styles.doneSub}>
            {winner === "draw"
              ? "Draw! Both teams played well."
              : `Team ${winner === "blue" ? "Blue 🔵" : "Red 🔴"} wins!`}
            {"\n\n"}Elo ratings updated. Players can now rate their teammates.
          </Text>
          {noShows.size > 0 && (
            <Text style={styles.doneSub}>
              {noShows.size} no-show{noShows.size > 1 ? "s" : ""} marked · -50 Elo each
            </Text>
          )}
          <Pressable style={styles.doneBtn} onPress={() => router.replace("/(tabs)/my-games")}>
            <Text style={styles.doneBtnText}>Back to My Games</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const blueTeam = game.bookings.filter((b) => b.teamAssignment === "blue");
  const redTeam = game.bookings.filter((b) => b.teamAssignment === "red");
  const unassigned = game.bookings.filter((b) => b.teamAssignment === "none");

  const skillColor = getSkillColor(game.skillLevel);

  return (
    <View style={[styles.container, { paddingTop: topPadding }]}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={Colors.text} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Organizer Panel</Text>
          <Text style={styles.headerSub}>{game.venue.name}</Text>
        </View>
        <View style={[styles.orgBadge, { backgroundColor: `${skillColor}22` }]}>
          <Feather name="shield" size={12} color={skillColor} />
          <Text style={[styles.orgBadgeText, { color: skillColor }]}>ORG</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomPadding + 100 }]}
      >
        <View style={styles.gameInfo}>
          <Text style={styles.venueName}>{game.venue.name}</Text>
          <Text style={styles.gameTime}>{formatGameTime(game.gameTime)} · {game.durationMinutes}min</Text>
          <View style={styles.gameMetaRow}>
            <View style={styles.gameMeta}>
              <Ionicons name="people-outline" size={13} color={Colors.muted} />
              <Text style={styles.gameMetaText}>{game.currentPlayers}/{game.maxPlayers} players</Text>
            </View>
            <View style={styles.gameMetaSep} />
            <View style={styles.gameMeta}>
              <Ionicons name="flash-outline" size={13} color={Colors.muted} />
              <Text style={styles.gameMetaText}>Avg {game.avgElo} Elo</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>MARK WINNER</Text>
          <View style={styles.winnerRow}>
            {([
              { value: "blue" as WinTeam, label: "Team Blue 🔵", color: Colors.blue },
              { value: "draw" as WinTeam, label: "Draw", color: Colors.muted },
              { value: "red" as WinTeam, label: "Team Red 🔴", color: Colors.red },
            ] as {value: WinTeam; label: string; color: string}[]).map((opt) => (
              <Pressable
                key={opt.value!}
                style={[
                  styles.winnerBtn,
                  winner === opt.value && { backgroundColor: `${opt.color}33`, borderColor: opt.color },
                ]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setWinner(opt.value);
                }}
              >
                <Text style={[styles.winnerBtnText, winner === opt.value && { color: opt.color }]}>
                  {opt.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>MATCH SCORE</Text>
          <Text style={styles.sectionSub}>Enter the final score for this match.</Text>
          <View style={styles.scoreRow}>
            <View style={styles.scoreTeam}>
              <Text style={[styles.scoreTeamLabel, { color: Colors.blue }]}>Team Blue 🔵</Text>
              <View style={styles.scoreStepper}>
                <Pressable
                  style={styles.scoreStepBtn}
                  onPress={() => { Haptics.selectionAsync(); setScoreBlue((v) => Math.max(0, v - 1)); }}
                >
                  <Ionicons name="remove" size={18} color={Colors.text} />
                </Pressable>
                <Text style={styles.scoreValue}>{scoreBlue}</Text>
                <Pressable
                  style={styles.scoreStepBtn}
                  onPress={() => { Haptics.selectionAsync(); setScoreBlue((v) => v + 1); }}
                >
                  <Ionicons name="add" size={18} color={Colors.text} />
                </Pressable>
              </View>
            </View>
            <Text style={styles.scoreDash}>—</Text>
            <View style={styles.scoreTeam}>
              <Text style={[styles.scoreTeamLabel, { color: Colors.red }]}>Team Red 🔴</Text>
              <View style={styles.scoreStepper}>
                <Pressable
                  style={styles.scoreStepBtn}
                  onPress={() => { Haptics.selectionAsync(); setScoreRed((v) => Math.max(0, v - 1)); }}
                >
                  <Ionicons name="remove" size={18} color={Colors.text} />
                </Pressable>
                <Text style={styles.scoreValue}>{scoreRed}</Text>
                <Pressable
                  style={styles.scoreStepBtn}
                  onPress={() => { Haptics.selectionAsync(); setScoreRed((v) => v + 1); }}
                >
                  <Ionicons name="add" size={18} color={Colors.text} />
                </Pressable>
              </View>
            </View>
          </View>
          <Text style={[styles.sectionSub, { marginTop: 14, marginBottom: 6 }]}>Top Scorer (optional)</Text>
          <TextInput
            style={styles.topScorerInput}
            placeholder="Player name…"
            placeholderTextColor={Colors.muted}
            value={topScorer}
            onChangeText={setTopScorer}
            returnKeyType="done"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>MARK NO-SHOWS</Text>
          <Text style={styles.sectionSub}>Tap to mark players who didn't show up. They receive -50 Elo.</Text>
          <View style={styles.playersList}>
            {game.bookings.map((b) => (
              <Pressable
                key={b.id}
                style={[styles.playerRow, noShows.has(b.player.id) && styles.playerRowNoShow]}
                onPress={() => toggleNoShow(b.player.id)}
              >
                <View style={[styles.playerAvatar, { backgroundColor: Colors.primary }]}>
                  <Text style={styles.playerAvatarText}>
                    {b.player.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.playerInfo}>
                  <Text style={styles.playerName}>{b.player.name}</Text>
                  <Text style={styles.playerElo}>{b.player.eloRating} Elo · {b.teamAssignment.toUpperCase()}</Text>
                </View>
                {noShows.has(b.player.id) ? (
                  <View style={styles.noShowBadge}>
                    <Text style={styles.noShowText}>NO-SHOW</Text>
                  </View>
                ) : (
                  <Ionicons name="checkmark-circle-outline" size={22} color={Colors.muted} />
                )}
              </Pressable>
            ))}
            {game.bookings.length === 0 && (
              <Text style={styles.emptyPlayers}>No players joined yet</Text>
            )}
          </View>
        </View>

        {blueTeam.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>TEAMS</Text>
            <View style={styles.teamsGrid}>
              <View style={[styles.teamCard, { borderTopColor: Colors.blue }]}>
                <Text style={[styles.teamLabel, { color: Colors.blue }]}>Team Blue 🔵</Text>
                {blueTeam.map((b) => (
                  <Text key={b.id} style={styles.teamPlayer}>{b.player.name} ({b.player.eloRating})</Text>
                ))}
                <Text style={styles.teamAvgElo}>
                  Avg: {Math.round(blueTeam.reduce((s, b) => s + b.player.eloRating, 0) / blueTeam.length)} Elo
                </Text>
              </View>
              <View style={[styles.teamCard, { borderTopColor: Colors.red }]}>
                <Text style={[styles.teamLabel, { color: Colors.red }]}>Team Red 🔴</Text>
                {redTeam.map((b) => (
                  <Text key={b.id} style={styles.teamPlayer}>{b.player.name} ({b.player.eloRating})</Text>
                ))}
                <Text style={styles.teamAvgElo}>
                  Avg: {redTeam.length > 0 ? Math.round(redTeam.reduce((s, b) => s + b.player.eloRating, 0) / redTeam.length) : "--"} Elo
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(bottomPadding, 12) + 8 }]}>
        <Pressable style={styles.cancelBtn} onPress={handleCancel}>
          <Text style={styles.cancelBtnText}>Cancel Game</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.completeBtn,
            !winner && styles.completeBtnDisabled,
            completing && { opacity: 0.7 },
            pressed && { opacity: 0.85 },
          ]}
          onPress={handleComplete}
          disabled={completing || !winner}
        >
          <Text style={styles.completeBtnText}>
            {completing ? "Completing..." : "Mark Complete"}
          </Text>
          {!completing && <Ionicons name="flag" size={16} color={Colors.text} />}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.base },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    backgroundColor: Colors.surface,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: { flex: 1, gap: 2 },
  headerTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    color: Colors.text,
  },
  headerSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: Colors.muted,
  },
  orgBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  orgBadgeText: {
    fontFamily: "Inter_700Bold",
    fontSize: 10,
    letterSpacing: 1,
  },
  scroll: { paddingHorizontal: 16 },
  gameInfo: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    gap: 4,
  },
  venueName: {
    fontFamily: "Inter_700Bold",
    fontSize: 17,
    color: Colors.text,
  },
  gameTime: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.muted,
  },
  gameMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  gameMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  gameMetaText: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.muted,
  },
  gameMetaSep: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: Colors.overlay,
  },
  section: { marginBottom: 16 },
  sectionTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 10,
    color: Colors.muted,
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  sectionSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.muted,
    marginBottom: 8,
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 4,
  },
  scoreTeam: { flex: 1, alignItems: "center", gap: 10 },
  scoreTeamLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    letterSpacing: 0.5,
  },
  scoreStepper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.separator,
    overflow: "hidden",
  },
  scoreStepBtn: {
    width: 40,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.overlay,
  },
  scoreValue: {
    width: 40,
    textAlign: "center",
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    color: Colors.text,
  },
  scoreDash: {
    fontFamily: "Inter_400Regular",
    fontSize: 22,
    color: Colors.muted,
    marginTop: 24,
  },
  topScorerInput: {
    backgroundColor: Colors.surface,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: Colors.separator,
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.text,
  },
  winnerRow: { flexDirection: "row", gap: 8 },
  winnerBtn: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.separator,
  },
  winnerBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    color: Colors.muted,
    textAlign: "center",
  },
  playersList: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    overflow: "hidden",
  },
  playerRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.separator,
  },
  playerRowNoShow: {
    backgroundColor: `${Colors.red}11`,
  },
  playerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  playerAvatarText: {
    fontFamily: "Inter_700Bold",
    fontSize: 13,
    color: Colors.text,
  },
  playerInfo: { flex: 1 },
  playerName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.text,
  },
  playerElo: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: Colors.muted,
  },
  noShowBadge: {
    backgroundColor: `${Colors.red}22`,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: `${Colors.red}55`,
  },
  noShowText: {
    fontFamily: "Inter_700Bold",
    fontSize: 9,
    color: Colors.red,
    letterSpacing: 0.5,
  },
  emptyPlayers: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.muted,
    textAlign: "center",
    padding: 20,
  },
  teamsGrid: { flexDirection: "row", gap: 10 },
  teamCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 12,
    gap: 5,
    borderTopWidth: 2,
  },
  teamLabel: {
    fontFamily: "Inter_700Bold",
    fontSize: 12,
    marginBottom: 2,
  },
  teamPlayer: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: Colors.muted,
  },
  teamAvgElo: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    color: Colors.text,
    marginTop: 4,
  },
  footer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 10,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.separator,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: Colors.overlay,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: `${Colors.red}44`,
  },
  cancelBtnText: {
    fontFamily: "Inter_700Bold",
    fontSize: 13,
    color: Colors.red,
  },
  completeBtn: {
    flex: 2,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  completeBtnDisabled: { backgroundColor: Colors.overlay },
  completeBtnText: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
    color: Colors.text,
  },
  doneState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    gap: 16,
  },
  doneTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 24,
    color: Colors.text,
  },
  doneSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.muted,
    textAlign: "center",
    lineHeight: 20,
  },
  doneBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 40,
    marginTop: 8,
  },
  doneBtnText: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    color: Colors.text,
  },
});
