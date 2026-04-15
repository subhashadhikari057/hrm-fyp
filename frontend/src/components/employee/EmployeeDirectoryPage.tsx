'use client';

import { useEffect, useMemo, useState } from 'react';
import { BriefcaseBusiness, Building2, Mail, Phone, Search, UsersRound } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import { PageHeader } from '../../components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import {
  employeeApi,
  type EmployeeDirectoryEntry,
  type EmployeeDirectoryOption,
} from '../../lib/api/employee';
import { API_BASE_URL } from '../../lib/api/types';

const PAGE_SIZE = 12;

function resolveImageUrl(imageUrl: string | null) {
  if (!imageUrl) return null;
  if (imageUrl.startsWith('http')) return imageUrl;
  if (imageUrl.startsWith('/uploads')) return `${API_BASE_URL}${imageUrl}`;
  if (imageUrl.startsWith('uploads/')) return `${API_BASE_URL}/${imageUrl}`;
  return `${API_BASE_URL}/uploads/${imageUrl.replace(/^\//, '')}`;
}

function formatEmploymentType(value: EmployeeDirectoryEntry['employmentType']) {
  if (!value) return 'Not set';
  return value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function formatStatus(status: EmployeeDirectoryEntry['status']) {
  return status === 'on_leave' ? 'On Leave' : 'Active';
}

export default function EmployeeDirectoryPage() {
  const [employees, setEmployees] = useState<EmployeeDirectoryEntry[]>([]);
  const [departments, setDepartments] = useState<EmployeeDirectoryOption[]>([]);
  const [designations, setDesignations] = useState<EmployeeDirectoryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterLoading, setFilterLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [designationId, setDesignationId] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({
    total: 0,
    page: 1,
    limit: PAGE_SIZE,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);

    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    const loadFilters = async () => {
      try {
        setFilterLoading(true);
        const response = await employeeApi.getDirectoryMeta();
        setDepartments(response.data.departments || []);
        setDesignations(response.data.designations || []);
      } catch (loadError) {
        console.error('Failed to load employee directory filters:', loadError);
      } finally {
        setFilterLoading(false);
      }
    };

    void loadFilters();
  }, []);

  useEffect(() => {
    const loadDirectory = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await employeeApi.getDirectory({
          search: search || undefined,
          departmentId: departmentId || undefined,
          designationId: designationId || undefined,
          page,
          limit: PAGE_SIZE,
          sortBy: 'firstName',
          sortOrder: 'asc',
        });
        setEmployees(response.data || []);
        if (response.meta) {
          setMeta(response.meta);
        }
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Failed to load employee directory');
      } finally {
        setLoading(false);
      }
    };

    void loadDirectory();
  }, [search, departmentId, designationId, page]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (search) count += 1;
    if (departmentId) count += 1;
    if (designationId) count += 1;
    return count;
  }, [search, departmentId, designationId]);

  const clearFilters = () => {
    setSearchInput('');
    setSearch('');
    setDepartmentId('');
    setDesignationId('');
    setPage(1);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Employee Directory"
          description="Browse coworkers from your company with only basic directory information."
        />

        <Card>
          <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-base">Directory Filters</CardTitle>
              <p className="text-sm text-gray-500">
                This view stays company-scoped and intentionally hides salary and other sensitive HR details.
              </p>
            </div>
            {activeFiltersCount > 0 ? (
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            ) : null}
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search by name or code"
                className="pl-9"
              />
            </div>

            <select
              value={departmentId}
              onChange={(event) => {
                setDepartmentId(event.target.value);
                setPage(1);
              }}
              disabled={filterLoading}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">All departments</option>
              {departments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </select>

            <select
              value={designationId}
              onChange={(event) => {
                setDesignationId(event.target.value);
                setPage(1);
              }}
              disabled={filterLoading}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">All designations</option>
              {designations.map((designation) => (
                <option key={designation.id} value={designation.id}>
                  {designation.name}
                </option>
              ))}
            </select>
          </CardContent>
        </Card>

        <Card className="gap-3">
          <CardContent className="flex items-center justify-between pt-6">
            <div>
              <p className="text-sm text-gray-500">Visible employees</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900">{meta.total}</p>
            </div>
            <div className="rounded-full bg-blue-100 p-3 text-blue-700">
              <UsersRound className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {error ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-red-600">{error}</p>
            </CardContent>
          </Card>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {loading
            ? Array.from({ length: 6 }).map((_, index) => (
                <Card key={index} className="overflow-hidden">
                  <CardContent className="space-y-4 pt-6">
                    <div className="h-12 w-12 animate-pulse rounded-full bg-slate-200" />
                    <div className="space-y-2">
                      <div className="h-4 animate-pulse rounded bg-slate-200" />
                      <div className="h-4 w-2/3 animate-pulse rounded bg-slate-200" />
                    </div>
                  </CardContent>
                </Card>
              ))
            : employees.map((employee) => {
                const imageUrl = resolveImageUrl(employee.imageUrl);
                const fullName = [employee.firstName, employee.middleName, employee.lastName]
                  .filter(Boolean)
                  .join(' ');

                return (
                  <Card key={employee.id} className="overflow-hidden">
                    <CardContent className="space-y-4 pt-6">
                        <div className="flex items-start gap-4">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={fullName}
                            className="h-14 w-14 rounded-full border border-slate-200 object-cover"
                          />
                        ) : (
                          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-lg font-semibold text-slate-700">
                            {employee.firstName.charAt(0)}
                            {employee.lastName.charAt(0)}
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-semibold text-slate-900">{fullName}</h3>
                            <span
                              className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                                employee.status === 'on_leave'
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-emerald-100 text-emerald-700'
                              }`}
                            >
                              {formatStatus(employee.status)}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-slate-500">{employee.employeeCode}</p>
                          <p className="mt-2 text-sm font-medium text-slate-700">
                            {employee.designation?.name || 'Designation not assigned'}
                          </p>
                        </div>
                      </div>

                      <div className="grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
                        <div className="flex items-start gap-2">
                          <Building2 className="mt-0.5 h-4 w-4 text-slate-400" />
                          <div>
                            <p className="text-xs uppercase tracking-wide text-slate-400">Department</p>
                            <p>{employee.department?.name || 'Not assigned'}</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-2">
                          <BriefcaseBusiness className="mt-0.5 h-4 w-4 text-slate-400" />
                          <div>
                            <p className="text-xs uppercase tracking-wide text-slate-400">Employment</p>
                            <p>{formatEmploymentType(employee.employmentType)}</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-2">
                          <Mail className="mt-0.5 h-4 w-4 text-slate-400" />
                          <div>
                            <p className="text-xs uppercase tracking-wide text-slate-400">Work Email</p>
                            <p className="break-all">{employee.workEmail || 'Not available'}</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-2">
                          <Phone className="mt-0.5 h-4 w-4 text-slate-400" />
                          <div>
                            <p className="text-xs uppercase tracking-wide text-slate-400">Phone</p>
                            <p>{employee.phone || 'Not available'}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
        </div>

        {!loading && employees.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-sm text-slate-500">
              No employees matched the current directory filters.
            </CardContent>
          </Card>
        ) : null}

        {!loading && meta.totalPages > 1 ? (
          <Card>
            <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-500">
                Page {meta.page} of {meta.totalPages}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  disabled={!meta.hasPreviousPage}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  disabled={!meta.hasNextPage}
                  onClick={() => setPage((current) => current + 1)}
                >
                  Next
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </DashboardLayout>
  );
}
