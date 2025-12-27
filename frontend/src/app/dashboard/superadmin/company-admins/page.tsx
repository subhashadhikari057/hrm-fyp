'use client';

import { useState, useMemo, useEffect } from 'react';
import { Ban, CheckCircle2, Eye, Pencil, UserCheck, UserCog, UserX, Users } from 'lucide-react';
import DashboardLayout from '../../../../components/DashboardLayout';
import { DataTable, Column } from '../../../../components/DataTable';
import { StatsGrid } from '../../../../components/StatsGrid';
import { PageHeader } from '../../../../components/PageHeader';
import { DeleteConfirmDialog } from '../../../../components/DeleteConfirmDialog';
import { ViewCompanyAdminModal } from '../../../../components/ViewCompanyAdminModal';
import { UpdateUserModal } from '../../../../components/UpdateUserModal';
import toast from 'react-hot-toast';
import { companyApi } from '../../../../lib/api/company';
import { API_BASE_URL } from '../../../../lib/api/types';
import { type User } from '../../../../lib/api/superadmin';

// Company Admin data type (mapped from backend)
interface CompanyAdmin {
  id: string;
  name: string;
  email: string;
  company: string;
  companyCode: string;
  status: 'active' | 'inactive';
  employeeCount: number;
  createdAt: string;
  avatarUrl?: string | null;
}

