import { API_BASE_URL, apiFetch, getAuthHeaders, handleApiError } from './types';

export type ProjectStatus = 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
export type ProjectTaskStatus = 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';
export type ProjectTaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface ProjectUserSummary {
  id: string;
  fullName?: string | null;
  email?: string | null;
}

export interface ProjectEmployeeSummary {
  id: string;
  employeeCode?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  status?: string | null;
}

export interface ProjectMemberRecord {
  id: string;
  projectId: string;
  employeeId: string;
  addedById?: string | null;
  createdAt: string;
  employee?: ProjectEmployeeSummary | null;
  addedBy?: ProjectUserSummary | null;
}

export interface ProjectTaskRecord {
  id: string;
  projectId: string;
  companyId: string;
  title: string;
  description?: string | null;
  status: ProjectTaskStatus;
  priority: ProjectTaskPriority;
  dueDate?: string | null;
  assigneeEmployeeId?: string | null;
  createdById?: string | null;
  updatedById?: string | null;
  createdAt: string;
  updatedAt: string;
  project?: {
    id: string;
    name: string;
    status: ProjectStatus;
  } | null;
  assigneeEmployee?: ProjectEmployeeSummary | null;
  createdBy?: ProjectUserSummary | null;
  updatedBy?: ProjectUserSummary | null;
  _count?: {
    comments: number;
  };
}

export interface ProjectTaskCommentRecord {
  id: string;
  taskId: string;
  companyId: string;
  authorUserId: string;
  comment: string;
  createdAt: string;
  authorUser?: ProjectUserSummary | null;
}

export interface ProjectRecord {
  id: string;
  companyId: string;
  name: string;
  description?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  status: ProjectStatus;
  createdById?: string | null;
  updatedById?: string | null;
  createdAt: string;
  updatedAt: string;
  members?: ProjectMemberRecord[];
  createdBy?: ProjectUserSummary | null;
  updatedBy?: ProjectUserSummary | null;
  taskSummary?: Record<ProjectTaskStatus, number>;
  _count?: {
    members: number;
    tasks: number;
  };
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
}

export interface ProjectResponse {
  message: string;
  data: ProjectRecord;
}

export interface ProjectListResponse {
  message: string;
  data: ProjectRecord[];
  meta?: PaginationMeta;
}

export interface ProjectTaskResponse {
  message: string;
  data: ProjectTaskRecord;
}

export interface ProjectTaskListResponse {
  message: string;
  data: ProjectTaskRecord[];
  meta?: PaginationMeta;
}

export interface ProjectTaskCommentResponse {
  message: string;
  data: ProjectTaskCommentRecord;
}

export interface ProjectTaskCommentListResponse {
  message: string;
  data: ProjectTaskCommentRecord[];
  meta?: PaginationMeta;
}

export interface ProjectMembersMutationResponse {
  message: string;
  data: {
    addedCount?: number;
    skippedCount?: number;
    members?: ProjectMemberRecord[];
    removedEmployee?: ProjectEmployeeSummary | null;
  };
}

export interface ProjectDeleteResponse {
  message: string;
  data: {
    id: string;
  };
}

export interface ProjectListParams {
  status?: ProjectStatus;
  search?: string;
  page?: number;
  limit?: number;
}

