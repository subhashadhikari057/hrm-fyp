import { API_BASE_URL, apiFetch, getAuthHeaders, handleApiError } from './types';

export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export interface LeaveType {
  id: string;
  companyId: string;
  name: string;
  code?: string | null;
  description?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string | null;
}

export interface LeaveRequest {
  id: string;
  companyId: string;
  employeeId: string;
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: LeaveStatus;
  createdById?: string | null;
  reviewedById?: string | null;
  reviewedAt?: string | null;
  reviewNote?: string | null;
  leaveType?: LeaveType | null;
  employee?: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    employeeCode?: string | null;
    departmentId?: string | null;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface LeaveTypeResponse {
  message: string;
  data: LeaveType;
}

export interface LeaveTypeListResponse {
  message: string;
  data: LeaveType[];
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface LeaveRequestResponse {
  message: string;
  data: LeaveRequest;
}

export interface LeaveRequestListResponse {
  message: string;
  data: LeaveRequest[];
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage?: boolean;
    hasPreviousPage?: boolean;
  };
}

export interface FilterLeaveTypesParams {
  search?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface FilterLeaveRequestsParams {
  status?: LeaveStatus;
  employeeId?: string;
  departmentId?: string;
  leaveTypeId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export const leaveApi = {
  async getLeaveTypes(params?: FilterLeaveTypesParams): Promise<LeaveTypeListResponse> {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.isActive !== undefined) query.append('isActive', String(params.isActive));
    if (params?.page) query.append('page', String(params.page));
    if (params?.limit) query.append('limit', String(params.limit));
    if (params?.sortBy) query.append('sortBy', params.sortBy);
    if (params?.sortOrder) query.append('sortOrder', params.sortOrder);

    const response = await apiFetch(
      `${API_BASE_URL}/leave/types${query.toString() ? `?${query.toString()}` : ''}`,
      {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
      },
    );

    if (!response.ok) {
      await handleApiError(response);
    }

    return response.json();
  },

  async getLeaveTypeById(id: string): Promise<LeaveTypeResponse> {
    const response = await apiFetch(`${API_BASE_URL}/leave/types/${id}`, {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include',
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    return response.json();
  },

  async createLeaveType(payload: {
    name: string;
    code?: string;
    description?: string;
    isActive?: boolean;
  }): Promise<LeaveTypeResponse> {
    const response = await apiFetch(`${API_BASE_URL}/leave/types`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    return response.json();
  },

  async updateLeaveType(
    id: string,
    payload: { name?: string; code?: string; description?: string; isActive?: boolean },
  ): Promise<LeaveTypeResponse> {
    const response = await apiFetch(`${API_BASE_URL}/leave/types/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    return response.json();
  },

  async deleteLeaveType(id: string): Promise<{ message: string }> {
    const response = await apiFetch(`${API_BASE_URL}/leave/types/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      credentials: 'include',
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    return response.json();
  },

  async createRequest(payload: {
    leaveTypeId: string;
    startDate: string;
    endDate: string;
    reason: string;
    employeeId?: string;
  }): Promise<LeaveRequestResponse> {
    const response = await apiFetch(`${API_BASE_URL}/leave/requests`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    return response.json();
  },

  async listMy(params?: {
    status?: LeaveStatus;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
  }): Promise<LeaveRequestListResponse> {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.dateFrom) query.append('dateFrom', params.dateFrom);
    if (params?.dateTo) query.append('dateTo', params.dateTo);
    if (params?.page) query.append('page', String(params.page));
    if (params?.limit) query.append('limit', String(params.limit));

    const response = await apiFetch(
      `${API_BASE_URL}/leave/requests/me${query.toString() ? `?${query.toString()}` : ''}`,
      {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
      },
    );

    if (!response.ok) {
      await handleApiError(response);
    }

    return response.json();
  },

  async listAdmin(params?: FilterLeaveRequestsParams): Promise<LeaveRequestListResponse> {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.employeeId) query.append('employeeId', params.employeeId);
    if (params?.departmentId) query.append('departmentId', params.departmentId);
    if (params?.leaveTypeId) query.append('leaveTypeId', params.leaveTypeId);
    if (params?.dateFrom) query.append('dateFrom', params.dateFrom);
    if (params?.dateTo) query.append('dateTo', params.dateTo);
    if (params?.page) query.append('page', String(params.page));
    if (params?.limit) query.append('limit', String(params.limit));

    const response = await apiFetch(
      `${API_BASE_URL}/leave/requests/admin${query.toString() ? `?${query.toString()}` : ''}`,
      {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
      },
    );

    if (!response.ok) {
      await handleApiError(response);
    }

    return response.json();
  },

  async approve(id: string, reviewNote?: string): Promise<LeaveRequestResponse> {
    const response = await apiFetch(`${API_BASE_URL}/leave/requests/admin/${id}/approve`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({ reviewNote }),
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    return response.json();
  },

  async reject(id: string, reviewNote?: string): Promise<LeaveRequestResponse> {
    const response = await apiFetch(`${API_BASE_URL}/leave/requests/admin/${id}/reject`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({ reviewNote }),
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    return response.json();
  },

  async cancel(id: string): Promise<LeaveRequestResponse> {
    const response = await apiFetch(`${API_BASE_URL}/leave/requests/me/${id}/cancel`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      credentials: 'include',
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    return response.json();
  },
};
