/**
 * Employee API functions
 */

import { API_BASE_URL, apiFetch, getAuthHeaders, handleApiError } from './types';

export interface Employee {
    id: string;
    userId: string;
    companyId: string;
    departmentId: string | null;
    designationId: string | null;
    workShiftId?: string | null;
    employeeCode: string;
    firstName: string;
    lastName: string;
    middleName: string | null;
    gender: 'male' | 'female' | 'other' | null;
    dateOfBirth: string | null;
    joinDate: string | null;
    probationEnd: string | null;
    employmentType: 'full_time' | 'part_time' | 'contract' | 'intern' | null;
    locationId: string | null;
    workEmail: string | null;
    personalEmail: string | null;
    phone: string | null;
    address: string | null;
    emergencyContactName: string | null;
    emergencyContactPhone: string | null;
    imageUrl: string | null;
    baseSalary: number | null;
    status: 'active' | 'on_leave' | 'terminated';
    createdAt: string;
    updatedAt: string;
    user?: {
        email: string;
        fullName: string | null;
        role: string;
    };
    department?: {
        id: string;
        name: string;
        code: string | null;
    };
    designation?: {
        id: string;
        name: string;
        code: string | null;
    };
    workShift?: {
        id: string;
        name: string;
        code: string | null;
        startTime?: string;
        endTime?: string;
    };
}

