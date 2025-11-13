/**
 * API utility functions for backend integration
 * Uses cookie-based authentication (HttpOnly cookies)
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// Backend role types
export type BackendUserRole = 'super_admin' | 'company_admin' | 'hr_manager' | 'manager' | 'employee';

// Frontend role types (mapped from backend)
export type FrontendUserRole = 'superadmin' | 'companyadmin' | 'hrmanager' | 'manager' | 'employee';

export interface BackendUser {
  id: string;
  email: string;
  fullName?: string | null;
  phone?: string | null;
  role: BackendUserRole;
  companyId?: string | null;
  avatarUrl?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  company?: {
    id: string;
    status: string;
    name: string;
  } | null;
}

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

export interface ApiError {
  message: string | string[];
  statusCode: number;
  error?: string;
}

/**
 * Map backend role to frontend role
 */
export function mapBackendRoleToFrontend(backendRole: BackendUserRole): FrontendUserRole {
  const roleMap: Record<BackendUserRole, FrontendUserRole> = {
    super_admin: 'superadmin',
    company_admin: 'companyadmin',
    hr_manager: 'hrmanager',
    manager: 'manager',
    employee: 'employee',
  };
  return roleMap[backendRole] || 'employee';
}

/**
 * Map frontend role to dashboard route
 */
export function getDashboardRoute(role: FrontendUserRole): string {
  const routeMap: Record<FrontendUserRole, string> = {
    superadmin: '/dashboard/superadmin',
    companyadmin: '/dashboard/companyadmin',
    hrmanager: '/dashboard/hrmanager',
    manager: '/dashboard/employee', // Manager uses employee dashboard for now
    employee: '/dashboard/employee',
  };
  return routeMap[role] || '/dashboard/employee';
}

/**
 * API client with cookie-based authentication
 */
export const api = {
  /**
   * Login user - sets HttpOnly cookie automatically
   */
  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Important: include cookies
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error: ApiError = await response.json().catch(() => ({
        message: 'Login failed',
        statusCode: response.status,
      }));
      throw new Error(
        typeof error.message === 'string' ? error.message : error.message?.[0] || 'Login failed'
      );
    }

    return response.json();
  },

  /**
   * Logout user - clears HttpOnly cookie
   */
  async logout(): Promise<void> {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
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
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      method: 'GET',
      credentials: 'include', // Important: include cookies
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Unauthorized - please login again');
      }
      const error: ApiError = await response.json().catch(() => ({
        message: 'Failed to get current user',
        statusCode: response.status,
      }));
      throw new Error(
        typeof error.message === 'string' ? error.message : error.message?.[0] || 'Failed to get current user'
      );
    }

    return response.json();
  },
};

/**
 * Helper function to get auth headers for API requests
 * Note: Cookies are automatically included with credentials: 'include'
 */
export function getAuthHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
  };
}

