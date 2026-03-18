'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Lock } from 'lucide-react';
import DashboardLayout from '../DashboardLayout';
import { PageHeader } from '../PageHeader';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { projectsApi, type ProjectRecord, type ProjectStatus } from '../../lib/api/projects';

const PAGE_LIMIT = 12;
const EMPLOYEE_MAX_PROJECTS = 100;

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function statusBadgeClass(status: ProjectStatus): string {
  switch (status) {
    case 'COMPLETED':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700';
    case 'ARCHIVED':
      return 'border-gray-300 bg-gray-100 text-gray-700';
    default:
      return 'border-blue-200 bg-blue-50 text-blue-700';
  }
}

function formatDate(value?: string | null) {
  return value ? new Date(value).toLocaleDateString('en-GB') : 'Not set';
}

function getCompletedTasks(project: ProjectRecord) {
  return project.taskSummary?.DONE || 0;
}

function getOngoingTasks(project: ProjectRecord) {
  return (project.taskSummary?.TODO || 0) + (project.taskSummary?.IN_PROGRESS || 0) + (project.taskSummary?.REVIEW || 0);
}

interface ProjectsEmployeePageProps {
  detailBasePath?: string;
}

export default function ProjectsEmployeePage({
  detailBasePath = '/dashboard/employee/projects',
}: ProjectsEmployeePageProps) {
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [projectsError, setProjectsError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'ALL'>('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({ active: 0, completed: 0, archived: 0 });

  const loadProjectStats = async () => {
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

  const loadProjects = async () => {
    setProjectsLoading(true);
    setProjectsError(null);

    try {
      if (statusFilter === 'ALL') {
        const [activeResponse, completedResponse] = await Promise.all([
          projectsApi.listMyProjects({ status: 'ACTIVE', page: 1, limit: EMPLOYEE_MAX_PROJECTS }),
          projectsApi.listMyProjects({ status: 'COMPLETED', page: 1, limit: EMPLOYEE_MAX_PROJECTS }),
        ]);

        const combinedProjects = [...(activeResponse.data || []), ...(completedResponse.data || [])].sort(
          (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
        );

        const totalVisibleProjects = combinedProjects.length;
        const computedTotalPages = Math.max(1, Math.ceil(totalVisibleProjects / PAGE_LIMIT));
        const startIndex = (page - 1) * PAGE_LIMIT;

        setProjects(combinedProjects.slice(startIndex, startIndex + PAGE_LIMIT));
        setTotalPages(computedTotalPages);
        return;
      }

      const response = await projectsApi.listMyProjects({
        status: statusFilter,
        page,
        limit: PAGE_LIMIT,
      });

      setProjects(response.data || []);
      setTotalPages(response.meta?.totalPages || 1);
    } catch (error: unknown) {
      setProjectsError(getErrorMessage(error, 'Failed to load my projects'));
      setProjects([]);
      setTotalPages(1);
    } finally {
      setProjectsLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, page]);

  useEffect(() => {
    void loadProjectStats();
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="My Projects"
          description="Open a project workspace to view the board, task stats, and your assigned work."
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

        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <CardTitle>Project List</CardTitle>
            <div className="flex flex-col gap-2 sm:items-end">
              <select
                className="h-10 min-w-52 rounded-md border border-gray-300 bg-white px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as ProjectStatus | 'ALL');
                  setPage(1);
                }}
              >
                <option value="ALL">All visible</option>
                <option value="ACTIVE">Active</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>
          </CardHeader>
          <CardContent>
            {projectsError ? <p className="text-sm text-red-600">{projectsError}</p> : null}

            {projectsLoading ? (
              <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-8 text-sm text-gray-600">
                Loading projects...
              </div>
            ) : projects.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-sm text-gray-600">
                No projects assigned yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                {projects.map((project) => (
                  <Link
                    key={project.id}
                    href={`${detailBasePath}/${project.id}`}
                    className="block rounded-xl border border-gray-200 bg-white p-5 transition-colors hover:border-blue-300 hover:bg-blue-50/30"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-base font-semibold text-gray-900">{project.name}</h3>
                        <p className="mt-1 line-clamp-2 text-sm text-gray-600">
                          {project.description || 'No description available.'}
                        </p>
                      </div>
                      <span
                        className={`inline-flex rounded-md border px-2 py-1 text-[11px] font-medium ${statusBadgeClass(project.status)}`}
                      >
                        {project.status}
                      </span>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2 text-xs text-gray-600">
                      <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1">
                        <Lock className="h-3.5 w-3.5" />
                        Assigned tasks only
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700">
                        {getCompletedTasks(project)} completed
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-amber-700">
                        {getOngoingTasks(project)} ongoing
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {formatDate(project.endDate)}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            <div className="mt-6 flex items-center justify-between gap-3 border-t border-gray-100 pt-4 text-sm text-gray-600">
              <span className="whitespace-nowrap">Projects page {page} of {totalPages}</span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((prev) => prev + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