export interface EmployeeFilters {
    search?: string;
    status?: 'active' | 'on_leave' | 'terminated';
    departmentId?: string;
    designationId?: string;
    workShiftId?: string;
    employmentType?: 'full_time' | 'part_time' | 'contract' | 'intern';
    joinDateFrom?: string;
    joinDateTo?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface CreateEmployeeData {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    middleName?: string;
    employeeCode?: string;
    departmentId?: string;
    designationId?: string;
    workShiftId?: string;
    employmentType?: 'full_time' | 'part_time' | 'contract' | 'intern';
    gender?: 'male' | 'female' | 'other';
    dateOfBirth?: string;
    joinDate?: string;
    probationEnd?: string;
    locationId?: string;
    workEmail?: string;
    personalEmail?: string;
    phone?: string;
    address?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    baseSalary?: number;
    image?: File;
}

export interface UpdateEmployeeData {
    firstName?: string;
    lastName?: string;
    middleName?: string;
    departmentId?: string;
    designationId?: string;
    workShiftId?: string;
    employmentType?: 'full_time' | 'part_time' | 'contract' | 'intern';
    gender?: 'male' | 'female' | 'other';
    dateOfBirth?: string;
    joinDate?: string;
    probationEnd?: string;
    locationId?: string;
    workEmail?: string;
    personalEmail?: string;
    phone?: string;
    address?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    baseSalary?: number;
    image?: File;
}

export interface EmployeeResponse {
    message: string;
    data: Employee;
}

export interface EmployeesResponse {
    message: string;
    data: Employee[];
    meta?: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

const employeeApi = {
    async getEmployees(filters?: EmployeeFilters): Promise<EmployeesResponse> {
        try {
            const params = new URLSearchParams();

            if (filters?.search) params.append('search', filters.search);
            if (filters?.status) params.append('status', filters.status);
            if (filters?.departmentId) params.append('departmentId', filters.departmentId);
            if (filters?.designationId) params.append('designationId', filters.designationId);
            if (filters?.employmentType) params.append('employmentType', filters.employmentType);
            if (filters?.joinDateFrom) params.append('joinDateFrom', filters.joinDateFrom);
            if (filters?.joinDateTo) params.append('joinDateTo', filters.joinDateTo);
            if (filters?.page) params.append('page', filters.page.toString());
            if (filters?.limit) params.append('limit', filters.limit.toString());
            if (filters?.sortBy) params.append('sortBy', filters.sortBy);
            if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder);

            const url = params.toString()
                ? `${API_BASE_URL}/employees?${params.toString()}`
                : `${API_BASE_URL}/employees`;

            const response = await apiFetch(url, {
                method: 'GET',
                headers: getAuthHeaders(),
                credentials: 'include',
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

    async getEmployeeById(id: string): Promise<EmployeeResponse> {
        try {
            const response = await apiFetch(`${API_BASE_URL}/employees/${id}`, {
                method: 'GET',
                headers: getAuthHeaders(),
                credentials: 'include',
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

    async getMyProfile(): Promise<EmployeeResponse> {
        try {
            const response = await apiFetch(`${API_BASE_URL}/employees/me`, {
                method: 'GET',
                headers: getAuthHeaders(),
                credentials: 'include',
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

    async createEmployee(data: CreateEmployeeData): Promise<EmployeeResponse> {
        try {
            const formData = new FormData();

            formData.append('email', data.email);
            formData.append('password', data.password);
            formData.append('firstName', data.firstName);
            formData.append('lastName', data.lastName);

            if (data.middleName) formData.append('middleName', data.middleName);
            if (data.employeeCode) formData.append('employeeCode', data.employeeCode);
            if (data.departmentId) formData.append('departmentId', data.departmentId);
            if (data.designationId) formData.append('designationId', data.designationId);
            if (data.workShiftId) formData.append('workShiftId', data.workShiftId);
            if (data.employmentType) formData.append('employmentType', data.employmentType);
            if (data.gender) formData.append('gender', data.gender);
            if (data.dateOfBirth) formData.append('dateOfBirth', data.dateOfBirth);
            if (data.joinDate) formData.append('joinDate', data.joinDate);
            if (data.probationEnd) formData.append('probationEnd', data.probationEnd);
            if (data.locationId) formData.append('locationId', data.locationId);
            if (data.workEmail) formData.append('workEmail', data.workEmail);
            if (data.personalEmail) formData.append('personalEmail', data.personalEmail);
            if (data.phone) formData.append('phone', data.phone);
            if (data.address) formData.append('address', data.address);
            if (data.emergencyContactName) formData.append('emergencyContactName', data.emergencyContactName);
            if (data.emergencyContactPhone) formData.append('emergencyContactPhone', data.emergencyContactPhone);
            if (data.baseSalary !== undefined) formData.append('baseSalary', data.baseSalary.toString());
            if (data.image) formData.append('image', data.image);

            // For FormData, don't set Content-Type header - browser will set it with boundary
            const authHeaders = getAuthHeaders();
            const headers: Record<string, string> = {};
            Object.entries(authHeaders).forEach(([key, value]) => {
                if (key.toLowerCase() !== 'content-type') {
                    headers[key] = value as string;
                }
            });

            const response = await apiFetch(`${API_BASE_URL}/employees`, {
                method: 'POST',
                headers,
                credentials: 'include',
                body: formData,
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

    async updateEmployee(id: string, data: UpdateEmployeeData): Promise<EmployeeResponse> {
        try {
            const formData = new FormData();

            if (data.firstName) formData.append('firstName', data.firstName);
            if (data.lastName) formData.append('lastName', data.lastName);
            if (data.middleName !== undefined) formData.append('middleName', data.middleName);
            if (data.departmentId !== undefined) formData.append('departmentId', data.departmentId);
            if (data.designationId !== undefined) formData.append('designationId', data.designationId);
            if (data.workShiftId !== undefined) formData.append('workShiftId', data.workShiftId);
            if (data.workShiftId !== undefined) formData.append('workShiftId', data.workShiftId);
            if (data.employmentType) formData.append('employmentType', data.employmentType);
            if (data.gender) formData.append('gender', data.gender);
            if (data.dateOfBirth) formData.append('dateOfBirth', data.dateOfBirth);
            if (data.joinDate) formData.append('joinDate', data.joinDate);
            if (data.probationEnd) formData.append('probationEnd', data.probationEnd);
            if (data.locationId !== undefined) formData.append('locationId', data.locationId);
            if (data.workEmail) formData.append('workEmail', data.workEmail);
            if (data.personalEmail) formData.append('personalEmail', data.personalEmail);
            if (data.phone) formData.append('phone', data.phone);
            if (data.address) formData.append('address', data.address);
            if (data.emergencyContactName) formData.append('emergencyContactName', data.emergencyContactName);
            if (data.emergencyContactPhone) formData.append('emergencyContactPhone', data.emergencyContactPhone);
            if (data.baseSalary !== undefined) formData.append('baseSalary', data.baseSalary.toString());
            if (data.image) formData.append('image', data.image);

            // For FormData, don't set Content-Type header
            const authHeaders = getAuthHeaders();
            const headers: Record<string, string> = {};
            Object.entries(authHeaders).forEach(([key, value]) => {
                if (key.toLowerCase() !== 'content-type') {
                    headers[key] = value as string;
                }
            });

            const response = await apiFetch(`${API_BASE_URL}/employees/${id}`, {
                method: 'PATCH',
                headers,
                credentials: 'include',
                body: formData,
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

    async updateEmployeeStatus(id: string, status: 'active' | 'on_leave' | 'terminated'): Promise<EmployeeResponse> {
        try {
            const response = await apiFetch(`${API_BASE_URL}/employees/${id}/status`, {
                method: 'PATCH',
                headers: getAuthHeaders(),
                credentials: 'include',
                body: JSON.stringify({ status }),
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

    async deleteEmployee(id: string): Promise<{ message: string }> {
        try {
            const response = await apiFetch(`${API_BASE_URL}/employees/${id}`, {
                method: 'DELETE',
                headers: getAuthHeaders(),
                credentials: 'include',
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

export { employeeApi };
