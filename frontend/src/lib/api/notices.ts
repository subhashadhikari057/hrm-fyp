import { API_BASE_URL, apiFetch, getAuthHeaders, handleApiError, BackendUserRole } from './types';

export type NoticeStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type NoticePriority = 'LOW' | 'NORMAL' | 'HIGH';
export type NoticeAudienceType = 'DEPARTMENT' | 'DESIGNATION' | 'EMPLOYEE' | 'ROLE' | 'WORK_SHIFT';

export interface NoticeAudience {
  type: NoticeAudienceType;
  departmentId?: string;
  designationId?: string;
  employeeId?: string;
  role?: BackendUserRole;
  workShiftId?: string;
}

export interface Notice {
  id: string;
  companyId: string;
  title: string;
  body: string;
  bannerUrl?: string | null;
  priority: NoticePriority;
  status: NoticeStatus;
  publishAt?: string | null;
  expiresAt?: string | null;
  isCompanyWide: boolean;
  createdById?: string | null;
  updatedById?: string | null;
  createdAt: string;
  updatedAt: string;
  audiences?: NoticeAudience[];
  isRead?: boolean;
  readAt?: string | null;
  _count?: {
    reads: number;
  };
}

export interface NoticeListResponse {
  message: string;
  data: Notice[];
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage?: boolean;
    hasPreviousPage?: boolean;
  };
}

export interface NoticeResponse {
  message: string;
  data: Notice;
}

export interface NoticeRead {
  id: string;
  noticeId: string;
  employeeId: string;
  readAt: string;
}

export interface NoticeReadResponse {
  message: string;
  data: NoticeRead;
}

export interface CreateNoticeRequest {
  title: string;
  body: string;
  priority?: NoticePriority;
  status?: NoticeStatus;
  publishAt?: string;
  expiresAt?: string;
  isCompanyWide?: boolean;
  audiences?: NoticeAudience[];
}

export interface UpdateNoticeRequest {
  title?: string;
  body?: string;
  priority?: NoticePriority;
  status?: NoticeStatus;
  publishAt?: string;
  expiresAt?: string;
  isCompanyWide?: boolean;
  audiences?: NoticeAudience[];
}

const noticesApi = {
  async listMy(params?: {
    search?: string;
    unreadOnly?: boolean;
    page?: number;
    limit?: number;
  }): Promise<NoticeListResponse> {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.unreadOnly !== undefined) query.append('unreadOnly', String(params.unreadOnly));
    if (params?.page) query.append('page', String(params.page));
    if (params?.limit) query.append('limit', String(params.limit));

    const response = await apiFetch(`${API_BASE_URL}/notices?${query.toString()}`, {
      method: 'GET',
      headers: { ...getAuthHeaders() },
      credentials: 'include',
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    return response.json();
  },

  async getMy(id: string): Promise<NoticeResponse> {
    const response = await apiFetch(`${API_BASE_URL}/notices/${id}`, {
      method: 'GET',
      headers: { ...getAuthHeaders() },
      credentials: 'include',
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    return response.json();
  },

  async markRead(id: string): Promise<NoticeReadResponse> {
    const response = await apiFetch(`${API_BASE_URL}/notices/${id}/read`, {
      method: 'POST',
      headers: { ...getAuthHeaders() },
      credentials: 'include',
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    return response.json();
  },

  async listAdmin(params?: {
    search?: string;
    status?: NoticeStatus;
    priority?: NoticePriority;
    isCompanyWide?: boolean;
    createdById?: string;
    publishFrom?: string;
    publishTo?: string;
    page?: number;
    limit?: number;
  }): Promise<NoticeListResponse> {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.status) query.append('status', params.status);
    if (params?.priority) query.append('priority', params.priority);
    if (params?.isCompanyWide !== undefined) query.append('isCompanyWide', String(params.isCompanyWide));
    if (params?.createdById) query.append('createdById', params.createdById);
    if (params?.publishFrom) query.append('publishFrom', params.publishFrom);
    if (params?.publishTo) query.append('publishTo', params.publishTo);
    if (params?.page) query.append('page', String(params.page));
    if (params?.limit) query.append('limit', String(params.limit));

    const response = await apiFetch(`${API_BASE_URL}/admin/notices?${query.toString()}`, {
      method: 'GET',
      headers: { ...getAuthHeaders() },
      credentials: 'include',
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    return response.json();
  },

  async getAdmin(id: string): Promise<NoticeResponse> {
    const response = await apiFetch(`${API_BASE_URL}/admin/notices/${id}`, {
      method: 'GET',
      headers: { ...getAuthHeaders() },
      credentials: 'include',
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    return response.json();
  },

  async createAdmin(payload: CreateNoticeRequest): Promise<NoticeResponse> {
    const response = await apiFetch(`${API_BASE_URL}/admin/notices`, {
      method: 'POST',
      credentials: 'include',
      headers: { ...getAuthHeaders() },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    return response.json();
  },

  async updateAdmin(id: string, payload: UpdateNoticeRequest): Promise<NoticeResponse> {
    const response = await apiFetch(`${API_BASE_URL}/admin/notices/${id}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { ...getAuthHeaders() },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    return response.json();
  },

  async removeAdmin(id: string): Promise<{ message: string }> {
    const response = await apiFetch(`${API_BASE_URL}/admin/notices/${id}`, {
      method: 'DELETE',
      headers: { ...getAuthHeaders() },
      credentials: 'include',
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    return response.json();
  },
};

export { noticesApi };
