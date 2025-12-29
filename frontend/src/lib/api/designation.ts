/**
 * Designation API functions
 */

import { API_BASE_URL, apiFetch, getAuthHeaders, handleApiError } from './types';

// Designation types
export interface Designation {
    id: string;
    name: string;
    code?: string | null;
    description?: string | null;
    isActive: boolean;
    companyId: string;
    createdAt: string;
    updatedAt?: string;
}

export interface DesignationsResponse {
    message: string;
    data: Designation[];
    meta?: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export interface DesignationResponse {
    message: string;
    data: Designation;
}

export interface CreateDesignationRequest {
    name: string;
    code?: string;
    description?: string;
    isActive?: boolean;
}

export interface UpdateDesignationRequest {
    name?: string;
    code?: string;
    description?: string;
    isActive?: boolean;
}

export interface FilterDesignationsParams {
    search?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export const designationApi = {
    /**
     * Get all designations for the company
     */
    async getDesignations(params?: FilterDesignationsParams): Promise<DesignationsResponse> {
        const queryParams = new URLSearchParams();

        if (params?.search) {
            queryParams.append('search', params.search);
        }
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

        const url = `${API_BASE_URL}/company/designations${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

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
     * Get designation by ID
     */
    async getDesignationById(designationId: string): Promise<DesignationResponse> {
        const response = await apiFetch(`${API_BASE_URL}/company/designations/${designationId}`, {
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
     * Create a new designation
     */
    async createDesignation(data: CreateDesignationRequest): Promise<DesignationResponse> {
        const response = await apiFetch(`${API_BASE_URL}/company/designations`, {
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
     * Update designation
     */
    async updateDesignation(
        designationId: string,
        data: UpdateDesignationRequest
    ): Promise<DesignationResponse> {
        const response = await apiFetch(`${API_BASE_URL}/company/designations/${designationId}`, {
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
     * Delete designation
     */
    async deleteDesignation(designationId: string): Promise<{ message: string }> {
        const response = await apiFetch(`${API_BASE_URL}/company/designations/${designationId}`, {
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
