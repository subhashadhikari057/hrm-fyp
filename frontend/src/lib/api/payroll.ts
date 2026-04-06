import { API_BASE_URL, apiFetch, getAuthHeaders, handleApiError } from './types';

export type PayrollPeriodStatus = 'DRAFT' | 'PROCESSED' | 'FINALIZED';
export type PayslipStatus = 'GENERATED' | 'FINALIZED';
export type PayslipLineItemType = 'EARNING' | 'DEDUCTION';

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
}

export interface PayrollPeriodRecord {
  id: string;
  companyId: string;
  fiscalYearLabel: string;
  bsPeriodYear?: number | null;
  bsPeriodMonth?: number | null;
  bsPeriodMonthLabel?: string | null;
  bsStartDate?: string | null;
  bsEndDate?: string | null;
  periodYear: number;
  periodMonth: number;
  periodLabel: string;
  startDate: string;
  endDate: string;
  status: PayrollPeriodStatus;
  processedAt?: string | null;
  finalizedAt?: string | null;
  finalizedById?: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    payslips: number;
  };
}

export interface PayslipLineItemRecord {
  id: string;
  payslipId: string;
  companyId: string;
  type: PayslipLineItemType;
  code: string;
  title: string;
  amount: number;
  sortOrder: number;
  createdAt: string;
}

export interface PayslipTaxBreakdownRow {
  label: string;
  lowerBound: number;
  upperBound: number | null;
  taxableAmount: number;
  rate: number;
  taxAmount: number;
}

export interface PayslipTdsComputation {
  annualTaxLiability: number;
  taxPaidToDate: number;
  remainingTax: number;
  remainingPeriods: number;
  uncappedMonthlyTds: number;
  cappedMonthlyTds: number;
  employeeSsfRate: number;
  employerSsfRate: number;
  taxEnabled: boolean;
}

export interface PayslipRecord {
  id: string;
  payrollPeriodId: string;
  companyId: string;
  employeeId: string;
  status: PayslipStatus;
  basicSalary: number;
  allowances: number;
  grossSalary: number;
  ssfEmployeeContribution: number;
  ssfEmployerContribution: number;
  totalSsfContribution: number;
  projectedAnnualIncome: number;
  taxableAnnualIncome: number;
  annualTaxLiability: number;
  taxPaidToDate: number;
  monthlyTds: number;
  taxBreakdown?: PayslipTaxBreakdownRow[] | null;
  tdsComputation?: PayslipTdsComputation | null;
  netSalary: number;
  isMarried: boolean;
  generatedAt: string;
  updatedAt: string;
  employee?: {
    id: string;
    employeeCode: string;
    firstName: string;
    lastName: string;
    workEmail?: string | null;
    department?: { id: string; name: string } | null;
    designation?: { id: string; name: string } | null;
  };
  payrollPeriod?: PayrollPeriodRecord;
  lineItems?: PayslipLineItemRecord[];
}

export interface PayrollPeriodDetailRecord extends PayrollPeriodRecord {
  payslips: PayslipRecord[];
  createdBy?: { id: string; fullName?: string | null; email?: string | null } | null;
  finalizedBy?: { id: string; fullName?: string | null; email?: string | null } | null;
  summary: {
    totalEmployees: number;
    totalGross: number;
    totalNet: number;
    totalTds: number;
    totalSsf: number;
    totalEmployeeSsf: number;
    totalEmployerSsf: number;
  };
}

export interface PayrollSummaryRecord {
  payslipCount: number;
  totalGrossSalary: number;
  totalNetSalary: number;
  totalTdsPaid: number;
  totalEmployeeSsf: number;
  totalEmployerSsf: number;
  totalSsfContribution: number;
}

export interface PayrollSummaryResponse {
  message: string;
  data: PayrollSummaryRecord;
}

export interface PayrollSettingsRecord {
  id: string;
  name: string;
  enableTaxDeduction: boolean;
  enableEmployeeSsf: boolean;
  enableEmployerSsf: boolean;
  employeeSsfRate: number;
  employerSsfRate: number;
}

export interface PayrollSettingsResponse {
  message: string;
  data: PayrollSettingsRecord;
}

export interface UpdatePayrollSettingsPayload {
  enableTaxDeduction?: boolean;
  enableEmployeeSsf?: boolean;
  enableEmployerSsf?: boolean;
  employeeSsfRate?: number;
  employerSsfRate?: number;
}

export interface PayrollPeriodResponse {
  message: string;
  data: PayrollPeriodRecord;
}

export interface PayrollPeriodDetailResponse {
  message: string;
  data: PayrollPeriodDetailRecord;
}

export interface PayrollPeriodListResponse {
  message: string;
  data: PayrollPeriodRecord[];
  meta?: PaginationMeta;
}

export interface PayslipResponse {
  message: string;
  data: PayslipRecord;
}

