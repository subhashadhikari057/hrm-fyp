'use client';

import { useState, useMemo, useEffect } from 'react';
import { CheckCircle2, Clock, Pencil, Trash2, XCircle } from 'lucide-react';
import DashboardLayout from '../../../../components/DashboardLayout';
import { DataTable, Column } from '../../../../components/DataTable';
import { StatsGrid } from '../../../../components/StatsGrid';
import { PageHeader } from '../../../../components/PageHeader';
import { AddButton } from '../../../../components/AddButton';
import { AddWorkShiftModal } from '../../../../components/AddWorkShiftModal';
import { UpdateWorkShiftModal } from '../../../../components/UpdateWorkShiftModal';
import { DeleteConfirmDialog } from '../../../../components/DeleteConfirmDialog';
import toast from 'react-hot-toast';
import { workShiftApi, type WorkShift } from '../../../../lib/api/workshift';

function formatTime(value: string) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    const seconds = String(date.getUTCSeconds()).padStart(2, '0');
    return seconds === '00' ? `${hours}:${minutes}` : `${hours}:${minutes}:${seconds}`;
}

export default function WorkShiftsPage() {
    const [workShifts, setWorkShifts] = useState<WorkShift[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [addModal, setAddModal] = useState(false);
    const [updateModal, setUpdateModal] = useState<{
        isOpen: boolean;
        workShiftId: string | null;
    }>({ isOpen: false, workShiftId: null });
    const [deleteDialog, setDeleteDialog] = useState<{
        isOpen: boolean;
        workShift: WorkShift | null;
    }>({ isOpen: false, workShift: null });
    const [deleting, setDeleting] = useState(false);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [filters, setFilters] = useState<Record<string, string[]>>({});
    const [sortBy, setSortBy] = useState<'createdAt' | 'name' | 'code' | 'startTime' | 'endTime' | 'updatedAt'>('createdAt');
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
        const fetchWorkShifts = async () => {
            setLoading(true);
            setError(null);
            try {
                const statusValues = filters.isActive || [];
                const isActive = statusValues.length === 1 ? statusValues[0] === 'true' : undefined;
                const response = await workShiftApi.getWorkShifts({
                    search: debouncedSearch.trim() || undefined,
                    isActive,
                    page,
                    limit,
                    sortBy,
                    sortOrder,
                });
                setWorkShifts(response.data);
                setTotal(response.meta?.total || response.data.length);
                setTotalPages(response.meta?.totalPages || 1);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to fetch work shifts');
                console.error('Error fetching work shifts:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchWorkShifts();
    }, [refreshTrigger, page, limit, filters, sortBy, sortOrder, debouncedSearch]);

    const stats = useMemo(() => {
        const totalCount = total || workShifts.length;
        const active = workShifts.filter((shift) => shift.isActive).length;
        const inactive = workShifts.filter((shift) => !shift.isActive).length;

        return [
            {
                label: 'Total Shifts',
                value: totalCount,
                iconBgColor: 'purple' as const,
                icon: <Clock className="h-4 w-4" />,
            },
            {
                label: 'Active Shifts',
                value: active,
                iconBgColor: 'green' as const,
                icon: <CheckCircle2 className="h-4 w-4" />,
            },
            {
                label: 'Inactive Shifts',
                value: inactive,
                iconBgColor: 'gray' as const,
                icon: <XCircle className="h-4 w-4" />,
            },
        ];
    }, [workShifts]);

    const getStatusBadge = (isActive: boolean) => {
        return (
            <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}
            >
                {isActive ? 'Active' : 'Inactive'}
            </span>
        );
    };

    const columns: Column<WorkShift>[] = [
        {
            key: 'name',
            header: 'Shift Name',
            sortable: true,
            render: (shift) => (
                <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center mr-3">
                        <span className="text-purple-600 font-semibold text-sm">
                            {shift.name.charAt(0).toUpperCase()}
                        </span>
                    </div>
                    <div>
                        <div className="font-medium text-gray-900">{shift.name}</div>
                        {shift.description && (
                            <div className="text-xs text-gray-500 line-clamp-1">{shift.description}</div>
                        )}
                    </div>
                </div>
            ),
        },
        {
            key: 'code',
            header: 'Code',
            sortable: true,
            render: (shift) => (
                <span className="font-mono text-sm text-gray-600">{shift.code || '-'}</span>
            ),
        },
        {
            key: 'startTime',
            header: 'Shift Time',
            sortable: true,
            render: (shift) => (
                <span className="text-gray-700">
                    {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
                </span>
            ),
        },
        {
            key: 'isActive',
            header: 'Status',
            sortable: true,
            render: (shift) => getStatusBadge(shift.isActive),
        },
        {
            key: 'createdAt',
            header: 'Created',
            sortable: true,
            render: (shift) => (
                <span className="text-gray-600">
                    {new Date(shift.createdAt).toLocaleDateString()}
                </span>
            ),
        },
    ];

    const handleEdit = (workShift: WorkShift) => {
        setUpdateModal({ isOpen: true, workShiftId: workShift.id });
    };

    const handleUpdateSuccess = () => {
        setRefreshTrigger((prev) => prev + 1);
    };

    const handleDeleteClick = (workShift: WorkShift) => {
        setDeleteDialog({ isOpen: true, workShift });
    };

    const handleDeleteConfirm = async () => {
        if (!deleteDialog.workShift) return;

        setDeleting(true);
        try {
            await workShiftApi.deleteWorkShift(deleteDialog.workShift.id);
            toast.success(`Work shift "${deleteDialog.workShift.name}" deleted successfully`);
            setDeleteDialog({ isOpen: false, workShift: null });
            setRefreshTrigger((prev) => prev + 1);
        } catch (err) {
            toast.error(
                err instanceof Error ? err.message : 'Failed to delete work shift'
            );
        } finally {
            setDeleting(false);
        }
    };

    const handleDeleteCancel = () => {
        setDeleteDialog({ isOpen: false, workShift: null });
    };

    const actions = (workShift: WorkShift) => (
        <>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(workShift);
                }}
                className="text-blue-600 hover:text-blue-900 transition-colors"
                title="Edit"
            >
                <Pencil className="w-4 h-4" />
            </button>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteClick(workShift);
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
                    title="Work Shifts"
                    description="Manage your company's work shifts and schedules"
                    actions={
                        <AddButton
                            label="Add Work Shift"
                            onClick={() => setAddModal(true)}
                        />
                    }
                />

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                        {error}
                    </div>
                )}

                <StatsGrid stats={stats} columns={3} />

                <DataTable
                    data={workShifts}
                    columns={columns}
                    actions={actions}
                    searchable={true}
                    searchPlaceholder="Search shifts by name, code, or description..."
                    emptyMessage={loading ? 'Loading work shifts...' : 'No work shifts found'}
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
                    onSearchChange={(query) => {
                        setSearch(query);
                    }}
                    onFilterChange={(nextFilters) => {
                        setFilters(nextFilters);
                        setPage(1);
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

                <AddWorkShiftModal
                    isOpen={addModal}
                    onClose={() => setAddModal(false)}
                    onSuccess={handleUpdateSuccess}
                />

                <UpdateWorkShiftModal
                    isOpen={updateModal.isOpen}
                    onClose={() => setUpdateModal({ isOpen: false, workShiftId: null })}
                    workShiftId={updateModal.workShiftId}
                    onSuccess={handleUpdateSuccess}
                />

                <DeleteConfirmDialog
                    isOpen={deleteDialog.isOpen}
                    onClose={handleDeleteCancel}
                    onConfirm={handleDeleteConfirm}
                    title="Delete Work Shift"
                    message="Are you sure you want to delete this work shift? This action cannot be undone."
                    itemName={deleteDialog.workShift?.name}
                    loading={deleting}
                />
            </div>
        </DashboardLayout>
    );
}
