/**
 * Company admin user API functions
 */

import { API_BASE_URL, apiFetch, getAuthHeaders, handleApiError } from './types';

export type CompanyUserRole = 'company_admin' | 'hr_manager' | 'manager' | 'employee';

export interface CompanyUser {
  id: string;
  email: string;
  fullName?: string | null;
  phone?: string | null;
  role: CompanyUserRole;
  companyId: string;
  avatarUrl?: string | null;
  isActive: boolean;
  lastLoginAt?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface CompanyUsersResponse {
  message: string;
  data: CompanyUser[];
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage?: boolean;
    hasPreviousPage?: boolean;
  };
}

export interface CompanyUserResponse {
  message: string;
  data: CompanyUser;
}

export interface CreateCompanyUserRequest {
  email: string;
  password: string;
  fullName?: string;
  phone?: string;
  role?: CompanyUserRole;
  avatarUrl?: string;
  avatar?: File;
  isActive?: boolean;
}

export interface UpdateCompanyUserRequest {
  fullName?: string;
  phone?: string;
  role?: CompanyUserRole;
  avatarUrl?: string;
  avatar?: File;
  isActive?: boolean;
}

export interface CompanyUserFilters {
  search?: string;
  role?: CompanyUserRole;
  isActive?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export const companyUserApi = {
  async getCompanyUsers(filters?: CompanyUserFilters): Promise<CompanyUsersResponse> {
    const queryParams = new URLSearchParams();

    if (filters?.search) queryParams.append('search', filters.search);
    if (filters?.role) queryParams.append('role', filters.role);
    if (filters?.isActive !== undefined) queryParams.append('isActive', String(filters.isActive));
    if (filters?.page) queryParams.append('page', String(filters.page));
    if (filters?.limit) queryParams.append('limit', String(filters.limit));
    if (filters?.sortBy) queryParams.append('sortBy', filters.sortBy);
    if (filters?.sortOrder) queryParams.append('sortOrder', filters.sortOrder);

    const url = `${API_BASE_URL}/company/users${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiFetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    return response.json();
  },

  async createCompanyUser(data: CreateCompanyUserRequest): Promise<CompanyUserResponse> {
    const formData = new FormData();
    formData.append('email', data.email);
    formData.append('password', data.password);
    if (data.fullName) formData.append('fullName', data.fullName);
    if (data.phone) formData.append('phone', data.phone);
    if (data.role) formData.append('role', data.role);
    if (data.avatarUrl) formData.append('avatarUrl', data.avatarUrl);
    if (data.avatar) formData.append('avatar', data.avatar);
    if (data.isActive !== undefined) formData.append('isActive', String(data.isActive));

    const response = await apiFetch(`${API_BASE_URL}/company/users`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    return response.json();
  },

  async updateCompanyUser(userId: string, data: UpdateCompanyUserRequest): Promise<CompanyUserResponse> {
    const formData = new FormData();
    if (data.fullName) formData.append('fullName', data.fullName);
    if (data.phone) formData.append('phone', data.phone);
    if (data.role) formData.append('role', data.role);
    if (data.avatarUrl) formData.append('avatarUrl', data.avatarUrl);
    if (data.avatar) formData.append('avatar', data.avatar);
    if (data.isActive !== undefined) formData.append('isActive', String(data.isActive));

    const response = await apiFetch(`${API_BASE_URL}/company/users/${userId}`, {
      method: 'PATCH',
      credentials: 'include',
      body: formData,
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    return response.json();
  },

  async resetCompanyUserPassword(userId: string): Promise<{ message: string; newPassword: string; userId: string; email: string }> {
    const response = await apiFetch(`${API_BASE_URL}/company/users/${userId}/reset-password`, {
      method: 'POST',
      credentials: 'include',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    return response.json();
  },
};
