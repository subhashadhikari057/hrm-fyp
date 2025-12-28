import { API_BASE_URL, apiFetch, getAuthHeaders, handleApiError } from './types';

export interface AttendanceDay {
  id: string;
  employeeId: string;
  companyId: string;
  workShiftId?: string | null;
  date: string;
  checkInTime?: string | null;
  checkOutTime?: string | null;
  totalWorkMinutes: number;
  lateMinutes: number;
  overtimeMinutes: number;
  status: 'PRESENT' | 'LATE' | 'HALF_DAY' | 'ABSENT' | 'ON_LEAVE' | 'WEEKEND' | 'HOLIDAY';
  source: 'SELF' | 'ADMIN' | 'IMPORT';
  notes?: string | null;
}

export interface AttendanceResponse {
  message: string;
  data: AttendanceDay;
}

export interface AttendanceListResponse {
  message: string;
  data: AttendanceDay[];
}

export interface AttendanceRecord extends AttendanceDay {
  employee?: {
    id: string;
    employeeCode?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    departmentId?: string | null;
    designationId?: string | null;
  } | null;
  workShift?: {
    id: string;
    name?: string | null;
    code?: string | null;
    startTime?: string | null;
    endTime?: string | null;
  } | null;
}

export interface AttendanceAdminListResponse {
  message: string;
  data: AttendanceRecord[];
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface AttendanceDetailResponse {
  message: string;
  data: AttendanceRecord;
}

const attendanceApi = {
  async checkIn(): Promise<AttendanceResponse> {
    try {
      const response = await apiFetch(`${API_BASE_URL}/attendance/check-in`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        throw await handleApiError(response);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Response) {
        throw await handleApiError(error);
      }
      throw error;
    }
  },

  async checkOut(): Promise<AttendanceResponse> {
    try {
      const response = await apiFetch(`${API_BASE_URL}/attendance/check-out`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        throw await handleApiError(response);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Response) {
        throw await handleApiError(error);
      }
      throw error;
    }
  },

  async getMyToday(): Promise<AttendanceDay | null> {
    try {
      const params = new URLSearchParams();
      const today = new Date();
      const iso = today.toISOString();
      params.append('dateFrom', iso);
      params.append('dateTo', iso);

      const response = await apiFetch(
        `${API_BASE_URL}/attendance/me?${params.toString()}`,
        {
          method: 'GET',
          headers: getAuthHeaders(),
          credentials: 'include',
        },
      );

      if (!response.ok) {
        throw await handleApiError(response);
      }

      const json: AttendanceListResponse = await response.json();
      const list = json.data || [];
      return list.length > 0 ? list[0] : null;
    } catch (error) {
      if (error instanceof Response) {
        throw await handleApiError(error);
      }
      throw error;
    }
  },

  async getMyAttendance(params?: {
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
  }): Promise<AttendanceListResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.dateFrom) queryParams.append('dateFrom', params.dateFrom);
      if (params?.dateTo) queryParams.append('dateTo', params.dateTo);
      if (params?.page) queryParams.append('page', String(params.page));
      if (params?.limit) queryParams.append('limit', String(params.limit));

      const response = await apiFetch(
        `${API_BASE_URL}/attendance/me?${queryParams.toString()}`,
        {
          method: 'GET',
          headers: getAuthHeaders(),
          credentials: 'include',
        },
      );

      if (!response.ok) {
        throw await handleApiError(response);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Response) {
        throw await handleApiError(error);
      }
      throw error;
    }
  },

  async getAttendance(params?: {
    employeeId?: string;
    departmentId?: string;
    designationId?: string;
    shiftId?: string;
    status?: AttendanceDay['status'];
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
  }): Promise<AttendanceAdminListResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.employeeId) queryParams.append('employeeId', params.employeeId);
      if (params?.departmentId) queryParams.append('departmentId', params.departmentId);
      if (params?.designationId) queryParams.append('designationId', params.designationId);
      if (params?.shiftId) queryParams.append('shiftId', params.shiftId);
      if (params?.status) queryParams.append('status', params.status);
      if (params?.dateFrom) queryParams.append('dateFrom', params.dateFrom);
      if (params?.dateTo) queryParams.append('dateTo', params.dateTo);
      if (params?.page) queryParams.append('page', String(params.page));
      if (params?.limit) queryParams.append('limit', String(params.limit));

      const response = await apiFetch(
        `${API_BASE_URL}/attendance?${queryParams.toString()}`,
        {
          method: 'GET',
          headers: getAuthHeaders(),
          credentials: 'include',
        },
      );

      if (!response.ok) {
        throw await handleApiError(response);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Response) {
        throw await handleApiError(error);
      }
      throw error;
    }
  },

  async createManualAttendance(payload: {
    employeeId: string;
    date: string;
    shiftId?: string;
    checkInTime?: string;
    checkOutTime?: string;
    status?: AttendanceDay['status'];
    notes?: string;
  }): Promise<AttendanceDetailResponse> {
    try {
      const response = await apiFetch(`${API_BASE_URL}/attendance/manual`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw await handleApiError(response);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Response) {
        throw await handleApiError(error);
      }
      throw error;
    }
  },

  async updateManualAttendance(
    id: string,
    payload: {
      checkInTime?: string;
      checkOutTime?: string;
      status?: AttendanceDay['status'];
      notes?: string;
    },
  ): Promise<AttendanceDetailResponse> {
    try {
      const response = await apiFetch(`${API_BASE_URL}/attendance/${id}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw await handleApiError(response);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Response) {
        throw await handleApiError(error);
      }
      throw error;
    }
  },
};

export { attendanceApi };
