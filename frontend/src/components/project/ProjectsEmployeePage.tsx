'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import DashboardLayout from '../DashboardLayout';
import { PageHeader } from '../PageHeader';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { employeeApi } from '../../lib/api/employee';
import {
  projectsApi,
  type ProjectRecord,
  type ProjectStatus,
  type ProjectTaskCommentRecord,
  type ProjectTaskRecord,
  type ProjectTaskStatus,
} from '../../lib/api/projects';
import { ProjectKanbanBoard } from './ProjectKanbanBoard';
import { ProjectTaskDetailModal } from './ProjectTaskDetailModal';

const PAGE_LIMIT = 10;
const MAX_API_LIMIT = 100;

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

export default function ProjectsEmployeePage() {
  const [currentEmployeeId, setCurrentEmployeeId] = useState<string | null>(null);

  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [projectsError, setProjectsError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'ALL'>('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [stats, setStats] = useState({ active: 0, completed: 0, archived: 0 });

  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<ProjectRecord | null>(null);

  const [tasks, setTasks] = useState<ProjectTaskRecord[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);

  const [taskStatusUpdating, setTaskStatusUpdating] = useState(false);

  const [taskDetailOpen, setTaskDetailOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<ProjectTaskRecord | null>(null);
  const [taskDetailLoading, setTaskDetailLoading] = useState(false);
  const [taskCommentsLoading, setTaskCommentsLoading] = useState(false);
  const [taskComments, setTaskComments] = useState<ProjectTaskCommentRecord[]>([]);
  const [taskCommentSaving, setTaskCommentSaving] = useState(false);

  const projectWritable = selectedProject?.status === 'ACTIVE';

  const canMoveTask = (task: ProjectTaskRecord) => {
    if (!projectWritable) return false;
    if (!currentEmployeeId) return false;
    return task.assigneeEmployeeId === currentEmployeeId;
  };

  const loadStats = async () => {
    try {
      const [activeRes, completedRes, archivedRes] = await Promise.all([
        projectsApi.listMyProjects({ status: 'ACTIVE', page: 1, limit: 1 }),
        projectsApi.listMyProjects({ status: 'COMPLETED', page: 1, limit: 1 }),
        projectsApi.listMyProjects({ status: 'ARCHIVED', page: 1, limit: 1 }),
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

  const loadMyProfile = async () => {
    try {
      const response = await employeeApi.getMyProfile();
      setCurrentEmployeeId(response.data.id);
    } catch {
      setCurrentEmployeeId(null);
    }
  };

  const loadProjectTasks = async (projectId: string) => {
    setTasksLoading(true);
    try {
      const response = await projectsApi.listMyProjectTasks(projectId, {
        page: 1,
        limit: MAX_API_LIMIT,
      });
      const taskList = response.data || [];
      setTasks(taskList);

      if (selectedTask && !taskList.some((task) => task.id === selectedTask.id)) {
        setTaskDetailOpen(false);
        setSelectedTask(null);
        setTaskComments([]);
      }
    } catch (error: any) {
      setTasks([]);
      toast.error(error?.message || 'Failed to load project tasks');
    } finally {
      setTasksLoading(false);
    }
  };

  const loadProjects = async () => {
    setProjectsLoading(true);
    setProjectsError(null);

    try {
      const response = await projectsApi.listMyProjects({
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
        const first = list[0];
        setSelectedProjectId(first.id);
        setSelectedProject(first);
        await loadProjectTasks(first.id);
        return;
      }

      const current = list.find((project) => project.id === selectedProjectId);
      if (current) {
        setSelectedProject(current);
      } else {
        const first = list[0];
        setSelectedProjectId(first.id);
        setSelectedProject(first);
        await loadProjectTasks(first.id);
      }
    } catch (error: any) {
      setProjectsError(error?.message || 'Failed to load my projects');
      setProjects([]);
      setTotalPages(1);
    } finally {
      setProjectsLoading(false);
    }
  };

  const loadTaskDetail = async (task: ProjectTaskRecord) => {
    setTaskDetailOpen(true);
    setTaskDetailLoading(true);
    setTaskCommentsLoading(true);

    try {
      const [taskRes, commentsRes] = await Promise.all([
        projectsApi.getMyTaskById(task.id),
        projectsApi.listMyTaskComments(task.id, { page: 1, limit: MAX_API_LIMIT }),
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
      const response = await projectsApi.listMyTaskComments(taskId, {
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
    loadStats();
    loadMyProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelectProject = async (project: ProjectRecord) => {
    setSelectedProjectId(project.id);
    setSelectedProject(project);
    await loadProjectTasks(project.id);
  };

  const handleMoveTask = async (task: ProjectTaskRecord, status: ProjectTaskStatus) => {
    if (!canMoveTask(task)) {
      toast.error('You can only update status for tasks assigned to you');
      return;
    }

    setTaskStatusUpdating(true);
    try {
      await projectsApi.updateMyTaskStatus(task.id, status);

      setTasks((prev) =>
        prev.map((item) => (item.id === task.id ? { ...item, status } : item)),
      );

      setSelectedTask((prev) => (prev && prev.id === task.id ? { ...prev, status } : prev));

      toast.success('Task status updated');
    } catch (error: any) {
      toast.error(error?.message || 'Failed to update task status');
      if (selectedProjectId) {
        await loadProjectTasks(selectedProjectId);
      }
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
      await projectsApi.addMyTaskComment(selectedTask.id, comment);
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="My Projects"
          description="View your projects, track tasks, and update status for tasks assigned to you."
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
              <CardTitle>My Project List</CardTitle>
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
                <p className="text-sm text-gray-600">No projects assigned yet.</p>
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
                              {project._count?.tasks || 0} tasks
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
                              onClick={() => handleSelectProject(project)}
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
            <CardHeader>
              {!selectedProject ? (
                <CardTitle>Project Tasks</CardTitle>
              ) : (
                <div className="space-y-1">
                  <CardTitle>{selectedProject.name}</CardTitle>
                  <p className="text-sm text-gray-600">
                    {selectedProject.description || 'No description available.'}
                  </p>
                  <p className="text-xs text-gray-500">
                    You can update status only for tasks assigned to you.
                  </p>
                </div>
              )}
            </CardHeader>

            <CardContent>
              {!selectedProject ? (
                <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center text-sm text-gray-600">
                  Select a project from the left panel to view tasks.
                </div>
              ) : (
                <ProjectKanbanBoard
                  tasks={tasks}
                  loading={tasksLoading}
                  canUpdateStatus={!taskStatusUpdating}
                  canMoveTask={canMoveTask}
                  onMoveTask={handleMoveTask}
                  onOpenTask={loadTaskDetail}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <ProjectTaskDetailModal
        open={taskDetailOpen}
        onOpenChange={setTaskDetailOpen}
        task={selectedTask}
        comments={taskComments}
        loading={taskDetailLoading}
        loadingComments={taskCommentsLoading}
        submittingComment={taskCommentSaving}
        updatingStatus={taskStatusUpdating}
        canUpdateStatus={!!(selectedTask && canMoveTask(selectedTask))}
        onUpdateStatus={handleTaskStatusFromModal}
        onAddComment={projectWritable ? handleAddTaskComment : undefined}
      />
    </DashboardLayout>
  );
}
