/**
 * Authentication API functions
 */

import { API_BASE_URL, apiFetch, getAuthHeaders, handleApiError, type ApiError, type BackendUser } from './types';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  user: BackendUser;
}

export interface MeResponse {
  user: BackendUser;
}

export const authApi = {
  /**
   * Login user - sets HttpOnly cookie automatically
   */
  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await apiFetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Important: include cookies
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    return response.json();
  },

  /**
   * Logout user - clears HttpOnly cookie
   */
  async logout(): Promise<void> {
    try {
      await apiFetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include', // Important: include cookies
      });
    } catch (error) {
      console.error('Logout error:', error);
      // Continue with logout even if API call fails
    }
  },

  /**
   * Get current authenticated user
   */
  async getCurrentUser(): Promise<MeResponse> {
    const response = await apiFetch(`${API_BASE_URL}/auth/me`, {
      method: 'GET',
      credentials: 'include', // Important: include cookies
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Unauthorized - please login again');
      }
      await handleApiError(response);
    }

    return response.json();
  },
};