export interface PayslipListResponse {
  message: string;
  data: PayslipRecord[];
  meta?: PaginationMeta;
}

export interface PayrollGenerateResponse {
  message: string;
  data: {
    payrollPeriodId: string;
    generatedCount: number;
    payslips: PayslipRecord[];
  };
}

export interface CreatePayrollPeriodPayload {
  fiscalYearLabel: string;
  bsPeriodYear?: number;
  bsPeriodMonth?: number;
  bsPeriodMonthLabel?: string;
  bsStartDate?: string;
  bsEndDate?: string;
  periodYear: number;
  periodMonth: number;
  periodLabel?: string;
  startDate: string;
  endDate: string;
}

export interface PayrollPeriodListParams {
  status?: PayrollPeriodStatus;
  fiscalYearLabel?: string;
  periodYear?: number;
  periodMonth?: number;
  page?: number;
  limit?: number;
}

export interface PayslipListParams {
  payrollPeriodId?: string;
  employeeId?: string;
  status?: PayslipStatus;
  fiscalYearLabel?: string;
  page?: number;
  limit?: number;
}

function buildQuery(params?: Record<string, string | number | undefined> | PayrollPeriodListParams | PayslipListParams) {
  const query = new URLSearchParams();
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      query.append(key, String(value));
    }
  });
  return query.toString();
}

export const payrollApi = {
  async createAdminPayrollPeriod(payload: CreatePayrollPeriodPayload): Promise<PayrollPeriodResponse> {
    const response = await apiFetch(`${API_BASE_URL}/payroll/admin/periods`, {
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

  async listAdminPayrollPeriods(params?: PayrollPeriodListParams): Promise<PayrollPeriodListResponse> {
    const query = buildQuery(params);
    const response = await apiFetch(`${API_BASE_URL}/payroll/admin/periods${query ? `?${query}` : ''}`, {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include',
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    return response.json();
  },

  async getAdminPayrollPeriodById(periodId: string): Promise<PayrollPeriodDetailResponse> {
    const response = await apiFetch(`${API_BASE_URL}/payroll/admin/periods/${periodId}`, {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include',
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    return response.json();
  },

  async generateAdminPayroll(periodId: string): Promise<PayrollGenerateResponse> {
    const response = await apiFetch(`${API_BASE_URL}/payroll/admin/periods/${periodId}/generate`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    return response.json();
  },

  async finalizeAdminPayroll(periodId: string): Promise<{ message: string; data: { id: string; status: PayrollPeriodStatus } }> {
    const response = await apiFetch(`${API_BASE_URL}/payroll/admin/periods/${periodId}/finalize`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    return response.json();
  },

  async listAdminPayslips(params?: PayslipListParams): Promise<PayslipListResponse> {
    const query = buildQuery(params);
    const response = await apiFetch(`${API_BASE_URL}/payroll/admin/payslips${query ? `?${query}` : ''}`, {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include',
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    return response.json();
  },

  async getAdminPayslipById(payslipId: string): Promise<PayslipResponse> {
    const response = await apiFetch(`${API_BASE_URL}/payroll/admin/payslips/${payslipId}`, {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include',
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    return response.json();
  },

  async getAdminPayrollSummary(fiscalYearLabel?: string): Promise<PayrollSummaryResponse> {
    const query = buildQuery({ fiscalYearLabel });
    const response = await apiFetch(`${API_BASE_URL}/payroll/admin/summary${query ? `?${query}` : ''}`, {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include',
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    return response.json();
  },

  async getAdminPayrollSettings(): Promise<PayrollSettingsResponse> {
    const response = await apiFetch(`${API_BASE_URL}/payroll/admin/settings`, {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include',
    });

    if (!response.ok) await handleApiError(response);
    return response.json();
  },

  async updateAdminPayrollSettings(payload: UpdatePayrollSettingsPayload): Promise<PayrollSettingsResponse> {
    const response = await apiFetch(`${API_BASE_URL}/payroll/admin/settings`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(payload),
    });

    if (!response.ok) await handleApiError(response);
    return response.json();
  },

  async listMyPayslips(params?: PayslipListParams): Promise<PayslipListResponse> {
    const query = buildQuery(params);
    const response = await apiFetch(`${API_BASE_URL}/payroll/me/payslips${query ? `?${query}` : ''}`, {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include',
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    return response.json();
  },

  async getMyPayslipById(payslipId: string): Promise<PayslipResponse> {
    const response = await apiFetch(`${API_BASE_URL}/payroll/me/payslips/${payslipId}`, {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include',
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    return response.json();
  },

  async getMyPayrollSummary(fiscalYearLabel?: string): Promise<PayrollSummaryResponse> {
    const query = buildQuery({ fiscalYearLabel });
    const response = await apiFetch(`${API_BASE_URL}/payroll/me/summary${query ? `?${query}` : ''}`, {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include',
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    return response.json();
  },
};
