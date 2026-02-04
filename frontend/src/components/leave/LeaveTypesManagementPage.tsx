'use client';

import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, CheckCircle2, Pencil, Trash2, XCircle } from 'lucide-react';
import DashboardLayout from '../DashboardLayout';
import { DataTable, type Column } from '../DataTable';
import { StatsGrid } from '../StatsGrid';
import { PageHeader } from '../PageHeader';
import { AddButton } from '../AddButton';
import { AddLeaveTypeModal } from '../AddLeaveTypeModal';
import { UpdateLeaveTypeModal } from '../UpdateLeaveTypeModal';
import { DeleteConfirmDialog } from '../DeleteConfirmDialog';
import toast from 'react-hot-toast';
import { leaveApi, type LeaveType } from '../../lib/api/leave';

export default function LeaveTypesManagementPage() {
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [addModal, setAddModal] = useState(false);
  const [updateModal, setUpdateModal] = useState<{ isOpen: boolean; leaveTypeId: string | null }>({
    isOpen: false,
    leaveTypeId: null,
  });
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; leaveType: LeaveType | null }>({
    isOpen: false,
    leaveType: null,
  });
  const [deleting, setDeleting] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState<Record<string, string[]>>({});
  const [sortBy, setSortBy] = useState<'createdAt' | 'name' | 'code' | 'updatedAt'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const handle = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(handle);
  }, [search]);

  useEffect(() => {
    const fetchLeaveTypes = async () => {
      setLoading(true);
      setError(null);
      try {
        const statusValues = filters.isActive || [];
        const isActive = statusValues.length === 1 ? statusValues[0] === 'true' : undefined;
        const response = await leaveApi.getLeaveTypes({
          search: debouncedSearch.trim() || undefined,
          isActive,
          page,
          limit,
          sortBy,
          sortOrder,
        });
        setLeaveTypes(response.data || []);
        setTotal(response.meta?.total || response.data.length);
        setTotalPages(response.meta?.totalPages || 1);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch leave types');
      } finally {
        setLoading(false);
      }
    };

    fetchLeaveTypes();
  }, [refreshTrigger, page, limit, filters, sortBy, sortOrder, debouncedSearch]);

  const stats = useMemo(() => {
    const totalCount = total || leaveTypes.length;
    const active = leaveTypes.filter((t) => t.isActive).length;
    const inactive = leaveTypes.filter((t) => !t.isActive).length;

    return [
      {
        label: 'Total Leave Types',
        value: totalCount,
        iconBgColor: 'blue' as const,
        icon: <CalendarDays className="h-4 w-4" />,
      },
      {
        label: 'Active Types',
        value: active,
        iconBgColor: 'green' as const,
        icon: <CheckCircle2 className="h-4 w-4" />,
      },
      {
        label: 'Inactive Types',
        value: inactive,
        iconBgColor: 'gray' as const,
        icon: <XCircle className="h-4 w-4" />,
      },
    ];
  }, [leaveTypes, total]);

  const getStatusBadge = (isActive: boolean) => (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
      }`}
    >
      {isActive ? 'Active' : 'Inactive'}
    </span>
  );

  const columns: Column<LeaveType>[] = [
    {
      key: 'name',
      header: 'Leave Type',
      sortable: true,
      render: (leaveType) => (
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
            <span className="text-blue-600 font-semibold text-sm">
              {leaveType.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <div className="font-medium text-gray-900">{leaveType.name}</div>
            {leaveType.description && (
              <div className="text-xs text-gray-500 line-clamp-1">{leaveType.description}</div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'code',
      header: 'Code',
      sortable: true,
      render: (leaveType) => (
        <span className="font-mono text-sm text-gray-600">{leaveType.code || '-'}</span>
      ),
    },
    {
      key: 'isActive',
      header: 'Status',
      sortable: true,
      render: (leaveType) => getStatusBadge(leaveType.isActive),
    },
    {
      key: 'createdAt',
      header: 'Created',
      sortable: true,
      render: (leaveType) => (
        <span className="text-gray-600">{new Date(leaveType.createdAt).toLocaleDateString()}</span>
      ),
    },
  ];

  const handleEdit = (leaveType: LeaveType) => {
    setUpdateModal({ isOpen: true, leaveTypeId: leaveType.id });
  };

  const handleUpdateSuccess = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleDeleteClick = (leaveType: LeaveType) => {
    setDeleteDialog({ isOpen: true, leaveType });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.leaveType) return;
    setDeleting(true);
    try {
      await leaveApi.deleteLeaveType(deleteDialog.leaveType.id);
      toast.success(`Leave type "${deleteDialog.leaveType.name}" deleted successfully`);
      setDeleteDialog({ isOpen: false, leaveType: null });
      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete leave type');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialog({ isOpen: false, leaveType: null });
  };

  const actions = (leaveType: LeaveType) => (
    <>
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleEdit(leaveType);
        }}
        className="text-blue-600 hover:text-blue-900 transition-colors"
        title="Edit"
      >
        <Pencil className="w-4 h-4" />
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleDeleteClick(leaveType);
        }}
        className="text-red-600 hover:text-red-900 transition-colors"
        title="Delete"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Leave Types"
          description="Manage your company's leave categories"
          actions={<AddButton label="Add Leave Type" onClick={() => setAddModal(true)} />}
        />

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <StatsGrid stats={stats} columns={3} />

        <DataTable
          data={leaveTypes}
          columns={columns}
          actions={actions}
          searchable={true}
          emptyMessage={loading ? 'Loading leave types...' : 'No leave types found'}
          loading={loading}
          serverSide={true}
          pagination={{
            page,
            limit,
            total,
            totalPages,
          }}
          onPageChange={(nextPage) => setPage(nextPage)}
          onPageSizeChange={(nextLimit) => {
            setLimit(nextLimit);
            setPage(1);
          }}
          onFilterChange={(nextFilters) => {
            setFilters(nextFilters);
            setPage(1);
          }}
          onSearchChange={(query) => {
            setSearch(query);
          }}
          filters={[
            {
              key: 'isActive',
              label: 'Status',
              type: 'multiselect',
              options: [
                { value: 'true', label: 'Active' },
                { value: 'false', label: 'Inactive' },
              ],
            },
          ]}
        />

        <AddLeaveTypeModal
          isOpen={addModal}
          onClose={() => setAddModal(false)}
          onSuccess={handleUpdateSuccess}
        />
        <UpdateLeaveTypeModal
          isOpen={updateModal.isOpen}
          onClose={() => setUpdateModal({ isOpen: false, leaveTypeId: null })}
          leaveTypeId={updateModal.leaveTypeId}
          onSuccess={handleUpdateSuccess}
        />
        <DeleteConfirmDialog
          isOpen={deleteDialog.isOpen}
          onClose={handleDeleteCancel}
          onConfirm={handleDeleteConfirm}
          title="Delete Leave Type"
          message="Are you sure you want to delete this leave type? This action cannot be undone."
          itemName={deleteDialog.leaveType?.name}
          loading={deleting}
        />
      </div>
    </DashboardLayout>
  );
}
