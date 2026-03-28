import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
  Game,
  Player,
  PotmEntry,
  Notification,
  EloHistoryEntry,
} from "@/constants/mock";
import {
  fetchUpcomingGames,
  fetchLeaderboard,
  fetchCurrentPlayer,
  fetchNotifications,
  fetchEloHistory,
  fetchPlayers,
} from "@/lib/ballrApi";
import { MAYA_CHEN_ID } from "@/lib/supabase";

interface BallrData {
  games: Game[];
  players: Player[];
  currentPlayer: Player | null;
  notifications: Notification[];
  eloHistory: EloHistoryEntry[];
  potmBangkok: PotmEntry[];
  potmBali: PotmEntry[];
  eloBangkok: PotmEntry[];
  eloBali: PotmEntry[];
  isLoadingGames: boolean;
  isLoadingLeaderboard: boolean;
  isLoadingProfile: boolean;
  refreshGames: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

const BallrDataContext = createContext<BallrData>({
  games: [],
  players: [],
  currentPlayer: null,
  notifications: [],
  eloHistory: [],
  potmBangkok: [],
  potmBali: [],
  eloBangkok: [],
  eloBali: [],
  isLoadingGames: true,
  isLoadingLeaderboard: true,
  isLoadingProfile: true,
  refreshGames: async () => {},
  refreshNotifications: async () => {},
});

export function BallrDataProvider({ children }: { children: ReactNode }) {
  const [games, setGames] = useState<Game[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [eloHistory, setEloHistory] = useState<EloHistoryEntry[]>([]);
  const [potmBangkok, setPotmBangkok] = useState<PotmEntry[]>([]);
  const [potmBali, setPotmBali] = useState<PotmEntry[]>([]);
  const [eloBangkok, setEloBangkok] = useState<PotmEntry[]>([]);
  const [eloBali, setEloBali] = useState<PotmEntry[]>([]);
  const [isLoadingGames, setIsLoadingGames] = useState(true);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(true);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  const loadGames = async () => {
    try {
      const upcoming = await fetchUpcomingGames(40);
      setGames(upcoming);
    } catch (e) {
      console.warn("Failed to load games", e);
    } finally {
      setIsLoadingGames(false);
    }
  };

  const loadLeaderboard = async () => {
    try {
      const [potmBkk, potmBli, eloBkk, eloBli] = await Promise.all([
        fetchLeaderboard("baller", "Bangkok", 20).catch(() => []),
        fetchLeaderboard("baller", "Bali", 20).catch(() => []),
        fetchLeaderboard("elo", "Bangkok", 50).catch(() => []),
        fetchLeaderboard("elo", "Bali", 50).catch(() => []),
      ]);
      if (potmBkk.length > 0) setPotmBangkok(potmBkk);
      if (potmBli.length > 0) setPotmBali(potmBli);
      if (eloBkk.length > 0) setEloBangkok(eloBkk);
      if (eloBli.length > 0) setEloBali(eloBli);
    } catch (e) {
      console.warn("Failed to load leaderboard", e);
    } finally {
      setIsLoadingLeaderboard(false);
    }
  };

  const loadProfile = async () => {
    try {
      const [player, history, allPlayers] = await Promise.all([
        fetchCurrentPlayer().catch((e) => { console.warn("fetchCurrentPlayer failed", e); return null; }),
        fetchEloHistory(MAYA_CHEN_ID).catch(() => []),
        fetchPlayers("Bangkok", 100).catch(() => fetchPlayers(undefined, 50).catch(() => [])),
      ]);
      if (player) setCurrentPlayer(player);
      if (history.length > 0) setEloHistory(history);
      if (allPlayers.length > 0) setPlayers(allPlayers);
    } catch (e) {
      console.warn("Failed to load profile", e);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const loadNotifications = async () => {
    try {
      const notifs = await fetchNotifications(MAYA_CHEN_ID);
      setNotifications(notifs);
    } catch (e) {
      console.warn("Failed to load notifications", e);
    }
  };

  useEffect(() => {
    loadGames();
    loadLeaderboard();
    loadProfile();
    loadNotifications();
  }, []);

  const refreshGames = async () => {
    setIsLoadingGames(true);
    await loadGames();
  };

  const refreshNotifications = async () => {
    await loadNotifications();
  };

  return (
    <BallrDataContext.Provider
      value={{
        games,
        players,
        currentPlayer,
        notifications,
        eloHistory,
        potmBangkok,
        potmBali,
        eloBangkok,
        eloBali,
        isLoadingGames,
        isLoadingLeaderboard,
        isLoadingProfile,
        refreshGames,
        refreshNotifications,
      }}
    >
      {children}
    </BallrDataContext.Provider>
  );
}

export function useBallrData() {
  return useContext(BallrDataContext);
}
