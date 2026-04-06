import { API_BASE_URL, apiFetch, getAuthHeaders, handleApiError } from './types';

export interface PolicyVersion {
  id: string;
  policyId: string;
  companyId: string;
  version: string;
  content: string;
  effectiveFrom: string;
  createdById?: string | null;
  createdAt: string;
  createdBy?: {
    id: string;
    fullName?: string | null;
    email: string;
  } | null;
}

export interface Policy {
  id: string;
  companyId: string;
  title: string;
  isActive: boolean;
  createdById?: string | null;
  createdAt: string;
  updatedAt: string;
  versions: PolicyVersion[];
}

export interface PolicyResponse {
  message: string;
  data: Policy | null;
}

export interface PolicyListResponse {
  message: string;
  data: Policy[];
}

export interface PendingPolicy {
  policyId: string;
  title: string;
  isActive: boolean;
  version: string;
  content: string;
  effectiveFrom: string;
  policyVersionId: string;
}

export interface PendingPolicyResponse {
  message: string;
  data: PendingPolicy | null;
}

export const policyApi = {
  async listPolicies(): Promise<PolicyListResponse> {
    const response = await apiFetch(`${API_BASE_URL}/policy`, {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include',
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    return response.json();
  },

  async getCurrentPolicy(): Promise<PolicyResponse> {
    const response = await apiFetch(`${API_BASE_URL}/policy/current`, {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include',
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    return response.json();
  },

  async createPolicy(payload: {
    title: string;
    content: string;
    effectiveFrom?: string;
  }): Promise<PolicyResponse> {
    const response = await apiFetch(`${API_BASE_URL}/policy`, {
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

  async updatePolicy(
    id: string,
    payload: {
      title?: string;
      content: string;
      version: string;
      effectiveFrom?: string;
    },
  ): Promise<PolicyResponse> {
    const response = await apiFetch(`${API_BASE_URL}/policy/${id}`, {
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

  async getPendingPolicy(): Promise<PendingPolicyResponse> {
    const response = await apiFetch(`${API_BASE_URL}/policy/pending`, {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include',
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    return response.json();
  },

  async acceptPolicy(): Promise<{ message: string; data: unknown }> {
    const response = await apiFetch(`${API_BASE_URL}/policy/accept`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    return response.json();
  },
};
