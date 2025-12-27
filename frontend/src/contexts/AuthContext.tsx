'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '../lib/api/auth';
import toast from 'react-hot-toast';
import { mapBackendRoleToFrontend, getDashboardRoute, type FrontendUserRole, type BackendUser } from '../lib/api/types';

interface User {
  id: string;
  email: string;
  role: FrontendUserRole;
  name?: string | null;
  fullName?: string | null;
  companyId?: string | null;
  avatarUrl?: string | null;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  isLoading: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const cacheKey = 'auth_user';

  /**
   * Convert backend user to frontend user format
   */
  const mapBackendUserToFrontend = (backendUser: BackendUser): User => {
    return {
      id: backendUser.id,
      email: backendUser.email,
      role: mapBackendRoleToFrontend(backendUser.role),
      name: backendUser.fullName,
      fullName: backendUser.fullName,
      companyId: backendUser.companyId || undefined,
      avatarUrl: backendUser.avatarUrl || undefined,
    };
  };

  const loadCachedUser = (): User | null => {
    try {
      const raw = sessionStorage.getItem(cacheKey);
      return raw ? (JSON.parse(raw) as User) : null;
    } catch {
      return null;
    }
  };

  const saveCachedUser = (nextUser: User | null) => {
    try {
      if (!nextUser) {
        sessionStorage.removeItem(cacheKey);
        return;
      }
      sessionStorage.setItem(cacheKey, JSON.stringify(nextUser));
    } catch {
      // Ignore storage errors
    }
  };

  /**
   * Check authentication status on mount
   */
  useEffect(() => {
    const checkAuth = async () => {
      const cachedUser = loadCachedUser();
      if (cachedUser) {
        setUser(cachedUser);
        setIsLoading(false);
        return;
      }

      try {
        const response = await authApi.getCurrentUser();
        const frontendUser = mapBackendUserToFrontend(response.user);
        setUser(frontendUser);
        saveCachedUser(frontendUser);
      } catch (error) {
        // Not authenticated or token expired
        setUser(null);
        saveCachedUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  /**
   * Login user with backend
   */
  const login = async (email: string, password: string): Promise<User> => {
    try {
            const response = await authApi.login(email, password);
      const frontendUser = mapBackendUserToFrontend(response.user);
      
      setUser(frontendUser);
      saveCachedUser(frontendUser);
      
      // Return user so caller can show welcome message
      return frontendUser;
    } catch (error) {
      // Re-throw error to be handled by LoginForm
      throw error;
    }
  };

  /**
   * Logout user
   */
  const logout = async () => {
    try {
            await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
      // Continue with logout even if API call fails
    }
    
    setUser(null);
    saveCachedUser(null);
    toast.success('Logged out successfully');
    router.push('/');
  };

  /**
   * Refresh current user data
   */
  const refreshUser = async () => {
    try {
      const response = await authApi.getCurrentUser();
      const frontendUser = mapBackendUserToFrontend(response.user);
      setUser(frontendUser);
      saveCachedUser(frontendUser);
    } catch (error) {
      // If refresh fails, user might be logged out
      setUser(null);
      saveCachedUser(null);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
