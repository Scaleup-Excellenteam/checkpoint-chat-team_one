import { createContext, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { User } from "../lib/api";
import { AUTH_URL } from "../config/env";

type AuthContextType = {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const u = localStorage.getItem("user");
    return u ? JSON.parse(u) : null;
  });
  
  const [loading, setLoading] = useState(false);

  const login = async (email: string, password: string) => {
    console.log('🔐 Login attempt with email:', email);
    setLoading(true);
    
    try {
  const response = await fetch(`${AUTH_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ identifier: email, password }),
      });

      console.log('🔐 Login response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('🔐 Login failed:', errorText);
        throw new Error(`Login failed: ${errorText}`);
      }

      const data = await response.json();
      console.log('🔐 Login successful:', data);

      // Store user and token
      setUser(data.user);
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("token", data.token);
      
    } catch (error) {
      console.error('🔐 Login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (username: string, email: string, password: string) => {
    console.log('📝 Register attempt with username:', username, 'email:', email);
    setLoading(true);
    
    try {
  const response = await fetch(`${AUTH_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, email, password }),
      });

      console.log('📝 Register response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('📝 Registration failed:', errorText);
        throw new Error(`Registration failed: ${errorText}`);
      }

      const data = await response.json();
      console.log('📝 Registration successful:', data);

      // Auto-login after successful registration
      setUser(data.user);
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("token", data.token);
      
    } catch (error) {
      console.error('📝 Registration error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    console.log('🚪 Logging out');
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  };

  const value = useMemo<AuthContextType>(() => ({
    user,
    login,
    register,
    logout,
    loading
  }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
