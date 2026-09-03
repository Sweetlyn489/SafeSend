import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { User } from "../types";
import { api } from "../api";

interface SessionContextValue {
  user: User | null;
  loading: boolean;
  login: (userId: number) => Promise<void>;
  logout: () => void;
  setBalance: (balance: number) => void;
  refreshUser: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | undefined>(undefined);

const STORAGE_KEY = "safesend.userId";

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const login = useCallback(async (userId: number) => {
    const fetched = await api.getUser(userId);
    setUser(fetched);
    localStorage.setItem(STORAGE_KEY, String(userId));
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const setBalance = useCallback((balance: number) => {
    setUser((prev) => (prev ? { ...prev, balance } : prev));
  }, []);

  const refreshUser = useCallback(async () => {
    if (!user) return;
    const fetched = await api.getUser(user.id);
    setUser(fetched);
  }, [user]);

  useEffect(() => {
    const storedId = localStorage.getItem(STORAGE_KEY);
    if (storedId) {
      login(Number(storedId)).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <SessionContext.Provider value={{ user, loading, login, logout, setBalance, refreshUser }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within a SessionProvider");
  return ctx;
}
