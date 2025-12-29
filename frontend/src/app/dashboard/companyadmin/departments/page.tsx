'use client';

import { useState, useMemo, useEffect } from 'react';
import { Building2, CheckCircle2, Pencil, Trash2, XCircle } from 'lucide-react';
import DashboardLayout from '../../../../components/DashboardLayout';
import { DataTable, Column } from '../../../../components/DataTable';
import { StatsGrid } from '../../../../components/StatsGrid';
import { PageHeader } from '../../../../components/PageHeader';
import { AddButton } from '../../../../components/AddButton';
import { AddDepartmentModal } from '../../../../components/AddDepartmentModal';
import { UpdateDepartmentModal } from '../../../../components/UpdateDepartmentModal';
import { DeleteConfirmDialog } from '../../../../components/DeleteConfirmDialog';
import toast from 'react-hot-toast';
import { departmentApi, type Department } from '../../../../lib/api/department';

export default function DepartmentsPage() {
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [addModal, setAddModal] = useState(false);
    const [updateModal, setUpdateModal] = useState<{
        isOpen: boolean;
        departmentId: string | null;
    }>({ isOpen: false, departmentId: null });
    const [deleteDialog, setDeleteDialog] = useState<{
        isOpen: boolean;
        department: Department | null;
    }>({ isOpen: false, department: null });
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

    // Fetch departments from backend
    useEffect(() => {
        const fetchDepartments = async () => {
            setLoading(true);
            setError(null);
            try {
                const statusValues = filters.isActive || [];
                const isActive = statusValues.length === 1 ? statusValues[0] === 'true' : undefined;
                const response = await departmentApi.getDepartments({
                    search: debouncedSearch.trim() || undefined,
                    isActive,
                    page,
                    limit,
                    sortBy,
                    sortOrder,
                });
                setDepartments(response.data);
                setTotal(response.meta?.total || response.data.length);
                setTotalPages(response.meta?.totalPages || 1);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to fetch departments');
                console.error('Error fetching departments:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchDepartments();
    }, [refreshTrigger, page, limit, filters, sortBy, sortOrder, debouncedSearch]);

    // Calculate stats
    const stats = useMemo(() => {
        const totalCount = total || departments.length;
        const active = departments.filter((d) => d.isActive).length;
        const inactive = departments.filter((d) => !d.isActive).length;

        return [
            {
                label: 'Total Departments',
                value: totalCount,
                iconBgColor: 'blue' as const,
                icon: <Building2 className="h-4 w-4" />,
            },
            {
                label: 'Active Departments',
                value: active,
                iconBgColor: 'green' as const,
                icon: <CheckCircle2 className="h-4 w-4" />,
            },
            {
                label: 'Inactive Departments',
                value: inactive,
                iconBgColor: 'gray' as const,
                icon: <XCircle className="h-4 w-4" />,
            },
        ];
    }, [departments]);

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

    const columns: Column<Department>[] = [
        {
            key: 'name',
            header: 'Department Name',
            sortable: true,
            render: (department) => (
                <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                        <span className="text-blue-600 font-semibold text-sm">
                            {department.name.charAt(0).toUpperCase()}
                        </span>
                    </div>
                    <div>
                        <div className="font-medium text-gray-900">{department.name}</div>
                        {department.description && (
                            <div className="text-xs text-gray-500 line-clamp-1">{department.description}</div>
                        )}
                    </div>
                </div>
            ),
        },
        {
            key: 'code',
            header: 'Code',
            sortable: true,
            render: (department) => (
                <span className="font-mono text-sm text-gray-600">{department.code || '-'}</span>
            ),
        },
        {
            key: 'isActive',
            header: 'Status',
            sortable: true,
            render: (department) => getStatusBadge(department.isActive),
        },
        {
            key: 'createdAt',
            header: 'Created',
            sortable: true,
            render: (department) => (
                <span className="text-gray-600">
                    {new Date(department.createdAt).toLocaleDateString()}
                </span>
            ),
        },
    ];

    const handleRowClick = (department: Department) => {
        console.log('Clicked department:', department);
        // Navigate to department details page
    };

    const handleEdit = (department: Department) => {
        setUpdateModal({ isOpen: true, departmentId: department.id });
    };

    const handleUpdateSuccess = () => {
        setRefreshTrigger((prev) => prev + 1);
    };

    const handleDeleteClick = (department: Department) => {
        setDeleteDialog({ isOpen: true, department });
    };

    const handleDeleteConfirm = async () => {
        if (!deleteDialog.department) return;

        setDeleting(true);
        try {
            await departmentApi.deleteDepartment(deleteDialog.department.id);
            toast.success(`Department "${deleteDialog.department.name}" deleted successfully`);
            setDeleteDialog({ isOpen: false, department: null });
            setRefreshTrigger((prev) => prev + 1);
        } catch (err) {
            toast.error(
                err instanceof Error ? err.message : 'Failed to delete department'
            );
        } finally {
            setDeleting(false);
        }
    };

    const handleDeleteCancel = () => {
        setDeleteDialog({ isOpen: false, department: null });
    };

    const actions = (department: Department) => (
        <>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(department);
                }}
                className="text-blue-600 hover:text-blue-900 transition-colors"
                title="Edit"
            >
                <Pencil className="w-4 h-4" />
            </button>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteClick(department);
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
                    title="Departments"
                    description="Manage your company's departments"
                    actions={
                        <AddButton
                            label="Add Department"
                            onClick={() => setAddModal(true)}
                        />
                    }
                />

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                        {error}
                    </div>
                )}

                {/* Stats Cards */}
                <StatsGrid stats={stats} columns={3} />

                {/* Data Table */}
                <DataTable
                    data={departments}
                    columns={columns}
                    onRowClick={handleRowClick}
                    actions={actions}
                    searchable={true}
                    emptyMessage={loading ? 'Loading departments...' : 'No departments found'}
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

                {/* Add Department Modal */}
                <AddDepartmentModal
                    isOpen={addModal}
                    onClose={() => setAddModal(false)}
                    onSuccess={handleUpdateSuccess}
                />

                {/* Update Department Modal */}
                <UpdateDepartmentModal
                    isOpen={updateModal.isOpen}
                    onClose={() => setUpdateModal({ isOpen: false, departmentId: null })}
                    departmentId={updateModal.departmentId}
                    onSuccess={handleUpdateSuccess}
                />

                {/* Delete Confirmation Dialog */}
                <DeleteConfirmDialog
                    isOpen={deleteDialog.isOpen}
                    onClose={handleDeleteCancel}
                    onConfirm={handleDeleteConfirm}
                    title="Delete Department"
                    message="Are you sure you want to delete this department? This action cannot be undone."
                    itemName={deleteDialog.department?.name}
                    loading={deleting}
                />
            </div>
        </DashboardLayout>
    );
}
