'use client';

import { useState, useMemo, useEffect } from 'react';
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

    // Fetch departments from backend
    useEffect(() => {
        const fetchDepartments = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await departmentApi.getDepartments();
                setDepartments(response.data);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to fetch departments');
                console.error('Error fetching departments:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchDepartments();
    }, [refreshTrigger]);

    // Calculate stats
    const stats = useMemo(() => {
        const total = departments.length;
        const active = departments.filter((d) => d.isActive).length;
        const inactive = departments.filter((d) => !d.isActive).length;

        return [
            {
                label: 'Total Departments',
                value: total,
                iconBgColor: 'blue' as const,
                icon: (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                        />
                    </svg>
                ),
            },
            {
                label: 'Active Departments',
                value: active,
                iconBgColor: 'green' as const,
                icon: (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                    </svg>
                ),
            },
            {
                label: 'Inactive Departments',
                value: inactive,
                iconBgColor: 'gray' as const,
                icon: (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                    </svg>
                ),
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
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                </svg>
            </button>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteClick(department);
                }}
                className="text-red-600 hover:text-red-900 transition-colors"
                title="Delete"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                </svg>
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
                    searchPlaceholder="Search departments by name, code, or description..."
                    emptyMessage={loading ? 'Loading departments...' : 'No departments found'}
                    loading={loading}
                    filters={[
                        {
                            key: 'isActive',
                            label: 'Status',
                            type: 'multiselect',
                            options: [
                                { value: 'true', label: 'Active' },
                                { value: 'false', label: 'Inactive' },
                            ],
                            getValue: (department) => String(department.isActive),
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
