'use client';

import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import DashboardLayout from '../DashboardLayout';
import { PageHeader } from '../PageHeader';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { employeeApi, type Employee } from '../../lib/api/employee';
import {
  projectsApi,
  type ProjectRecord,
  type ProjectStatus,
  type ProjectTaskCommentRecord,
  type ProjectTaskRecord,
  type ProjectTaskStatus,
} from '../../lib/api/projects';
import { ProjectFormModal } from './ProjectFormModal';
import { ProjectTaskFormModal } from './ProjectTaskFormModal';
import { ProjectTaskDetailModal } from './ProjectTaskDetailModal';
import { ProjectMemberManager, type ProjectMemberCandidate } from './ProjectMemberManager';
import { ProjectKanbanBoard } from './ProjectKanbanBoard';

const PAGE_LIMIT = 10;
const MAX_API_LIMIT = 100;

function toDateInput(value?: string | null): string {
  if (!value) return '';
  return value.slice(0, 10);
}

function projectStatusBadgeClass(status: ProjectStatus): string {
  switch (status) {
    case 'COMPLETED':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700';
    case 'ARCHIVED':
      return 'border-gray-300 bg-gray-100 text-gray-700';
    default:
      return 'border-blue-200 bg-blue-50 text-blue-700';
  }
}

