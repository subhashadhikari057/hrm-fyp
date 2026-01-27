'use client';

import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../../../../components/DashboardLayout';
import { PageHeader } from '../../../../components/PageHeader';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { noticesApi, type Notice, type NoticePriority, type NoticeStatus, type NoticeAudienceType } from '../../../../lib/api/notices';
import { departmentApi, type Department } from '../../../../lib/api/department';
import { designationApi, type Designation } from '../../../../lib/api/designation';
import { workShiftApi, type WorkShift } from '../../../../lib/api/workshift';
import { employeeApi, type Employee } from '../../../../lib/api/employee';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../../../components/ui/dialog';
import toast from 'react-hot-toast';

const PRIORITY_BADGE: Record<string, string> = {
  HIGH: 'bg-red-100 text-red-700',
  NORMAL: 'bg-blue-100 text-blue-700',
  LOW: 'bg-gray-100 text-gray-700',
};

const STATUS_BADGE: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  PUBLISHED: 'bg-emerald-100 text-emerald-700',
  ARCHIVED: 'bg-amber-100 text-amber-700',
};

const formatDate = (value?: string | null) => {
  if (!value) return '-';
  return new Date(value).toLocaleString('en-GB', {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

const dateToIsoStart = (val?: string) => {
  if (!val) return undefined;
  // Interpret as local date, start of day
  const d = new Date(`${val}T00:00:00`);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
};

function Badge({ text, className }: { text: string; className: string }) {
  return <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${className}`}>{text}</span>;
}

type AudienceEntry = {
  type: NoticeAudienceType;
  id: string;
  label: string;
};

export default function CompanyAdminNoticesPage() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(5);
  const [form, setForm] = useState({
    title: '',
    body: '',
    status: 'PUBLISHED' as NoticeStatus,
    priority: 'NORMAL' as NoticePriority,
    publishAt: '',
    expiresAt: '',
    isCompanyWide: true,
  });
  const [submitting, setSubmitting] = useState(false);

  const [audiences, setAudiences] = useState<AudienceEntry[]>([]);
  const [audienceType, setAudienceType] = useState<NoticeAudienceType>('DEPARTMENT');
  const [audienceId, setAudienceId] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [workShifts, setWorkShifts] = useState<WorkShift[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await noticesApi.listAdmin({ search: search || undefined, page, limit, sortBy: 'createdAt', sortOrder: 'desc' as any });
      setNotices(res.data || []);
      setTotalPages(res.meta?.totalPages || 1);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to load notices');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await noticesApi.removeAdmin(id);
      toast.success('Notice deleted');
      load();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete');
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, page]);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [deps, desigs, shifts, emps] = await Promise.all([
          departmentApi.getDepartments({ page: 1, limit: 100 }).catch(() => ({ data: [] })),
          designationApi.getDesignations({ page: 1, limit: 100 }).catch(() => ({ data: [] })),
          workShiftApi.getWorkShifts({ page: 1, limit: 100 }).catch(() => ({ data: [] })),
          employeeApi.getEmployees({ page: 1, limit: 100 }).catch(() => ({ data: [] })),
        ]);
        setDepartments(deps.data || []);
        setDesignations(desigs.data || []);
        setWorkShifts(shifts.data || []);
        setEmployees(emps.data || []);
      } catch {
        // ignore
      }
    };
    fetchOptions();
  }, []);

  const filtered = useMemo(() => notices, [notices]);

  const audienceOptions = useMemo(() => {
    switch (audienceType) {
      case 'DEPARTMENT':
        return departments.map((d) => ({ value: d.id, label: `${d.name}${d.code ? ` (${d.code})` : ''}` }));
      case 'DESIGNATION':
        return designations.map((d) => ({ value: d.id, label: `${d.name}${d.code ? ` (${d.code})` : ''}` }));
      case 'WORK_SHIFT':
        return workShifts.map((w) => ({ value: w.id, label: `${w.name}${w.code ? ` (${w.code})` : ''}` }));
      case 'EMPLOYEE':
        return employees.map((e) => ({
          value: e.id,
          label: `${e.firstName} ${e.lastName}${e.employeeCode ? ` (${e.employeeCode})` : ''}`,
        }));
      case 'ROLE':
        return [
          { value: 'employee', label: 'Employee' },
          { value: 'manager', label: 'Manager' },
          { value: 'hr_manager', label: 'HR Manager' },
          { value: 'company_admin', label: 'Company Admin' },
        ];
      default:
        return [];
    }
  }, [audienceType, departments, designations, workShifts, employees]);

  const handleAddAudience = () => {
    if (!audienceId) {
      toast.error('Select a target');
      return;
    }
    const label = audienceOptions.find((o) => o.value === audienceId)?.label || audienceId;
    const key = `${audienceType}-${audienceId}`;
    if (audiences.find((a) => `${a.type}-${a.id}` === key)) {
      toast.error('Already added');
      return;
    }
    setAudiences((prev) => [...prev, { type: audienceType, id: audienceId, label }]);
    setAudienceId('');
  };

  const removeAudience = (key: string) => {
    setAudiences((prev) => prev.filter((a) => `${a.type}-${a.id}` !== key));
  };

  const handleCreate = async () => {
    if (!form.title.trim() || !form.body.trim()) {
      toast.error('Title and body are required');
      return;
    }

    const payload: any = {
      title: form.title.trim(),
      body: form.body.trim(),
      status: form.status,
      priority: form.priority,
      isCompanyWide: form.isCompanyWide,
      publishAt: dateToIsoStart(form.publishAt),
      expiresAt: dateToIsoStart(form.expiresAt),
    };

    if (!form.isCompanyWide) {
      payload.audiences = audiences.map((a) => {
        if (a.type === 'ROLE') return { type: a.type, role: a.id };
        if (a.type === 'DEPARTMENT') return { type: a.type, departmentId: a.id };
        if (a.type === 'DESIGNATION') return { type: a.type, designationId: a.id };
        if (a.type === 'WORK_SHIFT') return { type: a.type, workShiftId: a.id };
        if (a.type === 'EMPLOYEE') return { type: a.type, employeeId: a.id };
        return { type: a.type };
      });
      if (!payload.audiences || payload.audiences.length === 0) {
        toast.error('Add at least one audience or mark as company-wide');
        return;
      }
    }

    setSubmitting(true);
    try {
      await noticesApi.createAdmin(payload);
      toast.success('Notice created');
      setForm((prev) => ({ ...prev, title: '', body: '', publishAt: '', expiresAt: '' }));
      setAudiences([]);
      load();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to create');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Notices"
          description="Create and manage company notices."
        />

        <Card>
          <CardHeader>
            <CardTitle>Create Notice</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Title</label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Announcement title"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Priority</label>
                <select
                  className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={form.priority}
                  onChange={(e) => setForm((prev) => ({ ...prev, priority: e.target.value as NoticePriority }))}
                >
                  <option value="HIGH">High</option>
                  <option value="NORMAL">Normal</option>
                  <option value="LOW">Low</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Body</label>
              <textarea
                rows={4}
                value={form.body}
                onChange={(e) => setForm((prev) => ({ ...prev, body: e.target.value }))}
                placeholder="Write the notice content"
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Status</label>
                <select
                  className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={form.status}
                  onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value as NoticeStatus }))}
                >
                  <option value="DRAFT">Draft</option>
                  <option value="PUBLISHED">Published</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Publish Date</label>
                <Input
                  type="date"
                  value={form.publishAt}
                  onChange={(e) => setForm((prev) => ({ ...prev, publishAt: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Expires Date</label>
                <Input
                  type="date"
                  value={form.expiresAt}
                  onChange={(e) => setForm((prev) => ({ ...prev, expiresAt: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input
                id="isCompanyWide"
                type="checkbox"
                checked={form.isCompanyWide}
                onChange={(e) => setForm((prev) => ({ ...prev, isCompanyWide: e.target.checked }))}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="isCompanyWide" className="text-sm text-gray-700">
                Company-wide notice (uncheck to target audiences)
              </label>
            </div>

            {!form.isCompanyWide && (
              <div className="space-y-3 rounded-md border border-gray-200 p-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Audience Type</label>
                    <select
                      className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      value={audienceType}
                      onChange={(e) => {
                        setAudienceType(e.target.value as NoticeAudienceType);
                        setAudienceId('');
                      }}
                    >
                      <option value="DEPARTMENT">Department</option>
                      <option value="DESIGNATION">Designation</option>
                      <option value="WORK_SHIFT">Work Shift</option>
                      <option value="EMPLOYEE">Employee</option>
                      <option value="ROLE">Role</option>
                    </select>
                  </div>

                  <div className="space-y-1 md:col-span-2">
                    <label className="text-sm font-medium text-gray-700">Target</label>
                    <select
                      className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      value={audienceId}
                      onChange={(e) => setAudienceId(e.target.value)}
                    >
                      <option value="">Select...</option>
                      {audienceOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button variant="blue" size="sm" type="button" onClick={handleAddAudience}>
                    Add Audience
                  </Button>
                </div>

                {audiences.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {audiences.map((a) => {
                      const key = `${a.type}-${a.id}`;
                      return (
                        <span
                          key={key}
                          className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-800"
                        >
                          {a.type}: {a.label}
                          <button
                            type="button"
                            className="text-blue-500 hover:text-blue-700"
                            onClick={() => removeAudience(key)}
                            aria-label="Remove audience"
                          >
                            ×
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end">
              <Button variant="blue" onClick={handleCreate} disabled={submitting}>
                {submitting ? 'Saving...' : 'Publish Notice'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Existing Notices</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Search notices"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            {loading && <div className="text-sm text-gray-600">Loading notices...</div>}
            {!loading && filtered.length === 0 && (
              <div className="rounded-md border border-dashed border-gray-300 px-4 py-6 text-center text-sm text-gray-600">
                No notices yet.
              </div>
            )}

            <div className="grid gap-3">
              {!loading && filtered.map((notice) => (
                <Card key={notice.id} className="border border-gray-200 bg-white/70">
                  <CardHeader className="space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge text={notice.status} className={STATUS_BADGE[notice.status] || 'bg-gray-100 text-gray-700'} />
                          <Badge text={notice.priority} className={PRIORITY_BADGE[notice.priority] || 'bg-gray-100 text-gray-700'} />
                          <span className="text-xs text-gray-600">Company‑wide: {notice.isCompanyWide ? 'Yes' : 'No'}</span>
                        </div>
                        <CardTitle className="text-xl leading-tight text-gray-900">{notice.title}</CardTitle>
                        <p className="text-sm text-gray-700 whitespace-pre-line">{notice.body}</p>
                      </div>
                      <Dialog open={confirmDeleteId === notice.id} onOpenChange={(open) => setConfirmDeleteId(open ? notice.id : null)}>
                        <DialogTrigger asChild>
                          <Button variant="red" size="sm">Delete</Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                          <DialogHeader>
                            <DialogTitle>Delete this notice?</DialogTitle>
                          </DialogHeader>
                          <p className="text-sm text-gray-600">
                            This action cannot be undone. Are you sure you want to delete “{notice.title}”?
                          </p>
                          <DialogFooter className="mt-4 flex justify-end gap-2">
                            <Button variant="gray" size="sm" onClick={() => setConfirmDeleteId(null)}>Cancel</Button>
                            <Button
                              variant="red"
                              size="sm"
                              disabled={deletingId === notice.id}
                              onClick={() => handleDelete(notice.id)}
                            >
                              {deletingId === notice.id ? 'Deleting...' : 'Confirm Delete'}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                    <div className="flex flex-wrap gap-6 text-xs text-gray-700">
                      <div><span className="font-semibold text-gray-800">Publish:</span> {formatDate(notice.publishAt)}</div>
                      <div><span className="font-semibold text-gray-800">Expires:</span> {formatDate(notice.expiresAt)}</div>
                      <div><span className="font-semibold text-gray-800">Reads:</span> {notice._count?.reads ?? 0}</div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>

            {!loading && totalPages > 1 && (
              <div className="flex items-center justify-between pt-2 text-sm text-gray-700">
                <span>
                  Page {page} of {totalPages}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="gray"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="blue"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
