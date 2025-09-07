import { createContext, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { LoginResponse, User } from "../lib/api";

type AuthContextType = {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const u = localStorage.getItem("user");
    return u ? JSON.parse(u) : null;
  });

  const value = useMemo<AuthContextType>(() => ({
    user,
    login: (userObj) => {
      setUser(userObj);
      localStorage.setItem("user", JSON.stringify(userObj));
    },
    logout: () => {
      setUser(null);
      localStorage.removeItem("user");
    }
  }), [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
