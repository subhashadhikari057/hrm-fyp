/**
 * Department API functions
 */

import { API_BASE_URL, apiFetch, getAuthHeaders, handleApiError } from './types';

// Department types
export interface Department {
    id: string;
    name: string;
    code?: string | null;
    description?: string | null;
    isActive: boolean;
    companyId: string;
    createdAt: string;
    updatedAt?: string;
}

export interface DepartmentsResponse {
    message: string;
    data: Department[];
    meta?: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export interface DepartmentResponse {
    message: string;
    data: Department;
}

export interface CreateDepartmentRequest {
    name: string;
    code?: string;
    description?: string;
    isActive?: boolean;
}

export interface UpdateDepartmentRequest {
    name?: string;
    code?: string;
    description?: string;
    isActive?: boolean;
}

export interface FilterDepartmentsParams {
    isActive?: boolean;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export const departmentApi = {
    /**
     * Get all departments for the company
     */
    async getDepartments(params?: FilterDepartmentsParams): Promise<DepartmentsResponse> {
        const queryParams = new URLSearchParams();

        if (params?.isActive !== undefined) {
            queryParams.append('isActive', String(params.isActive));
        }
        if (params?.page) {
            queryParams.append('page', String(params.page));
        }
        if (params?.limit) {
            queryParams.append('limit', String(params.limit));
        }
        if (params?.sortBy) {
            queryParams.append('sortBy', params.sortBy);
        }
        if (params?.sortOrder) {
            queryParams.append('sortOrder', params.sortOrder);
        }

        const url = `${API_BASE_URL}/company/departments${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

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

    /**
     * Get department by ID
     */
    async getDepartmentById(departmentId: string): Promise<DepartmentResponse> {
        const response = await apiFetch(`${API_BASE_URL}/company/departments/${departmentId}`, {
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
     * Create a new department
     */
    async createDepartment(data: CreateDepartmentRequest): Promise<DepartmentResponse> {
        const response = await apiFetch(`${API_BASE_URL}/company/departments`, {
            method: 'POST',
            credentials: 'include',
            headers: getAuthHeaders(),
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            await handleApiError(response);
        }

        return response.json();
    },

    /**
     * Update department
     */
    async updateDepartment(
        departmentId: string,
        data: UpdateDepartmentRequest
    ): Promise<DepartmentResponse> {
        const response = await apiFetch(`${API_BASE_URL}/company/departments/${departmentId}`, {
            method: 'PATCH',
            credentials: 'include',
            headers: getAuthHeaders(),
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            await handleApiError(response);
        }

        return response.json();
    },

    /**
     * Delete department
     */
    async deleteDepartment(departmentId: string): Promise<{ message: string }> {
        const response = await apiFetch(`${API_BASE_URL}/company/departments/${departmentId}`, {
            method: 'DELETE',
            credentials: 'include',
            headers: getAuthHeaders(),
        });

        if (!response.ok) {
            await handleApiError(response);
        }

        return response.json();
    },
};
