'use client';

import { useState, useMemo, useEffect } from 'react';
import { AlertTriangle, Ban, Building2, CheckCircle2, Eye, Pencil, Users } from 'lucide-react';
import DashboardLayout from '../../../../components/DashboardLayout';
import { DataTable, Column, FilterOption } from '../../../../components/DataTable';
import { StatsGrid } from '../../../../components/StatsGrid';
import { PageHeader } from '../../../../components/PageHeader';
import { AddButton } from '../../../../components/AddButton';
import { AddCompanyModal } from '../../../../components/AddCompanyModal';
import { UpdateCompanyModal } from '../../../../components/UpdateCompanyModal';
import { DeleteConfirmDialog } from '../../../../components/DeleteConfirmDialog';
import { ViewCompanyModal } from '../../../../components/ViewCompanyModal';
import toast from 'react-hot-toast';
import { companyApi, type Company } from '../../../../lib/api/company';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [viewModal, setViewModal] = useState<{
    isOpen: boolean;
    companyId: string | null;
  }>({ isOpen: false, companyId: null });
  const [updateModal, setUpdateModal] = useState<{
    isOpen: boolean;
    companyId: string | null;
  }>({ isOpen: false, companyId: null });
  const [suspendDialog, setSuspendDialog] = useState<{
    isOpen: boolean;
    company: Company | null;
  }>({ isOpen: false, company: null });
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [nextStatus, setNextStatus] = useState<'active' | 'suspended'>('suspended');

  // Fetch companies from backend
  useEffect(() => {
    const fetchCompanies = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await companyApi.getCompanies();
        console.log('Fetched companies:', response.data);
        // Log the first company's logoUrl to debug
        if (response.data.length > 0) {
          console.log('First company logoUrl:', response.data[0].logoUrl);
          console.log('Constructed URL:', response.data[0].logoUrl ? `${API_BASE_URL}/uploads/${response.data[0].logoUrl}` : 'No logo');
        }
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
        icon: <Building2 className="h-4 w-4" />,
      },
      {
        label: 'Active Companies',
        value: active,
        iconBgColor: 'green' as const,
        icon: <CheckCircle2 className="h-4 w-4" />,
      },
      {
        label: 'Suspended Companies',
        value: suspended,
        iconBgColor: 'yellow' as const,
        icon: <AlertTriangle className="h-4 w-4" />,
      },
      {
        label: 'Total Users',
        value: totalUsers.toLocaleString(),
        iconBgColor: 'purple' as const,
        icon: <Users className="h-4 w-4" />,
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
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[status as keyof typeof statusStyles] || statusStyles.active
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
      render: (company) => {
        const logoUrl = company.logoUrl ? `${API_BASE_URL}/uploads/${company.logoUrl}` : null;

        // Debug logging
        if (company.logoUrl) {
          console.log(`Company: ${company.name}, logoUrl: ${company.logoUrl}, Full URL: ${logoUrl}`);
        }

        return (
          <div className="flex items-center">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={`${company.name} logo`}
                className="w-10 h-10 rounded-full object-cover mr-3"
                onError={(e) => {
                  // Fallback to initial avatar if image fails to load
                  console.error(`Failed to load image: ${logoUrl}`);
                  e.currentTarget.style.display = 'none';
                  const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                  if (fallback) fallback.classList.remove('hidden');
                }}
                onLoad={() => {
                  console.log(`Successfully loaded image: ${logoUrl}`);
                }}
              />
            ) : null}
            <div
              className={`w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3 ${logoUrl ? 'hidden' : ''
                }`}
            >
              <span className="text-blue-600 font-semibold text-sm">
                {company.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <div className="font-medium text-gray-900">{company.name}</div>
              {company.industry && (
                <div className="text-xs text-gray-500">{company.industry}</div>
              )}
            </div>
          </div>
        );
      },
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
    setViewModal({ isOpen: true, companyId: company.id });
  };

  const handleEdit = (company: Company) => {
    setUpdateModal({ isOpen: true, companyId: company.id });
  };

  const handleAddCompanySuccess = () => {
    setRefreshTrigger((prev) => prev + 1);
    toast.success('Company created successfully');
  };

  const handleUpdateCompanySuccess = () => {
    setRefreshTrigger((prev) => prev + 1);
    toast.success('Company updated successfully');
  };

  const handleSuspendClick = (company: Company) => {
    setNextStatus(company.status === 'suspended' ? 'active' : 'suspended');
    setSuspendDialog({ isOpen: true, company });
  };

  const handleSuspendConfirm = async () => {
    if (!suspendDialog.company) return;

    setUpdatingStatus(true);
    try {
      await companyApi.updateCompanyStatus(suspendDialog.company.id, { status: nextStatus });
      const actionLabel = nextStatus === 'suspended' ? 'suspended' : 'activated';
      toast.success(`Company "${suspendDialog.company.name}" ${actionLabel} successfully`);
      setSuspendDialog({ isOpen: false, company: null });
      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to update company status'
      );
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleSuspendCancel = () => {
    setSuspendDialog({ isOpen: false, company: null });
  };

  const actions = (company: Company) => (
    <>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setViewModal({ isOpen: true, companyId: company.id });
        }}
        className="text-green-600 hover:text-green-900 transition-colors"
        title="View"
      >
        <Eye className="w-5 h-5" />
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleEdit(company);
        }}
        className="text-blue-600 hover:text-blue-900 transition-colors"
        title="Edit"
      >
        <Pencil className="w-5 h-5" />
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleSuspendClick(company);
        }}
        className={
          company.status === 'suspended'
            ? 'text-green-600 hover:text-green-900 transition-colors'
            : 'text-yellow-600 hover:text-yellow-900 transition-colors'
        }
        title={company.status === 'suspended' ? 'Activate' : 'Suspend'}
      >
        {company.status === 'suspended' ? <CheckCircle2 className="w-5 h-5" /> : <Ban className="w-5 h-5" />}
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

        {/* View Company Modal */}
        <ViewCompanyModal
          isOpen={viewModal.isOpen}
          onClose={() => setViewModal({ isOpen: false, companyId: null })}
          companyId={viewModal.companyId}
        />

        {/* Update Company Modal */}
        <UpdateCompanyModal
          isOpen={updateModal.isOpen}
          onClose={() => setUpdateModal({ isOpen: false, companyId: null })}
          companyId={updateModal.companyId}
          onSuccess={handleUpdateCompanySuccess}
        />

        {/* Suspend Confirmation Dialog */}
        <DeleteConfirmDialog
          isOpen={suspendDialog.isOpen}
          onClose={handleSuspendCancel}
          onConfirm={handleSuspendConfirm}
          title={nextStatus === 'suspended' ? 'Suspend Company' : 'Activate Company'}
          message={
            nextStatus === 'suspended'
              ? 'This will temporarily disable login for all users in this company. You can reactivate it at any time.'
              : 'This will restore login access for all users in this company.'
          }
          warningText={
            nextStatus === 'suspended'
              ? 'You can reactivate the company later.'
              : ''
          }
          itemName={
            suspendDialog.company
              ? `${suspendDialog.company.name} (${suspendDialog.company.code})`
              : undefined
          }
          confirmLabel={nextStatus === 'suspended' ? 'Suspend' : 'Activate'}
          confirmVariant={nextStatus === 'suspended' ? 'red' : 'blue'}
          loading={updatingStatus}
        />
      </div>
    </DashboardLayout>
  );
}