export interface ProjectTaskListParams {
  status?: ProjectTaskStatus;
  priority?: ProjectTaskPriority;
  assigneeEmployeeId?: string;
  search?: string;
  dueDateFrom?: string;
  dueDateTo?: string;
  page?: number;
  limit?: number;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

function buildProjectQuery(params?: ProjectListParams): string {
  const query = new URLSearchParams();
  if (params?.status) query.append('status', params.status);
  if (params?.search) query.append('search', params.search);
  if (params?.page) query.append('page', String(params.page));
  if (params?.limit) query.append('limit', String(params.limit));
  return query.toString();
}

function buildTaskQuery(params?: ProjectTaskListParams): string {
  const query = new URLSearchParams();
  if (params?.status) query.append('status', params.status);
  if (params?.priority) query.append('priority', params.priority);
  if (params?.assigneeEmployeeId) query.append('assigneeEmployeeId', params.assigneeEmployeeId);
  if (params?.search) query.append('search', params.search);
  if (params?.dueDateFrom) query.append('dueDateFrom', params.dueDateFrom);
  if (params?.dueDateTo) query.append('dueDateTo', params.dueDateTo);
  if (params?.page) query.append('page', String(params.page));
  if (params?.limit) query.append('limit', String(params.limit));
  return query.toString();
}

function buildPaginationQuery(params?: PaginationParams): string {
  const query = new URLSearchParams();
  if (params?.page) query.append('page', String(params.page));
  if (params?.limit) query.append('limit', String(params.limit));
  return query.toString();
}

export const projectsApi = {
  async createProject(payload: {
    name: string;
    description?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<ProjectResponse> {
    const response = await apiFetch(`${API_BASE_URL}/projects/admin`, {
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

  async listAdminProjects(params?: ProjectListParams): Promise<ProjectListResponse> {
    const query = buildProjectQuery(params);
    const response = await apiFetch(`${API_BASE_URL}/projects/admin${query ? `?${query}` : ''}`, {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include',
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    return response.json();
  },

  async getAdminProjectById(projectId: string): Promise<ProjectResponse> {
    const response = await apiFetch(`${API_BASE_URL}/projects/admin/${projectId}`, {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include',
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    return response.json();
  },

  async updateAdminProject(
    projectId: string,
    payload: {
      name?: string;
      description?: string;
      startDate?: string;
      endDate?: string;
    },
  ): Promise<ProjectResponse> {
    const response = await apiFetch(`${API_BASE_URL}/projects/admin/${projectId}`, {
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

  async updateAdminProjectStatus(
    projectId: string,
    status: ProjectStatus,
  ): Promise<ProjectResponse> {
    const response = await apiFetch(`${API_BASE_URL}/projects/admin/${projectId}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    return response.json();
  },

  async deleteAdminProject(projectId: string): Promise<ProjectDeleteResponse> {
    const response = await apiFetch(`${API_BASE_URL}/projects/admin/${projectId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      credentials: 'include',
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    return response.json();
  },

  async addAdminProjectMembers(
    projectId: string,
    employeeIds: string[],
  ): Promise<ProjectMembersMutationResponse> {
    const response = await apiFetch(`${API_BASE_URL}/projects/admin/${projectId}/members`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({ employeeIds }),
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    return response.json();
  },

  async removeAdminProjectMember(
    projectId: string,
    employeeId: string,
  ): Promise<ProjectMembersMutationResponse> {
    const response = await apiFetch(
      `${API_BASE_URL}/projects/admin/${projectId}/members/${employeeId}`,
      {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include',
      },
    );

    if (!response.ok) {
      await handleApiError(response);
    }

    return response.json();
  },

  async createAdminTask(
    projectId: string,
    payload: {
      title: string;
      description?: string;
      priority?: ProjectTaskPriority;
      dueDate?: string;
      assigneeEmployeeId?: string;
    },
  ): Promise<ProjectTaskResponse> {
    const response = await apiFetch(`${API_BASE_URL}/projects/admin/${projectId}/tasks`, {
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

  async listAdminTasks(
    projectId: string,
    params?: ProjectTaskListParams,
  ): Promise<ProjectTaskListResponse> {
    const query = buildTaskQuery(params);
    const response = await apiFetch(
      `${API_BASE_URL}/projects/admin/${projectId}/tasks${query ? `?${query}` : ''}`,
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

  async getAdminTaskById(taskId: string): Promise<ProjectTaskResponse> {
    const response = await apiFetch(`${API_BASE_URL}/projects/admin/tasks/${taskId}`, {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include',
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    return response.json();
  },

  async updateAdminTask(
    taskId: string,
    payload: {
      title?: string;
      description?: string;
      priority?: ProjectTaskPriority;
      dueDate?: string;
      assigneeEmployeeId?: string;
    },
  ): Promise<ProjectTaskResponse> {
    const response = await apiFetch(`${API_BASE_URL}/projects/admin/tasks/${taskId}`, {
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

  async updateAdminTaskStatus(
    taskId: string,
    status: ProjectTaskStatus,
  ): Promise<ProjectTaskResponse> {
    const response = await apiFetch(`${API_BASE_URL}/projects/admin/tasks/${taskId}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    return response.json();
  },

  async listAdminTaskComments(
    taskId: string,
    params?: PaginationParams,
  ): Promise<ProjectTaskCommentListResponse> {
    const query = buildPaginationQuery(params);
    const response = await apiFetch(
      `${API_BASE_URL}/projects/admin/tasks/${taskId}/comments${query ? `?${query}` : ''}`,
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

  async addAdminTaskComment(taskId: string, comment: string): Promise<ProjectTaskCommentResponse> {
    const response = await apiFetch(`${API_BASE_URL}/projects/admin/tasks/${taskId}/comments`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({ comment }),
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    return response.json();
  },

  async listMyProjects(params?: ProjectListParams): Promise<ProjectListResponse> {
    const query = buildProjectQuery(params);
    const response = await apiFetch(`${API_BASE_URL}/projects/me${query ? `?${query}` : ''}`, {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include',
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    return response.json();
  },

  async listMyProjectTasks(
    projectId: string,
    params?: ProjectTaskListParams,
  ): Promise<ProjectTaskListResponse> {
    const query = buildTaskQuery(params);
    const response = await apiFetch(
      `${API_BASE_URL}/projects/me/${projectId}/tasks${query ? `?${query}` : ''}`,
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

  async getMyTaskById(taskId: string): Promise<ProjectTaskResponse> {
    const response = await apiFetch(`${API_BASE_URL}/projects/me/tasks/${taskId}`, {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include',
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    return response.json();
  },

  async updateMyTaskStatus(taskId: string, status: ProjectTaskStatus): Promise<ProjectTaskResponse> {
    const response = await apiFetch(`${API_BASE_URL}/projects/me/tasks/${taskId}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    return response.json();
  },

  async listMyTaskComments(
    taskId: string,
    params?: PaginationParams,
  ): Promise<ProjectTaskCommentListResponse> {
    const query = buildPaginationQuery(params);
    const response = await apiFetch(
      `${API_BASE_URL}/projects/me/tasks/${taskId}/comments${query ? `?${query}` : ''}`,
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

  async addMyTaskComment(taskId: string, comment: string): Promise<ProjectTaskCommentResponse> {
    const response = await apiFetch(`${API_BASE_URL}/projects/me/tasks/${taskId}/comments`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({ comment }),
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    return response.json();
  },
};
