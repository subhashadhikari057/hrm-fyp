/**
 * Statistics API functions
 */

import { API_BASE_URL, getAuthHeaders, handleApiError } from './types';
import { companyApi } from './company';
import { superadminApi } from './superadmin';

// Employee Statistics Types
export interface EmployeeStatsResponse {
  message: string;
  data: {
    summary: {
      totalEmployees: number;
      totalActive: number;
      totalOnLeave: number;
      totalTerminated: number;
      newHiresThisMonth: number;
      averageSalary: number;
    };
    byStatus: Array<{ status: string; count: number }>;
    byDepartment: Array<{
      departmentId: string;
      departmentName: string;
      departmentCode: string;
      count: number;
    }>;
    byDesignation: Array<{
      designationId: string;
      designationName: string;
      designationCode: string;
      count: number;
    }>;
    byEmploymentType: Array<{ employmentType: string; count: number }>;
  };
}

// Department Response Types
export interface DepartmentsResponse {
  message: string;
  data: Array<{
    id: string;
    name: string;
    code: string;
    description?: string | null;
    isActive: boolean;
    companyId: string;
    createdAt: string;
    updatedAt?: string;
  }>;
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export const statsApi = {
  /**
   * Get employee statistics for company (Company Admin / HR Manager / Manager only)
   */
  async getEmployeeStats(): Promise<EmployeeStatsResponse> {
    const response = await fetch(`${API_BASE_URL}/employees/stats`, {
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
   * Get all departments for company (Company Admin / HR Manager only)
   */
  async getDepartments(params?: {
    isActive?: boolean;
    page?: number;
    limit?: number;
  }): Promise<DepartmentsResponse> {
    const queryParams = new URLSearchParams();
    if (params?.isActive !== undefined) queryParams.append('isActive', String(params.isActive));
    if (params?.page) queryParams.append('page', String(params.page));
    if (params?.limit) queryParams.append('limit', String(params.limit));

    const response = await fetch(`${API_BASE_URL}/company/departments?${queryParams.toString()}`, {
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
   * Get super admin dashboard stats
   */
  async getSuperAdminStats(): Promise<{
    totalCompanies: number;
    totalUsers: number;
    activeCompanies: number;
    totalCompanyAdmins: number;
  }> {
    try {
      // Fetch all data in parallel
      const [companiesResponse, usersResponse, companyAdminsResponse] = await Promise.all([
        companyApi.getCompanies(),
        superadminApi.getUsers({ limit: 1 }), // Just get meta for total count
        companyApi.getCompanyAdmins({ limit: 1 }), // Just get meta for total count
      ]);

      const totalCompanies = companiesResponse.data.length;
      const activeCompanies = companiesResponse.data.filter((c) => c.status === 'active').length;
      const totalUsers = usersResponse.meta.total;
      const totalCompanyAdmins = companyAdminsResponse.meta.total;

      return {
        totalCompanies,
        totalUsers,
        activeCompanies,
        totalCompanyAdmins,
      };
    } catch (error) {
      console.error('Error fetching super admin stats:', error);
      throw error;
    }
  },

  /**
   * Get company admin dashboard stats
   */
  async getCompanyAdminStats(): Promise<{
    totalEmployees: number;
    activeEmployees: number;
    totalDepartments: number;
    newHiresThisMonth: number;
  }> {
    try {
      // Fetch employee stats and departments in parallel
      const [employeeStatsResponse, departmentsResponse] = await Promise.all([
        this.getEmployeeStats(),
        this.getDepartments({ limit: 1 }), // Just get meta for total count
      ]);

      return {
        totalEmployees: employeeStatsResponse.data.summary.totalEmployees,
        activeEmployees: employeeStatsResponse.data.summary.totalActive,
        totalDepartments: departmentsResponse.meta.total,
        newHiresThisMonth: employeeStatsResponse.data.summary.newHiresThisMonth,
      };
    } catch (error) {
      console.error('Error fetching company admin stats:', error);
      throw error;
    }
  },

  /**
   * Get HR manager dashboard stats
   */
  async getHRManagerStats(): Promise<{
    activeEmployees: number;
    newHires: number;
    totalEmployees: number;
    employeesOnLeave: number;
  }> {
    try {
      const employeeStatsResponse = await this.getEmployeeStats();

      return {
        activeEmployees: employeeStatsResponse.data.summary.totalActive,
        newHires: employeeStatsResponse.data.summary.newHiresThisMonth,
        totalEmployees: employeeStatsResponse.data.summary.totalEmployees,
        employeesOnLeave: employeeStatsResponse.data.summary.totalOnLeave,
      };
    } catch (error) {
      console.error('Error fetching HR manager stats:', error);
      throw error;
    }
  },
};






