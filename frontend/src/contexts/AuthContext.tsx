'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
// Uncomment when ready to integrate with backend:
// import { api } from '../lib/api';

type UserRole = 'superadmin' | 'companyadmin' | 'hrmanager' | 'employee';

interface User {
  email: string;
  role: UserRole;
  name?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, role: UserRole) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check for stored auth on mount
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string, role: UserRole) => {
    // DUMMY LOGIN - Replace with actual API call when ready:
    // 
    // try {
    //   const response = await api.login(email, password);
    //   const userData: User = {
    //     email: response.user.email,
    //     role: response.user.role,
    //     name: response.user.name,
    //   };
    //   setUser(userData);
    //   localStorage.setItem('user', JSON.stringify(userData));
    //   localStorage.setItem('token', response.token);
    //   
    //   const dashboardRoutes: Record<UserRole, string> = {
    //     superadmin: '/dashboard/superadmin',
    //     companyadmin: '/dashboard/companyadmin',
    //     hrmanager: '/dashboard/hrmanager',
    //     employee: '/dashboard/employee',
    //   };
    //   router.push(dashboardRoutes[userData.role]);
    // } catch (error) {
    //   throw error; // Handle error in LoginForm component
    // }

    // Current dummy implementation:
    const userData: User = {
      email,
      role,
      name: email.split('@')[0],
    };

    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));

    // Redirect based on role
    const dashboardRoutes: Record<UserRole, string> = {
      superadmin: '/dashboard/superadmin',
      companyadmin: '/dashboard/companyadmin',
      hrmanager: '/dashboard/hrmanager',
      employee: '/dashboard/employee',
    };

    router.push(dashboardRoutes[role]);
  };

  const logout = async () => {
    // Uncomment when ready to integrate with backend:
    // try {
    //   await api.logout();
    // } catch (error) {
    //   console.error('Logout error:', error);
    // }
    
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    router.push('/');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
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

