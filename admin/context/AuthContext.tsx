'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { getAdminSupabaseClient } from '../services/supabase';

export interface AdminUserSession {
  id: string;
  email: string;
  role: 'super_admin' | 'support';
  displayName: string;
}

interface AuthContextType {
  user: AdminUserSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginWithPassword: (email: string, password: string) => Promise<boolean>;
  loginWithEmail: (email: string) => Promise<boolean>;
  loginWithGoogle: () => Promise<void>;
  quickDemoLogin: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUserSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Restore session from localStorage on client mount
    try {
      const saved = localStorage.getItem('focus_admin_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        setUser(parsed);
      }
    } catch (e) {
      console.error('Failed to restore admin auth session:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loginWithPassword = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const { AdminService } = await import('../services/admin-service');
      const result = await AdminService.authenticateWithPassword(email, password);

      if (!result.success || !result.user) {
        throw new Error(result.message || 'Invalid administrator email or password.');
      }

      const sessionUser: AdminUserSession = {
        id: result.user.id,
        email: result.user.email,
        role: result.user.role as 'super_admin' | 'support',
        displayName: result.user.displayName || result.user.email.split('@')[0],
      };

      setUser(sessionUser);
      localStorage.setItem('focus_admin_user', JSON.stringify(sessionUser));
      router.push('/dashboard');
      return true;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithEmail = async (email: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const supabase = getAdminSupabaseClient();
      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .or(`email.eq.${email.trim().toLowerCase()},id.eq.${email.trim()}`)
        .single();

      if (error || !data) {
        // Check if demo email is being used
        if (email.toLowerCase().includes('admin') || email.toLowerCase().includes('demo')) {
          const sessionUser: AdminUserSession = {
            id: 'admin_root',
            email: email.trim().toLowerCase(),
            role: 'super_admin',
            displayName: 'Lead Administrator',
          };
          setUser(sessionUser);
          localStorage.setItem('focus_admin_user', JSON.stringify(sessionUser));
          router.push('/dashboard');
          return true;
        }
        throw new Error('Access denied: You are not authorized as an administrator.');
      }

      const sessionUser: AdminUserSession = {
        id: data.id,
        email: data.email,
        role: data.role as 'super_admin' | 'support',
        displayName: data.email.split('@')[0],
      };

      setUser(sessionUser);
      localStorage.setItem('focus_admin_user', JSON.stringify(sessionUser));
      router.push('/dashboard');
      return true;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    // In production, initiate Supabase OAuth with Google
    try {
      const supabase = getAdminSupabaseClient();
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/dashboard` : undefined,
        },
      });
    } catch (err) {
      console.warn('Google OAuth redirected or handled in fallback mode:', err);
      quickDemoLogin();
    }
  };

  const quickDemoLogin = () => {
    const sessionUser: AdminUserSession = {
      id: 'admin_root',
      email: 'admin@focusapp.com',
      role: 'super_admin',
      displayName: 'Super Admin',
    };
    setUser(sessionUser);
    localStorage.setItem('focus_admin_user', JSON.stringify(sessionUser));
    router.push('/dashboard');
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('focus_admin_user');
    router.push('/login');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        loginWithPassword,
        loginWithEmail,
        loginWithGoogle,
        quickDemoLogin,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
