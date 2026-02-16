'use client';

import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../../../../components/DashboardLayout';
import { PageHeader } from '../../../../components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import EmployeeLeaveRequestModal from '../../../../components/EmployeeLeaveRequestModal';
import { useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { leaveApi, type HalfDaySession, type LeaveRequest, type LeaveStatsItem, type LeaveStatus, type LeaveType } from '../../../../lib/api/leave';

const STATUS_BADGES: Record<LeaveStatus, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  APPROVED: 'bg-emerald-100 text-emerald-700',
  REJECTED: 'bg-rose-100 text-rose-700',
  CANCELLED: 'bg-gray-100 text-gray-700',
};

const toKtmIsoDate = (dateStr: string) => {
  if (!dateStr) return '';
  return new Date(`${dateStr}T00:00:00+05:45`).toISOString();
};

const getTodayKtmDateInput = () =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kathmandu',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());

const formatDate = (value?: string | null) => {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    timeZone: 'Asia/Kathmandu',
  });
};

function StatusBadge({ status }: { status: LeaveStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${STATUS_BADGES[status] || ''}`}>
      {status}
    </span>
  );
}

export default function EmployeeLeavePage() {
  const searchParams = useSearchParams();
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [leaveStats, setLeaveStats] = useState<LeaveStatsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<LeaveStatus | 'ALL'>('ALL');
  const [leaveTypeFilter, setLeaveTypeFilter] = useState<string>('');
  const [addRequestModalOpen, setAddRequestModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  const [formTypeId, setFormTypeId] = useState('');
  const [formStartDate, setFormStartDate] = useState(() => getTodayKtmDateInput());
  const [formEndDate, setFormEndDate] = useState(() => getTodayKtmDateInput());
  const [formReason, setFormReason] = useState('');
  const [formIsHalfDay, setFormIsHalfDay] = useState(false);
  const [formHalfDaySession, setFormHalfDaySession] = useState<HalfDaySession>('FIRST_HALF');

  const filtered = useMemo(() => {
    if (statusFilter === 'ALL') return requests;
    return requests.filter((r) => r.status === statusFilter);
  }, [requests, statusFilter]);

  const loadRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await leaveApi.listMy({
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        leaveTypeId: leaveTypeFilter || undefined,
        page,
        limit,
      });
      setRequests(res.data || []);
      setTotalPages(res.meta?.totalPages || 1);
    } catch (err: any) {
      setError(err?.message || 'Failed to load leave requests');
    } finally {
      setLoading(false);
    }
  };

  const loadLeaveTypes = async () => {
    try {
      const res = await leaveApi.getLeaveTypes({ isActive: true, page: 1, limit: 100 });
      setLeaveTypes(res.data || []);
      if (!formTypeId && res.data?.length) {
        setFormTypeId(res.data[0].id);
      }
    } catch (err: any) {
      setLeaveTypes([]);
      setFormTypeId('');
      setError(err?.message || 'Failed to load leave types');
    }
  };

  const loadLeaveStats = async () => {
    try {
      const res = await leaveApi.getMyStats();
      setLeaveStats(res.data || []);
    } catch {
      setLeaveStats([]);
    }
  };

  useEffect(() => {
    loadLeaveTypes();
    loadLeaveStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const status = searchParams.get('status');
    const leaveTypeId = searchParams.get('leaveTypeId');

    if (status && ['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'].includes(status)) {
      setStatusFilter(status as LeaveStatus | 'ALL');
    }
    if (leaveTypeId) {
      setLeaveTypeFilter(leaveTypeId);
    }
  }, [searchParams]);

  useEffect(() => {
    loadRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, leaveTypeFilter, page, limit]);

  const handleCreate = async () => {
    const todayKtm = getTodayKtmDateInput();
    if (!formTypeId) {
      toast.error('Leave type is required');
      return;
    }
    if (!formReason.trim()) {
      toast.error('Reason is required');
      return;
    }
    if (!formStartDate || !formEndDate) {
      toast.error('Start and end date are required');
      return;
    }
    if (new Date(formStartDate) > new Date(formEndDate)) {
      toast.error('End date must be after start date');
      return;
    }
    if (formStartDate < todayKtm) {
      toast.error('Past dates are not allowed for leave requests');
      return;
    }

    setCreating(true);
    try {
      await leaveApi.createRequest({
        leaveTypeId: formTypeId,
        startDate: toKtmIsoDate(formStartDate),
        endDate: toKtmIsoDate(formEndDate),
        reason: formReason.trim(),
        isHalfDay: formIsHalfDay,
        halfDaySession: formIsHalfDay ? formHalfDaySession : undefined,
      });
      toast.success('Leave request submitted');
      setFormReason('');
      setFormIsHalfDay(false);
      setFormHalfDaySession('FIRST_HALF');
      setAddRequestModalOpen(false);
      loadRequests();
      loadLeaveStats();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to submit request');
    } finally {
      setCreating(false);
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await leaveApi.cancel(id);
      toast.success('Request cancelled');
      loadRequests();
      loadLeaveStats();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to cancel');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="My Leave"
          description="Submit and track your leave requests."
          actions={
            <Button variant="blue" onClick={() => setAddRequestModalOpen(true)}>
              Add Leave Request
            </Button>
          }
        />

        <Card>
          <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <CardTitle>My Requests</CardTitle>
            <div className="flex gap-3">
              <select
                className="w-56 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                value={leaveTypeFilter}
                onChange={(e) => {
                  setLeaveTypeFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All leave types</option>
                {leaveTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
              <select
                className="w-48 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as LeaveStatus | 'ALL');
                  setPage(1);
                }}
              >
                <option value="ALL">All statuses</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </CardHeader>
          <CardContent>
            {error && <div className="text-sm text-red-600 mb-3">{error}</div>}
            {loading ? (
              <div className="text-sm text-gray-600">Loading...</div>
            ) : filtered.length === 0 ? (
              <div className="text-sm text-gray-600">No requests yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">Dates</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">Type</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">Days</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">Status</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">Reason</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filtered.map((r) => {
                      const typeLabel = r.leaveType?.name || leaveTypes.find((t) => t.id === r.leaveTypeId)?.name || '—';
                      return (
                        <tr key={r.id} className="hover:bg-gray-50">
                          <td className="px-3 py-2 text-gray-900">
                            {formatDate(r.startDate)} → {formatDate(r.endDate)}
                          </td>
                          <td className="px-3 py-2 text-gray-700">{typeLabel}</td>
                          <td className="px-3 py-2 text-gray-700">{r.totalDays}</td>
                          <td className="px-3 py-2">
                            <StatusBadge status={r.status} />
                          </td>
                          <td className="px-3 py-2 text-gray-700 max-w-xs">
                            <div className="line-clamp-2">{r.reason}</div>
                          </td>
                          <td className="px-3 py-2">
                            {r.status === 'PENDING' ? (
                              <Button variant="red" size="sm" onClick={() => handleCancel(r.id)}>
                                Cancel
                              </Button>
                            ) : (
                              <span className="text-gray-400 text-xs">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
              <span>
                Page {page} of {totalPages}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <EmployeeLeaveRequestModal
        open={addRequestModalOpen}
        onOpenChange={setAddRequestModalOpen}
        creating={creating}
        leaveTypes={leaveTypes}
        formTypeId={formTypeId}
        onFormTypeIdChange={setFormTypeId}
        formStartDate={formStartDate}
        onFormStartDateChange={setFormStartDate}
        formEndDate={formEndDate}
        onFormEndDateChange={setFormEndDate}
        minDate={getTodayKtmDateInput()}
        formReason={formReason}
        onFormReasonChange={setFormReason}
        formIsHalfDay={formIsHalfDay}
        onFormIsHalfDayChange={setFormIsHalfDay}
        formHalfDaySession={formHalfDaySession}
        onFormHalfDaySessionChange={setFormHalfDaySession}
        selectedLeaveStats={leaveStats.find((s) => s.leaveTypeId === formTypeId) || null}
        onSubmit={handleCreate}
      />
    </DashboardLayout>
  );
}
