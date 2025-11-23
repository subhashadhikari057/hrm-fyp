/**
 * Company API functions
 */

import { API_BASE_URL, getAuthHeaders, handleApiError, type BackendUserRole } from './types';
import { superadminApi, type User } from './superadmin';

// Company types
export interface Company {
  id: string;
  name: string;
  code: string;
  logoUrl?: string | null;
  industry?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  planExpiresAt?: string | null;
  maxEmployees?: number | null;
  status: 'active' | 'suspended' | 'archived';
  userCount: number;
  createdAt: string;
  updatedAt?: string;
}

export interface CompaniesResponse {
  message: string;
  data: Company[];
}

export interface CompanyResponse {
  message: string;
  data: Company;
}

export interface CreateCompanyWithAdminRequest {
  companyName: string;
  companyCode?: string;
  adminEmail: string;
  adminPassword: string;
  adminFullName?: string;
  industry?: string;
  address?: string;
  city?: string;
  country?: string;
  planExpiresAt?: string;
  maxEmployees?: number;
  logo?: File;
}

export interface CreateCompanyWithAdminResponse {
  message: string;
  data: {
    company: Company;
    admin: {
      id: string;
      email: string;
      fullName?: string | null;
      role: string;
    };
  };
}

export interface UpdateCompanyRequest {
  name?: string;
  code?: string;
  industry?: string;
  address?: string;
  city?: string;
  country?: string;
  planExpiresAt?: string;
  maxEmployees?: number;
  logo?: File;
}

export interface UpdateCompanyStatusRequest {
  status: 'active' | 'suspended' | 'archived';
}

export const companyApi = {
  /**
   * Get all companies
   */
  async getCompanies(): Promise<CompaniesResponse> {
    const response = await fetch(`${API_BASE_URL}/companies`, {
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
   * Get company by ID
   */
  async getCompanyById(companyId: string): Promise<CompanyResponse> {
    const response = await fetch(`${API_BASE_URL}/companies/${companyId}`, {
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
   * Create a new company with admin user
   */
  async createCompanyWithAdmin(
    companyData: CreateCompanyWithAdminRequest
  ): Promise<CreateCompanyWithAdminResponse> {
    const formData = new FormData();
    formData.append('companyName', companyData.companyName);
    if (companyData.companyCode) formData.append('companyCode', companyData.companyCode);
    formData.append('adminEmail', companyData.adminEmail);
    formData.append('adminPassword', companyData.adminPassword);
    if (companyData.adminFullName) formData.append('adminFullName', companyData.adminFullName);
    if (companyData.industry) formData.append('industry', companyData.industry);
    if (companyData.address) formData.append('address', companyData.address);
    if (companyData.city) formData.append('city', companyData.city);
    if (companyData.country) formData.append('country', companyData.country);
    if (companyData.planExpiresAt) formData.append('planExpiresAt', companyData.planExpiresAt);
    if (companyData.maxEmployees) formData.append('maxEmployees', String(companyData.maxEmployees));
    if (companyData.logo) formData.append('logo', companyData.logo);

    const response = await fetch(`${API_BASE_URL}/companies`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    return response.json();
  },

  /**
   * Update company details
   */
  async updateCompany(
    companyId: string,
    companyData: UpdateCompanyRequest
  ): Promise<CompanyResponse> {
    const formData = new FormData();
    if (companyData.name) formData.append('name', companyData.name);
    if (companyData.code) formData.append('code', companyData.code);
    if (companyData.industry) formData.append('industry', companyData.industry);
    if (companyData.address) formData.append('address', companyData.address);
    if (companyData.city) formData.append('city', companyData.city);
    if (companyData.country) formData.append('country', companyData.country);
    if (companyData.planExpiresAt) formData.append('planExpiresAt', companyData.planExpiresAt);
    if (companyData.maxEmployees) formData.append('maxEmployees', String(companyData.maxEmployees));
    if (companyData.logo) formData.append('logo', companyData.logo);

    const response = await fetch(`${API_BASE_URL}/companies/${companyId}`, {
      method: 'PATCH',
      credentials: 'include',
      body: formData,
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    return response.json();
  },

  /**
   * Update company status
   */
  async updateCompanyStatus(
    companyId: string,
    status: UpdateCompanyStatusRequest
  ): Promise<CompanyResponse> {
    const response = await fetch(`${API_BASE_URL}/companies/${companyId}/status`, {
      method: 'PATCH',
      credentials: 'include',
      headers: getAuthHeaders(),
      body: JSON.stringify(status),
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    return response.json();
  },

  /**
   * Delete a company
   */
  async deleteCompany(companyId: string): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/companies/${companyId}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    return response.json();
  },

  /**
   * Get all company admins (users with role='company_admin')
   */
  async getCompanyAdmins(params?: {
    isActive?: boolean;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{
    message: string;
    data: User[];
    meta: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    };
  }> {
    return superadminApi.getUsers({
      role: 'company_admin',
      ...params,
    });
  },

  /**
   * Delete a company admin (soft delete - sets isActive to false)
   */
  async deleteCompanyAdmin(adminId: string): Promise<{ message: string; data: User }> {
    return superadminApi.deleteUser(adminId);
  },
};

