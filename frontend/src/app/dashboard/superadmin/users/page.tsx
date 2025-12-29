'use client';

import { useState, useMemo, useEffect } from 'react';
import { Ban, CheckCircle2, Eye, Pencil, UserCheck, UserX, Users } from 'lucide-react';
import DashboardLayout from '../../../../components/DashboardLayout';
import { DataTable, Column, FilterOption } from '../../../../components/DataTable';
import { StatsGrid } from '../../../../components/StatsGrid';
import { PageHeader } from '../../../../components/PageHeader';
import { AddButton } from '../../../../components/AddButton';
import { AddUserModal } from '../../../../components/AddUserModal';
import { UpdateUserModal } from '../../../../components/UpdateUserModal';
import { ViewUserModal } from '../../../../components/ViewUserModal';
import { DeleteConfirmDialog } from '../../../../components/DeleteConfirmDialog';
import toast from 'react-hot-toast';
import { superadminApi, type User, type BackendUserRole } from '../../../../lib/api/superadmin';
import { API_BASE_URL } from '../../../../lib/api/types';

// Frontend user type (mapped from backend)
interface FrontendUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive';
  company?: string;
  createdAt: string;
  avatarUrl?: string | null;
}

// Map backend role to display role
function mapRoleToDisplay(role: BackendUserRole): string {
  const roleMap: Record<BackendUserRole, string> = {
    super_admin: 'Super Admin',
    company_admin: 'Company Admin',
    hr_manager: 'HR Manager',
    manager: 'Manager',
    employee: 'Employee',
  };
  return roleMap[role] || role;
}

