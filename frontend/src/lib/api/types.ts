/**
 * Shared API types and utilities
 */

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// Backend role types
export type BackendUserRole = 'super_admin' | 'company_admin' | 'hr_manager' | 'manager' | 'employee';

// Frontend role types (mapped from backend)
export type FrontendUserRole = 'superadmin' | 'companyadmin' | 'hrmanager' | 'manager' | 'employee';

export interface ApiError {
  message: string | string[];
  statusCode: number;
  error?: string;
}

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
 * Helper function to get auth headers for API requests
 * Note: Cookies are automatically included with credentials: 'include'
 */
export function getAuthHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
  };
}

let refreshPromise: Promise<boolean> | null = null;

function shouldSkipRefresh(input: RequestInfo | URL) {
  const url =
    typeof input === 'string'
      ? input
      : input instanceof URL
      ? input.toString()
      : input.url;
  return (
    url.includes('/auth/login') ||
    url.includes('/auth/logout') ||
    url.includes('/auth/refresh')
  );
}

async function refreshAccessToken(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
        });
        return response.ok;
      } catch {
        return false;
      }
    })();
  }

  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}

export async function apiFetch(
  input: RequestInfo | URL,
  init: RequestInit = {},
  options: { retry?: boolean } = {},
): Promise<Response> {
  const requestInit = {
    ...init,
    credentials: init.credentials ?? 'include',
  };

  const response = await fetch(input, requestInit);
  if (response.status !== 401 || options.retry === false || shouldSkipRefresh(input)) {
    return response;
  }

  const refreshed = await refreshAccessToken();
  if (!refreshed) {
    return response;
  }

  return fetch(input, requestInit);
}

/**
 * Helper function to handle API errors
 */
export async function handleApiError(response: Response): Promise<never> {
  const error: ApiError = await response.json().catch(() => ({
    message: 'An error occurred',
    statusCode: response.status,
  }));
  throw new Error(
    typeof error.message === 'string' ? error.message : error.message?.[0] || 'An error occurred'
  );
}
