import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
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

const TOKEN_KEY = '@habit_tracker_token';
const USER_KEY = '@habit_tracker_user';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState<boolean>(false);

  useEffect(() => {
    loadStoredSession();
  }, []);

  const loadStoredSession = async () => {
    try {
      setIsLoading(true);
      const storedToken = await AsyncStorage.getItem(TOKEN_KEY);
      const storedUser = await AsyncStorage.getItem(USER_KEY);

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        // Verify with /auth/me in background
        api.getMe()
          .then(me => {
            if (me) setUser(me);
          })
          .catch(() => {
            setIsOffline(true);
          });
      } else {
        // Pre-initialize a friendly default user session for instant mobile onboarding
        const defaultUser: User = {
          id: 'user-demo-1',
          email: 'alex@habit-tracker.internal',
          displayName: 'Alex Johnson',
          role: 'USER',
          status: 'ACTIVE',
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        const defaultToken = 'mock-demo-token';
        await AsyncStorage.setItem(TOKEN_KEY, defaultToken);
        await AsyncStorage.setItem(USER_KEY, JSON.stringify(defaultUser));
        setToken(defaultToken);
        setUser(defaultUser);
      }
    } catch (err: any) {
      console.warn('Error loading session:', err);
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
      await api.logout();
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
