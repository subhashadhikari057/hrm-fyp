'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CalendarDays, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../DashboardLayout';
import { useBreadcrumbs } from '../AppBreadcrumbs';
import { PageHeader } from '../PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { employeeApi } from '../../lib/api/employee';
import {
  projectsApi,
  type ProjectRecord,
  type ProjectTaskCommentRecord,
  type ProjectTaskRecord,
  type ProjectTaskStatus,
} from '../../lib/api/projects';
import { ProjectKanbanBoard } from './ProjectKanbanBoard';
import { ProjectTaskDetailModal } from './ProjectTaskDetailModal';

const MAX_API_LIMIT = 100;

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function formatDate(value?: string | null) {
  return value ? new Date(value).toLocaleDateString('en-GB') : 'Not set';
}

interface ProjectEmployeeDetailPageProps {
  projectId: string;
  basePath: string;
}

export default function ProjectEmployeeDetailPage({
  projectId,
  basePath,
}: ProjectEmployeeDetailPageProps) {
  const [currentEmployeeId, setCurrentEmployeeId] = useState<string | null>(null);
  const [project, setProject] = useState<ProjectRecord | null>(null);
  const [projectLoading, setProjectLoading] = useState(false);
  const [projectError, setProjectError] = useState<string | null>(null);
  const [tasks, setTasks] = useState<ProjectTaskRecord[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [taskStatusUpdating, setTaskStatusUpdating] = useState(false);
  const [taskDetailOpen, setTaskDetailOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<ProjectTaskRecord | null>(null);
  const [taskDetailLoading, setTaskDetailLoading] = useState(false);
  const [taskCommentsLoading, setTaskCommentsLoading] = useState(false);
  const [taskComments, setTaskComments] = useState<ProjectTaskCommentRecord[]>([]);
  const [taskCommentSaving, setTaskCommentSaving] = useState(false);

  const projectWritable = project?.status === 'ACTIVE';

  useBreadcrumbs(
    project
      ? [
          { href: basePath.replace(/\/projects$/, ''), label: 'Dashboard' },
          { href: basePath, label: 'Projects' },
          { label: project.name },
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

  const canMoveTask = (task: ProjectTaskRecord) => {
    if (!projectWritable || !currentEmployeeId) return false;
    return task.assigneeEmployeeId === currentEmployeeId;
  };

  const loadMyProfile = async () => {
    try {
      const response = await employeeApi.getMyProfile();
      setCurrentEmployeeId(response.data.id);
    } catch {
      setCurrentEmployeeId(null);
    }
  };

  const loadProject = async () => {
    setProjectLoading(true);
    setProjectError(null);

    try {
      const [activeResponse, completedResponse] = await Promise.all([
        projectsApi.listMyProjects({ status: 'ACTIVE', page: 1, limit: MAX_API_LIMIT }),
        projectsApi.listMyProjects({ status: 'COMPLETED', page: 1, limit: MAX_API_LIMIT }),
      ]);

      const matched =
        [...(activeResponse.data || []), ...(completedResponse.data || [])].find(
          (item) => item.id === projectId,
        ) || null;
      setProject(matched);
      if (!matched) setProjectError('Project not found.');
    } catch (error: unknown) {
      setProject(null);
      setProjectError(getErrorMessage(error, 'Failed to load project'));
    } finally {
      setProjectLoading(false);
    }
  };

  const loadProjectTasks = async () => {
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
    } catch (error: unknown) {
      setTasks([]);
      toast.error(getErrorMessage(error, 'Failed to load project tasks'));
    } finally {
      setTasksLoading(false);
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
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Failed to load task details'));
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
      const response = await projectsApi.listMyTaskComments(taskId, { page: 1, limit: MAX_API_LIMIT });
      setTaskComments(response.data || []);
    } catch {
      setTaskComments([]);
    } finally {
      setTaskCommentsLoading(false);
    }
  };

  useEffect(() => {
    void loadMyProfile();
    void loadProject();
    void loadProjectTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const handleMoveTask = async (task: ProjectTaskRecord, status: ProjectTaskStatus) => {
    if (!canMoveTask(task)) {
      toast.error('You can only update status for tasks assigned to you');
      return;
    }

    setTaskStatusUpdating(true);
    try {
      await projectsApi.updateMyTaskStatus(task.id, status);
      setTasks((prev) => prev.map((item) => (item.id === task.id ? { ...item, status } : item)));
      setSelectedTask((prev) => (prev && prev.id === task.id ? { ...prev, status } : prev));
      toast.success('Task status updated');
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Failed to update task status'));
      await loadProjectTasks();
    } finally {
      setTaskStatusUpdating(false);
    }
  };

  const handleAddTaskComment = async (comment: string) => {
    if (!selectedTask) return;
    setTaskCommentSaving(true);
    try {
      await projectsApi.addMyTaskComment(selectedTask.id, comment);
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
          title={project?.name || 'Project Workspace'}
          description="Track tasks in a dedicated project page and update only work assigned to you."
          actions={
            <Link href={basePath} className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-900 hover:bg-slate-100">
              <ArrowLeft className="h-4 w-4" />
              Back to Projects
            </Link>
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
          <CardHeader>
            {!project ? (
              <CardTitle>Project Tasks</CardTitle>
            ) : (
              <div className="space-y-2">
                <CardTitle>{project.name}</CardTitle>
                <p className="text-sm text-gray-600">{project.description || 'No description available.'}</p>
                <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
                  <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1.5">
                    <CalendarDays className="h-3.5 w-3.5" />
                    End {formatDate(project.endDate)}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1.5">
                    <Lock className="h-3.5 w-3.5" />
                    You can update only assigned tasks
                  </span>
                </div>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {!project ? (
              <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-10 text-center text-sm text-gray-600">
                {projectLoading ? 'Loading project...' : 'Project not found.'}
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
        onUpdateStatus={(status) => (selectedTask ? handleMoveTask(selectedTask, status) : undefined)}
        onAddComment={projectWritable ? handleAddTaskComment : undefined}
      />
    </DashboardLayout>
  );
}
