'use client';

import React, { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../../../../components/DashboardLayout';
import { PageHeader } from '../../../../components/PageHeader';
import { regularizationApi, type Regularization, type RegularizationRequestType, type RegularizationStatus } from '../../../../lib/api/regularizations';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import toast from 'react-hot-toast';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';

const REQUEST_TYPES: { value: RegularizationRequestType; label: string }[] = [
  { value: 'MISSED_CHECKIN', label: 'Missed Check-in' },
  { value: 'MISSED_CHECKOUT', label: 'Missed Check-out' },
  { value: 'WRONG_TIME', label: 'Wrong Time' },
  { value: 'FULL_DAY_EDIT', label: 'Full Day Edit' },
];

const STATUS_BADGES: Record<RegularizationStatus, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  APPROVED: 'bg-emerald-100 text-emerald-700',
  REJECTED: 'bg-rose-100 text-rose-700',
  CANCELLED: 'bg-gray-100 text-gray-700',
};

const formatDate = (value?: string | null) => {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
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
  return <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${STATUS_BADGES[status] || ''}`}>{status}</span>;
}

export default function EmployeeRegularizationsPage() {
  const [requests, setRequests] = useState<Regularization[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<RegularizationStatus | 'ALL'>('ALL');

  const [formDate, setFormDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [formCheckIn, setFormCheckIn] = useState<string>('');
  const [formCheckOut, setFormCheckOut] = useState<string>('');
  const [formReason, setFormReason] = useState<string>('');
  const [formType, setFormType] = useState<RegularizationRequestType>('MISSED_CHECKIN');

  const filtered = useMemo(() => {
    if (statusFilter === 'ALL') return requests;
    return requests.filter((r) => r.status === statusFilter);
  }, [requests, statusFilter]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await regularizationApi.listMy({
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        limit: 100,
      });
      setRequests(res.data || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const handleCreate = async () => {
    if (!formReason.trim()) {
      toast.error('Reason is required');
      return;
    }
    const payload: any = {
      date: new Date(formDate).toISOString(),
      requestType: formType,
      reason: formReason.trim(),
    };
    if (formCheckIn) payload.requestedCheckInTime = formCheckIn;
    if (formCheckOut) payload.requestedCheckOutTime = formCheckOut;

    setCreating(true);
    try {
      await regularizationApi.create(payload);
      toast.success('Request submitted');
      setFormReason('');
      setFormCheckIn('');
      setFormCheckOut('');
      load();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to submit request');
    } finally {
      setCreating(false);
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await regularizationApi.cancel(id);
      toast.success('Request cancelled');
      load();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to cancel');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Attendance Requests"
          description="Submit and track attendance regularization requests."
        />

        <Card>
          <CardHeader>
            <CardTitle>New Request</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Date</label>
                <Input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Request Type</label>
                <select
                  className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  value={formType}
                  onChange={(e) => setFormType(e.target.value as RegularizationRequestType)}
                >
                  {REQUEST_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Proposed Check-in</label>
                <Input
                  type="time"
                  step="1"
                  value={formCheckIn}
                  onChange={(e) => setFormCheckIn(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Proposed Check-out</label>
                <Input
                  type="time"
                  step="1"
                  value={formCheckOut}
                  onChange={(e) => setFormCheckOut(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Reason</label>
              <textarea
                value={formReason}
                onChange={(e) => setFormReason(e.target.value)}
                rows={3}
                placeholder="Provide a brief reason"
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="flex justify-end">
              <Button onClick={handleCreate} disabled={creating}>
                {creating ? 'Submitting...' : 'Submit Request'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <CardTitle>My Requests</CardTitle>
            <div className="flex gap-3">
              <select
                className="w-48 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as RegularizationStatus | 'ALL')}
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
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">Date</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">Type</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">Proposed</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">Status</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">Reason</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filtered.map((r) => {
                      const proposedIn = formatTime(r.requestedCheckInTime);
                      const proposedOut = formatTime(r.requestedCheckOutTime);
                      const proposed =
                        proposedIn === '-' && proposedOut === '-'
                          ? '—'
                          : `${proposedIn} → ${proposedOut}`;
                      return (
                        <tr key={r.id} className="hover:bg-gray-50">
                          <td className="px-3 py-2 text-gray-900">
                            {formatDate(r.date)}
                          </td>
                          <td className="px-3 py-2 text-gray-700">{r.requestType}</td>
                          <td className="px-3 py-2 text-gray-700">{proposed}</td>
                          <td className="px-3 py-2">
                            <StatusBadge status={r.status} />
                          </td>
                          <td className="px-3 py-2 text-gray-700 max-w-xs">
                            <div className="line-clamp-2">{r.reason}</div>
                          </td>
                          <td className="px-3 py-2">
                            {r.status === 'PENDING' ? (
                              <Button variant="outline" size="sm" onClick={() => handleCancel(r.id)}>
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
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
