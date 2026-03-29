import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { PLAYERS, Player } from "@/constants/mock";
import { API_BASE } from "@/lib/supabase";
import { transformPlayer } from "@/lib/ballrApi";

const AUTH_STORAGE_KEY = "ballr_auth_user";

interface AuthContextType {
  user: Player | null;
  isLoggedIn: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  loginAsDemo: () => void;
  logout: () => void;
  updateProfile: (updates: Partial<Player>) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoggedIn: false,
  login: async () => {},
  signup: async () => {},
  loginAsDemo: () => {},
  logout: () => {},
  updateProfile: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Player | null>(null);

  // Restore persisted auth state on mount — auto-login as demo user if no saved session
  useEffect(() => {
    AsyncStorage.getItem(AUTH_STORAGE_KEY)
      .then((stored) => {
        if (stored) {
          try {
            const parsed = JSON.parse(stored) as Player;
            // Ensure persisted user always has fresh ELO from PLAYERS[0]
            if (parsed.id === "p0") {
              setUser({ ...PLAYERS[0], isCurrentUser: true });
            } else {
              setUser(parsed);
            }
          } catch {
            AsyncStorage.removeItem(AUTH_STORAGE_KEY);
            // Auto-login as demo user
            setUser({ ...PLAYERS[0], isCurrentUser: true });
          }
        } else {
          // No saved session — auto-login as demo user
          setUser({ ...PLAYERS[0], isCurrentUser: true });
        }
      })
      .catch(() => {
        // Storage error — auto-login as demo user
        setUser({ ...PLAYERS[0], isCurrentUser: true });
      });
  }, []);

  // Persist user whenever it changes
  useEffect(() => {
    if (user) {
      AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user)).catch(() => {});
    }
  }, [user]);

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.toLowerCase().trim(), password }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.player) {
        const player = transformPlayer(data.player);
        player.isCurrentUser = true;
        setUser(player);
        return;
      }
      throw new Error(data.error || "Login failed");
    } catch (e) {
      // Fallback to mock data if API is down
      console.warn("API login failed, falling back to mock:", e);
      await new Promise((r) => setTimeout(r, 500));
      setUser({ ...PLAYERS[0], isCurrentUser: true });
    }
  };

  const signup = async (name: string, email: string, _password: string) => {
    // For now signup creates a local user — real signup would need a POST endpoint
    await new Promise((r) => setTimeout(r, 800));
    setUser({
      ...PLAYERS[0],
      name,
      eloRating: 1000,
      eloCalibrated: false,
      gamesPlayed: 0,
      gamesWon: 0,
      gamesLost: 0,
      gamesDrawn: 0,
      reliabilityScore: 100,
      noShowCount: 0,
      memberSince: new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" }),
      isCurrentUser: true,
    });
  };

  const loginAsDemo = () => {
    setUser({ ...PLAYERS[0], isCurrentUser: true });
  };

  const logout = () => {
    setUser(null);
    AsyncStorage.removeItem(AUTH_STORAGE_KEY).catch(() => {});
  };

  const updateProfile = (updates: Partial<Player>) => {
    if (user) setUser({ ...user, ...updates });
  };

  const isLoggedIn = user !== null;

  return (
    <AuthContext.Provider value={{ user, isLoggedIn, login, signup, loginAsDemo, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
