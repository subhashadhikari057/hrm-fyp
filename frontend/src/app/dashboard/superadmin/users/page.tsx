'use client';

import { useState, useMemo, useEffect } from 'react';
import DashboardLayout from '../../../../components/DashboardLayout';
import { DataTable, Column, FilterOption } from '../../../../components/DataTable';
import { StatsGrid } from '../../../../components/StatsGrid';
import { PageHeader } from '../../../../components/PageHeader';
import { AddButton } from '../../../../components/AddButton';
import { AddUserModal } from '../../../../components/AddUserModal';
import { UpdateUserModal } from '../../../../components/UpdateUserModal';
import { ViewUserModal } from '../../../../components/ViewUserModal';
import { DeleteConfirmDialog } from '../../../../components/DeleteConfirmDialog';
import { useToast } from '../../../../contexts/ToastContext';
import { superadminApi, type User, type BackendUserRole } from '../../../../lib/api/superadmin';

// Frontend user type (mapped from backend)
interface FrontendUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive';
  company?: string;
  createdAt: string;
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
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    user: FrontendUser | null;
  }>({ isOpen: false, user: null });
  const [deleting, setDeleting] = useState(false);
  const { showToast } = useToast();

  // Fetch users from backend
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await superadminApi.getUsers({
          page: 1,
          limit: 100, // Get all users for now
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
        }));

        setUsers(mappedUsers);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch users');
        console.error('Error fetching users:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [refreshTrigger]);

  // Calculate stats
  const stats = useMemo(() => {
    const total = users.length;
    const active = users.filter((u) => u.status === 'active').length;
    const inactive = users.filter((u) => u.status === 'inactive').length;

    return [
      {
        label: 'Total Users',
        value: total,
        iconBgColor: 'blue' as const,
        icon: (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
        ),
      },
      {
        label: 'Active Users',
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
        label: 'Inactive Users',
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
    showToast('User created successfully', 'success');
  };

  const handleUpdateUserSuccess = () => {
    setRefreshTrigger((prev) => prev + 1);
    showToast('User updated successfully', 'success');
  };

  const handleDeleteClick = (user: FrontendUser) => {
    setDeleteDialog({ isOpen: true, user });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.user) return;

    setDeleting(true);
    try {
      await superadminApi.deleteUser(deleteDialog.user.id);
      showToast(`User "${deleteDialog.user.name}" deleted successfully`, 'success');
      setDeleteDialog({ isOpen: false, user: null });
      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Failed to delete user',
        'error'
      );
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialog({ isOpen: false, user: null });
  };

  const columns: Column<FrontendUser>[] = [
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      render: (user) => (
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
            <span className="text-blue-600 font-semibold text-sm">
              {user.name.charAt(0).toUpperCase()}
            </span>
          </div>
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
      sortable: true,
      render: (user) => getRoleBadge(user.role),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (user) => getStatusBadge(user.status),
    },
    {
      key: 'company',
      header: 'Company',
      sortable: true,
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

  const handleRowClick = (user: FrontendUser) => {
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
        onClick={() => handleEdit(user)}
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
        onClick={() => handleDeleteClick(user)}
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
          onRowClick={handleRowClick}
          actions={actions}
          searchable={true}
          searchPlaceholder="Search users by name, email, or company..."
          emptyMessage={loading ? 'Loading users...' : 'No users found'}
          loading={loading}
          filters={[
            {
              key: 'status',
              label: 'Status',
              type: 'multiselect',
              options: [
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
              ],
              getValue: (user) => user.status,
            },
            {
              key: 'role',
              label: 'Role',
              type: 'select',
              options: [
                { value: 'Super Admin', label: 'Super Admin' },
                { value: 'Company Admin', label: 'Company Admin' },
                { value: 'HR Manager', label: 'HR Manager' },
                { value: 'Manager', label: 'Manager' },
                { value: 'Employee', label: 'Employee' },
              ],
              getValue: (user) => user.role,
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
          isOpen={deleteDialog.isOpen}
          onClose={handleDeleteCancel}
          onConfirm={handleDeleteConfirm}
          title="Delete User"
          message="Are you sure you want to delete this user? This action cannot be undone."
          itemName={deleteDialog.user ? `${deleteDialog.user.name} (${deleteDialog.user.email})` : undefined}
          loading={deleting}
        />
      </div>
    </DashboardLayout>
  );
}

