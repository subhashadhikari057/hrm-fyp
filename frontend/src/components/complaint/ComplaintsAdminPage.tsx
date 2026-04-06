'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import DashboardLayout from '../DashboardLayout';
import { PageHeader } from '../PageHeader';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import {
  complaintsApi,
  type ComplaintPriority,
  type ComplaintRecord,
  type ComplaintStatus,
} from '../../lib/api/complaints';
import { ComplaintStatusBadge } from './ComplaintStatusBadge';
import { ViewComplaintModal } from './ViewComplaintModal';

export default function ComplaintsAdminPage() {
  const [rows, setRows] = useState<ComplaintRecord[]>([]);
  const [stats, setStats] = useState({ open: 0, inProgress: 0, closed: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<ComplaintStatus | 'ALL'>('ALL');
  const [priority, setPriority] = useState<ComplaintPriority | 'ALL'>('ALL');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedComplaint, setSelectedComplaint] = useState<ComplaintRecord | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  const loadRows = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await complaintsApi.listAdmin({
        status: status === 'ALL' ? undefined : status,
        priority: priority === 'ALL' ? undefined : priority,
        page,
        limit,
      });
      setRows(response.data || []);
      setTotalPages(response.meta?.totalPages || 1);

      if (selectedId) {
        const stillExists = (response.data || []).some((item) => item.id === selectedId);
        if (!stillExists) {
          setSelectedId(null);
          setSelectedComplaint(null);
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load complaints');
      setRows([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const [openRes, inProgressRes, closedRes] = await Promise.all([
        complaintsApi.listAdmin({ status: 'OPEN', page: 1, limit: 1 }),
        complaintsApi.listAdmin({ status: 'IN_PROGRESS', page: 1, limit: 1 }),
        complaintsApi.listAdmin({ status: 'CLOSED', page: 1, limit: 1 }),
      ]);

      setStats({
        open: openRes.meta?.total || 0,
        inProgress: inProgressRes.meta?.total || 0,
        closed: closedRes.meta?.total || 0,
      });
    } catch {
      setStats({ open: 0, inProgress: 0, closed: 0 });
    }
  };

  const loadDetail = async (id: string) => {
    setSelectedId(id);
    setDetailLoading(true);
    try {
      const response = await complaintsApi.getAdminById(id);
      setSelectedComplaint(response.data);
      setViewModalOpen(true);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to load complaint details');
      setSelectedComplaint(null);
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    loadRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, priority, page]);

  useEffect(() => {
    loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const reloadAfterAction = async (id: string) => {
    await loadRows();
    await loadStats();
    await loadDetail(id);
  };

  const handleInProgress = async (id: string, note?: string) => {
    setActionLoading(true);
    try {
      await complaintsApi.markInProgress(id, note);
      toast.success('Complaint moved to in-progress');
      await reloadAfterAction(id);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update complaint');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResolve = async (id: string, note?: string) => {
    setActionLoading(true);
    try {
      await complaintsApi.resolve(id, note);
      toast.success('Complaint resolved');
      await reloadAfterAction(id);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to resolve complaint');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddNote = async (id: string, note: string) => {
    setActionLoading(true);
    try {
      await complaintsApi.addNote(id, note);
      toast.success('Note added');
      await reloadAfterAction(id);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to add note');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Complaints"
          description="Review employee complaints, update status, and maintain public notes."
        />

        <Card>
          <CardContent className="grid grid-cols-1 gap-4 pt-6 md:grid-cols-3">
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-amber-700">Open</p>
              <p className="mt-1 text-2xl font-semibold text-amber-800">{stats.open}</p>
            </div>
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-blue-700">In Progress</p>
              <p className="mt-1 text-2xl font-semibold text-blue-800">{stats.inProgress}</p>
            </div>
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">Closed</p>
              <p className="mt-1 text-2xl font-semibold text-emerald-800">{stats.closed}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <CardTitle>Complaint Requests</CardTitle>
            <div className="flex flex-wrap gap-3">
              <select
                className="w-48 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value as ComplaintStatus | 'ALL');
                  setPage(1);
                }}
              >
                <option value="ALL">All statuses</option>
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="CLOSED">Closed</option>
              </select>

              <select
                className="w-48 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={priority}
                onChange={(e) => {
                  setPriority(e.target.value as ComplaintPriority | 'ALL');
                  setPage(1);
                }}
              >
                <option value="ALL">All priorities</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>

            </div>
          </CardHeader>
          <CardContent>
            {error && <div className="mb-3 text-sm text-red-600">{error}</div>}
            {loading ? (
              <div className="text-sm text-gray-600">Loading complaints...</div>
            ) : rows.length === 0 ? (
              <div className="text-sm text-gray-600">No complaints found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">Created</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">Employee</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">Title</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">Priority</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">Status</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">Notes</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {rows.map((row) => {
                      const employeeName = row.employee
                        ? `${row.employee.firstName ?? ''} ${row.employee.lastName ?? ''}`.trim()
                        : '-';
                      return (
                        <tr key={row.id} className="hover:bg-gray-50">
                          <td className="px-3 py-2 text-gray-700">
                            {new Date(row.createdAt).toLocaleDateString('en-GB')}
                          </td>
                          <td className="px-3 py-2 text-gray-700">
                            {employeeName}
                            {row.employee?.employeeCode ? ` (${row.employee.employeeCode})` : ''}
                          </td>
                          <td className="px-3 py-2 text-gray-900 max-w-xs">
                            <div className="line-clamp-1">{row.title}</div>
                          </td>
                          <td className="px-3 py-2 text-gray-700">{row.priority}</td>
                          <td className="px-3 py-2">
                            <ComplaintStatusBadge status={row.status} />
                          </td>
                          <td className="px-3 py-2 text-gray-700">{row._count?.notes ?? 0}</td>
                          <td className="px-3 py-2">
                            <Button
                              size="sm"
                              variant={selectedId === row.id ? 'blue' : 'outline'}
                              onClick={() => loadDetail(row.id)}
                            >
                              View
                            </Button>
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

      </div>

      <ViewComplaintModal
        open={viewModalOpen}
        onOpenChange={setViewModalOpen}
        complaint={selectedComplaint}
        loading={detailLoading}
        showEmployee
        actionLoading={actionLoading}
        onMarkInProgress={handleInProgress}
        onResolve={handleResolve}
        onAddNote={handleAddNote}
      />
    </DashboardLayout>
  );
}
