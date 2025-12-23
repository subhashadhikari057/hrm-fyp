'use client';

import { useState, useMemo, useEffect } from 'react';
import DashboardLayout from '../../../../components/DashboardLayout';
import { DataTable, Column, FilterOption } from '../../../../components/DataTable';
import { StatsGrid } from '../../../../components/StatsGrid';
import { PageHeader } from '../../../../components/PageHeader';
import { DeleteConfirmDialog } from '../../../../components/DeleteConfirmDialog';
import toast from 'react-hot-toast';
import { companyApi } from '../../../../lib/api/company';
import { type User } from '../../../../lib/api/superadmin';

// Company Admin data type (mapped from backend)
interface CompanyAdmin {
  id: string;
  name: string;
  email: string;
  company: string;
  companyCode: string;
  status: 'active' | 'inactive' | 'suspended';
  employeeCount: number;
  createdAt: string;
}

export default function CompanyAdminsPage() {
  const [companyAdmins, setCompanyAdmins] = useState<CompanyAdmin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [adminToDelete, setAdminToDelete] = useState<CompanyAdmin | null>(null);

  const fetchCompanyAdmins = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await companyApi.getCompanyAdmins();
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
      }));

      // Fetch company data to get userCount (employee count) for each admin
      try {
        const companiesResponse = await companyApi.getCompanies();
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
    } catch (err: any) {
      setError(err.message || 'Failed to fetch company admins');
      toast.error(err.message || 'Failed to fetch company admins');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanyAdmins();
  }, []);

  // Calculate stats
  const stats = useMemo(() => {
    const total = companyAdmins.length;
    const active = companyAdmins.filter((ca) => ca.status === 'active').length;
    const inactive = companyAdmins.filter((ca) => ca.status === 'inactive').length;
    const totalEmployees = companyAdmins.reduce((sum, ca) => sum + ca.employeeCount, 0);

    return [
      {
        label: 'Total Company Admins',
        value: total,
        iconBgColor: 'blue' as const,
        icon: (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        ),
      },
      {
        label: 'Active Admins',
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
        label: 'Inactive Admins',
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
      {
        label: 'Total Employees',
        value: totalEmployees.toLocaleString(),
        iconBgColor: 'purple' as const,
        icon: (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.196-2.137M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.196-2.137M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
        ),
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
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
            <span className="text-blue-600 font-semibold text-sm">
              {admin.name.charAt(0).toUpperCase()}
            </span>
          </div>
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
      sortable: true,
      render: (admin) => getStatusBadge(admin.status),
    },
    {
      key: 'employeeCount',
      header: 'Employees',
      sortable: true,
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

  const handleRowClick = (admin: CompanyAdmin) => {
    console.log('Clicked company admin:', admin);
    // Navigate to company admin details page
  };

  const handleEdit = (admin: CompanyAdmin) => {
    console.log('Edit company admin:', admin);
    // Open edit dialog
  };

  const handleDeleteClick = (admin: CompanyAdmin) => {
    setAdminToDelete(admin);
    setIsDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (adminToDelete) {
      try {
        await companyApi.deleteCompanyAdmin(adminToDelete.id);
        toast.success(`Company Admin "${adminToDelete.name}" deleted successfully`);
        fetchCompanyAdmins(); // Refresh the list
      } catch (err: any) {
        toast.error(err.message || 'Failed to delete company admin');
      } finally {
        setIsDeleteConfirmOpen(false);
        setAdminToDelete(null);
      }
    }
  };

  const actions = (admin: CompanyAdmin) => (
    <>
      <button
        onClick={() => handleEdit(admin)}
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
        onClick={() => handleDeleteClick(admin)}
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

  const filters: FilterOption<CompanyAdmin>[] = [
    {
      key: 'status',
      label: 'Status',
      type: 'multiselect',
      options: [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
        { value: 'suspended', label: 'Suspended' },
      ],
      getValue: (admin) => admin.status,
    },
  ];

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
          onRowClick={handleRowClick}
          actions={actions}
          searchable={true}
          searchPlaceholder="Search company admins by name, email, or company..."
          emptyMessage="No company admins found"
          loading={isLoading}
          filters={filters}
        />
      </div>

      {adminToDelete && (
        <DeleteConfirmDialog
          isOpen={isDeleteConfirmOpen}
          onClose={() => setIsDeleteConfirmOpen(false)}
          onConfirm={handleDeleteConfirm}
          itemType="Company Admin"
          itemName={adminToDelete.name}
          description="This action will deactivate the company admin. They will no longer be able to log in. This can be reversed later."
        />
      )}
    </DashboardLayout>
  );
}
