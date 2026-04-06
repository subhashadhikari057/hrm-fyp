'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../../../components/DashboardLayout';
import { PageHeader } from '../../../../components/PageHeader';
import { Button } from '../../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import {
  complaintsApi,
  type ComplaintPriority,
  type ComplaintRecord,
  type ComplaintStatus,
} from '../../../../lib/api/complaints';
import { EmployeeComplaintModal } from '../../../../components/complaint/EmployeeComplaintModal';
import { ComplaintStatusBadge } from '../../../../components/complaint/ComplaintStatusBadge';
import { ViewComplaintModal } from '../../../../components/complaint/ViewComplaintModal';

export default function EmployeeComplaintsPage() {
  const [rows, setRows] = useState<ComplaintRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<ComplaintStatus | 'ALL'>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<ComplaintPriority | 'ALL'>('ALL');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedComplaint, setSelectedComplaint] = useState<ComplaintRecord | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  const loadRows = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await complaintsApi.listMy({
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        priority: priorityFilter === 'ALL' ? undefined : priorityFilter,
        page,
        limit,
      });
      setRows(response.data || []);
      setTotalPages(response.meta?.totalPages || 1);

      if (selectedId) {
        const stillExists = (response.data || []).some((row) => row.id === selectedId);
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

  const loadDetail = async (id: string) => {
    setSelectedId(id);
    setDetailLoading(true);
    try {
      const response = await complaintsApi.getMyById(id);
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
  }, [statusFilter, priorityFilter, page]);

  const handleCreateComplaint = async (payload: {
    title: string;
    description: string;
    priority: ComplaintPriority;
  }) => {
    setCreating(true);
    try {
      await complaintsApi.create(payload);
      toast.success('Complaint submitted successfully');
      setModalOpen(false);
      setPage(1);
      await loadRows();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to submit complaint');
    } finally {
      setCreating(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="My Complaints"
          description="Submit complaints and track updates from HR/Admin."
          actions={
            <Button variant="blue" onClick={() => setModalOpen(true)}>
              Add Complaint Request
            </Button>
          }
        />

        <Card>
          <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <CardTitle>My Requests</CardTitle>
            <div className="flex gap-3">
              <select
                className="w-48 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={priorityFilter}
                onChange={(e) => {
                  setPriorityFilter(e.target.value as ComplaintPriority | 'ALL');
                  setPage(1);
                }}
              >
                <option value="ALL">All priorities</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
              <select
                className="w-48 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as ComplaintStatus | 'ALL');
                  setPage(1);
                }}
              >
                <option value="ALL">All statuses</option>
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="CLOSED">Closed</option>
              </select>
            </div>
          </CardHeader>
          <CardContent>
            {error && <div className="mb-3 text-sm text-red-600">{error}</div>}
            {loading ? (
              <div className="text-sm text-gray-600">Loading complaints...</div>
            ) : rows.length === 0 ? (
              <div className="text-sm text-gray-600">No complaint requests yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">Created</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">Title</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">Priority</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">Status</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">Notes</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {rows.map((row) => (
                      <tr key={row.id} className="hover:bg-gray-50">
                        <td className="px-3 py-2 text-gray-700">
                          {new Date(row.createdAt).toLocaleDateString('en-GB')}
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
                    ))}
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

      <EmployeeComplaintModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        loading={creating}
        onSubmit={handleCreateComplaint}
      />
      <ViewComplaintModal
        open={viewModalOpen}
        onOpenChange={setViewModalOpen}
        complaint={selectedComplaint}
        loading={detailLoading}
      />
    </DashboardLayout>
  );
}
