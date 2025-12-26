/**
 * Work shift API functions
 */

import { API_BASE_URL, apiFetch, getAuthHeaders, handleApiError } from './types';

export interface WorkShift {
    id: string;
    name: string;
    code?: string | null;
    description?: string | null;
    startTime: string;
    endTime: string;
    isActive: boolean;
    companyId: string;
    createdAt: string;
    updatedAt?: string;
}

export interface WorkShiftsResponse {
    message: string;
    data: WorkShift[];
    meta?: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export interface WorkShiftResponse {
    message: string;
    data: WorkShift;
}

export interface CreateWorkShiftRequest {
    name: string;
    code?: string;
    description?: string;
    startTime: string;
    endTime: string;
    isActive?: boolean;
}

export interface UpdateWorkShiftRequest {
    name?: string;
    code?: string;
    description?: string;
    startTime?: string;
    endTime?: string;
    isActive?: boolean;
}

export interface FilterWorkShiftsParams {
    isActive?: boolean;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export const workShiftApi = {
    /**
     * Get all work shifts for the company
     */
    async getWorkShifts(params?: FilterWorkShiftsParams): Promise<WorkShiftsResponse> {
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

        const url = `${API_BASE_URL}/company/workshifts${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

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
     * Get work shift by ID
     */
    async getWorkShiftById(workShiftId: string): Promise<WorkShiftResponse> {
        const response = await apiFetch(`${API_BASE_URL}/company/workshifts/${workShiftId}`, {
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
     * Create a new work shift
     */
    async createWorkShift(data: CreateWorkShiftRequest): Promise<WorkShiftResponse> {
        const response = await apiFetch(`${API_BASE_URL}/company/workshifts`, {
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
     * Update work shift
     */
    async updateWorkShift(
        workShiftId: string,
        data: UpdateWorkShiftRequest
    ): Promise<WorkShiftResponse> {
        const response = await apiFetch(`${API_BASE_URL}/company/workshifts/${workShiftId}`, {
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
     * Delete work shift
     */
    async deleteWorkShift(workShiftId: string): Promise<{ message: string }> {
        const response = await apiFetch(`${API_BASE_URL}/company/workshifts/${workShiftId}`, {
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
