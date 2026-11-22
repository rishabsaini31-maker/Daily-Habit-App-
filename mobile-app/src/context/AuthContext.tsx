import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  isOffline: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string, timezone?: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Pure In-Memory Auth Context:
 * - 0% local database / 0% AsyncStorage / 0% SQLite
 * - Session state managed in memory
 */
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState<boolean>(false);

  useEffect(() => {
    loadSession();
  }, []);

  const loadSession = async () => {
    try {
      setIsLoading(true);
      // Pure in-memory session: check backend session if token exists
      const me = await api.getMe();
      if (me) {
        setUser(me);
      } else {
        setUser(null);
        setToken(null);
      }
    } catch (err: any) {
      setUser(null);
      setToken(null);
      setIsOffline(true);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await api.login(email, password);
      setUser(res.user);
      setToken(res.token);
    } catch (err: any) {
      setError(err.message || 'Failed to sign in. Please verify credentials.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, displayName: string, timezone?: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await api.register(email, password, displayName, timezone);
      setUser(res.user);
      setToken(res.token);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please check inputs.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await api.logout().catch(() => {});
      setUser(null);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => setError(null);

  const refreshUser = async () => {
    try {
      const me = await api.getMe();
      if (me) setUser(me);
    } catch {
      // ignore
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        error,
        isOffline,
        login,
        register,
        logout,
        clearError,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
