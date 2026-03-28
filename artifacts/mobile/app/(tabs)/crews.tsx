import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import BallrLogo from "@/components/BallrLogo";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { Crew } from "@/constants/mock";
import { fetchCrews } from "@/lib/ballrApi";
import { useBallrData } from "@/context/BallrDataContext";
const CREW_COLORS = [Colors.primary, Colors.blue, Colors.teal, Colors.purple, Colors.amber];

function CrewCard({ crew, index }: { crew: Crew; index: number }) {
  const accentColor = crew.primaryColor || CREW_COLORS[index % CREW_COLORS.length];

  return (
    <Pressable
      style={({ pressed }) => [styles.crewCard, pressed && { opacity: 0.85 }]}
      onPress={() => router.push({ pathname: "/crew/[id]", params: { id: crew.id } })}
    >
      <View style={[styles.crewColorBar, { backgroundColor: accentColor }]} />
      <View style={styles.crewCardBody}>
        <View style={styles.crewCardTop}>
          <View style={[styles.crewIcon, { backgroundColor: `${accentColor}30` }]}>
            <Ionicons name="people" size={18} color={accentColor} />
          </View>
          <View style={styles.crewCardInfo}>
            <Text style={styles.crewName} numberOfLines={1}>
              {crew.name}
            </Text>
            {crew.description ? (
              <Text style={styles.crewDesc} numberOfLines={1}>
                {crew.description}
              </Text>
            ) : null}
          </View>
          <Ionicons name="chevron-forward" size={16} color={Colors.muted} />
        </View>
        <View style={styles.crewStatsRow}>
          <View style={styles.crewStat}>
            <Ionicons name="people-outline" size={12} color={Colors.muted} />
            <Text style={styles.crewStatText}>{crew.memberCount} members</Text>
          </View>
          <View style={styles.crewStatDot} />
          <View style={styles.crewStat}>
            <Ionicons name="football-outline" size={12} color={Colors.muted} />
            <Text style={styles.crewStatText}>{crew.gameCount} games</Text>
          </View>
          <View style={styles.crewStatDot} />
          <View style={styles.crewStat}>
            <Ionicons name="trending-up-outline" size={12} color={Colors.muted} />
            <Text style={styles.crewStatText}>{crew.avgElo} avg ELO</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

function EmptyState() {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconWrap}>
        <Ionicons name="people-outline" size={48} color={Colors.muted} />
      </View>
      <Text style={styles.emptyTitle}>No Crews Yet</Text>
      <Text style={styles.emptySub}>
        Create a crew to play with friends, track stats,{"\n"}and compete on the crew leaderboard.
      </Text>
      <View style={styles.emptyActions}>
        <Pressable
          style={styles.emptyCreateBtn}
          onPress={() => router.push("/create-crew")}
        >
          <Ionicons name="add-circle-outline" size={16} color={Colors.base} />
          <Text style={styles.emptyCreateBtnText}>Create Crew</Text>
        </Pressable>
        <Pressable
          style={styles.emptyJoinBtn}
          onPress={() => router.push("/crew/join")}
        >
          <Ionicons name="enter-outline" size={16} color={Colors.accent} />
          <Text style={styles.emptyJoinBtnText}>Join with Code</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function CrewsScreen() {
  const insets = useSafeAreaInsets();
  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const bottomPadding = Platform.OS === "web" ? 34 : insets.bottom;
  const { currentPlayer } = useBallrData();

  const [crews, setCrews] = useState<Crew[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    loadCrews();
  }, []);

  const loadCrews = async () => {
    try {
      setIsLoading(true);
      setHasError(false);
      const data = await fetchCrews();
      setCrews(Array.isArray(data) ? data : []);
    } catch {
      setHasError(true);
      setCrews([]);
    } finally {
      setIsLoading(false);
    }
  };

  const cityLabel = currentPlayer?.basedIn?.toUpperCase() ?? "BANGKOK";

  return (
    <View style={[styles.container, { paddingTop: topPadding }]}>
      <FlatList
        data={crews}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => <CrewCard crew={item} index={index} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.listContent, { paddingBottom: bottomPadding + 90 }]}
        ListHeaderComponent={
          <>
            <View style={styles.topBar}>
              <Text style={styles.cityLabel}>{cityLabel}</Text>
              <BallrLogo />
              <Pressable
                style={styles.bellBtn}
                onPress={() => router.push("/notifications")}
              >
                <Ionicons name="notifications-outline" size={20} color={Colors.muted} />
              </Pressable>
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>MY CREWS</Text>
              <Pressable
                style={styles.joinCodeBtn}
                onPress={() => router.push("/crew/join")}
              >
                <Ionicons name="enter-outline" size={14} color={Colors.accent} />
                <Text style={styles.joinCodeBtnText}>Join</Text>
              </Pressable>
            </View>

            {isLoading && (
              <View style={styles.loadingWrap}>
                <ActivityIndicator size="small" color={Colors.accent} />
                <Text style={styles.loadingText}>Loading crews...</Text>
              </View>
            )}

            {!isLoading && hasError && (
              <View style={styles.emptyState}>
                <View style={styles.emptyIconWrap}>
                  <Ionicons name="cloud-offline-outline" size={48} color={Colors.muted} />
                </View>
                <Text style={styles.emptyTitle}>Could not load crews</Text>
                <Text style={styles.emptySub}>Check your connection and try again.</Text>
                <Pressable style={styles.emptyCreateBtn} onPress={loadCrews}>
                  <Ionicons name="refresh-outline" size={16} color={Colors.base} />
                  <Text style={styles.emptyCreateBtnText}>Retry</Text>
                </Pressable>
              </View>
            )}

            {!isLoading && !hasError && crews.length === 0 && <EmptyState />}
          </>
        }
      />

      {/* FAB */}
      <Pressable
        style={({ pressed }) => [
          styles.fab,
          { bottom: bottomPadding + 72 },
          pressed && { opacity: 0.85 },
        ]}
        onPress={() => router.push("/create-crew")}
      >
        <Ionicons name="add" size={24} color={Colors.base} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.base,
  },
  listContent: {
    paddingHorizontal: 16,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  cityLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    color: Colors.muted,
    letterSpacing: 1.5,
  },
  bellBtn: {
    padding: 4,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 13,
    color: Colors.muted,
    letterSpacing: 1.2,
  },
  joinCodeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.overlay,
  },
  joinCodeBtnText: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: Colors.accent,
  },
  crewCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    marginBottom: 10,
    overflow: "hidden",
    flexDirection: "row",
  },
  crewColorBar: {
    width: 4,
  },
  crewCardBody: {
    flex: 1,
    padding: 14,
  },
  crewCardTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  crewIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  crewCardInfo: {
    flex: 1,
  },
  crewName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: Colors.text,
  },
  crewDesc: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.muted,
    marginTop: 2,
  },
  crewStatsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    gap: 6,
  },
  crewStat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  crewStatText: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: Colors.muted,
  },
  crewStatDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Colors.overlay,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 18,
    color: Colors.text,
    marginBottom: 8,
  },
  emptySub: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.muted,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyActions: {
    flexDirection: "row",
    gap: 12,
  },
  emptyCreateBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.accent,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  emptyCreateBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: Colors.base,
  },
  emptyJoinBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.overlay,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  emptyJoinBtnText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.accent,
  },
  loadingWrap: {
    alignItems: "center",
    paddingVertical: 32,
    gap: 8,
  },
  loadingText: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.muted,
  },
  fab: {
    position: "absolute",
    right: 20,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.accent,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
});
