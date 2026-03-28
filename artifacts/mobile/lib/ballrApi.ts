import {
  Player,
  Game,
  Venue,
  Booking,
  PotmEntry,
  Notification,
  EloHistoryEntry,
  SkillLevel,
  GameStatus,
  SurfaceType,
  NotificationType,
  Crew,
  CrewMember,
  CrewGame,
  CrewLeaderboardEntry,
  CrewRole,
} from "@/constants/mock";
import { API_BASE, MAYA_CHEN_ID } from "./supabase";

const CITY_ID_MAP: Record<string, string> = {
  "c1000000-0000-0000-0000-000000000001": "bangkok",
  "c1000000-0000-0000-0000-000000000002": "bali",
};

async function apiFetch(path: string): Promise<any> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`);
  return res.json();
}

export function transformPlayer(p: any): Player {
  return {
    id: p.id,
    name: p.name,
    profileImageUrl: p.profile_image_url ?? undefined,
    bannerImageUrl: p.banner_image_url ?? undefined,
    nationality: p.nationality ?? "Unknown",
    eloRating: p.elo_rating ?? 1000,
    eloCalibrated: p.elo_calibrated ?? true,
    gamesPlayed: p.games_played ?? 0,
    gamesWon: p.games_won ?? 0,
    gamesLost: p.games_lost ?? 0,
    gamesDrawn: p.games_drawn ?? 0,
    reliabilityScore: p.reliability_score ?? 100,
    noShowCount: p.no_show_count ?? 0,
    avgSkillRating: Number(p.avg_skill_rating) || 3.5,
    avgSportsmanshipRating: Number(p.avg_sportsmanship_rating) || 3.5,
    preferredPositions: p.preferred_position ? [p.preferred_position] : [],
    footPreference: p.foot_preference ?? undefined,
    bio: p.bio ?? "",
    basedIn: p.based_in ?? "",
    memberSince: p.member_since ?? "",
    winStreak: p.win_streak ?? 0,
    ballerScore: Number(p.baller_score) ?? 0,
    eloGainThisMonth: p.elo_gain_this_month ?? 0,
    medal: p.medal ?? undefined,
    instagram: p.instagram ?? undefined,
    whatsapp: p.whatsapp ?? undefined,
    favoriteTeam: p.favorite_team ?? undefined,
    favoritePlayer: p.favorite_player ?? undefined,
    following: Array.isArray(p.following) ? p.following : [],
  };
}

export function transformVenue(v: any): Venue {
  return {
    id: v.id ?? "",
    name: v.name ?? "Unknown Venue",
    address: v.address ?? "",
    cityId: CITY_ID_MAP[v.city_id] ?? v.cityId ?? "bangkok",
    surfaceType: (v.surface_type ?? v.surfaceType ?? "turf") as SurfaceType,
    amenities: Array.isArray(v.amenities) ? v.amenities : [],
    lat: Number(v.latitude ?? v.lat) || 0,
    lng: Number(v.longitude ?? v.lng) || 0,
    capacity: v.capacity ?? undefined,
    imageUrl: v.image_url ?? v.imageUrl ?? undefined,
    communityLink: v.community_link ?? v.communityLink ?? undefined,
    communityType: v.community_type ?? v.communityType ?? undefined,
    totalGames: v.total_games ?? v.totalGames ?? undefined,
  };
}

export function transformBooking(b: any, gameId: string): Booking {
  return {
    id: b.id,
    gameId,
    player: transformPlayer(b.player),
    teamAssignment: b.team === "A" ? "blue" : b.team === "B" ? "red" : "none",
    paymentStatus: b.paid ? "paid" : "pending",
    attended: b.status === "attended",
    markedNoShow: b.status === "no_show",
  };
}

export function transformGame(g: any): Game {
  const timeStr = (g.start_time ?? "18:00:00").substring(0, 5);
  const gameTime = `${g.date}T${timeStr}:00`;
  return {
    id: g.id,
    venue: transformVenue(g.venue ?? {}),
    cityId: CITY_ID_MAP[g.city_id] ?? "bangkok",
    gameTime,
    durationMinutes: g.duration_minutes ?? 60,
    maxPlayers: g.max_players ?? 12,
    currentPlayers: g.current_players ?? 0,
    pricePerPlayer: Number(g.price_per_player) || 0,
    skillLevel: (g.skill_category ?? "mixed") as SkillLevel,
    status: (g.status ?? "upcoming") as GameStatus,
    organizer: transformPlayer(g.organizer ?? {}),
    bookings: Array.isArray(g.bookings)
      ? g.bookings.map((b: any) => transformBooking(b, g.id))
      : [],
    description: g.description ?? undefined,
    registrationCutoff: g.registration_cutoff ?? gameTime,
    teamsBalanced: g.teams_balanced ?? false,
    winningTeam: g.winning_team ?? undefined,
    minElo: g.min_elo ?? 0,
    maxElo: g.max_elo ?? 2000,
    avgElo: g.avg_elo ?? 1000,
    aiAssignmentCalculated: g.ai_assignment_calculated ?? false,
    aiAssignment: g.ai_assignment ?? undefined,
  };
}

export function transformPotmEntry(p: any): PotmEntry {
  return {
    rank: p.rank,
    player: transformPlayer(p.player),
    potmScore: Number(p.potm_score) || 0,
    gamesPlayed: p.games_played ?? 0,
    wins: p.wins ?? 0,
    avgSkillRating: Number(p.avg_peer_rating) || 0,
  };
}

export function transformNotification(n: any): Notification {
  return {
    id: n.id,
    type: (n.type ?? "game_confirmed") as NotificationType,
    title: n.title ?? "",
    body: n.body ?? "",
    timestamp: n.created_at ?? new Date().toISOString(),
    read: n.read ?? false,
    gameId: n.game_id ?? undefined,
  };
}

export function transformEloHistory(e: any): EloHistoryEntry {
  return {
    gameId: e.game_id,
    venueName: e.venue_name ?? "Unknown Venue",
    eloBefore: e.old_elo,
    eloAfter: e.new_elo,
    change: e.change,
    reason: e.reason as EloHistoryEntry["reason"],
    date: e.created_at,
  };
}

export async function fetchUpcomingGames(limit = 30): Promise<Game[]> {
  const data = await apiFetch(`/games?status=upcoming&limit=${limit}`);
  return Array.isArray(data) ? data.map(transformGame) : [];
}

export async function fetchGameById(id: string): Promise<Game | null> {
  try {
    const data = await apiFetch(`/games/${id}`);
    return transformGame(data);
  } catch {
    return null;
  }
}

export async function fetchPlayers(city?: string, limit = 100): Promise<Player[]> {
  try {
    const q = city ? `?city=${encodeURIComponent(city)}&limit=${limit}` : `?limit=${limit}`;
    const data = await apiFetch(`/players${q}`);
    return Array.isArray(data) ? data.map(transformPlayer) : [];
  } catch {
    return [];
  }
}

export async function fetchPlayerById(id: string): Promise<Player | null> {
  try {
    const data = await apiFetch(`/players/${id}`);
    return transformPlayer(data);
  } catch {
    return null;
  }
}

export async function fetchLeaderboard(
  type: "baller" | "elo" | "champion",
  city: string,
  limit = 20
): Promise<PotmEntry[]> {
  try {
    if (type === "baller" || type === "champion") {
      const data = await apiFetch(`/leaderboard?type=${type}&city=${city}&limit=${limit * 3}`);
      const arr = Array.isArray(data) ? data : [];
      const cityKey = city.toLowerCase();
      const filtered = arr
        .filter((e: any) => {
          const mapped = CITY_ID_MAP[e.city_id];
          return mapped === cityKey;
        })
        .sort((a: any, b: any) => a.rank - b.rank)
        .slice(0, limit);
      return filtered.map(transformPotmEntry);
    }
    const data = await apiFetch(`/players?city=${encodeURIComponent(city)}&limit=${limit}`);
    const arr = Array.isArray(data) ? data : [];
    return arr
      .sort((a: any, b: any) => (b.elo_rating ?? 0) - (a.elo_rating ?? 0))
      .map((p: any, i: number) => ({
        rank: i + 1,
        player: transformPlayer(p),
        potmScore: p.elo_rating ?? 1000,
        gamesPlayed: p.games_played ?? 0,
        wins: p.games_won ?? 0,
        avgSkillRating: Number(p.avg_skill_rating) || 0,
      }));
  } catch {
    return [];
  }
}

export async function fetchVenueById(id: string): Promise<Venue | null> {
  try {
    const data = await apiFetch(`/venues/${id}`);
    return transformVenue(data);
  } catch {
    return null;
  }
}

export async function fetchCurrentPlayer(): Promise<Player | null> {
  return fetchPlayerById(MAYA_CHEN_ID);
}

export async function fetchNotifications(playerId: string): Promise<Notification[]> {
  try {
    const data = await apiFetch(`/players/${playerId}/notifications`);
    const arr = Array.isArray(data) ? data : [];
    return arr.map(transformNotification).slice(0, 30);
  } catch {
    return [];
  }
}

export async function fetchEloHistory(playerId: string): Promise<EloHistoryEntry[]> {
  try {
    const data = await apiFetch(`/players/${playerId}/elo-history`);
    const arr = Array.isArray(data) ? data : [];
    return arr.slice(0, 20).map(transformEloHistory);
  } catch {
    return [];
  }
}

// ── Crew transforms ──────────────────────────────────────────────

export function transformCrew(c: Record<string, unknown>): Crew {
  return {
    id: c.id as string,
    name: (c.name as string) ?? "Unnamed Crew",
    description: (c.description as string) ?? "",
    primaryColor: (c.primary_color as string) ?? "#2D5A27",
    inviteCode: (c.invite_code as string) ?? "",
    isPrivate: (c.is_private as boolean) ?? false,
    cityId: (c.city_id as string) ?? "",
    createdAt: (c.created_at as string) ?? "",
    memberCount: (c.member_count as number) ?? 0,
    gameCount: (c.game_count as number) ?? 0,
    avgElo: (c.avg_elo as number) ?? 1000,
  };
}

export function transformCrewMember(m: Record<string, unknown>): CrewMember {
  // API may return nested player data as m.player.name
  const player = (m.player ?? {}) as Record<string, unknown>;
  return {
    id: (m.id as string) ?? "",
    crewId: (m.crew_id as string) ?? "",
    playerId: (m.player_id as string) ?? (player.id as string) ?? "",
    playerName:
      (m.player_name as string) ??
      (player.name as string) ??
      (m.name as string) ??
      "Unknown",
    profileImageUrl:
      (m.profile_image_url as string) ??
      (player.profile_image_url as string) ??
      undefined,
    role: ((m.role as string) ?? "member") as CrewRole,
    crewElo: (m.crew_elo as number) ?? (m.elo as number) ?? 1000,
    gamesPlayed: (m.games_played as number) ?? (m.total_games as number) ?? (player.games_played as number) ?? (player.total_games as number) ?? 0,
    gamesWon: (m.games_won as number) ?? (m.wins as number) ?? (player.games_won as number) ?? (player.wins as number) ?? 0,
    joinedAt: (m.joined_at as string) ?? "",
  };
}

export function transformCrewGame(g: Record<string, unknown>): CrewGame {
  // API may return nested venue data as g.venue.name
  const venue = (g.venue ?? {}) as Record<string, unknown>;
  return {
    id: (g.id as string) ?? "",
    crewId: (g.crew_id as string) ?? "",
    gameId: (g.game_id as string) ?? (g.id as string) ?? "",
    venueName: (g.venue_name as string) ?? (venue.name as string) ?? "Unknown Venue",
    gameTime: (g.game_time as string) ?? (g.date as string) ?? "",
    status: ((g.status as string) ?? "upcoming") as GameStatus,
    playerCount: (g.player_count as number) ?? (g.current_players as number) ?? 0,
    maxPlayers: (g.max_players as number) ?? 12,
    winningTeam: (g.winning_team as "blue" | "red" | "draw") ?? undefined,
  };
}

export function transformCrewLeaderboardEntry(
  e: Record<string, unknown>,
  idx: number
): CrewLeaderboardEntry {
  // API may return nested player data as e.player.name
  const player = (e.player ?? {}) as Record<string, unknown>;
  return {
    rank: (e.rank as number) ?? idx + 1,
    playerId: (e.player_id as string) ?? (player.id as string) ?? "",
    playerName:
      (e.player_name as string) ??
      (player.name as string) ??
      (e.name as string) ??
      "Unknown",
    profileImageUrl:
      (e.profile_image_url as string) ??
      (player.profile_image_url as string) ??
      undefined,
    crewElo: (e.crew_elo as number) ?? (e.elo as number) ?? 1000,
    gamesPlayed: (e.games_played as number) ?? (player.games_played as number) ?? 0,
    gamesWon: (e.games_won as number) ?? (player.games_won as number) ?? 0,
  };
}

// ── Crew API fetchers ──────────────────────────────────────────

export async function fetchCrews(): Promise<Crew[]> {
  try {
    const data = await apiFetch("/crews");
    const arr = Array.isArray(data) ? data : [];
    return arr.map(transformCrew);
  } catch {
    return [];
  }
}

export async function fetchCrewById(id: string): Promise<Crew | null> {
  try {
    const data = await apiFetch(`/crews/${id}`);
    return transformCrew(data);
  } catch {
    return null;
  }
}

export async function fetchCrewMembers(id: string): Promise<CrewMember[]> {
  try {
    const data = await apiFetch(`/crews/${id}/members`);
    const arr = Array.isArray(data) ? data : [];
    return arr.map(transformCrewMember);
  } catch {
    return [];
  }
}

export async function fetchCrewLeaderboard(id: string): Promise<CrewLeaderboardEntry[]> {
  try {
    const data = await apiFetch(`/crews/${id}/leaderboard`);
    const arr = Array.isArray(data) ? data : [];
    return arr.map((e: Record<string, unknown>, i: number) =>
      transformCrewLeaderboardEntry(e, i)
    );
  } catch {
    return [];
  }
}

export async function fetchCrewGames(id: string): Promise<CrewGame[]> {
  try {
    const data = await apiFetch(`/crews/${id}/games`);
    const arr = Array.isArray(data) ? data : [];
    return arr.map(transformCrewGame);
  } catch {
    return [];
  }
}

export async function fetchCrewByInviteCode(code: string): Promise<Crew | null> {
  try {
    const data = await apiFetch(`/crews/join?code=${encodeURIComponent(code)}`);
    return transformCrew(data);
  } catch {
    return null;
  }
}
