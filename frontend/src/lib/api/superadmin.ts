/**
 * Super Admin API functions
 */

import { API_BASE_URL, apiFetch, getAuthHeaders, handleApiError, type BackendUserRole, type BackendUser } from './types';

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
  fullName: string;
  phone: string;
  role: BackendUserRole;
  companyId: string;
  avatarUrl?: string;
  avatar?: File;
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
  avatar?: File;
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
    search?: string;
    role?: BackendUserRole;
    companyId?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<UsersResponse> {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.role) queryParams.append('role', params.role);
    if (params?.companyId) queryParams.append('companyId', params.companyId);
    if (params?.isActive !== undefined) queryParams.append('isActive', String(params.isActive));
    if (params?.page) queryParams.append('page', String(params.page));
    if (params?.limit) queryParams.append('limit', String(params.limit));
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    const response = await apiFetch(`${API_BASE_URL}/superadmin-users?${queryParams.toString()}`, {
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
    const formData = new FormData();
    formData.append('email', userData.email);
    formData.append('password', userData.password);
    formData.append('fullName', userData.fullName);
    formData.append('phone', userData.phone);
    formData.append('role', userData.role);
    formData.append('companyId', userData.companyId);
    if (userData.avatarUrl) formData.append('avatarUrl', userData.avatarUrl);
    if (userData.avatar) formData.append('avatar', userData.avatar);
    if (userData.isActive !== undefined) formData.append('isActive', String(userData.isActive));

    const response = await apiFetch(`${API_BASE_URL}/superadmin-users`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
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
    const formData = new FormData();
    if (userData.email) formData.append('email', userData.email);
    if (userData.fullName) formData.append('fullName', userData.fullName);
    if (userData.phone) formData.append('phone', userData.phone);
    if (userData.role) formData.append('role', userData.role);
    if (userData.avatarUrl) formData.append('avatarUrl', userData.avatarUrl);
    if (userData.avatar) formData.append('avatar', userData.avatar);
    if (userData.isActive !== undefined) formData.append('isActive', String(userData.isActive));

    const response = await apiFetch(`${API_BASE_URL}/superadmin-users/${userId}`, {
      method: 'PATCH',
      credentials: 'include',
      body: formData,
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
    const response = await apiFetch(`${API_BASE_URL}/superadmin-users/${userId}`, {
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
