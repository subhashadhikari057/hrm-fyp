'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api, mapBackendRoleToFrontend, getDashboardRoute, type FrontendUserRole, type BackendUser } from '../lib/api';

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
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

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

  /**
   * Check authentication status on mount
   */
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await api.getCurrentUser();
        const frontendUser = mapBackendUserToFrontend(response.user);
        setUser(frontendUser);
      } catch (error) {
        // Not authenticated or token expired
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  /**
   * Login user with backend
   */
  const login = async (email: string, password: string) => {
    try {
      const response = await api.login(email, password);
      const frontendUser = mapBackendUserToFrontend(response.user);
      
      setUser(frontendUser);
      
      // Get dashboard route based on role
      const dashboardRoute = getDashboardRoute(frontendUser.role);
      
      // Redirect to appropriate dashboard
      router.push(dashboardRoute);
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
      await api.logout();
    } catch (error) {
      console.error('Logout error:', error);
      // Continue with logout even if API call fails
    }
    
    setUser(null);
    router.push('/');
  };

  /**
   * Refresh current user data
   */
  const refreshUser = async () => {
    try {
      const response = await api.getCurrentUser();
      const frontendUser = mapBackendUserToFrontend(response.user);
      setUser(frontendUser);
    } catch (error) {
      // If refresh fails, user might be logged out
      setUser(null);
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

