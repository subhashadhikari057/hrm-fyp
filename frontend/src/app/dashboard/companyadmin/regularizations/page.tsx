'use client';

import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../../../components/DashboardLayout';
import { PageHeader } from '../../../../components/PageHeader';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../../components/ui/dialog';
import { employeeApi, type Employee } from '../../../../lib/api/employee';
import {
  regularizationApi,
  type Regularization,
  type RegularizationStatus,
} from '../../../../lib/api/regularizations';

const STATUS_BADGES: Record<RegularizationStatus, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  APPROVED: 'bg-emerald-100 text-emerald-700',
  REJECTED: 'bg-rose-100 text-rose-700',
  CANCELLED: 'bg-gray-100 text-gray-700',
};

const REQUEST_TYPE_LABELS: Record<string, string> = {
  MISSED_CHECKIN: 'Missed Check-in',
  MISSED_CHECKOUT: 'Missed Check-out',
  WRONG_TIME: 'Wrong Time',
  FULL_DAY_EDIT: 'Full Day Edit',
};

const toKtmIsoDate = (dateStr: string, endOfDay = false) => {
  if (!dateStr) return undefined;
  const time = endOfDay ? '23:59:59' : '00:00:00';
  return new Date(`${dateStr}T${time}+05:45`).toISOString();
};

const formatDate = (value?: string | null) => {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('en-GB', {
    month: 'short',
    day: '2-digit',
    timeZone: 'Asia/Kathmandu',
  });
};

const formatTime = (value?: string | null) => {
  if (!value) return '-';
  return new Date(value).toLocaleTimeString('en-GB', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kathmandu',
  });
};

function StatusBadge({ status }: { status: RegularizationStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${STATUS_BADGES[status] || ''}`}
    >
      {status}
    </span>
  );
}

export default function CompanyAdminRegularizationsPage() {
  const [requests, setRequests] = useState<Regularization[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [statusFilter, setStatusFilter] = useState<RegularizationStatus | 'ALL'>('PENDING');
  const [employeeId, setEmployeeId] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [actionId, setActionId] = useState<string | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [reviewModal, setReviewModal] = useState<{
    open: boolean;
    action: 'approve' | 'reject';
    request: Regularization | null;
  }>({ open: false, action: 'approve', request: null });

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await employeeApi.getEmployees({ page: 1, limit: 100 });
        setEmployees(res.data || []);
      } catch (err) {
        console.error('Failed to load employees for filter', err);
      }
    };
    fetchEmployees();
  }, []);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await regularizationApi.listAdmin({
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        employeeId: employeeId || undefined,
        dateFrom: dateFrom ? toKtmIsoDate(dateFrom) : undefined,
        dateTo: dateTo ? toKtmIsoDate(dateTo, true) : undefined,
        page,
        limit,
      });
      setRequests(res.data || []);
      setTotalPages(res.meta?.totalPages || 1);
    } catch (err: any) {
      setError(err?.message || 'Failed to load regularizations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, employeeId, dateFrom, dateTo, page, limit]);

  const employeeOptions = useMemo(
    () =>
      employees.map((employee) => ({
        value: employee.id,
        label: `${employee.firstName} ${employee.lastName}${employee.employeeCode ? ` (${employee.employeeCode})` : ''}`,
      })),
    [employees],
  );

  const handleApprove = async (id: string, note?: string) => {
    setActionId(id);
    try {
      await regularizationApi.approve(id, note || undefined);
      toast.success('Request approved');
      load();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to approve');
    } finally {
      setActionId(null);
    }
  };

  const handleReject = async (id: string, note?: string) => {
    setActionId(id);
    try {
      await regularizationApi.reject(id, note || undefined);
      toast.success('Request rejected');
      load();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to reject');
    } finally {
      setActionId(null);
    }
  };

  const openReviewModal = (request: Regularization, action: 'approve' | 'reject') => {
    setReviewNote('');
    setReviewModal({ open: true, action, request });
  };

  const closeReviewModal = () => {
    if (actionId) return;
    setReviewModal({ open: false, action: 'approve', request: null });
    setReviewNote('');
  };

  const confirmReview = async () => {
    if (!reviewModal.request) return;
    const id = reviewModal.request.id;
    if (reviewModal.action === 'approve') {
      await handleApprove(id, reviewNote.trim() || undefined);
    } else {
      await handleReject(id, reviewNote.trim() || undefined);
    }
    closeReviewModal();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Attendance Requests"
          description="Review and approve attendance regularization requests."
        />

        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Status</label>
              <select
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as RegularizationStatus | 'ALL');
                  setPage(1);
                }}
              >
                <option value="ALL">All</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Employee</label>
              <select
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                value={employeeId}
                onChange={(e) => {
                  setEmployeeId(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All employees</option>
                {employeeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">From</label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">To</label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Requests</CardTitle>
          </CardHeader>
          <CardContent>
            {error && <div className="text-sm text-red-600 mb-3">{error}</div>}
            {loading ? (
              <div className="text-sm text-gray-600">Loading...</div>
            ) : requests.length === 0 ? (
              <div className="text-sm text-gray-600">No requests found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">Date</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">Employee</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">Type</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">Proposed</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">Status</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">Reason</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {requests.map((req) => {
                      const employeeName = req.employee
                        ? `${req.employee.firstName ?? ''} ${req.employee.lastName ?? ''}`.trim()
                        : '—';
                      const employeeCode = req.employee?.employeeCode
                        ? ` (${req.employee.employeeCode})`
                        : '';
                      const proposed = `${formatTime(req.requestedCheckInTime)} → ${formatTime(req.requestedCheckOutTime)}`;
                      return (
                        <tr key={req.id} className="hover:bg-gray-50">
                          <td className="px-3 py-2 text-gray-900">{formatDate(req.date)}</td>
                          <td className="px-3 py-2 text-gray-700">
                            {employeeName || '—'}
                            {employeeCode}
                          </td>
                          <td className="px-3 py-2 text-gray-700">
                            {REQUEST_TYPE_LABELS[req.requestType] || req.requestType}
                          </td>
                          <td className="px-3 py-2 text-gray-700">{proposed}</td>
                          <td className="px-3 py-2">
                            <StatusBadge status={req.status} />
                          </td>
                          <td className="px-3 py-2 text-gray-700 max-w-xs">
                            <div className="line-clamp-2">{req.reason}</div>
                          </td>
                          <td className="px-3 py-2">
                            {req.status === 'PENDING' ? (
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  disabled={actionId === req.id}
                                  onClick={() => openReviewModal(req, 'approve')}
                                >
                                  Approve
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={actionId === req.id}
                                  onClick={() => openReviewModal(req, 'reject')}
                                >
                                  Reject
                                </Button>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400">—</span>
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

      <Dialog open={reviewModal.open} onOpenChange={(open) => !open && closeReviewModal()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {reviewModal.action === 'approve' ? 'Approve Request' : 'Reject Request'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              {reviewModal.action === 'approve' ? 'Approval note (optional)' : 'Rejection note (optional)'}
            </label>
            <textarea
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              rows={3}
              value={reviewNote}
              onChange={(e) => setReviewNote(e.target.value)}
              placeholder="Add a short note for this decision"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeReviewModal} disabled={!!actionId}>
              Cancel
            </Button>
            <Button onClick={confirmReview} disabled={!!actionId}>
              {reviewModal.action === 'approve' ? 'Approve' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