export default function UsersPage() {
  const [users, setUsers] = useState<FrontendUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [statusDialog, setStatusDialog] = useState<{
    isOpen: boolean;
    user: FrontendUser | null;
  }>({ isOpen: false, user: null });
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [nextStatus, setNextStatus] = useState<'active' | 'inactive'>('inactive');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, string[]>>({});
  const [sortBy, setSortBy] = useState<'createdAt' | 'email' | 'fullName' | 'lastLoginAt' | 'updatedAt'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    const handle = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);

    return () => clearTimeout(handle);
  }, [search]);

  // Fetch users from backend
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      setError(null);
      try {
        const statusValues = filters.status || [];
        const roleValue = filters.role?.[0] as BackendUserRole | undefined;
        const isActive =
          statusValues.length === 1 ? statusValues[0] === 'active' : undefined;

        const response = await superadminApi.getUsers({
          search: debouncedSearch.trim() || undefined,
          page,
          limit,
          role: roleValue,
          isActive,
          sortBy,
          sortOrder,
        });

        // Map backend users to frontend format
        const mappedUsers: FrontendUser[] = response.data.map((user) => ({
          id: user.id,
          name: user.fullName || user.email,
          email: user.email,
          role: mapRoleToDisplay(user.role),
          status: user.isActive ? 'active' : 'inactive',
          company: user.company?.name || undefined,
          createdAt: user.createdAt,
          avatarUrl: user.avatarUrl || null,
        }));

        setUsers(mappedUsers);
        setTotal(response.meta.total);
        setTotalPages(response.meta.totalPages);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch users');
        console.error('Error fetching users:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [refreshTrigger, page, limit, debouncedSearch, filters, sortBy, sortOrder]);

  // Calculate stats
  const stats = useMemo(() => {
    const totalCount = total || users.length;
    const active = users.filter((u) => u.status === 'active').length;
    const inactive = users.filter((u) => u.status === 'inactive').length;

    return [
      {
        label: 'Total Users',
        value: totalCount,
        iconBgColor: 'blue' as const,
        icon: <Users className="h-4 w-4" />,
      },
      {
        label: 'Active Users',
        value: active,
        iconBgColor: 'green' as const,
        icon: <UserCheck className="h-4 w-4" />,
      },
      {
        label: 'Inactive Users',
        value: inactive,
        iconBgColor: 'gray' as const,
        icon: <UserX className="h-4 w-4" />,
      },
    ];
  }, [users]);

  const getStatusBadge = (status: string) => {
    const statusStyles = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      suspended: 'bg-yellow-100 text-yellow-800',
    };

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[status as keyof typeof statusStyles] || statusStyles.active
          }`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getRoleBadge = (role: string) => {
    const roleStyles: Record<string, string> = {
      'Super Admin': 'bg-purple-100 text-purple-800',
      'Company Admin': 'bg-blue-100 text-blue-800',
      'HR Manager': 'bg-green-100 text-green-800',
      Manager: 'bg-orange-100 text-orange-800',
      Employee: 'bg-gray-100 text-gray-800',
    };

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleStyles[role] || roleStyles.Employee
          }`}
      >
        {role}
      </span>
    );
  };

  const handleAddUserSuccess = () => {
    setRefreshTrigger((prev) => prev + 1);
    toast.success('User created successfully');
  };

  const handleUpdateUserSuccess = () => {
    setRefreshTrigger((prev) => prev + 1);
    toast.success('User updated successfully');
  };

  const handleStatusClick = (user: FrontendUser) => {
    setNextStatus(user.status === 'active' ? 'inactive' : 'active');
    setStatusDialog({ isOpen: true, user });
  };

  const handleStatusConfirm = async () => {
    if (!statusDialog.user) return;

    setUpdatingStatus(true);
    try {
      await superadminApi.updateUser(statusDialog.user.id, {
        isActive: nextStatus === 'active',
      });
      const actionLabel = nextStatus === 'active' ? 'activated' : 'deactivated';
      toast.success(`User "${statusDialog.user.name}" ${actionLabel} successfully`);
      setStatusDialog({ isOpen: false, user: null });
      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to update user'
      );
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleStatusCancel = () => {
    setStatusDialog({ isOpen: false, user: null });
  };

  const columns: Column<FrontendUser>[] = [
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      render: (user) => (
        <div className="flex items-center">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl.startsWith('http') ? user.avatarUrl : `${API_BASE_URL}/uploads/${user.avatarUrl}`}
              alt={user.name}
              className="w-10 h-10 rounded-full object-cover border border-gray-200 mr-3"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
              <span className="text-blue-600 font-semibold text-sm">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div>
            <div className="font-medium text-gray-900">{user.name}</div>
            <div className="text-xs text-gray-500">{user.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      sortable: false,
      render: (user) => getRoleBadge(user.role),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: false,
      render: (user) => getStatusBadge(user.status),
    },
    {
      key: 'company',
      header: 'Company',
      sortable: false,
      render: (user) => (
        <span className="text-gray-900">{user.company || '-'}</span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Created',
      sortable: true,
      render: (user) => (
        <span className="text-gray-600">
          {new Date(user.createdAt).toLocaleDateString()}
        </span>
      ),
    },
  ];

  const handleView = (user: FrontendUser) => {
    setSelectedUserId(user.id);
    setIsViewModalOpen(true);
  };

  const handleEdit = (user: FrontendUser) => {
    setSelectedUserId(user.id);
    setIsUpdateModalOpen(true);
  };


  const actions = (user: FrontendUser) => (
    <>
      <button
        onClick={() => handleView(user)}
        className="text-green-600 hover:text-green-900 transition-colors"
        title="View"
      >
        <Eye className="w-4 h-4" />
      </button>
      <button
        onClick={() => handleEdit(user)}
        className="text-blue-600 hover:text-blue-900 transition-colors"
        title="Edit"
      >
        <Pencil className="w-4 h-4" />
      </button>
      <button
        onClick={() => handleStatusClick(user)}
        className={
          user.status === 'active'
            ? 'text-yellow-600 hover:text-yellow-900 transition-colors'
            : 'text-green-600 hover:text-green-900 transition-colors'
        }
        title={user.status === 'active' ? 'Deactivate' : 'Activate'}
      >
        {user.status === 'active' ? <Ban className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
      </button>
    </>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Users"
          description="Manage all users in the system"
          actions={
            <AddButton
              label="Add User"
              onClick={() => setIsModalOpen(true)}
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
          data={users}
          columns={columns}
          actions={actions}
          searchable={true}
          searchPlaceholder="Search users by name, email, or company..."
          emptyMessage={loading ? 'Loading users...' : 'No users found'}
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
            const sortMap: Record<string, 'createdAt' | 'fullName'> = {
              name: 'fullName',
              createdAt: 'createdAt',
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
                { value: 'inactive', label: 'Inactive' },
              ],
            },
            {
              key: 'role',
              label: 'Role',
              type: 'select',
              options: [
                { value: 'super_admin', label: 'Super Admin' },
                { value: 'company_admin', label: 'Company Admin' },
                { value: 'hr_manager', label: 'HR Manager' },
                { value: 'manager', label: 'Manager' },
                { value: 'employee', label: 'Employee' },
              ],
            },
          ]}
        />

        {/* Add User Modal */}
        <AddUserModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleAddUserSuccess}
        />

        {/* Update User Modal */}
        <UpdateUserModal
          isOpen={isUpdateModalOpen}
          onClose={() => {
            setIsUpdateModalOpen(false);
            setSelectedUserId(null);
          }}
          onSuccess={handleUpdateUserSuccess}
          userId={selectedUserId}
        />

        {/* View User Modal */}
        <ViewUserModal
          isOpen={isViewModalOpen}
          onClose={() => {
            setIsViewModalOpen(false);
            setSelectedUserId(null);
          }}
          userId={selectedUserId}
        />

        {/* Delete Confirmation Dialog */}
        <DeleteConfirmDialog
          isOpen={statusDialog.isOpen}
          onClose={handleStatusCancel}
          onConfirm={handleStatusConfirm}
          title={nextStatus === 'active' ? 'Activate User' : 'Deactivate User'}
          message={
            nextStatus === 'active'
              ? 'This will restore access for this user.'
              : 'This will disable login access for this user. You can reactivate later.'
          }
          warningText={nextStatus === 'active' ? '' : 'You can reactivate the user later.'}
          itemName={statusDialog.user ? `${statusDialog.user.name} (${statusDialog.user.email})` : undefined}
          confirmLabel={nextStatus === 'active' ? 'Activate' : 'Deactivate'}
          confirmVariant={nextStatus === 'active' ? 'blue' : 'red'}
          loading={updatingStatus}
        />
      </div>
    </DashboardLayout>
  );
}
