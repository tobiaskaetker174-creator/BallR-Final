import { Ionicons, Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import BallrLogo from "@/components/BallrLogo";
import GameMapView from "@/components/GameMapView";
import { LinearGradient } from "expo-linear-gradient";
import { router, useNavigation } from "expo-router";
import React, { ComponentProps, useState, useMemo, useEffect, useCallback } from "react";
import {
  Alert,
  FlatList,
  Image,
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
  GAMES,
  NOTIFICATIONS,
  PLAYERS,
  FOLLOWED_PLAYER_IDS,
  MY_GAME_IDS,
  ELO_HISTORY,
  Game,
  SkillLevel,
  formatGameTime,
  formatPrice,
  getSkillColor,
  getSkillLabel,
} from "@/constants/mock";
import { useAuth } from "@/context/AuthContext";
import { useBallrData } from "@/context/BallrDataContext";
import { ActivityIndicator } from "react-native";

type ViewMode = "list" | "map";

const CITIES = [
  { id: "all", label: "All" },
  { id: "bangkok", label: "Bangkok" },
  { id: "bali", label: "Bali" },
];

const SKILL_FILTERS: { id: SkillLevel | "all"; label: string }[] = [
  { id: "all", label: "ALL GAMES" },
  { id: "beginner", label: "BEGINNER" },
  { id: "intermediate", label: "INTERMEDIATE" },
  { id: "advanced", label: "ADVANCED" },
  { id: "mixed", label: "MIXED" },
];

type DateFilter = "all" | "today" | "tomorrow" | "weekend" | "week";
const DATE_FILTERS: { id: DateFilter; label: string; icon: ComponentProps<typeof Ionicons>["name"] }[] = [
  { id: "all", label: "Any Date", icon: "calendar-outline" },
  { id: "today", label: "Today", icon: "today-outline" },
  { id: "tomorrow", label: "Tomorrow", icon: "arrow-forward-circle-outline" },
  { id: "weekend", label: "Weekend", icon: "sunny-outline" },
  { id: "week", label: "This Week", icon: "calendar-number-outline" },
];

type EloFilter = "all" | "casual" | "mid" | "competitive" | "elite";
const ELO_FILTERS: { id: EloFilter; label: string; range: [number, number] }[] = [
  { id: "all", label: "All Levels", range: [0, 9999] },
  { id: "casual", label: "Casual (<900)", range: [0, 899] },
  { id: "mid", label: "Rec (900–1200)", range: [900, 1200] },
  { id: "competitive", label: "Comp (1200+)", range: [1200, 9999] },
];

function isDateMatch(gameTime: string, filter: DateFilter): boolean {
  const now = new Date();
  const game = new Date(gameTime);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfTomorrow = new Date(startOfToday.getTime() + 86400000);
  const startOfDayAfterTomorrow = new Date(startOfTomorrow.getTime() + 86400000);
  const dayOfWeek = now.getDay();
  const daysUntilWeekend = dayOfWeek === 6 ? 0 : dayOfWeek === 0 ? 0 : 6 - dayOfWeek;
  const startOfWeekend = new Date(startOfToday.getTime() + daysUntilWeekend * 86400000);
  const endOfWeekend = new Date(startOfWeekend.getTime() + 2 * 86400000);
  const endOfWeek = new Date(startOfToday.getTime() + 7 * 86400000);

  switch (filter) {
    case "today": return game >= startOfToday && game < startOfTomorrow;
    case "tomorrow": return game >= startOfTomorrow && game < startOfDayAfterTomorrow;
    case "weekend": return game >= startOfWeekend && game < endOfWeekend;
    case "week": return game >= startOfToday && game < endOfWeek;
    default: return true;
  }
}

const ME = PLAYERS[0];
const MY_ELO = ME.eloRating;
const ELO_MATCH_RANGE = 300;

function getUserSkillTier(elo: number): SkillLevel {
  if (elo < 900) return "beginner";
  if (elo < 1200) return "intermediate";
  return "advanced";
}

const MY_SKILL_TIER = getUserSkillTier(MY_ELO);
const PAST_VENUE_KEYWORDS = new Set(
  ELO_HISTORY.map((e) => e.venueName.split(" ")[0].toLowerCase())
);

function scoreGame(game: Game, followedIds: Set<string>): number {
  let score = 0;
  const skillBonus =
    game.skillLevel === MY_SKILL_TIER ? 2 :
    game.skillLevel === "mixed" ? 1 : 0;
  score += skillBonus;
  const firstWord = game.venue.name.split(" ")[0].toLowerCase();
  if (PAST_VENUE_KEYWORDS.has(firstWord)) score += 1;
  const friendsInGame = game.bookings.filter((b) => followedIds.has(b.player.id));
  score += friendsInGame.length * 2;
  if (game.maxPlayers - game.currentPlayers >= 3) score += 1;
  return score;
}

function computeForYou(liveGames: Game[], followedIds: Set<string>, myElo: number): Game[] {
  return liveGames
    .filter((g) =>
      !MY_GAME_IDS.includes(g.id) &&
      g.status !== "full" &&
      Math.abs(g.avgElo - myElo) <= ELO_MATCH_RANGE
    )
    .map((g) => ({ game: g, score: scoreGame(g, followedIds) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map((x) => x.game);
}

function computeFriendGames(liveGames: Game[], followedIds: Set<string>): { player: typeof PLAYERS[number]; game: Game }[] {
  const result: { player: typeof PLAYERS[number]; game: Game }[] = [];
  for (const playerId of followedIds) {
    for (const game of liveGames) {
      if (game.status === "upcoming" || game.status === "full") {
        const booking = game.bookings.find((b) => b.player.id === playerId);
        if (booking) {
          const player = PLAYERS.find((p) => p.id === playerId) ?? booking.player;
          result.push({ player, game });
          break;
        }
      }
    }
  }
  return result;
}

function ForYouCard({ game, followedIds }: { game: Game; followedIds: Set<string> }) {
  const skillColor = getSkillColor(game.skillLevel);
  const friendsInGame = game.bookings
    .filter((b) => followedIds.has(b.player.id))
    .map((b) => b.player.name.split(" ")[0]);
  const eloMatch = Math.abs(game.avgElo - MY_ELO) <= ELO_MATCH_RANGE;

  return (
    <Pressable
      style={({ pressed }) => [styles.forYouCard, pressed && { opacity: 0.8 }]}
      onPress={() => router.push({ pathname: "/game/[id]", params: { id: game.id } })}
    >
      {eloMatch && (
        <View style={styles.forYouEloChip}>
          <Ionicons name="checkmark-circle" size={10} color={Colors.accent} />
          <Text style={styles.forYouEloText}>ELO MATCH</Text>
        </View>
      )}
      <Text style={styles.forYouVenue} numberOfLines={2}>{game.venue.name}</Text>
      <Text style={styles.forYouAddress} numberOfLines={1}>{game.venue.address.split(",")[0]}</Text>
      <View style={styles.forYouMeta}>
        <Ionicons name="time-outline" size={11} color={Colors.muted} />
        <Text style={styles.forYouMetaText}>{formatGameTime(game.gameTime)}</Text>
      </View>
      <View style={styles.forYouMeta}>
        <Ionicons name="people-outline" size={11} color={Colors.muted} />
        <Text style={styles.forYouMetaText}>{game.currentPlayers}/{game.maxPlayers} players</Text>
      </View>
      {friendsInGame.length > 0 && (
        <View style={styles.forYouFriends}>
          <Ionicons name="person-outline" size={10} color={Colors.teal} />
          <Text style={styles.forYouFriendsText} numberOfLines={1}>
            {friendsInGame.slice(0, 2).join(", ")} {friendsInGame.length > 2 ? `+${friendsInGame.length - 2}` : ""} playing
          </Text>
        </View>
      )}
      <View style={styles.forYouBottom}>
        <Text style={styles.forYouPrice}>{formatPrice(game.pricePerPlayer, game.cityId)}</Text>
        <View style={[styles.forYouSkill, { backgroundColor: `${skillColor}22` }]}>
          <Text style={[styles.forYouSkillText, { color: skillColor }]}>{getSkillLabel(game.skillLevel)}</Text>
        </View>
      </View>
    </Pressable>
  );
}

function ForYouSection({ forYouGames, followedIds }: { forYouGames: Game[]; followedIds: Set<string> }) {
  if (forYouGames.length === 0) return null;
  return (
    <View style={styles.forYouSection}>
      <View style={styles.forYouHeader}>
        <View style={styles.forYouTitleRow}>
          <View style={[styles.sectionAccentBar, { backgroundColor: Colors.amber }]} />
          <Ionicons name="sparkles" size={13} color={Colors.amber} />
          <Text style={styles.forYouTitle}>FOR YOU</Text>
        </View>
        <Text style={styles.forYouSub}>Matched to your ELO & following</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.forYouScroll}
      >
        {forYouGames.map((g) => (
          <ForYouCard key={g.id} game={g} followedIds={followedIds} />
        ))}
      </ScrollView>
    </View>
  );
}

function FriendsPlayingStrip({ friendGames }: { friendGames: { player: typeof PLAYERS[number]; game: Game }[] }) {
  if (friendGames.length === 0) return null;

  return (
    <View style={styles.friendsSection}>
      <View style={styles.forYouHeader}>
        <View style={styles.forYouTitleRow}>
          <View style={[styles.sectionAccentBar, { backgroundColor: Colors.teal }]} />
          <Ionicons name="people" size={13} color={Colors.teal} />
          <Text style={[styles.forYouTitle, { color: Colors.teal }]}>FRIENDS PLAYING</Text>
        </View>
        <Text style={styles.forYouSub}>People you follow have joined a game</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.friendsScroll}
      >
        {friendGames.map(({ player, game }) => {
          const initials = player.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
          const firstName = player.name.split(" ")[0];
          const venueName = game.venue.name.split(" ").slice(0, 3).join(" ");
          const gameTime = formatGameTime(game.gameTime);
          return (
            <Pressable
              key={player.id}
              style={({ pressed }) => [styles.friendCard, pressed && { opacity: 0.8 }]}
              onPress={() => router.push({ pathname: "/game/[id]", params: { id: game.id } })}
            >
              <View style={styles.friendAvatar}>
                <Text style={styles.friendAvatarText}>{initials}</Text>
              </View>
              <Text style={styles.friendName} numberOfLines={1}>{firstName}</Text>
              <Text style={styles.friendSummary} numberOfLines={3}>
                is playing at{"\n"}
                <Text style={styles.friendSummaryBold}>{venueName}</Text>
                {"\n"}{gameTime}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

function CompactGameCard({ game }: { game: Game }) {
  const skillColor = getSkillColor(game.skillLevel);
  const isFull = game.status === "full" || game.currentPlayers >= game.maxPlayers;

  return (
    <View style={styles.compactCardWrapper}>
      <Pressable
        style={({ pressed }) => [styles.compactVenueRow, pressed && { opacity: 0.7 }]}
        onPress={() => router.push({ pathname: "/venue/[id]", params: { id: game.venue.id } })}
      >
        <View style={styles.compactVenueLeft}>
          <Ionicons name="location-outline" size={11} color={Colors.accent} />
          <Text style={styles.compactVenue} numberOfLines={1}>{game.venue.name}</Text>
        </View>
        <Ionicons name="chevron-forward" size={11} color={Colors.muted} />
      </Pressable>

      <Pressable
        style={({ pressed }) => [styles.compactCard, pressed && { opacity: 0.8 }]}
        onPress={() => router.push({ pathname: "/game/[id]", params: { id: game.id } })}
      >
        <View style={styles.compactCardTop}>
          <View style={styles.compactCardLeft}>
            <View style={styles.compactMeta}>
              <Ionicons name="location-outline" size={11} color={Colors.muted} />
              <Text style={styles.compactMetaText}>{game.venue.address.split(",")[0]}</Text>
            </View>
          </View>
          <View style={styles.compactRight}>
            <Text style={styles.compactPrice}>{formatPrice(game.pricePerPlayer, game.cityId)}</Text>
            {isFull && (
              <View style={styles.openBadge}>
                <Text style={styles.openBadgeText}>Full</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.compactStats}>
          <View style={styles.compactStat}>
            <Ionicons name="time-outline" size={11} color={Colors.muted} />
            <Text style={styles.compactStatText}>{formatGameTime(game.gameTime)}</Text>
          </View>
          <View style={styles.compactStatDot} />
          <View style={styles.compactStat}>
            <Ionicons name="people-outline" size={11} color={Colors.muted} />
            <Text style={styles.compactStatText}>{game.currentPlayers}/{game.maxPlayers}</Text>
          </View>
          <View style={styles.compactStatDot} />
          <View style={[styles.skillDot, { backgroundColor: skillColor }]} />
          <Text style={styles.compactStatText}>{getSkillLabel(game.skillLevel)}</Text>
        </View>

        <Pressable
          style={({ pressed }) => [styles.joinMatchBtn, pressed && { opacity: 0.85 }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push({ pathname: "/game/[id]", params: { id: game.id } });
          }}
        >
          <Text style={styles.joinMatchBtnText}>JOIN MATCH</Text>
        </Pressable>
      </Pressable>
    </View>
  );
}

export default function DiscoverScreen() {
  const insets = useSafeAreaInsets();
  const { isLoggedIn } = useAuth();
  const { games: liveGames, currentPlayer, notifications: liveNotifications, isLoadingGames, refreshGames } = useBallrData();
  const [selectedCity, setSelectedCity] = useState<string>("all");
  const [selectedSkill, setSelectedSkill] = useState<string>("all");
  const [selectedDate, setSelectedDate] = useState<DateFilter>("all");
  const [selectedElo, setSelectedElo] = useState<EloFilter>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  const navigation = useNavigation();
  const [followedSnap, setFollowedSnap] = useState(() => new Set(FOLLOWED_PLAYER_IDS));
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus" as any, () => {
      setFollowedSnap(new Set(FOLLOWED_PLAYER_IDS));
    });
    return unsubscribe;
  }, [navigation]);

  const allGames = liveGames.length > 0 ? liveGames : GAMES;
  const me = currentPlayer ?? PLAYERS[0];
  const myElo = me.eloRating;

  const forYouGames = useMemo(() => computeForYou(allGames, followedSnap, myElo), [allGames, followedSnap, myElo]);
  const friendGames = useMemo(() => computeFriendGames(allGames, followedSnap), [allGames, followedSnap]);

  const eloRange = ELO_FILTERS.find((e) => e.id === selectedElo)?.range ?? [0, 9999];

  const filteredGames = useMemo(() => {
    return allGames.filter((g) => {
      if (selectedCity !== "all" && g.cityId !== selectedCity) return false;
      if (selectedSkill !== "all" && g.skillLevel !== selectedSkill) return false;
      if (!isDateMatch(g.gameTime, selectedDate)) return false;
      if (g.avgElo < eloRange[0] || g.avgElo > eloRange[1]) return false;
      return true;
    }).sort((a, b) => new Date(a.gameTime).getTime() - new Date(b.gameTime).getTime());
  }, [allGames, selectedCity, selectedSkill, selectedDate, selectedElo]);

  const activeFilterCount = [
    selectedCity !== "all",
    selectedSkill !== "all",
    selectedDate !== "all",
    selectedElo !== "all",
  ].filter(Boolean).length;

  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const bottomPadding = Platform.OS === "web" ? 34 : insets.bottom;

  const unreadCount = (liveNotifications.length > 0 ? liveNotifications : NOTIFICATIONS).filter((n) => !n.read).length;
  const featuredGame = allGames[0] ?? GAMES[0];

  const topBar = (
    <View style={[styles.topBar, { paddingTop: topPadding }]}>
      <View style={styles.topBarLeft}>
        {selectedCity !== "all" && (
          <View style={styles.cityActiveChip}>
            <Ionicons name="location" size={11} color={Colors.accent} />
            <Text style={styles.cityActiveText}>{CITIES.find(c => c.id === selectedCity)?.label}</Text>
          </View>
        )}
      </View>

      <BallrLogo />

      <View style={styles.topBarRight}>
        <Pressable
          style={[styles.viewModeBtn, viewMode === "map" && styles.viewModeBtnActive]}
          onPress={() => {
            Haptics.selectionAsync();
            setViewMode(v => v === "list" ? "map" : "list");
          }}
        >
          <Ionicons
            name={viewMode === "map" ? "list-outline" : "map-outline"}
            size={17}
            color={viewMode === "map" ? Colors.accent : Colors.muted}
          />
        </Pressable>
        <Pressable style={styles.bellBtn} onPress={() => router.push("/notifications")}>
          <Ionicons name="notifications-outline" size={20} color={Colors.muted} />
          {unreadCount > 0 && (
            <View style={styles.bellBadge}>
              <Text style={styles.bellBadgeText}>{unreadCount > 9 ? "9+" : unreadCount}</Text>
            </View>
          )}
        </Pressable>
      </View>
    </View>
  );

  if (viewMode === "map") {
    return (
      <View style={[styles.container, { flex: 1 }]}>
        {topBar}

        <View style={styles.mapFilterRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
            {SKILL_FILTERS.map((sf) => (
              <Pressable
                key={sf.id}
                style={[styles.filterPill, selectedSkill === sf.id && styles.filterPillActive]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setSelectedSkill(sf.id);
                }}
              >
                <Text style={[styles.filterPillText, selectedSkill === sf.id && styles.filterPillTextActive]}>
                  {sf.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          <View style={styles.mapCityToggle}>
            {CITIES.map((c) => (
              <Pressable
                key={c.id}
                style={[styles.mapCityChip, selectedCity === c.id && styles.mapCityChipActive]}
                onPress={() => { Haptics.selectionAsync(); setSelectedCity(c.id); }}
              >
                <Text style={[styles.mapCityChipText, selectedCity === c.id && styles.mapCityChipTextActive]}>
                  {c.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={{ flex: 1, paddingBottom: bottomPadding + 80 }}>
          <GameMapView games={filteredGames} selectedCity={selectedCity} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredGames}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <CompactGameCard game={item} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottomPadding + 110 }}
        ListHeaderComponent={
          <>
            {topBar}

            <View style={styles.featuredSection}>
              <View style={styles.sectionLabelRow}>
                <View style={[styles.sectionAccentBar, { backgroundColor: Colors.accent }]} />
                <Text style={styles.featuredLabel}>FEATURED PITCH</Text>
              </View>
              <Pressable
                style={styles.featuredCard}
                onPress={() => router.push({ pathname: "/game/[id]", params: { id: featuredGame.id } })}
              >
                <Image
                  source={require("../../assets/images/featured_pitch.jpg")}
                  style={styles.featuredImage}
                  resizeMode="cover"
                />
                <LinearGradient
                  colors={["transparent", "rgba(20,19,18,0.95)"]}
                  style={styles.featuredGradient}
                />
                <LinearGradient
                  colors={["rgba(20,19,18,0.6)", "transparent"]}
                  style={styles.featuredTopGradient}
                />
                <View style={styles.featuredOverlay}>
                  <View style={styles.featuredOverlayTop}>
                    <View style={styles.featuredGameBadge}>
                      <Text style={styles.featuredGameBadgeText}>GAME DETAILS</Text>
                    </View>
                  </View>
                  <View style={styles.featuredOverlayBottom}>
                    <Pressable
                      onPress={(e) => {
                        e.stopPropagation();
                        router.push({ pathname: "/venue/[id]", params: { id: featuredGame.venue.id } });
                      }}
                    >
                      <Text style={styles.featuredVenue}>{featuredGame.venue.name}</Text>
                    </Pressable>
                    <View style={styles.featuredMeta}>
                      <Text style={styles.featuredMetaText}>{formatGameTime(featuredGame.gameTime)}</Text>
                      <Text style={styles.featuredMetaDot}>·</Text>
                      <Text style={styles.featuredMetaText}>{featuredGame.currentPlayers}/{featuredGame.maxPlayers} players</Text>
                    </View>
                    <View style={styles.featuredPriceRow}>
                      <Text style={styles.featuredPrice}>{formatPrice(featuredGame.pricePerPlayer, featuredGame.cityId)}</Text>
                    </View>
                  </View>
                </View>
              </Pressable>
            </View>

            <View style={styles.filterSection}>
              <View style={styles.filterTopRow}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
                  {SKILL_FILTERS.map((sf) => (
                    <Pressable
                      key={sf.id}
                      style={[styles.filterPill, selectedSkill === sf.id && styles.filterPillActive]}
                      onPress={() => {
                        Haptics.selectionAsync();
                        setSelectedSkill(sf.id);
                      }}
                    >
                      <Text style={[styles.filterPillText, selectedSkill === sf.id && styles.filterPillTextActive]}>
                        {sf.label}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
                <Pressable
                  style={[styles.filterToggleBtn, showFilters && styles.filterToggleBtnActive, activeFilterCount > 0 && !showFilters && styles.filterToggleBtnBadge]}
                  onPress={() => { Haptics.selectionAsync(); setShowFilters((v) => !v); }}
                >
                  <Ionicons name="options-outline" size={15} color={showFilters ? Colors.text : Colors.muted} />
                  {activeFilterCount > 0 && (
                    <View style={styles.filterBadge}>
                      <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
                    </View>
                  )}
                </Pressable>
              </View>

              {showFilters && (
                <View style={styles.expandedFilters}>
                  <Text style={styles.expandedFilterLabel}>CITY</Text>
                  <View style={styles.filterRow}>
                    {CITIES.map((c) => (
                      <Pressable
                        key={c.id}
                        style={[styles.dateChip, selectedCity === c.id && styles.dateChipActive]}
                        onPress={() => { Haptics.selectionAsync(); setSelectedCity(c.id); }}
                      >
                        {c.id !== "all" && <Ionicons name="location-outline" size={12} color={selectedCity === c.id ? Colors.text : Colors.muted} />}
                        <Text style={[styles.dateChipText, selectedCity === c.id && styles.dateChipTextActive]}>
                          {c.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>

                  <Text style={[styles.expandedFilterLabel, { marginTop: 10 }]}>DATE</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
                    {DATE_FILTERS.map((df) => (
                      <Pressable
                        key={df.id}
                        style={[styles.dateChip, selectedDate === df.id && styles.dateChipActive]}
                        onPress={() => { Haptics.selectionAsync(); setSelectedDate(df.id); }}
                      >
                        <Ionicons
                          name={df.icon}
                          size={12}
                          color={selectedDate === df.id ? Colors.text : Colors.muted}
                        />
                        <Text style={[styles.dateChipText, selectedDate === df.id && styles.dateChipTextActive]}>
                          {df.label}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>

                  <Text style={[styles.expandedFilterLabel, { marginTop: 10 }]}>ELO RANGE</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
                    {ELO_FILTERS.map((ef) => (
                      <Pressable
                        key={ef.id}
                        style={[styles.dateChip, selectedElo === ef.id && styles.dateChipActive]}
                        onPress={() => { Haptics.selectionAsync(); setSelectedElo(ef.id); }}
                      >
                        <Text style={[styles.dateChipText, selectedElo === ef.id && styles.dateChipTextActive]}>
                          {ef.label}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>

                  {activeFilterCount > 0 && (
                    <Pressable
                      style={styles.clearFiltersBtn}
                      onPress={() => {
                        Haptics.selectionAsync();
                        setSelectedCity("all");
                        setSelectedSkill("all");
                        setSelectedDate("all");
                        setSelectedElo("all");
                        setShowFilters(false);
                      }}
                    >
                      <Ionicons name="close-circle-outline" size={13} color={Colors.red} />
                      <Text style={styles.clearFiltersBtnText}>Clear {activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""}</Text>
                    </Pressable>
                  )}
                </View>
              )}
            </View>

            <View style={styles.upcomingHeader}>
              <View style={styles.sectionLabelRow}>
                <View style={[styles.sectionAccentBar, { backgroundColor: Colors.accent }]} />
                <Text style={styles.upcomingTitle}>
                  {filteredGames.length > 0 ? `${filteredGames.length} GAMES FOUND` : "UPCOMING GAMES"}
                </Text>
              </View>
              <Pressable onPress={() => { setSelectedDate("all"); setSelectedElo("all"); setSelectedSkill("all"); setSelectedCity("all"); }}>
                <Text style={styles.seeAll}>RESET</Text>
              </Pressable>
            </View>
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="football-outline" size={40} color={Colors.muted} />
            <Text style={styles.emptyText}>No games available</Text>
          </View>
        }
        ListFooterComponent={
          <>
            <ForYouSection forYouGames={forYouGames} followedIds={followedSnap} />
            <FriendsPlayingStrip friendGames={friendGames} />
            {!isLoggedIn ? (
              <Pressable
                style={styles.referralBanner}
                onPress={() => {
                  Alert.prompt(
                    "Enter Referral Code",
                    "Have a code from a friend? Enter it below.",
                    [
                      { text: "Cancel", style: "cancel" },
                      {
                        text: "Apply",
                        onPress: (code) => {
                          if (code && code.trim().length > 0) {
                            Alert.alert("Code Applied!", `Referral code "${code.trim().toUpperCase()}" will be applied when you sign up.`);
                          }
                        },
                      },
                    ],
                    "plain-text",
                    "",
                    "default"
                  );
                }}
              >
                <Ionicons name="gift-outline" size={16} color={Colors.accent} />
                <Text style={styles.referralBannerText}>Have a referral code? Tap to enter it</Text>
                <Ionicons name="chevron-forward" size={14} color={Colors.muted} />
              </Pressable>
            ) : null}
          </>
        }
      />

      <Pressable
        style={[styles.fab, { bottom: bottomPadding + 72 }]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          router.push("/create-game");
        }}
      >
        <Ionicons name="add" size={26} color={Colors.text} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.base,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  topBarLeft: {
    minWidth: 36,
    flexDirection: "row",
    alignItems: "center",
  },
  topBarRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  viewModeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.separator,
  },
  viewModeBtnActive: {
    backgroundColor: `${Colors.primary}44`,
    borderColor: Colors.accent,
  },
  mapFilterRow: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 10,
  },
  mapCityToggle: {
    flexDirection: "row",
    gap: 6,
  },
  mapCityChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.separator,
  },
  mapCityChipActive: {
    backgroundColor: `${Colors.primary}44`,
    borderColor: Colors.accent,
  },
  mapCityChipText: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    color: Colors.muted,
  },
  mapCityChipTextActive: {
    color: Colors.accent,
    fontFamily: "Inter_600SemiBold",
  },
  cityActiveChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: `${Colors.primary}33`,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  cityActiveText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    color: Colors.accent,
  },
  logoText: {
    flex: 1,
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    color: Colors.text,
    letterSpacing: 3,
    textAlign: "center",
  },
  bellBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
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
  bellBadgeText: {
    fontFamily: "Inter_700Bold",
    fontSize: 9,
    color: Colors.text,
  },
  sectionLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  sectionAccentBar: {
    width: 3,
    height: 14,
    borderRadius: 2,
  },
  featuredSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  featuredLabel: {
    fontFamily: "Inter_700Bold",
    fontSize: 10,
    color: Colors.muted,
    letterSpacing: 2,
  },
  featuredCard: {
    borderRadius: 16,
    overflow: "hidden",
    height: 200,
  },
  featuredImage: {
    width: "100%",
    height: "100%",
  },
  featuredGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 140,
  },
  featuredTopGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 60,
  },
  featuredOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    padding: 14,
    justifyContent: "space-between",
  },
  featuredOverlayTop: {
    flexDirection: "row",
  },
  featuredGameBadge: {
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  featuredGameBadgeText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 9,
    color: Colors.text,
    letterSpacing: 1,
  },
  featuredOverlayBottom: {
    gap: 3,
  },
  featuredVenue: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    color: Colors.text,
    letterSpacing: -0.3,
  },
  featuredMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  featuredMetaText: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: "rgba(230,226,223,0.7)",
  },
  featuredMetaDot: {
    color: Colors.muted,
    fontSize: 12,
  },
  featuredPriceRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  featuredPrice: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: Colors.accent,
  },
  filterSection: {
    marginBottom: 16,
  },
  filterTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingRight: 16,
  },
  filterRow: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.separator,
  },
  filterPillActive: {
    backgroundColor: `${Colors.primary}50`,
    borderColor: Colors.accent,
  },
  filterPillText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 10,
    color: Colors.muted,
    letterSpacing: 0.5,
  },
  filterPillTextActive: {
    color: Colors.accent,
  },
  filterToggleBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    borderWidth: 1,
    borderColor: Colors.separator,
  },
  filterToggleBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterToggleBtnBadge: {
    borderColor: Colors.accent,
  },
  filterBadge: {
    position: "absolute",
    top: -3,
    right: -3,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  filterBadgeText: {
    fontFamily: "Inter_700Bold",
    fontSize: 8,
    color: Colors.base,
  },
  expandedFilters: {
    backgroundColor: Colors.surface,
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 14,
    padding: 14,
    gap: 8,
  },
  expandedFilterLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 9,
    color: Colors.muted,
    letterSpacing: 1.5,
  },
  dateChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: Colors.overlay,
    borderWidth: 1,
    borderColor: Colors.separator,
  },
  dateChipActive: {
    backgroundColor: `${Colors.primary}44`,
    borderColor: Colors.accent,
  },
  dateChipText: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    color: Colors.muted,
  },
  dateChipTextActive: {
    color: Colors.accent,
    fontFamily: "Inter_600SemiBold",
  },
  clearFiltersBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-start",
    marginTop: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: `${Colors.red}11`,
    borderWidth: 1,
    borderColor: `${Colors.red}33`,
  },
  clearFiltersBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    color: Colors.red,
  },
  upcomingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  upcomingTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 11,
    color: Colors.muted,
    letterSpacing: 1.5,
  },
  seeAll: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    color: Colors.accent,
    letterSpacing: 0.5,
  },
  compactCardWrapper: {
    marginHorizontal: 16,
    marginBottom: 12,
  },
  compactVenueRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4,
    paddingBottom: 6,
  },
  compactVenueLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    flex: 1,
  },
  skillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  compactCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.separator,
  },
  compactCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  compactCardLeft: {
    flex: 1,
    gap: 3,
    marginRight: 10,
  },
  compactVenue: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
    color: Colors.text,
  },
  compactMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  compactMetaText: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: Colors.muted,
  },
  compactRight: {
    alignItems: "flex-end",
    gap: 4,
  },
  compactPrice: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    color: Colors.accent,
  },
  openBadge: {
    backgroundColor: `${Colors.accent}22`,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
  },
  openBadgeText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 9,
    color: Colors.accent,
  },
  compactStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  compactStat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  compactStatText: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: Colors.muted,
  },
  compactStatDot: {
    width: 3,
    height: 3,
    borderRadius: 999,
    backgroundColor: Colors.overlay,
  },
  joinMatchBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  joinMatchBtnText: {
    fontFamily: "Inter_700Bold",
    fontSize: 12,
    color: Colors.text,
    letterSpacing: 1,
  },
  emptyState: {
    alignItems: "center",
    paddingTop: 40,
    gap: 10,
  },
  emptyText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: Colors.muted,
  },
  fab: {
    position: "absolute",
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1.5,
    borderColor: `${Colors.accent}55`,
  },
  forYouSection: {
    marginBottom: 16,
  },
  forYouHeader: {
    paddingHorizontal: 16,
    marginBottom: 10,
    gap: 2,
  },
  forYouTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  forYouTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 11,
    color: Colors.amber,
    letterSpacing: 1.5,
  },
  forYouSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: Colors.muted,
  },
  forYouScroll: {
    paddingHorizontal: 16,
    gap: 10,
  },
  forYouCard: {
    width: 170,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 13,
    gap: 5,
    borderWidth: 1,
    borderColor: Colors.separator,
  },
  forYouEloChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: `${Colors.accent}18`,
    alignSelf: "flex-start",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
    marginBottom: 2,
  },
  forYouEloText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 9,
    color: Colors.accent,
    letterSpacing: 0.5,
  },
  forYouVenue: {
    fontFamily: "Inter_700Bold",
    fontSize: 13,
    color: Colors.text,
    lineHeight: 17,
  },
  forYouAddress: {
    fontFamily: "Inter_400Regular",
    fontSize: 10,
    color: Colors.muted,
  },
  forYouMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  forYouMetaText: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: Colors.muted,
  },
  forYouFriends: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: `${Colors.teal}15`,
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 8,
  },
  forYouFriendsText: {
    fontFamily: "Inter_500Medium",
    fontSize: 10,
    color: Colors.teal,
    flex: 1,
  },
  forYouBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 2,
  },
  forYouPrice: {
    fontFamily: "Inter_700Bold",
    fontSize: 13,
    color: Colors.accent,
  },
  forYouSkill: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
  },
  forYouSkillText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 9,
    letterSpacing: 0.3,
  },
  friendsSection: {
    marginBottom: 16,
  },
  friendsScroll: {
    paddingHorizontal: 16,
    gap: 10,
  },
  friendCard: {
    width: 110,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 12,
    gap: 4,
    alignItems: "center",
    borderWidth: 1,
    borderColor: `${Colors.teal}33`,
  },
  friendAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${Colors.teal}33`,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  friendAvatarText: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
    color: Colors.teal,
  },
  friendName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: Colors.text,
    textAlign: "center",
  },
  friendSummary: {
    fontFamily: "Inter_400Regular",
    fontSize: 10,
    color: Colors.muted,
    textAlign: "center",
    lineHeight: 14,
  },
  friendSummaryBold: {
    fontFamily: "Inter_600SemiBold",
    color: Colors.teal,
  },
  referralBanner: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.surface,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: `${Colors.accent}44`,
  },
  referralBannerText: {
    flex: 1,
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.text,
  },
});
