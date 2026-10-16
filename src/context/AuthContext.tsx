"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { User, authApi } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Continue client cleanup even if network fails
    } finally {
      localStorage.removeItem('hospital_crm_token');
      localStorage.removeItem('hospital_crm_refresh_token');
      localStorage.removeItem('hospital_crm_user');

      if (typeof document !== 'undefined') {
        document.cookie = 'hospital_crm_token=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      }

      setToken(null);
      setUser(null);
      router.push('/login');
    }
  }, [router]);

  // Initialize auth state from localStorage on app boot
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = localStorage.getItem('hospital_crm_token');
        const storedUser = localStorage.getItem('hospital_crm_user');

        if (!storedToken || !storedUser) {
          // If no token in localStorage, make sure stale cookie is purged
          if (typeof document !== 'undefined') {
            document.cookie = 'hospital_crm_token=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT';
          }
          setIsLoading(false);
          return;
        }

        const parsedUser = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(parsedUser);

        // Synchronize cookie for Next.js server-side middleware
        if (typeof document !== 'undefined') {
          document.cookie = `hospital_crm_token=${storedToken}; path=/; max-age=604800; SameSite=Lax`;
        }

        // Unblock UI immediately so dashboard opens instantly without waiting for network!
        setIsLoading(false);

        // Silently verify session and refresh profile in background
        try {
          const meRes = await authApi.getMe();
          if (meRes.success && meRes.data) {
            setUser(meRes.data);
            localStorage.setItem('hospital_crm_user', JSON.stringify(meRes.data));
          }
        } catch (err: any) {
          // Only invalidate session if server explicitly returned 401 Unauthorized
          if (err?.statusCode === 401) {
            console.warn('Session expired on server. Logging out...');
            logout();
          }
        }
      } catch (err) {
        console.error('Failed to parse local auth state', err);
        if (typeof document !== 'undefined') {
          document.cookie = 'hospital_crm_token=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        }
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, [logout]);

  const login = async (credentials: { email: string; password: string }) => {
    setIsLoading(true);
    try {
      const res = await authApi.login(credentials);
      if (res.success && res.data) {
        const { user: userData, tokens } = res.data;

        localStorage.setItem('hospital_crm_token', tokens.accessToken);
        localStorage.setItem('hospital_crm_refresh_token', tokens.refreshToken);
        localStorage.setItem('hospital_crm_user', JSON.stringify(userData));

        // Set cookie for middleware route protection
        if (typeof document !== 'undefined') {
          document.cookie = `hospital_crm_token=${tokens.accessToken}; path=/; max-age=604800; SameSite=Lax`;
        }

        setToken(tokens.accessToken);
        setUser(userData);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const refreshProfile = async () => {
    try {
      const res = await authApi.getMe();
      if (res.success && res.data) {
        setUser(res.data);
        localStorage.setItem('hospital_crm_user', JSON.stringify(res.data));
      }
    } catch {
      // Ignore
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!token && !!user,
        login,
        logout,
        refreshProfile,
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
