'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, CalendarDays, MoreHorizontal, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../DashboardLayout';
import { useBreadcrumbs } from '../AppBreadcrumbs';
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
import { ProjectKanbanBoard } from './ProjectKanbanBoard';
import { type ProjectMemberCandidate } from './ProjectMemberManager';
import { ProjectMembersModal } from './ProjectMembersModal';
import { ProjectTaskDetailModal } from './ProjectTaskDetailModal';
import { ProjectTaskFormModal } from './ProjectTaskFormModal';
import { DeleteProjectModal } from './DeleteProjectModal';
import { useRouter } from 'next/navigation';

const MAX_API_LIMIT = 100;

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function toDateInput(value?: string | null): string {
  return value ? value.slice(0, 10) : '';
}

function formatDate(value?: string | null) {
  return value ? new Date(value).toLocaleDateString('en-GB') : 'Not set';
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

interface ProjectAdminDetailPageProps {
  projectId: string;
  basePath: string;
}

export default function ProjectAdminDetailPage({ projectId, basePath }: ProjectAdminDetailPageProps) {
  const router = useRouter();
  const [selectedProject, setSelectedProject] = useState<ProjectRecord | null>(null);
  const [projectDetailLoading, setProjectDetailLoading] = useState(false);
  const [projectError, setProjectError] = useState<string | null>(null);
  const [tasks, setTasks] = useState<ProjectTaskRecord[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [employeeCandidates, setEmployeeCandidates] = useState<ProjectMemberCandidate[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [projectFormOpen, setProjectFormOpen] = useState(false);
  const [projectFormLoading, setProjectFormLoading] = useState(false);
  const [taskFormOpen, setTaskFormOpen] = useState(false);
  const [taskFormLoading, setTaskFormLoading] = useState(false);
  const [memberAdding, setMemberAdding] = useState(false);
  const [memberRemoving, setMemberRemoving] = useState(false);
  const [membersModalOpen, setMembersModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [projectDeleting, setProjectDeleting] = useState(false);
  const [projectStatusUpdating, setProjectStatusUpdating] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [taskStatusUpdating, setTaskStatusUpdating] = useState(false);
  const [taskDetailOpen, setTaskDetailOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<ProjectTaskRecord | null>(null);
  const [taskDetailLoading, setTaskDetailLoading] = useState(false);
  const [taskCommentsLoading, setTaskCommentsLoading] = useState(false);
  const [taskComments, setTaskComments] = useState<ProjectTaskCommentRecord[]>([]);
  const [taskCommentSaving, setTaskCommentSaving] = useState(false);
  const actionsMenuRef = useRef<HTMLDivElement | null>(null);

  const projectWritable = selectedProject?.status === 'ACTIVE';

  useBreadcrumbs(
    selectedProject
      ? [
          { href: basePath.replace(/\/projects$/, ''), label: 'Dashboard' },
          { href: basePath, label: 'Projects' },
          { label: selectedProject.name },
        ]
      : null,
  );

  const taskStats = useMemo(
    () => ({
      todo: tasks.filter((task) => task.status === 'TODO').length,
      inProgress: tasks.filter((task) => task.status === 'IN_PROGRESS').length,
      review: tasks.filter((task) => task.status === 'REVIEW').length,
      done: tasks.filter((task) => task.status === 'DONE').length,
    }),
    [tasks],
  );

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

  const projectFormInitialValues = useMemo(() => {
    if (!selectedProject) return undefined;
    return {
      name: selectedProject.name,
      description: selectedProject.description || '',
      startDate: toDateInput(selectedProject.startDate),
      endDate: toDateInput(selectedProject.endDate),
    };
  }, [selectedProject]);

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

  const loadProjectDetail = async () => {
    setProjectDetailLoading(true);
    setTasksLoading(true);
    setProjectError(null);

    try {
      const projectRes = await projectsApi.getAdminProjectById(projectId);
      setSelectedProject(projectRes.data);

      try {
        const tasksRes = await projectsApi.listAdminTasks(projectId, { page: 1, limit: MAX_API_LIMIT });
        const taskList = tasksRes.data || [];
        setTasks(taskList);

        if (selectedTask && !taskList.some((task) => task.id === selectedTask.id)) {
          setTaskDetailOpen(false);
          setSelectedTask(null);
          setTaskComments([]);
        }
      } catch (error: unknown) {
        setTasks([]);
        toast.error(getErrorMessage(error, 'Failed to load project tasks'));
      }
    } catch (error: unknown) {
      setProjectError(getErrorMessage(error, 'Failed to load project'));
      setSelectedProject(null);
      setTasks([]);
    } finally {
      setProjectDetailLoading(false);
      setTasksLoading(false);
    }
  };

  const refreshTaskComments = async (taskId: string) => {
    setTaskCommentsLoading(true);
    try {
      const response = await projectsApi.listAdminTaskComments(taskId, { page: 1, limit: MAX_API_LIMIT });
      setTaskComments(response.data || []);
    } catch {
      setTaskComments([]);
    } finally {
      setTaskCommentsLoading(false);
    }
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
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Failed to load task details'));
      setSelectedTask(task);
      setTaskComments([]);
    } finally {
      setTaskDetailLoading(false);
      setTaskCommentsLoading(false);
    }
  };

  useEffect(() => {
    void loadProjectDetail();
    void loadEmployeeCandidates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  useEffect(() => {
    if (!actionsOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setActionsOpen(false);
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (actionsMenuRef.current && !actionsMenuRef.current.contains(event.target as Node)) {
        setActionsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [actionsOpen]);

  const handleProjectFormSubmit = async (payload: {
    name: string;
    description?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    setProjectFormLoading(true);
    try {
      await projectsApi.updateAdminProject(projectId, payload);
      toast.success('Project updated successfully');
      setProjectFormOpen(false);
      await loadProjectDetail();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Failed to save project'));
    } finally {
      setProjectFormLoading(false);
    }
  };

  const handleProjectStatusChange = async (status: ProjectStatus) => {
    if (!selectedProject || selectedProject.status === status) return;
    setProjectStatusUpdating(true);
    try {
      await projectsApi.updateAdminProjectStatus(projectId, status);
      toast.success(`Project moved to ${status}`);
      await loadProjectDetail();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Failed to update project status'));
    } finally {
      setProjectStatusUpdating(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!selectedProject) return;

    setProjectDeleting(true);
    try {
      await projectsApi.deleteAdminProject(projectId);
      toast.success('Project deleted successfully');
      setDeleteModalOpen(false);
      router.push(basePath);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Failed to delete project'));
    } finally {
      setProjectDeleting(false);
    }
  };

  const closeActions = () => setActionsOpen(false);

  const handleAddMembers = async (employeeIds: string[]) => {
    setMemberAdding(true);
    try {
      const response = await projectsApi.addAdminProjectMembers(projectId, employeeIds);
      const added = response.data?.addedCount || 0;
      if (added > 0) toast.success(`Added ${added} member${added > 1 ? 's' : ''}`);
      else toast('Selected member is already in this project');
      await loadProjectDetail();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Failed to add member'));
    } finally {
      setMemberAdding(false);
    }
  };

  const handleRemoveMember = async (employeeId: string) => {
    setMemberRemoving(true);
    try {
      await projectsApi.removeAdminProjectMember(projectId, employeeId);
      toast.success('Member removed from project');
      await loadProjectDetail();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Failed to remove member'));
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
    setTaskFormLoading(true);
    try {
      await projectsApi.createAdminTask(projectId, payload);
      toast.success('Task created successfully');
      setTaskFormOpen(false);
      await loadProjectDetail();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Failed to create task'));
    } finally {
      setTaskFormLoading(false);
    }
  };

  const handleMoveTask = async (task: ProjectTaskRecord, status: ProjectTaskStatus) => {
    setTaskStatusUpdating(true);
    try {
      await projectsApi.updateAdminTaskStatus(task.id, status);
      setTasks((prev) => prev.map((item) => (item.id === task.id ? { ...item, status } : item)));
      setSelectedTask((prev) => (prev && prev.id === task.id ? { ...prev, status } : prev));
      toast.success('Task status updated');
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Failed to update task status'));
      await loadProjectDetail();
    } finally {
      setTaskStatusUpdating(false);
    }
  };

  const handleAddTaskComment = async (comment: string) => {
    if (!selectedTask) return;
    setTaskCommentSaving(true);
    try {
      await projectsApi.addAdminTaskComment(selectedTask.id, comment);
      toast.success('Comment added');
      await refreshTaskComments(selectedTask.id);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Failed to add comment'));
    } finally {
      setTaskCommentSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title={selectedProject?.name || 'Project Workspace'}
          description="Work inside a dedicated project page with task stats, members, and the Kanban board."
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <Link href={basePath} className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-900 hover:bg-slate-100">
                <ArrowLeft className="h-4 w-4" />
                Back to Projects
              </Link>
              <Button variant="blue" disabled={!projectWritable} onClick={() => setTaskFormOpen(true)}>
                <Plus className="h-4 w-4" />
                New Task
              </Button>
              <div className="relative" ref={actionsMenuRef}>
                <Button
                  variant="outline"
                  disabled={!selectedProject}
                  onClick={() => setActionsOpen((prev) => !prev)}
                  className="hover:bg-slate-100 hover:text-slate-900"
                >
                  <MoreHorizontal className="h-4 w-4" />
                  Actions
                </Button>

                {actionsOpen && selectedProject ? (
                  <div className="absolute right-0 z-20 mt-2 w-52 rounded-xl border border-slate-200 bg-white p-1.5 shadow-[0_16px_40px_-18px_rgba(15,23,42,0.28)]">
                    <button
                      type="button"
                      onClick={() => {
                        setProjectFormOpen(true);
                        closeActions();
                      }}
                      className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-blue-50 hover:text-blue-700"
                    >
                      Edit Project
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMembersModalOpen(true);
                        closeActions();
                      }}
                      className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-blue-50 hover:text-blue-700"
                    >
                      Manage Members
                    </button>
                    <button
                      type="button"
                      disabled={selectedProject.status !== 'ARCHIVED'}
                      onClick={() => {
                        setDeleteModalOpen(true);
                        closeActions();
                      }}
                      className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-red-600 transition-colors hover:bg-rose-50 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Delete Project
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          }
        />

        {projectError ? (
          <Card>
            <CardContent className="pt-6 text-sm text-red-600">{projectError}</CardContent>
          </Card>
        ) : null}

        <Card>
          <CardContent className="grid grid-cols-1 gap-4 pt-6 md:grid-cols-4">
            <div className="rounded-lg border border-slate-300 bg-slate-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-700">To Do</p>
              <p className="mt-1 text-2xl font-semibold text-slate-800">{taskStats.todo}</p>
            </div>
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-blue-700">In Progress</p>
              <p className="mt-1 text-2xl font-semibold text-blue-800">{taskStats.inProgress}</p>
            </div>
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-amber-700">Review</p>
              <p className="mt-1 text-2xl font-semibold text-amber-800">{taskStats.review}</p>
            </div>
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">Done</p>
              <p className="mt-1 text-2xl font-semibold text-emerald-800">{taskStats.done}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            {!selectedProject ? (
              <CardTitle>Project Overview</CardTitle>
            ) : (
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                  <CardTitle>{selectedProject.name}</CardTitle>
                  <p className="mt-1 line-clamp-2 text-sm text-gray-600">
                    {selectedProject.description || 'No description available.'}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-600">
                    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1.5">
                      <CalendarDays className="h-3.5 w-3.5" />
                      Start {formatDate(selectedProject.startDate)}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1.5">
                      <CalendarDays className="h-3.5 w-3.5" />
                      End {formatDate(selectedProject.endDate)}
                    </span>
                    <span className={`inline-flex rounded-full border px-3 py-1.5 font-medium ${projectStatusBadgeClass(selectedProject.status)}`}>
                      {selectedProject.status}
                    </span>
                    <span className="inline-flex rounded-full border border-gray-200 bg-white px-3 py-1.5 font-medium text-gray-700">
                      {selectedProject.members?.length || 0} member{(selectedProject.members?.length || 0) === 1 ? '' : 's'}
                    </span>
                  </div>
                </div>

                <div className="w-full lg:w-auto lg:min-w-52">
                  <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-gray-500">
                    Project Status
                  </label>
                  <select
                    className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={selectedProject.status}
                    disabled={projectStatusUpdating}
                    onChange={(e) => handleProjectStatusChange(e.target.value as ProjectStatus)}
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="COMPLETED">COMPLETED</option>
                    <option value="ARCHIVED">ARCHIVED</option>
                  </select>
                </div>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {!selectedProject ? (
              <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-10 text-center text-sm text-gray-600">
                {projectDetailLoading ? 'Loading project...' : 'Project not found.'}
              </div>
            ) : (
              <div className="space-y-5">
                <div>
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h3 className="text-sm font-semibold text-gray-900">Members</h3>
                  </div>
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

      <ProjectFormModal
        open={projectFormOpen}
        onOpenChange={setProjectFormOpen}
        loading={projectFormLoading}
        mode="edit"
        initialValues={projectFormInitialValues}
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

      <ProjectMembersModal
        open={membersModalOpen}
        onOpenChange={setMembersModalOpen}
        members={selectedProject?.members || []}
        candidates={employeeCandidates}
        adding={memberAdding || membersLoading}
        removing={memberRemoving}
        onAddMembers={handleAddMembers}
        onRemoveMember={handleRemoveMember}
      />

      <DeleteProjectModal
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        projectName={selectedProject?.name || ''}
        loading={projectDeleting}
        onConfirm={handleDeleteProject}
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
        onUpdateStatus={(status) => (selectedTask ? handleMoveTask(selectedTask, status) : undefined)}
        onAddComment={handleAddTaskComment}
      />
    </DashboardLayout>
  );
}