export default function ProjectsAdminPage() {
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [projectsError, setProjectsError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'ALL'>('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [stats, setStats] = useState({ active: 0, completed: 0, archived: 0 });

  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<ProjectRecord | null>(null);
  const [projectDetailLoading, setProjectDetailLoading] = useState(false);

  const [tasks, setTasks] = useState<ProjectTaskRecord[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);

  const [employeeCandidates, setEmployeeCandidates] = useState<ProjectMemberCandidate[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);

  const [projectFormOpen, setProjectFormOpen] = useState(false);
  const [projectFormMode, setProjectFormMode] = useState<'create' | 'edit'>('create');
  const [projectFormLoading, setProjectFormLoading] = useState(false);

  const [taskFormOpen, setTaskFormOpen] = useState(false);
  const [taskFormLoading, setTaskFormLoading] = useState(false);

  const [memberAdding, setMemberAdding] = useState(false);
  const [memberRemoving, setMemberRemoving] = useState(false);
  const [projectStatusUpdating, setProjectStatusUpdating] = useState(false);
  const [taskStatusUpdating, setTaskStatusUpdating] = useState(false);

  const [taskDetailOpen, setTaskDetailOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<ProjectTaskRecord | null>(null);
  const [taskDetailLoading, setTaskDetailLoading] = useState(false);
  const [taskCommentsLoading, setTaskCommentsLoading] = useState(false);
  const [taskComments, setTaskComments] = useState<ProjectTaskCommentRecord[]>([]);
  const [taskCommentSaving, setTaskCommentSaving] = useState(false);

  const projectWritable = selectedProject?.status === 'ACTIVE';

  const taskAssigneeOptions = useMemo(() => {
    const members = selectedProject?.members ?? [];
    return members
      .map((member) => {
        const name = `${member.employee?.firstName || ''} ${member.employee?.lastName || ''}`.trim();
        const code = member.employee?.employeeCode ? ` (${member.employee.employeeCode})` : '';
        return {
          id: member.employeeId,
          label: `${name || 'Employee'}${code}`,
        };
      })
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [selectedProject?.members]);

  const loadProjectStats = async () => {
    try {
      const [activeRes, completedRes, archivedRes] = await Promise.all([
        projectsApi.listAdminProjects({ status: 'ACTIVE', page: 1, limit: 1 }),
        projectsApi.listAdminProjects({ status: 'COMPLETED', page: 1, limit: 1 }),
        projectsApi.listAdminProjects({ status: 'ARCHIVED', page: 1, limit: 1 }),
      ]);

      setStats({
        active: activeRes.meta?.total || 0,
        completed: completedRes.meta?.total || 0,
        archived: archivedRes.meta?.total || 0,
      });
    } catch {
      setStats({ active: 0, completed: 0, archived: 0 });
    }
  };

  const loadEmployeeCandidates = async () => {
    setMembersLoading(true);
    try {
      const response = await employeeApi.getEmployees({
        status: 'active',
        page: 1,
        limit: 100,
        sortBy: 'firstName',
        sortOrder: 'asc',
      });

      const candidates = (response.data || []).map((employee: Employee) => {
        const fullName = `${employee.firstName || ''} ${employee.lastName || ''}`.trim();
        return {
          id: employee.id,
          label: `${fullName || employee.employeeCode}${
            employee.employeeCode ? ` (${employee.employeeCode})` : ''
          }`,
        };
      });

      setEmployeeCandidates(candidates);
    } catch {
      setEmployeeCandidates([]);
    } finally {
      setMembersLoading(false);
    }
  };

  const loadProjectDetail = async (projectId: string) => {
    setProjectDetailLoading(true);
    setTasksLoading(true);
    try {
      const projectRes = await projectsApi.getAdminProjectById(projectId);
      setSelectedProject(projectRes.data);
      setSelectedProjectId(projectId);

      try {
        const tasksRes = await projectsApi.listAdminTasks(projectId, {
          page: 1,
          limit: MAX_API_LIMIT,
        });
        const taskList = tasksRes.data || [];
        setTasks(taskList);

        if (selectedTask && !taskList.some((task) => task.id === selectedTask.id)) {
          setTaskDetailOpen(false);
          setSelectedTask(null);
          setTaskComments([]);
        }
      } catch (error: any) {
        setTasks([]);
        toast.error(error?.message || 'Failed to load project tasks');
      }
    } catch (error: any) {
      toast.error(error?.message || 'Failed to load project details');
      setSelectedProject(null);
      setTasks([]);
      setSelectedProjectId(null);
    } finally {
      setProjectDetailLoading(false);
      setTasksLoading(false);
    }
  };

  const loadProjects = async () => {
    setProjectsLoading(true);
    setProjectsError(null);

    try {
      const response = await projectsApi.listAdminProjects({
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        page,
        limit: PAGE_LIMIT,
      });

      const list = response.data || [];
      setProjects(list);
      setTotalPages(response.meta?.totalPages || 1);

      if (list.length === 0) {
        setSelectedProject(null);
        setSelectedProjectId(null);
        setTasks([]);
        return;
      }

      if (!selectedProjectId) {
        await loadProjectDetail(list[0].id);
        return;
      }

      const stillVisible = list.some((project) => project.id === selectedProjectId);
      if (!stillVisible) {
        await loadProjectDetail(list[0].id);
      }
    } catch (error: any) {
      setProjectsError(error?.message || 'Failed to load projects');
      setProjects([]);
      setTotalPages(1);
    } finally {
      setProjectsLoading(false);
    }
  };

  const refreshSelectedProject = async () => {
    if (!selectedProjectId) return;
    await loadProjectDetail(selectedProjectId);
  };

  const loadTaskDetail = async (task: ProjectTaskRecord) => {
    setTaskDetailOpen(true);
    setTaskDetailLoading(true);
    setTaskCommentsLoading(true);

    try {
      const [taskRes, commentsRes] = await Promise.all([
        projectsApi.getAdminTaskById(task.id),
        projectsApi.listAdminTaskComments(task.id, { page: 1, limit: MAX_API_LIMIT }),
      ]);

      setSelectedTask(taskRes.data);
      setTaskComments(commentsRes.data || []);
    } catch (error: any) {
      toast.error(error?.message || 'Failed to load task details');
      setSelectedTask(task);
      setTaskComments([]);
    } finally {
      setTaskDetailLoading(false);
      setTaskCommentsLoading(false);
    }
  };

  const refreshTaskComments = async (taskId: string) => {
    setTaskCommentsLoading(true);
    try {
      const response = await projectsApi.listAdminTaskComments(taskId, {
        page: 1,
        limit: MAX_API_LIMIT,
      });
      setTaskComments(response.data || []);
    } catch {
      setTaskComments([]);
    } finally {
      setTaskCommentsLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, page]);

  useEffect(() => {
    loadProjectStats();
    loadEmployeeCandidates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleProjectFormSubmit = async (payload: {
    name: string;
    description?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    setProjectFormLoading(true);

    try {
      if (projectFormMode === 'create') {
        const response = await projectsApi.createProject(payload);
        toast.success('Project created successfully');
        setProjectFormOpen(false);
        setPage(1);
        await Promise.all([loadProjects(), loadProjectStats()]);
        await loadProjectDetail(response.data.id);
      } else if (selectedProjectId) {
        await projectsApi.updateAdminProject(selectedProjectId, payload);
        toast.success('Project updated successfully');
        setProjectFormOpen(false);
        await Promise.all([loadProjects(), loadProjectStats(), refreshSelectedProject()]);
      }
    } catch (error: any) {
      toast.error(error?.message || 'Failed to save project');
    } finally {
      setProjectFormLoading(false);
    }
  };

  const handleProjectStatusChange = async (status: ProjectStatus) => {
    if (!selectedProjectId || !selectedProject || selectedProject.status === status) {
      return;
    }

    setProjectStatusUpdating(true);
    try {
      await projectsApi.updateAdminProjectStatus(selectedProjectId, status);
      toast.success(`Project moved to ${status}`);
      await Promise.all([loadProjects(), loadProjectStats(), refreshSelectedProject()]);
    } catch (error: any) {
      toast.error(error?.message || 'Failed to update project status');
    } finally {
      setProjectStatusUpdating(false);
    }
  };

  const handleAddMembers = async (employeeIds: string[]) => {
    if (!selectedProjectId) return;

    setMemberAdding(true);
    try {
      const response = await projectsApi.addAdminProjectMembers(selectedProjectId, employeeIds);
      const added = response.data?.addedCount || 0;
      if (added > 0) {
        toast.success(`Added ${added} member${added > 1 ? 's' : ''}`);
      } else {
        toast('Selected member is already in this project');
      }
      await Promise.all([refreshSelectedProject(), loadProjects()]);
    } catch (error: any) {
      toast.error(error?.message || 'Failed to add member');
    } finally {
      setMemberAdding(false);
    }
  };

  const handleRemoveMember = async (employeeId: string) => {
    if (!selectedProjectId) return;

    setMemberRemoving(true);
    try {
      await projectsApi.removeAdminProjectMember(selectedProjectId, employeeId);
      toast.success('Member removed from project');
      await Promise.all([refreshSelectedProject(), loadProjects()]);
    } catch (error: any) {
      toast.error(error?.message || 'Failed to remove member');
    } finally {
      setMemberRemoving(false);
    }
  };

  const handleCreateTask = async (payload: {
    title: string;
    description?: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
    dueDate?: string;
    assigneeEmployeeId?: string;
  }) => {
    if (!selectedProjectId) return;

    setTaskFormLoading(true);
    try {
      await projectsApi.createAdminTask(selectedProjectId, payload);
      toast.success('Task created successfully');
      setTaskFormOpen(false);
      await Promise.all([refreshSelectedProject(), loadProjects()]);
    } catch (error: any) {
      toast.error(error?.message || 'Failed to create task');
    } finally {
      setTaskFormLoading(false);
    }
  };

  const handleMoveTask = async (task: ProjectTaskRecord, status: ProjectTaskStatus) => {
    setTaskStatusUpdating(true);
    try {
      await projectsApi.updateAdminTaskStatus(task.id, status);

      setTasks((prev) =>
        prev.map((item) => (item.id === task.id ? { ...item, status } : item)),
      );

      setSelectedTask((prev) => (prev && prev.id === task.id ? { ...prev, status } : prev));

      toast.success('Task status updated');
    } catch (error: any) {
      toast.error(error?.message || 'Failed to update task status');
      await refreshSelectedProject();
    } finally {
      setTaskStatusUpdating(false);
    }
  };

  const handleTaskStatusFromModal = async (status: ProjectTaskStatus) => {
    if (!selectedTask) return;

    await handleMoveTask(selectedTask, status);
  };

  const handleAddTaskComment = async (comment: string) => {
    if (!selectedTask) return;

    setTaskCommentSaving(true);
    try {
      await projectsApi.addAdminTaskComment(selectedTask.id, comment);
      toast.success('Comment added');

      setTasks((prev) =>
        prev.map((item) =>
          item.id === selectedTask.id
            ? {
                ...item,
                _count: {
                  comments: (item._count?.comments || 0) + 1,
                },
              }
            : item,
        ),
      );

      setSelectedTask((prev) =>
        prev
          ? {
              ...prev,
              _count: {
                comments: (prev._count?.comments || 0) + 1,
              },
            }
          : prev,
      );

      await refreshTaskComments(selectedTask.id);
    } catch (error: any) {
      toast.error(error?.message || 'Failed to add comment');
    } finally {
      setTaskCommentSaving(false);
    }
  };

  const projectFormInitialValues = useMemo(() => {
    if (!selectedProject) return undefined;

    return {
      name: selectedProject.name,
      description: selectedProject.description || '',
      startDate: toDateInput(selectedProject.startDate),
      endDate: toDateInput(selectedProject.endDate),
    };
  }, [selectedProject]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Projects"
          description="Manage projects, members, and task Kanban workflows."
          actions={
            <Button
              variant="blue"
              onClick={() => {
                setProjectFormMode('create');
                setProjectFormOpen(true);
              }}
            >
              Create Project
            </Button>
          }
        />

        <Card>
          <CardContent className="grid grid-cols-1 gap-4 pt-6 md:grid-cols-3">
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-blue-700">Active</p>
              <p className="mt-1 text-2xl font-semibold text-blue-800">{stats.active}</p>
            </div>
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">Completed</p>
              <p className="mt-1 text-2xl font-semibold text-emerald-800">{stats.completed}</p>
            </div>
            <div className="rounded-lg border border-gray-300 bg-gray-100 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-700">Archived</p>
              <p className="mt-1 text-2xl font-semibold text-gray-800">{stats.archived}</p>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <Card className="xl:col-span-1">
            <CardHeader className="flex flex-col gap-3">
              <CardTitle>Project List</CardTitle>
              <select
                className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as ProjectStatus | 'ALL');
                  setPage(1);
                }}
              >
                <option value="ALL">All statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="COMPLETED">Completed</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </CardHeader>
            <CardContent className="space-y-3">
              {projectsError ? <p className="text-sm text-red-600">{projectsError}</p> : null}

              {projectsLoading ? (
                <p className="text-sm text-gray-600">Loading projects...</p>
              ) : projects.length === 0 ? (
                <p className="text-sm text-gray-600">No projects found.</p>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700">Name</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700">Status</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {projects.map((project) => (
                        <tr
                          key={project.id}
                          className={
                            selectedProjectId === project.id ? 'bg-blue-50/70' : 'hover:bg-gray-50'
                          }
                        >
                          <td className="px-3 py-2 text-gray-900">
                            <p className="line-clamp-1 font-medium">{project.name}</p>
                            <p className="text-xs text-gray-500">
                              {project._count?.members || 0} members • {project._count?.tasks || 0} tasks
                            </p>
                          </td>
                          <td className="px-3 py-2">
                            <span
                              className={`inline-flex rounded-md border px-2 py-1 text-[11px] font-medium ${projectStatusBadgeClass(
                                project.status,
                              )}`}
                            >
                              {project.status}
                            </span>
                          </td>
                          <td className="px-3 py-2">
                            <Button
                              size="sm"
                              variant={selectedProjectId === project.id ? 'blue' : 'outline'}
                              onClick={() => loadProjectDetail(project.id)}
                            >
                              View
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>
                  Page {page} of {totalPages}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  >
                    Prev
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((prev) => prev + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="xl:col-span-2">
            <CardHeader className="flex flex-col gap-3">
              {!selectedProject ? (
                <CardTitle>Project Details</CardTitle>
              ) : (
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <CardTitle>{selectedProject.name}</CardTitle>
                    <p className="mt-1 text-sm text-gray-600">
                      {selectedProject.description || 'No description available.'}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-600">
                      <span>
                        Start:{' '}
                        {selectedProject.startDate
                          ? new Date(selectedProject.startDate).toLocaleDateString('en-GB')
                          : 'Not set'}
                      </span>
                      <span>•</span>
                      <span>
                        End:{' '}
                        {selectedProject.endDate
                          ? new Date(selectedProject.endDate).toLocaleDateString('en-GB')
                          : 'Not set'}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <select
                      className="h-9 rounded-md border border-gray-300 bg-white px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      value={selectedProject.status}
                      disabled={projectStatusUpdating}
                      onChange={(e) => handleProjectStatusChange(e.target.value as ProjectStatus)}
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="COMPLETED">COMPLETED</option>
                      <option value="ARCHIVED">ARCHIVED</option>
                    </select>

                    <Button
                      variant="outline"
                      onClick={() => {
                        setProjectFormMode('edit');
                        setProjectFormOpen(true);
                      }}
                    >
                      Edit Project
                    </Button>

                    <Button variant="blue" disabled={!projectWritable} onClick={() => setTaskFormOpen(true)}>
                      New Task
                    </Button>
                  </div>
                </div>
              )}
            </CardHeader>

            <CardContent>
              {!selectedProject ? (
                <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center text-sm text-gray-600">
                  Select a project from the left panel to manage members and tasks.
                </div>
              ) : projectDetailLoading ? (
                <div className="text-sm text-gray-600">Loading project details...</div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <h3 className="mb-3 text-sm font-semibold text-gray-900">Members</h3>
                    <ProjectMemberManager
                      members={selectedProject.members || []}
                      candidates={employeeCandidates}
                      adding={memberAdding || membersLoading}
                      removing={memberRemoving}
                      onAddMembers={handleAddMembers}
                      onRemoveMember={handleRemoveMember}
                    />
                  </div>

                  <div>
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-gray-900">Kanban Board</h3>
                      <span className="text-xs text-gray-500">Drag and drop or use status selector</span>
                    </div>
                    <ProjectKanbanBoard
                      tasks={tasks}
                      loading={tasksLoading}
                      canUpdateStatus={projectWritable && !taskStatusUpdating}
                      onMoveTask={handleMoveTask}
                      onOpenTask={loadTaskDetail}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <ProjectFormModal
        open={projectFormOpen}
        onOpenChange={setProjectFormOpen}
        loading={projectFormLoading}
        mode={projectFormMode}
        initialValues={projectFormMode === 'edit' ? projectFormInitialValues : undefined}
        onSubmit={handleProjectFormSubmit}
      />

      <ProjectTaskFormModal
        open={taskFormOpen}
        onOpenChange={setTaskFormOpen}
        loading={taskFormLoading}
        mode="create"
        assignees={taskAssigneeOptions}
        onSubmit={handleCreateTask}
      />

      <ProjectTaskDetailModal
        open={taskDetailOpen}
        onOpenChange={setTaskDetailOpen}
        task={selectedTask}
        comments={taskComments}
        loading={taskDetailLoading}
        loadingComments={taskCommentsLoading}
        submittingComment={taskCommentSaving}
        updatingStatus={taskStatusUpdating}
        canUpdateStatus={!!projectWritable}
        onUpdateStatus={handleTaskStatusFromModal}
        onAddComment={handleAddTaskComment}
      />
    </DashboardLayout>
  );
}