export default function CompanyAdminsPage() {
  const [companyAdmins, setCompanyAdmins] = useState<CompanyAdmin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [adminToUpdate, setAdminToUpdate] = useState<CompanyAdmin | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [nextStatus, setNextStatus] = useState<'active' | 'inactive'>('inactive');
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedAdminId, setSelectedAdminId] = useState<string | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedEditId, setSelectedEditId] = useState<string | null>(null);
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

  const fetchCompanyAdmins = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const statusValues = filters.status || [];
      const isActive = statusValues.length === 1 ? statusValues[0] === 'active' : undefined;
      const response = await companyApi.getCompanyAdmins({
        search: debouncedSearch.trim() || undefined,
        page,
        limit,
        isActive,
        sortBy,
        sortOrder,
      });
      // Map backend users to frontend CompanyAdmin format
      const mappedAdmins: CompanyAdmin[] = response.data.map((user: User) => ({
        id: user.id,
        name: user.fullName || user.email,
        email: user.email,
        company: user.company?.name || '-',
        companyCode: user.company?.code || '-',
        status: user.isActive ? 'active' : 'inactive', // Map isActive to status
        employeeCount: 0, // Will be updated from company data if available
        createdAt: user.createdAt,
        avatarUrl: user.avatarUrl || null,
      }));

      // Fetch company data to get userCount (employee count) for each admin
      try {
        const companiesResponse = await companyApi.getCompanies({ page: 1, limit: 1000 });
        const companyMap = new Map(
          companiesResponse.data.map((company) => [company.id, company.userCount])
        );

        // Update employeeCount for each admin based on their company
        const adminsWithCounts = mappedAdmins.map((admin) => {
          const user = response.data.find((u: User) => u.id === admin.id);
          const companyId = user?.companyId;
          const employeeCount = companyId ? companyMap.get(companyId) || 0 : 0;
          return { ...admin, employeeCount };
        });

        setCompanyAdmins(adminsWithCounts);
      } catch (err) {
        // If company fetch fails, just use the admins without counts
        setCompanyAdmins(mappedAdmins);
      }
      setTotal(response.meta.total);
      setTotalPages(response.meta.totalPages);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch company admins');
      toast.error(err.message || 'Failed to fetch company admins');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanyAdmins();
  }, [page, limit, debouncedSearch, filters, sortBy, sortOrder]);

  // Calculate stats
  const stats = useMemo(() => {
    const totalCount = total || companyAdmins.length;
    const active = companyAdmins.filter((ca) => ca.status === 'active').length;
    const inactive = companyAdmins.filter((ca) => ca.status === 'inactive').length;
    const totalEmployees = companyAdmins.reduce((sum, ca) => sum + ca.employeeCount, 0);

    return [
      {
        label: 'Total Company Admins',
        value: totalCount,
        iconBgColor: 'blue' as const,
        icon: <UserCog className="h-4 w-4" />,
      },
      {
        label: 'Active Admins',
        value: active,
        iconBgColor: 'green' as const,
        icon: <UserCheck className="h-4 w-4" />,
      },
      {
        label: 'Inactive Admins',
        value: inactive,
        iconBgColor: 'gray' as const,
        icon: <UserX className="h-4 w-4" />,
      },
      {
        label: 'Total Employees',
        value: totalEmployees.toLocaleString(),
        iconBgColor: 'purple' as const,
        icon: <Users className="h-4 w-4" />,
      },
    ];
  }, [companyAdmins]);

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

  const columns: Column<CompanyAdmin>[] = [
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      render: (admin) => (
        <div className="flex items-center">
          {admin.avatarUrl ? (
            <img
              src={admin.avatarUrl.startsWith('http') ? admin.avatarUrl : `${API_BASE_URL}/uploads/${admin.avatarUrl}`}
              alt={admin.name}
              className="w-10 h-10 rounded-full object-cover border border-gray-200 mr-3"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
              <span className="text-blue-600 font-semibold text-sm">
                {admin.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div>
            <div className="font-medium text-gray-900">{admin.name}</div>
            <div className="text-xs text-gray-500">{admin.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'company',
      header: 'Company',
      sortable: true,
      render: (admin) => (
        <div>
          <div className="font-medium text-gray-900">{admin.company}</div>
          <div className="text-xs text-gray-500 font-mono">{admin.companyCode}</div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: false,
      render: (admin) => getStatusBadge(admin.status),
    },
    {
      key: 'employeeCount',
      header: 'Employees',
      sortable: false,
      render: (admin) => (
        <span className="text-gray-900">{admin.employeeCount}</span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Created',
      sortable: true,
      render: (admin) => (
        <span className="text-gray-600">
          {new Date(admin.createdAt).toLocaleDateString()}
        </span>
      ),
    },
  ];

  const handleView = (admin: CompanyAdmin) => {
    setSelectedAdminId(admin.id);
    setViewModalOpen(true);
  };

  const handleEdit = (admin: CompanyAdmin) => {
    setSelectedEditId(admin.id);
    setEditModalOpen(true);
  };

  const handleStatusClick = (admin: CompanyAdmin) => {
    setNextStatus(admin.status === 'active' ? 'inactive' : 'active');
    setAdminToUpdate(admin);
    setStatusDialogOpen(true);
  };

  const handleStatusConfirm = async () => {
    if (!adminToUpdate) return;

    setUpdatingStatus(true);
    try {
      await companyApi.updateCompanyAdminStatus(adminToUpdate.id, nextStatus === 'active');
      const actionLabel = nextStatus === 'active' ? 'activated' : 'deactivated';
      toast.success(`Company Admin "${adminToUpdate.name}" ${actionLabel} successfully`);
      fetchCompanyAdmins();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update company admin');
    } finally {
      setUpdatingStatus(false);
      setStatusDialogOpen(false);
      setAdminToUpdate(null);
    }
  };

  const handleStatusCancel = () => {
    setStatusDialogOpen(false);
    setAdminToUpdate(null);
  };

  const actions = (admin: CompanyAdmin) => (
    <>
      <button
        onClick={() => handleView(admin)}
        className="text-green-600 hover:text-green-900 transition-colors"
        title="View"
      >
        <Eye className="w-4 h-4" />
      </button>
      <button
        onClick={() => handleEdit(admin)}
        className="text-blue-600 hover:text-blue-900 transition-colors"
        title="Edit"
      >
        <Pencil className="w-4 h-4" />
      </button>
      <button
        onClick={() => handleStatusClick(admin)}
        className={
          admin.status === 'active'
            ? 'text-yellow-600 hover:text-yellow-900 transition-colors'
            : 'text-green-600 hover:text-green-900 transition-colors'
        }
        title={admin.status === 'active' ? 'Deactivate' : 'Activate'}
      >
        {admin.status === 'active' ? <Ban className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
      </button>
    </>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Company Admins"
          description="Manage all company administrators in the system"
        />

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Error!</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
        )}

        {/* Stats Cards */}
        <StatsGrid stats={stats} columns={4} />

        {/* Data Table */}
        <DataTable
          data={companyAdmins}
          columns={columns}
          actions={actions}
          searchable={true}
          searchPlaceholder="Search company admins by name, email, or company..."
          emptyMessage="No company admins found"
          loading={isLoading}
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
            const sortMap: Record<string, 'createdAt' | 'fullName' | 'email'> = {
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
          ]}
        />
      </div>

      {adminToUpdate && (
        <DeleteConfirmDialog
          isOpen={statusDialogOpen}
          onClose={handleStatusCancel}
          onConfirm={handleStatusConfirm}
          title={nextStatus === 'active' ? 'Activate Company Admin' : 'Deactivate Company Admin'}
          itemName={adminToUpdate.name}
          message={
            nextStatus === 'active'
              ? 'This will restore login access so the admin can sign in again.'
              : 'This will disable login access for this admin. You can reactivate them later.'
          }
          warningText={nextStatus === 'active' ? '' : 'You can reactivate the admin later.'}
          confirmLabel={nextStatus === 'active' ? 'Activate' : 'Deactivate'}
          confirmVariant={nextStatus === 'active' ? 'blue' : 'red'}
          loading={updatingStatus}
          icon={
            nextStatus === 'active' ? <CheckCircle2 className="h-5 w-5" /> : <Ban className="h-5 w-5" />
          }
          iconBgClassName={nextStatus === 'active' ? 'bg-green-100' : 'bg-yellow-100'}
          iconTextClassName={nextStatus === 'active' ? 'text-green-600' : 'text-yellow-600'}
        />
      )}

      <ViewCompanyAdminModal
        isOpen={viewModalOpen}
        onClose={() => {
          setViewModalOpen(false);
          setSelectedAdminId(null);
        }}
        userId={selectedAdminId}
      />

      <UpdateUserModal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedEditId(null);
        }}
        onSuccess={() => {
          fetchCompanyAdmins();
        }}
        userId={selectedEditId}
        title="Update Company Admin"
        submitLabel="Update Company Admin"
      />
    </DashboardLayout>
  );
}
