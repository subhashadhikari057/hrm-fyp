import { API_BASE_URL, apiFetch, getAuthHeaders, handleApiError } from './types';

export type ComplaintStatus = 'OPEN' | 'IN_PROGRESS' | 'CLOSED';
export type ComplaintPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface ComplaintAuthor {
  id: string;
  fullName?: string | null;
  email: string;
}

export interface ComplaintEmployeeInfo {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  employeeCode?: string | null;
  departmentId?: string | null;
}

export interface ComplaintNote {
  id: string;
  complaintId: string;
  companyId: string;
  authorUserId: string;
  note: string;
  createdAt: string;
  authorUser?: ComplaintAuthor | null;
}

export interface ComplaintRecord {
  id: string;
  companyId: string;
  employeeId: string;
  title: string;
  description: string;
  priority: ComplaintPriority;
  status: ComplaintStatus;
  closedAt?: string | null;
  createdById: string;
  updatedById?: string | null;
  createdAt: string;
  updatedAt: string;
  employee?: ComplaintEmployeeInfo | null;
  notes?: ComplaintNote[];
  _count?: {
    notes: number;
  };
}

export interface ComplaintResponse {
  message: string;
  data: ComplaintRecord;
}

export interface ComplaintListResponse {
  message: string;
  data: ComplaintRecord[];
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage?: boolean;
    hasPreviousPage?: boolean;
  };
}

export interface ComplaintNoteResponse {
  message: string;
  data: ComplaintNote;
}

export interface ComplaintListParams {
  status?: ComplaintStatus;
  priority?: ComplaintPriority;
  employeeId?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

function buildQuery(params?: ComplaintListParams): string {
  const query = new URLSearchParams();
  if (params?.status) query.append('status', params.status);
  if (params?.priority) query.append('priority', params.priority);
  if (params?.employeeId) query.append('employeeId', params.employeeId);
  if (params?.search) query.append('search', params.search);
  if (params?.dateFrom) query.append('dateFrom', params.dateFrom);
  if (params?.dateTo) query.append('dateTo', params.dateTo);
  if (params?.page) query.append('page', String(params.page));
  if (params?.limit) query.append('limit', String(params.limit));
  return query.toString();
}

export const complaintsApi = {
  async create(payload: {
    title: string;
    description: string;
    priority?: ComplaintPriority;
  }): Promise<ComplaintResponse> {
    const response = await apiFetch(`${API_BASE_URL}/complaints`, {
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

  async listMy(params?: ComplaintListParams): Promise<ComplaintListResponse> {
    const query = buildQuery(params);
    const response = await apiFetch(
      `${API_BASE_URL}/complaints/me${query ? `?${query}` : ''}`,
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

  async getMyById(id: string): Promise<ComplaintResponse> {
    const response = await apiFetch(`${API_BASE_URL}/complaints/me/${id}`, {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include',
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    return response.json();
  },

  async listAdmin(params?: ComplaintListParams): Promise<ComplaintListResponse> {
    const query = buildQuery(params);
    const response = await apiFetch(
      `${API_BASE_URL}/complaints/admin${query ? `?${query}` : ''}`,
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

  async getAdminById(id: string): Promise<ComplaintResponse> {
    const response = await apiFetch(`${API_BASE_URL}/complaints/admin/${id}`, {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include',
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    return response.json();
  },

  async markInProgress(id: string, note?: string): Promise<ComplaintResponse> {
    const response = await apiFetch(`${API_BASE_URL}/complaints/admin/${id}/in-progress`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({ note }),
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    return response.json();
  },

  async resolve(id: string, note?: string): Promise<ComplaintResponse> {
    const response = await apiFetch(`${API_BASE_URL}/complaints/admin/${id}/resolve`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({ note }),
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    return response.json();
  },

  async addNote(id: string, note: string): Promise<ComplaintNoteResponse> {
    const response = await apiFetch(`${API_BASE_URL}/complaints/admin/${id}/notes`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({ note }),
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    return response.json();
  },
};
