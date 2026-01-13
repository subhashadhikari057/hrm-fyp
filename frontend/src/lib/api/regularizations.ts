import { API_BASE_URL, apiFetch, getAuthHeaders, handleApiError } from './types';

export type RegularizationRequestType =
  | 'MISSED_CHECKIN'
  | 'MISSED_CHECKOUT'
  | 'WRONG_TIME'
  | 'FULL_DAY_EDIT';

export type RegularizationStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export interface Regularization {
  id: string;
  companyId: string;
  employeeId: string;
  attendanceDayId?: string | null;
  date: string;
  requestType: RegularizationRequestType;
  requestedCheckInTime?: string | null;
  requestedCheckOutTime?: string | null;
  reason: string;
  status: RegularizationStatus;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  reviewNote?: string | null;
  beforeSnapshot?: any;
  afterSnapshot?: any;
  createdAt: string;
  updatedAt: string;
}

export interface RegularizationListResponse {
  message: string;
  data: Regularization[];
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage?: boolean;
    hasPreviousPage?: boolean;
  };
}

export interface RegularizationResponse {
  message: string;
  data: Regularization;
}

const regularizationApi = {
  async create(payload: {
    date: string;
    requestType: RegularizationRequestType;
    requestedCheckInTime?: string;
    requestedCheckOutTime?: string;
    reason: string;
  }): Promise<RegularizationResponse> {
    const response = await apiFetch(`${API_BASE_URL}/attendance/regularizations`, {
      method: 'POST',
      headers: { ...getAuthHeaders() },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      await handleApiError(response);
    }
    return response.json();
  },

  async listMy(params?: {
    status?: RegularizationStatus;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
  }): Promise<RegularizationListResponse> {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.dateFrom) query.append('dateFrom', params.dateFrom);
    if (params?.dateTo) query.append('dateTo', params.dateTo);
    if (params?.page) query.append('page', String(params.page));
    if (params?.limit) query.append('limit', String(params.limit));

    const response = await apiFetch(
      `${API_BASE_URL}/attendance/regularizations/me?${query.toString()}`,
      {
        method: 'GET',
        headers: { ...getAuthHeaders() },
        credentials: 'include',
      },
    );
    if (!response.ok) {
      await handleApiError(response);
    }
    return response.json();
  },

  async cancel(id: string): Promise<RegularizationResponse> {
    const response = await apiFetch(
      `${API_BASE_URL}/attendance/regularizations/me/${id}/cancel`,
      {
        method: 'PATCH',
        headers: { ...getAuthHeaders() },
        credentials: 'include',
      },
    );
    if (!response.ok) {
      await handleApiError(response);
    }
    return response.json();
  },
};

export { regularizationApi };
