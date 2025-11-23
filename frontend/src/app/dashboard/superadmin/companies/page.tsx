'use client';

import { useState, useMemo, useEffect } from 'react';
import DashboardLayout from '../../../../components/DashboardLayout';
import { DataTable, Column, FilterOption } from '../../../../components/DataTable';
import { StatsGrid } from '../../../../components/StatsGrid';
import { PageHeader } from '../../../../components/PageHeader';
import { AddButton } from '../../../../components/AddButton';
import { AddCompanyModal } from '../../../../components/AddCompanyModal';
import { DeleteConfirmDialog } from '../../../../components/DeleteConfirmDialog';
import { useToast } from '../../../../contexts/ToastContext';
import { companyApi, type Company } from '../../../../lib/api/company';

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    company: Company | null;
  }>({ isOpen: false, company: null });
  const [deleting, setDeleting] = useState(false);
  const { showToast } = useToast();

  // Fetch companies from backend
  useEffect(() => {
    const fetchCompanies = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await companyApi.getCompanies();
        setCompanies(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch companies');
        console.error('Error fetching companies:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCompanies();
  }, [refreshTrigger]);

  // Calculate stats
  const stats = useMemo(() => {
    const total = companies.length;
    const active = companies.filter((c) => c.status === 'active').length;
    const suspended = companies.filter((c) => c.status === 'suspended').length;
    const totalUsers = companies.reduce((sum, c) => sum + c.userCount, 0);

    return [
      {
        label: 'Total Companies',
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
        label: 'Active Companies',
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
        label: 'Suspended Companies',
        value: suspended,
        iconBgColor: 'yellow' as const,
        icon: (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        ),
      },
      {
        label: 'Total Users',
        value: totalUsers.toLocaleString(),
        iconBgColor: 'purple' as const,
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
    ];
  }, [companies]);

  const getStatusBadge = (status: string) => {
    const statusStyles = {
      active: 'bg-green-100 text-green-800',
      suspended: 'bg-yellow-100 text-yellow-800',
      archived: 'bg-gray-100 text-gray-800',
    };

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          statusStyles[status as keyof typeof statusStyles] || statusStyles.active
        }`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const columns: Column<Company>[] = [
    {
      key: 'name',
      header: 'Company Name',
      sortable: true,
      render: (company) => (
        <div className="flex items-center">
          <div>
            <div className="font-medium text-gray-900">{company.name}</div>
            {company.industry && (
              <div className="text-xs text-gray-500">{company.industry}</div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'code',
      header: 'Code',
      sortable: true,
      render: (company) => (
        <span className="font-mono text-sm text-gray-600">{company.code}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (company) => getStatusBadge(company.status),
    },
    {
      key: 'userCount',
      header: 'Users',
      sortable: true,
      render: (company) => (
        <span className="text-gray-900">{company.userCount}</span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Created',
      sortable: true,
      render: (company) => (
        <span className="text-gray-600">
          {new Date(company.createdAt).toLocaleDateString()}
        </span>
      ),
    },
  ];

  const handleRowClick = (company: Company) => {
    console.log('Clicked company:', company);
    // Navigate to company details page
  };

  const handleEdit = (company: Company) => {
    console.log('Edit company:', company);
    // Open edit dialog
  };

  const handleAddCompanySuccess = () => {
    setRefreshTrigger((prev) => prev + 1);
    showToast('Company created successfully', 'success');
  };

  const handleDeleteClick = (company: Company) => {
    setDeleteDialog({ isOpen: true, company });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.company) return;

    setDeleting(true);
    try {
      await companyApi.deleteCompany(deleteDialog.company.id);
      showToast(`Company "${deleteDialog.company.name}" deleted successfully`, 'success');
      setDeleteDialog({ isOpen: false, company: null });
      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Failed to delete company',
        'error'
      );
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialog({ isOpen: false, company: null });
  };

  const actions = (company: Company) => (
    <>
      <button
        onClick={() => handleEdit(company)}
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
        onClick={() => handleDeleteClick(company)}
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
          title="Companies"
          description="Manage all companies in the system"
          actions={
            <AddButton
              label="Add Company"
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
          data={companies}
          columns={columns}
          onRowClick={handleRowClick}
          actions={actions}
          searchable={true}
          searchPlaceholder="Search companies by name, code, or industry..."
          emptyMessage={loading ? 'Loading companies...' : 'No companies found'}
          loading={loading}
          filters={[
            {
              key: 'status',
              label: 'Status',
              type: 'multiselect',
              options: [
                { value: 'active', label: 'Active' },
                { value: 'suspended', label: 'Suspended' },
                { value: 'archived', label: 'Archived' },
              ],
              getValue: (company) => company.status,
            },
          ]}
        />

        {/* Add Company Modal */}
        <AddCompanyModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleAddCompanySuccess}
        />

        {/* Delete Confirmation Dialog */}
        <DeleteConfirmDialog
          isOpen={deleteDialog.isOpen}
          onClose={handleDeleteCancel}
          onConfirm={handleDeleteConfirm}
          title="Delete Company"
          message="Are you sure you want to delete this company? This action cannot be undone and will affect all associated users."
          itemName={deleteDialog.company ? `${deleteDialog.company.name} (${deleteDialog.company.code})` : undefined}
          loading={deleting}
        />
      </div>
    </DashboardLayout>
  );
}

