/**
 * Super Admin API functions
 */

import { API_BASE_URL, getAuthHeaders, handleApiError, type BackendUserRole, type BackendUser } from './types';

// Re-export types for convenience
export type { BackendUserRole, BackendUser } from './types';

// User types
export interface User {
  id: string;
  email: string;
  fullName?: string | null;
  phone?: string | null;
  role: BackendUserRole;
  companyId?: string | null;
  avatarUrl?: string | null;
  isActive: boolean;
  lastLoginAt?: string | null;
  createdAt: string;
  updatedAt?: string;
  company?: {
    id: string;
    name: string;
    code: string;
    status: string;
  } | null;
}

export interface UsersResponse {
  message: string;
  data: User[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface CreateUserRequest {
  email: string;
  password: string;
  fullName?: string;
  phone?: string;
  role?: BackendUserRole;
  companyId?: string;
  avatarUrl?: string;
  isActive?: boolean;
}

export interface CreateUserResponse {
  message: string;
  data: User;
}

export interface UpdateUserRequest {
  email?: string;
  fullName?: string;
  phone?: string;
  role?: BackendUserRole;
  avatarUrl?: string;
  isActive?: boolean;
}

export interface UpdateUserResponse {
  message: string;
  data: User;
}

export const superadminApi = {
  /**
   * Get all users with filters and pagination
   */
  async getUsers(params?: {
    role?: BackendUserRole;
    companyId?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<UsersResponse> {
    const queryParams = new URLSearchParams();
    if (params?.role) queryParams.append('role', params.role);
    if (params?.companyId) queryParams.append('companyId', params.companyId);
    if (params?.isActive !== undefined) queryParams.append('isActive', String(params.isActive));
    if (params?.page) queryParams.append('page', String(params.page));
    if (params?.limit) queryParams.append('limit', String(params.limit));
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    const response = await fetch(`${API_BASE_URL}/superadmin-users?${queryParams.toString()}`, {
      method: 'GET',
      credentials: 'include',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    return response.json();
  },

  /**
   * Create a new user
   */
  async createUser(userData: CreateUserRequest): Promise<CreateUserResponse> {
    const response = await fetch(`${API_BASE_URL}/superadmin-users`, {
      method: 'POST',
      credentials: 'include',
      headers: getAuthHeaders(),
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    return response.json();
  },

  /**
   * Update a user
   */
  async updateUser(userId: string, userData: UpdateUserRequest): Promise<UpdateUserResponse> {
    const response = await fetch(`${API_BASE_URL}/superadmin-users/${userId}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: getAuthHeaders(),
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    return response.json();
  },

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<{ message: string; data: User }> {
    const response = await fetch(`${API_BASE_URL}/superadmin-users/${userId}`, {
      method: 'GET',
      credentials: 'include',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    return response.json();
  },

  /**
   * Delete a user (soft delete - sets isActive to false)
   */
  async deleteUser(userId: string): Promise<UpdateUserResponse> {
    // Use update endpoint to deactivate user (soft delete)
    return this.updateUser(userId, { isActive: false });
  },
};

