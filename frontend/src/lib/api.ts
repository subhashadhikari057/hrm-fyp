/**
 * API utility functions for backend integration
 * 
 * Replace the dummy login in AuthContext with actual API calls using these functions
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: {
    id: string;
    email: string;
    role: 'superadmin' | 'companyadmin' | 'hrmanager' | 'employee';
    name?: string;
  };
  token: string;
}

export interface ApiError {
  message: string;
  statusCode: number;
}

/**
 * Login API call
 * Replace the dummy login in AuthContext.login() with:
 * 
 * const response = await api.login(email, password);
 * const userData = {
 *   email: response.user.email,
 *   role: response.user.role,
 *   name: response.user.name,
 * };
 * localStorage.setItem('token', response.token);
 * setUser(userData);
 */
export const api = {
  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.message || 'Login failed');
    }

    return response.json();
  },

  async logout(): Promise<void> {
    const token = localStorage.getItem('token');
    if (!token) return;

    await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  },

  async getCurrentUser(): Promise<LoginResponse['user']> {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No token found');
    }

    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get current user');
    }

    return response.json();
  },
};

/**
 * Helper function to get auth headers for API requests
 */
export function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
  };
}

