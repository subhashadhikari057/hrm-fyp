'use client';

import { useState, useMemo, useEffect } from 'react';
import { Briefcase, CheckCircle2, Pencil, Trash2, XCircle } from 'lucide-react';
import DashboardLayout from '../../../../components/DashboardLayout';
import { DataTable, Column } from '../../../../components/DataTable';
import { StatsGrid } from '../../../../components/StatsGrid';
import { PageHeader } from '../../../../components/PageHeader';
import { AddButton } from '../../../../components/AddButton';
import { AddDesignationModal } from '../../../../components/AddDesignationModal';
import { UpdateDesignationModal } from '../../../../components/UpdateDesignationModal';
import { DeleteConfirmDialog } from '../../../../components/DeleteConfirmDialog';
import toast from 'react-hot-toast';
import { designationApi, type Designation } from '../../../../lib/api/designation';

export default function DesignationsPage() {
    const [designations, setDesignations] = useState<Designation[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [addModal, setAddModal] = useState(false);
    const [updateModal, setUpdateModal] = useState<{
        isOpen: boolean;
        designationId: string | null;
    }>({ isOpen: false, designationId: null });
    const [deleteDialog, setDeleteDialog] = useState<{
        isOpen: boolean;
        designation: Designation | null;
    }>({ isOpen: false, designation: null });
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

    // Fetch designations from backend
    useEffect(() => {
        const fetchDesignations = async () => {
            setLoading(true);
            setError(null);
            try {
                const statusValues = filters.isActive || [];
                const isActive = statusValues.length === 1 ? statusValues[0] === 'true' : undefined;
                const response = await designationApi.getDesignations({
                    search: debouncedSearch.trim() || undefined,
                    isActive,
                    page,
                    limit,
                    sortBy,
                    sortOrder,
                });
                setDesignations(response.data);
                setTotal(response.meta?.total || response.data.length);
                setTotalPages(response.meta?.totalPages || 1);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to fetch designations');
                console.error('Error fetching designations:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchDesignations();
    }, [refreshTrigger, page, limit, filters, sortBy, sortOrder, debouncedSearch]);

    // Calculate stats
    const stats = useMemo(() => {
        const totalCount = total || designations.length;
        const active = designations.filter((d) => d.isActive).length;
        const inactive = designations.filter((d) => !d.isActive).length;

        return [
            {
                label: 'Total Designations',
                value: totalCount,
                iconBgColor: 'purple' as const,
                icon: <Briefcase className="h-4 w-4" />,
            },
            {
                label: 'Active Designations',
                value: active,
                iconBgColor: 'green' as const,
                icon: <CheckCircle2 className="h-4 w-4" />,
            },
            {
                label: 'Inactive Designations',
                value: inactive,
                iconBgColor: 'gray' as const,
                icon: <XCircle className="h-4 w-4" />,
            },
        ];
    }, [designations]);

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

    const columns: Column<Designation>[] = [
        {
            key: 'name',
            header: 'Designation Name',
            sortable: true,
            render: (designation) => (
                <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center mr-3">
                        <span className="text-purple-600 font-semibold text-sm">
                            {designation.name.charAt(0).toUpperCase()}
                        </span>
                    </div>
                    <div>
                        <div className="font-medium text-gray-900">{designation.name}</div>
                        {designation.description && (
                            <div className="text-xs text-gray-500 line-clamp-1">{designation.description}</div>
                        )}
                    </div>
                </div>
            ),
        },
        {
            key: 'code',
            header: 'Code',
            sortable: true,
            render: (designation) => (
                <span className="font-mono text-sm text-gray-600">{designation.code || '-'}</span>
            ),
        },
        {
            key: 'isActive',
            header: 'Status',
            sortable: true,
            render: (designation) => getStatusBadge(designation.isActive),
        },
        {
            key: 'createdAt',
            header: 'Created',
            sortable: true,
            render: (designation) => (
                <span className="text-gray-600">
                    {new Date(designation.createdAt).toLocaleDateString()}
                </span>
            ),
        },
    ];

    const handleRowClick = (designation: Designation) => {
        console.log('Clicked designation:', designation);
        // Navigate to designation details page
    };

    const handleEdit = (designation: Designation) => {
        setUpdateModal({ isOpen: true, designationId: designation.id });
    };

    const handleUpdateSuccess = () => {
        setRefreshTrigger((prev) => prev + 1);
    };

    const handleDeleteClick = (designation: Designation) => {
        setDeleteDialog({ isOpen: true, designation });
    };

    const handleDeleteConfirm = async () => {
        if (!deleteDialog.designation) return;

        setDeleting(true);
        try {
            await designationApi.deleteDesignation(deleteDialog.designation.id);
            toast.success(`Designation "${deleteDialog.designation.name}" deleted successfully`);
            setDeleteDialog({ isOpen: false, designation: null });
            setRefreshTrigger((prev) => prev + 1);
        } catch (err) {
            toast.error(
                err instanceof Error ? err.message : 'Failed to delete designation'
            );
        } finally {
            setDeleting(false);
        }
    };

    const handleDeleteCancel = () => {
        setDeleteDialog({ isOpen: false, designation: null });
    };

    const actions = (designation: Designation) => (
        <>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(designation);
                }}
                className="text-blue-600 hover:text-blue-900 transition-colors"
                title="Edit"
            >
                <Pencil className="w-4 h-4" />
            </button>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteClick(designation);
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
                    title="Designations"
                    description="Manage your company's job designations and positions"
                    actions={
                        <AddButton
                            label="Add Designation"
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
                    data={designations}
                    columns={columns}
                    onRowClick={handleRowClick}
                    actions={actions}
                    searchable={true}
                    searchPlaceholder="Search designations by name, code, or description..."
                    emptyMessage={loading ? 'Loading designations...' : 'No designations found'}
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

                {/* Add Designation Modal */}
                <AddDesignationModal
                    isOpen={addModal}
                    onClose={() => setAddModal(false)}
                    onSuccess={handleUpdateSuccess}
                />

                {/* Update Designation Modal */}
                <UpdateDesignationModal
                    isOpen={updateModal.isOpen}
                    onClose={() => setUpdateModal({ isOpen: false, designationId: null })}
                    designationId={updateModal.designationId}
                    onSuccess={handleUpdateSuccess}
                />

                {/* Delete Confirmation Dialog */}
                <DeleteConfirmDialog
                    isOpen={deleteDialog.isOpen}
                    onClose={handleDeleteCancel}
                    onConfirm={handleDeleteConfirm}
                    title="Delete Designation"
                    message="Are you sure you want to delete this designation? This action cannot be undone."
                    itemName={deleteDialog.designation?.name}
                    loading={deleting}
                />
            </div>
        </DashboardLayout>
    );
}
