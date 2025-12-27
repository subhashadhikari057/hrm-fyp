'use client';

import { useState, useMemo, useEffect } from 'react';
import { Clock, Eye, Pencil, Trash2, UserCheck, UserX, Users } from 'lucide-react';
import DashboardLayout from '../../../../components/DashboardLayout';
import { DataTable, Column } from '../../../../components/DataTable';
import { StatsGrid } from '../../../../components/StatsGrid';
import { PageHeader } from '../../../../components/PageHeader';
import { AddButton } from '../../../../components/AddButton';
import { DeleteConfirmDialog } from '../../../../components/DeleteConfirmDialog';
import EmployeeViewModal from '../../../../components/EmployeeViewModal';
import { AddEmployeeModal } from '../../../../components/AddEmployeeModal';
import { UpdateEmployeeModal } from '../../../../components/UpdateEmployeeModal';
import toast from 'react-hot-toast';
import { employeeApi, type Employee } from '../../../../lib/api/employee';
import { departmentApi, type Department } from '../../../../lib/api/department';
import { designationApi, type Designation } from '../../../../lib/api/designation';
import { API_BASE_URL } from '../../../../lib/api/types';

export default function EmployeesPage() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [addModal, setAddModal] = useState(false);
    const [updateModal, setUpdateModal] = useState<{
        isOpen: boolean;
        employeeId: string | null;
    }>({ isOpen: false, employeeId: null });
    const [deleteDialog, setDeleteDialog] = useState<{
        isOpen: boolean;
        employee: Employee | null;
    }>({ isOpen: false, employee: null });
    const [viewModal, setViewModal] = useState<{
        isOpen: boolean;
        employee: Employee | null;
    }>({ isOpen: false, employee: null });
    const [deleting, setDeleting] = useState(false);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [filters, setFilters] = useState<Record<string, string[]>>({});
    const [sortBy, setSortBy] = useState<'createdAt' | 'firstName' | 'lastName' | 'employeeCode' | 'joinDate'>('createdAt');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [departments, setDepartments] = useState<Department[]>([]);
    const [designations, setDesignations] = useState<Designation[]>([]);

    useEffect(() => {
        const handle = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1);
        }, 400);

        return () => clearTimeout(handle);
    }, [search]);

    useEffect(() => {
        const fetchFilters = async () => {
            try {
                const [departmentsResponse, designationsResponse] = await Promise.all([
                    departmentApi.getDepartments({ isActive: true, page: 1, limit: 100 }),
                    designationApi.getDesignations({ isActive: true, page: 1, limit: 100 }),
                ]);
                setDepartments(departmentsResponse.data);
                setDesignations(designationsResponse.data);
            } catch (err) {
                console.error('Error fetching filter data:', err);
            }
        };

        fetchFilters();
    }, []);

    // Fetch employees from backend
    useEffect(() => {
        const fetchEmployees = async () => {
            setLoading(true);
            setError(null);
            try {
                const statusValues = filters.status || [];
                const employmentTypeValues = filters.employmentType || [];
                const departmentValues = filters.departmentId || [];
                const designationValues = filters.designationId || [];

                const response = await employeeApi.getEmployees({
                    search: debouncedSearch.trim() || undefined,
                    page,
                    limit,
                    status: statusValues.length === 1 ? (statusValues[0] as Employee['status']) : undefined,
                    employmentType:
                        employmentTypeValues.length === 1
                            ? (employmentTypeValues[0] as NonNullable<Employee['employmentType']>)
                            : undefined,
                    departmentId: departmentValues.length === 1 ? departmentValues[0] : undefined,
                    designationId: designationValues.length === 1 ? designationValues[0] : undefined,
                    sortBy,
                    sortOrder,
                });
                setEmployees(response.data);
                setTotal(response.meta?.total || response.data.length);
                setTotalPages(response.meta?.totalPages || 1);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to fetch employees');
                console.error('Error fetching employees:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchEmployees();
    }, [refreshTrigger, page, limit, debouncedSearch, filters, sortBy, sortOrder]);

    // Calculate stats
    const stats = useMemo(() => {
        const totalCount = total || employees.length;
        const active = employees.filter((e) => e.status === 'active').length;
        const onLeave = employees.filter((e) => e.status === 'on_leave').length;
        const terminated = employees.filter((e) => e.status === 'terminated').length;

        return [
            {
                label: 'Total Employees',
                value: totalCount,
                iconBgColor: 'indigo' as const,
                icon: <Users className="h-4 w-4" />,
            },
            {
                label: 'Active',
                value: active,
                iconBgColor: 'green' as const,
                icon: <UserCheck className="h-4 w-4" />,
            },
            {
                label: 'On Leave',
                value: onLeave,
                iconBgColor: 'yellow' as const,
                icon: <Clock className="h-4 w-4" />,
            },
            {
                label: 'Terminated',
                value: terminated,
                iconBgColor: 'red' as const,
                icon: <UserX className="h-4 w-4" />,
            },
        ];
    }, [employees]);

    const getStatusBadge = (status: string) => {
        const statusConfig = {
            active: 'bg-green-100 text-green-800',
            on_leave: 'bg-yellow-100 text-yellow-800',
            terminated: 'bg-red-100 text-red-800',
        };

        const label = status === 'on_leave' ? 'On Leave' : status.charAt(0).toUpperCase() + status.slice(1);

        return (
            <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig[status as keyof typeof statusConfig] || 'bg-gray-100 text-gray-800'
                    }`}
            >
                {label}
            </span>
        );
    };

    const getEmploymentTypeBadge = (type: string | null) => {
        if (!type) return '-';

        const typeConfig = {
            full_time: { label: 'Full-Time', color: 'bg-blue-50 text-blue-700 border border-blue-200' },
            part_time: { label: 'Part-Time', color: 'bg-purple-50 text-purple-700 border border-purple-200' },
            contract: { label: 'Contract', color: 'bg-orange-50 text-orange-700 border border-orange-200' },
            intern: { label: 'Intern', color: 'bg-pink-50 text-pink-700 border border-pink-200' },
        };

        const config = typeConfig[type as keyof typeof typeConfig];
        if (!config) return type;

        return (
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium ${config.color}`}>
                {config.label}
            </span>
        );
    };

    const columns: Column<Employee>[] = [
        {
            key: 'employeeCode',
            header: 'Employee',
            sortable: true,
            render: (employee) => {
                const fullName = `${employee.firstName} ${employee.middleName ? employee.middleName + ' ' : ''}${employee.lastName}`;
                const initial = `${employee.firstName.charAt(0)}${employee.lastName.charAt(0)}`.toUpperCase();
                const imageUrl = employee.imageUrl ? `${API_BASE_URL}/uploads/${employee.imageUrl}` : null;

                return (
                    <div className="flex items-center min-w-[200px]">
                        {imageUrl ? (
                            <img
                                src={imageUrl}
                                alt={fullName}
                                className="w-11 h-11 rounded-full object-cover mr-3 border-2 border-indigo-100"
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                    const fallback = target.nextElementSibling as HTMLElement;
                                    if (fallback) fallback.style.display = 'flex';
                                }}
                            />
                        ) : null}
                        <div
                            className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center mr-3 shadow-sm"
                            style={{ display: imageUrl ? 'none' : 'flex' }}
                        >
                            <span className="text-white font-bold text-sm">{initial}</span>
                        </div>
                        <div className="min-w-0">
                            <div className="text-gray-900 text-sm truncate">{fullName}</div>
                            <div className="text-xs text-gray-500 font-medium mt-0.5">{employee.employeeCode}</div>
                        </div>
                    </div>
                );
            },
        },
        {
            key: 'workEmail',
            header: 'Email',
            sortable: true,
            render: (employee) => (
                <span className="text-sm text-gray-700 font-medium">
                    {employee.workEmail || employee.user?.email || '-'}
                </span>
            ),
        },
        {
            key: 'department',
            header: 'Department',
            sortable: false,
            render: (employee) => (
                <div className="text-sm">
                    <span className="text-gray-900 font-medium">{employee.department?.name || '-'}</span>
                    {employee.department?.code && (
                        <span className="ml-1.5 text-xs text-gray-500 font-mono">({employee.department.code})</span>
                    )}
                </div>
            ),
        },
        {
            key: 'designation',
            header: 'Designation',
            sortable: false,
            render: (employee) => (
                <div className="text-sm">
                    <span className="text-gray-900 font-medium">{employee.designation?.name || '-'}</span>
                    {employee.designation?.code && (
                        <span className="ml-1.5 text-xs text-gray-500 font-mono">({employee.designation.code})</span>
                    )}
                </div>
            ),
        },
        {
            key: 'status',
            header: 'Status',
            sortable: true,
            render: (employee) => getStatusBadge(employee.status),
        },
        {
            key: 'joinDate',
            header: 'Join Date',
            sortable: true,
            render: (employee) => (
                <span className="text-gray-600">
                    {employee.joinDate ? new Date(employee.joinDate).toLocaleDateString() : '-'}
                </span>
            ),
        },
    ];

    const handleRowClick = (employee: Employee) => {
        setViewModal({ isOpen: true, employee });
    };

    const handleViewClick = (employee: Employee) => {
        setViewModal({ isOpen: true, employee });
    };

    const handleViewClose = () => {
        setViewModal({ isOpen: false, employee: null });
    };

    const handleEdit = (employee: Employee) => {
        setUpdateModal({ isOpen: true, employeeId: employee.id });
    };

    const handleUpdateSuccess = () => {
        setRefreshTrigger((prev) => prev + 1);
    };

    const handleDeleteClick = (employee: Employee) => {
        setDeleteDialog({ isOpen: true, employee });
    };

    const handleDeleteConfirm = async () => {
        if (!deleteDialog.employee) return;

        setDeleting(true);
        try {
            await employeeApi.deleteEmployee(deleteDialog.employee.id);
            const fullName = `${deleteDialog.employee.firstName} ${deleteDialog.employee.lastName}`;
            toast.success(`Employee "${fullName}" deleted successfully`);
            setDeleteDialog({ isOpen: false, employee: null });
            setRefreshTrigger((prev) => prev + 1);
        } catch (err) {
            toast.error(
                err instanceof Error ? err.message : 'Failed to delete employee'
            );
        } finally {
            setDeleting(false);
        }
    };

    const handleDeleteCancel = () => {
        setDeleteDialog({ isOpen: false, employee: null });
    };

    const actions = (employee: Employee) => (
        <>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    handleViewClick(employee);
                }}
                className="text-indigo-600 hover:text-indigo-900 transition-colors"
                title="View Details"
            >
                <Eye className="w-4 h-4" />
            </button>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(employee);
                }}
                className="text-blue-600 hover:text-blue-900 transition-colors"
                title="Edit"
            >
                <Pencil className="w-4 h-4" />
            </button>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteClick(employee);
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
                    title="Employees"
                    description="Manage your company's employees and their information"
                    actions={
                        <AddButton
                            label="Add Employee"
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
                <StatsGrid stats={stats} columns={4} />

                {/* Data Table */}
                <DataTable
                    data={employees}
                    columns={columns}
                    onRowClick={handleRowClick}
                    actions={actions}
                    searchable={true}
                    searchPlaceholder="Search employees by name, code, or email..."
                    emptyMessage={loading ? 'Loading employees...' : 'No employees found'}
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
                    onSortChange={(key, direction) => {
                        const sortMap: Record<string, typeof sortBy> = {
                            employeeCode: 'employeeCode',
                            joinDate: 'joinDate',
                        };
                        const mappedKey = sortMap[key];
                        if (!mappedKey) return;
                        setSortBy(mappedKey);
                        setSortOrder(direction);
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
                            key: 'status',
                            label: 'Status',
                            type: 'multiselect',
                            options: [
                                { value: 'active', label: 'Active' },
                                { value: 'on_leave', label: 'On Leave' },
                                { value: 'terminated', label: 'Terminated' },
                            ],
                        },
                        {
                            key: 'employmentType',
                            label: 'Employment Type',
                            type: 'multiselect',
                            options: [
                                { value: 'full_time', label: 'Full-Time' },
                                { value: 'part_time', label: 'Part-Time' },
                                { value: 'contract', label: 'Contract' },
                                { value: 'intern', label: 'Intern' },
                            ],
                        },
                        {
                            key: 'departmentId',
                            label: 'Department',
                            type: 'multiselect',
                            options: departments.map((department) => ({
                                value: department.id,
                                label: department.name,
                            })),
                        },
                        {
                            key: 'designationId',
                            label: 'Designation',
                            type: 'multiselect',
                            options: designations.map((designation) => ({
                                value: designation.id,
                                label: designation.name,
                            })),
                        },
                    ]}
                />

                {/* View Modal */}
                <EmployeeViewModal
                    isOpen={viewModal.isOpen}
                    onClose={handleViewClose}
                    employee={viewModal.employee}
                />

                {/* Add Modal */}
                <AddEmployeeModal
                    isOpen={addModal}
                    onClose={() => setAddModal(false)}
                    onSuccess={handleUpdateSuccess}
                />

                {/* Update Modal */}
                <UpdateEmployeeModal
                    isOpen={updateModal.isOpen}
                    onClose={() => setUpdateModal({ isOpen: false, employeeId: null })}
                    employeeId={updateModal.employeeId}
                    onSuccess={handleUpdateSuccess}
                />

                {/* Delete Confirmation Dialog */}
                <DeleteConfirmDialog
                    isOpen={deleteDialog.isOpen}
                    onClose={handleDeleteCancel}
                    onConfirm={handleDeleteConfirm}
                    title="Delete Employee"
                    message="Are you sure you want to delete this employee? This action cannot be undone and will also delete the associated user account."
                    itemName={
                        deleteDialog.employee
                            ? `${deleteDialog.employee.firstName} ${deleteDialog.employee.lastName}`
                            : undefined
                    }
                    loading={deleting}
                />
            </div>
        </DashboardLayout>
    );
}
