'use client';

import { useEffect, useMemo, useState } from 'react';
import { Ban, CheckCircle2, Eye, Pencil, UserCheck, UserX, Users } from 'lucide-react';
import DashboardLayout from '../../../../components/DashboardLayout';
import { DataTable, Column } from '../../../../components/DataTable';
import { StatsGrid } from '../../../../components/StatsGrid';
import { PageHeader } from '../../../../components/PageHeader';
import { AddButton } from '../../../../components/AddButton';
import { DeleteConfirmDialog } from '../../../../components/DeleteConfirmDialog';
import { AddCompanyUserModal } from '../../../../components/AddCompanyUserModal';
import { UpdateCompanyUserModal } from '../../../../components/UpdateCompanyUserModal';
import { ViewCompanyUserModal } from '../../../../components/ViewCompanyUserModal';
import toast from 'react-hot-toast';
import { companyUserApi, type CompanyUser, type CompanyUserRole } from '../../../../lib/api/company-users';
import { API_BASE_URL } from '../../../../lib/api/types';

const roleLabels: Record<CompanyUserRole, string> = {
  hr_manager: 'HR Manager',
  manager: 'Manager',
  employee: 'Employee',
};

export default function CompanyUsersPage() {
  const [users, setUsers] = useState<CompanyUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [viewModal, setViewModal] = useState<{ isOpen: boolean; user: CompanyUser | null }>({
    isOpen: false,
    user: null,
  });
  const [updateModal, setUpdateModal] = useState<{ isOpen: boolean; user: CompanyUser | null }>({
    isOpen: false,
    user: null,
  });
  const [statusDialog, setStatusDialog] = useState<{ isOpen: boolean; user: CompanyUser | null }>({
    isOpen: false,
    user: null,
  });
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [nextStatus, setNextStatus] = useState<'active' | 'inactive'>('inactive');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, string[]>>({});

  useEffect(() => {
    const handle = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);

    return () => clearTimeout(handle);
  }, [search]);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      setError(null);
      try {
        const statusValues = filters.status || [];
        const roleValues = filters.role || [];
        const isActive = statusValues.length === 1 ? statusValues[0] === 'active' : undefined;
        const role = roleValues.length === 1 ? (roleValues[0] as CompanyUserRole) : undefined;

        const response = await companyUserApi.getCompanyUsers({
          search: debouncedSearch.trim() || undefined,
          page,
          limit,
          isActive,
          role,
        });

        setUsers(response.data);
        setTotal(response.meta?.total || response.data.length);
        setTotalPages(response.meta?.totalPages || 1);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch users');
        console.error('Error fetching users:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [page, limit, debouncedSearch, filters, refreshTrigger]);

  const stats = useMemo(() => {
    const totalCount = total || users.length;
    const active = users.filter((u) => u.isActive).length;
    const inactive = users.filter((u) => !u.isActive).length;

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
  }, [users, total]);

  const getStatusBadge = (isActive: boolean) => (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
      }`}
    >
      {isActive ? 'Active' : 'Inactive'}
    </span>
  );

  const getRoleBadge = (role: CompanyUserRole) => {
    const roleStyles: Record<CompanyUserRole, string> = {
      hr_manager: 'bg-green-100 text-green-800',
      manager: 'bg-orange-100 text-orange-800',
      employee: 'bg-gray-100 text-gray-800',
    };

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          roleStyles[role] || roleStyles.employee
        }`}
      >
        {roleLabels[role]}
      </span>
    );
  };

  const columns: Column<CompanyUser>[] = [
    {
      key: 'fullName',
      header: 'Name',
      sortable: false,
      render: (user) => {
        const name = user.fullName || user.email;
        const avatarUrl = user.avatarUrl
          ? user.avatarUrl.startsWith('http')
            ? user.avatarUrl
            : `${API_BASE_URL}/uploads/${user.avatarUrl}`
          : null;

        return (
          <div className="flex items-center">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={name}
                className="w-10 h-10 rounded-full object-cover border border-gray-200 mr-3"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                <span className="text-blue-600 font-semibold text-sm">
                  {name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <div className="font-medium text-gray-900">{name}</div>
              <div className="text-xs text-gray-500">{user.email}</div>
            </div>
          </div>
        );
      },
    },
    {
      key: 'role',
      header: 'Role',
      sortable: false,
      render: (user) => getRoleBadge(user.role),
    },
    {
      key: 'phone',
      header: 'Phone',
      sortable: false,
      render: (user) => <span className="text-gray-700">{user.phone || '-'}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      sortable: false,
      render: (user) => getStatusBadge(user.isActive),
    },
    {
      key: 'createdAt',
      header: 'Created',
      sortable: false,
      render: (user) => (
        <span className="text-gray-600">
          {new Date(user.createdAt).toLocaleDateString()}
        </span>
      ),
    },
  ];

  const handleView = (user: CompanyUser) => {
    setViewModal({ isOpen: true, user });
  };

  const handleEdit = (user: CompanyUser) => {
    setUpdateModal({ isOpen: true, user });
  };

  const handleStatusClick = (user: CompanyUser) => {
    setNextStatus(user.isActive ? 'inactive' : 'active');
    setStatusDialog({ isOpen: true, user });
  };

  const handleStatusConfirm = async () => {
    if (!statusDialog.user) return;

    setUpdatingStatus(true);
    try {
      await companyUserApi.updateCompanyUser(statusDialog.user.id, {
        isActive: nextStatus === 'active',
      });
      const actionLabel = nextStatus === 'active' ? 'activated' : 'deactivated';
      toast.success(`User "${statusDialog.user.fullName || statusDialog.user.email}" ${actionLabel} successfully`);
      setStatusDialog({ isOpen: false, user: null });
      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update user');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleStatusCancel = () => {
    setStatusDialog({ isOpen: false, user: null });
  };

  const actions = (user: CompanyUser) => (
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
          user.isActive
            ? 'text-yellow-600 hover:text-yellow-900 transition-colors'
            : 'text-green-600 hover:text-green-900 transition-colors'
        }
        title={user.isActive ? 'Deactivate' : 'Activate'}
      >
        {user.isActive ? <Ban className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
      </button>
    </>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Users"
          description="Manage users in your company"
          actions={<AddButton label="Add User" onClick={() => setAddModalOpen(true)} />}
        />

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <StatsGrid stats={stats} columns={3} />

        <DataTable
          data={users}
          columns={columns}
          actions={actions}
          searchable={true}
          searchPlaceholder="Search users by name, email, or phone..."
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
          onSearchChange={(query) => {
            setSearch(query);
          }}
          onFilterChange={(nextFilters) => {
            setFilters(nextFilters);
            setPage(1);
          }}
          filters={[
            {
              key: 'role',
              label: 'Role',
              type: 'multiselect',
              options: [
                { value: 'hr_manager', label: 'HR Manager' },
                { value: 'manager', label: 'Manager' },
                { value: 'employee', label: 'Employee' },
              ],
            },
            {
              key: 'status',
              label: 'Status',
              type: 'multiselect',
              options: [
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
              ],
            },
          ]}
        />
      </div>

      <AddCompanyUserModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSuccess={() => {
          toast.success('User created successfully');
          setRefreshTrigger((prev) => prev + 1);
        }}
      />

      <UpdateCompanyUserModal
        isOpen={updateModal.isOpen}
        onClose={() => setUpdateModal({ isOpen: false, user: null })}
        onSuccess={() => {
          toast.success('User updated successfully');
          setRefreshTrigger((prev) => prev + 1);
        }}
        user={updateModal.user}
      />

      <ViewCompanyUserModal
        isOpen={viewModal.isOpen}
        onClose={() => setViewModal({ isOpen: false, user: null })}
        user={viewModal.user}
      />

      <DeleteConfirmDialog
        isOpen={statusDialog.isOpen}
        onClose={handleStatusCancel}
        onConfirm={handleStatusConfirm}
        title={nextStatus === 'active' ? 'Activate User' : 'Deactivate User'}
        itemName={
          statusDialog.user ? `${statusDialog.user.fullName || statusDialog.user.email}` : undefined
        }
        message={
          nextStatus === 'active'
            ? 'This will restore login access for this user.'
            : 'This will disable login access for this user. You can reactivate later.'
        }
        warningText={nextStatus === 'active' ? '' : 'You can reactivate the user later.'}
        confirmLabel={nextStatus === 'active' ? 'Activate' : 'Deactivate'}
        confirmVariant={nextStatus === 'active' ? 'blue' : 'red'}
        loading={updatingStatus}
        icon={
          nextStatus === 'active' ? <CheckCircle2 className="h-5 w-5" /> : <Ban className="h-5 w-5" />
        }
        iconBgClassName={nextStatus === 'active' ? 'bg-green-100' : 'bg-yellow-100'}
        iconTextClassName={nextStatus === 'active' ? 'text-green-600' : 'text-yellow-600'}
      />
    </DashboardLayout>
  );
}
