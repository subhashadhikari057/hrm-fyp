import { API_BASE_URL, apiFetch, getAuthHeaders, handleApiError } from './types';

export interface SubscriptionPlan {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  monthlyPrice: number;
  yearlyPrice?: number | null;
  maxEmployees?: number | null;
  features?: string[] | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    companies: number;
  };
}

export interface SubscriptionPlansResponse {
  message: string;
  data: SubscriptionPlan[];
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface SubscriptionPlanResponse {
  message: string;
  data: SubscriptionPlan;
}

export interface SubscriptionPlanPayload {
  name: string;
  code: string;
  description?: string;
  monthlyPrice?: number;
  yearlyPrice?: number;
  maxEmployees?: number;
  features?: string[];
  isActive?: boolean;
}

export const subscriptionApi = {
  async getPlans(page = 1, limit = 50): Promise<SubscriptionPlansResponse> {
    const response = await apiFetch(`${API_BASE_URL}/subscription-plans?page=${page}&limit=${limit}`, {
      method: 'GET',
      credentials: 'include',
      headers: getAuthHeaders(),
    });
    if (!response.ok) await handleApiError(response);
    return response.json();
  },

  async createPlan(payload: SubscriptionPlanPayload): Promise<SubscriptionPlanResponse> {
    const response = await apiFetch(`${API_BASE_URL}/subscription-plans`, {
      method: 'POST',
      credentials: 'include',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!response.ok) await handleApiError(response);
    return response.json();
  },

  async updatePlan(id: string, payload: Partial<SubscriptionPlanPayload>): Promise<SubscriptionPlanResponse> {
    const response = await apiFetch(`${API_BASE_URL}/subscription-plans/${id}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!response.ok) await handleApiError(response);
    return response.json();
  },
};
