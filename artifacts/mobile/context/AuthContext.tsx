import React, { createContext, useContext, useState, ReactNode } from "react";
import { PLAYERS, Player } from "@/constants/mock";

interface AuthContextType {
  user: Player | null;
  isLoggedIn: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateProfile: (updates: Partial<Player>) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoggedIn: false,
  login: async () => {},
  signup: async () => {},
  logout: () => {},
  updateProfile: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Player | null>(null);

  const login = async (email: string, _password: string) => {
    await new Promise((r) => setTimeout(r, 800));
    setUser(PLAYERS[0]);
  };

  const signup = async (name: string, _email: string, _password: string) => {
    await new Promise((r) => setTimeout(r, 1000));
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

  const logout = () => setUser(null);

  const updateProfile = (updates: Partial<Player>) => {
    if (user) setUser({ ...user, ...updates });
  };

  return (
    <AuthContext.Provider value={{ user, isLoggedIn: !!user, login, signup, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
