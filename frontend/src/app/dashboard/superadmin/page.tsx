'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Building2, CheckCircle2, Clock3, ShieldAlert, UserCog, Users } from 'lucide-react';
import DashboardLayout from '../../../components/DashboardLayout';
import { PageHeader } from '../../../components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { companyApi, type Company } from '../../../lib/api/company';
import { superadminApi, type User } from '../../../lib/api/superadmin';

function formatDate(value?: string | null) {
  return value ? new Date(value).toLocaleDateString('en-GB') : 'Not set';
}

function daysUntil(dateString?: string | null) {
  if (!dateString) return null;
  const today = new Date();
  const target = new Date(dateString);
  const diff = target.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function statusBadgeClass(status: Company['status']) {
  switch (status) {
    case 'active':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700';
    case 'suspended':
      return 'border-amber-200 bg-amber-50 text-amber-700';
    default:
      return 'border-slate-300 bg-slate-100 text-slate-700';
  }
}

export default function SuperAdminDashboard() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [companyAdmins, setCompanyAdmins] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      try {
        const [companiesResponse, usersResponse, companyAdminsResponse] = await Promise.all([
          companyApi.getCompanies({ page: 1, limit: 50, sortBy: 'createdAt', sortOrder: 'desc' }),
          superadminApi.getUsers({ page: 1, limit: 20, sortBy: 'createdAt', sortOrder: 'desc' }),
          companyApi.getCompanyAdmins({ page: 1, limit: 20, sortBy: 'createdAt', sortOrder: 'desc' }),
        ]);

        setCompanies(companiesResponse.data || []);
        setUsers(usersResponse.data || []);
        setCompanyAdmins(companyAdminsResponse.data || []);
      } finally {
        setLoading(false);
      }
    };

    void loadDashboard();
  }, []);

  const summary = useMemo(() => {
    const activeCompanies = companies.filter((company) => company.status === 'active').length;
    const suspendedCompanies = companies.filter((company) => company.status === 'suspended').length;
    const archivedCompanies = companies.filter((company) => company.status === 'archived').length;
    const expiringSoon = companies.filter((company) => {
      const days = daysUntil(company.planExpiresAt);
      return days !== null && days >= 0 && days <= 30;
    }).length;

    return {
      totalCompanies: companies.length,
      activeCompanies,
      suspendedCompanies,
      archivedCompanies,
      totalUsers: users.length,
      totalCompanyAdmins: companyAdmins.length,
      expiringSoon,
      activeSubscriptionPlans: new Set(
        companies
          .filter((company) => company.subscriptionPlan?.isActive)
          .map((company) => company.subscriptionPlan?.id),
      ).size,
      companiesOnTrial: companies.filter((company) => company.subscriptionStatus === 'trial').length,
      totalEmployeesAcrossPlatform: users.filter((user) => user.role === 'employee').length,
    };
  }, [companies, users, companyAdmins]);

  const recentCompanies = useMemo(() => companies.slice(0, 4), [companies]);
  const recentUsers = useMemo(() => users.slice(0, 4), [users]);
  const attentionCompanies = useMemo(
    () =>
      companies.filter((company) => {
        const days = daysUntil(company.planExpiresAt);
        return company.status === 'suspended' || (days !== null && days >= 0 && days <= 30);
      }),
    [companies],
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Super Admin Dashboard"
          description="Monitor platform tenants, company admins, and system-wide activity from one overview page."
        />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Total Companies</p>
                  <p className="mt-2 text-3xl font-semibold text-gray-900">{loading ? '...' : summary.totalCompanies}</p>
                </div>
                <div className="rounded-xl bg-blue-50 p-3 text-blue-700">
                  <Building2 className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Active Companies</p>
                  <p className="mt-2 text-3xl font-semibold text-gray-900">{loading ? '...' : summary.activeCompanies}</p>
                </div>
                <div className="rounded-xl bg-emerald-50 p-3 text-emerald-700">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Suspended Companies</p>
                  <p className="mt-2 text-3xl font-semibold text-gray-900">{loading ? '...' : summary.suspendedCompanies}</p>
                </div>
                <div className="rounded-xl bg-amber-50 p-3 text-amber-700">
                  <ShieldAlert className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Company Admins</p>
                  <p className="mt-2 text-3xl font-semibold text-gray-900">{loading ? '...' : summary.totalCompanyAdmins}</p>
                </div>
                <div className="rounded-xl bg-purple-50 p-3 text-purple-700">
                  <UserCog className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Companies</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-8 text-sm text-gray-600">Loading recent companies...</div>
              ) : recentCompanies.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-sm text-gray-600">No companies found.</div>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium text-gray-600">Company</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-600">Plan</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-600">Users</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-600">Plan Expiry</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {recentCompanies.slice(0, 4).map((company) => (
                        <tr key={company.id}>
                          <td className="px-4 py-3">
                            <div>
                              <p className="font-medium text-gray-900">{company.name}</p>
                              <p className="text-xs text-gray-500">{company.code || 'No code'}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-medium ${statusBadgeClass(company.status)}`}>
                              {company.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-700">{company.subscriptionPlan?.name || 'No plan'}</td>
                          <td className="px-4 py-3 text-gray-700">{company.userCount}</td>
                          <td className="px-4 py-3 text-gray-700">{formatDate(company.planExpiresAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Attention Required</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-8 text-sm text-gray-600">Loading alerts...</div>
              ) : attentionCompanies.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-sm text-gray-600">No urgent company alerts right now.</div>
              ) : (
                <div className="space-y-3">
                  {attentionCompanies.slice(0, 4).map((company) => {
                    const expiryDays = daysUntil(company.planExpiresAt);
                    const isSuspended = company.status === 'suspended';
                    return (
                      <div key={company.id} className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                        <div className="flex items-start gap-3">
                          <div className={`mt-0.5 rounded-lg p-2 ${isSuspended ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                            <AlertTriangle className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-gray-900">{company.name}</p>
                            <p className="mt-1 text-xs text-gray-600">
                              {isSuspended
                                ? 'Company is suspended and may require administrative review.'
                                : `Plan expires in ${expiryDays} day${expiryDays === 1 ? '' : 's'}.`}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recently Added Users</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-8 text-sm text-gray-600">Loading recent users...</div>
              ) : recentUsers.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-sm text-gray-600">No recent users found.</div>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium text-gray-600">Name</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-600">Role</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-600">Created</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {recentUsers.slice(0, 4).map((user) => (
                        <tr key={user.id}>
                          <td className="px-4 py-3">
                            <div>
                              <p className="font-medium text-gray-900">{user.fullName || user.email}</p>
                              <p className="text-xs text-gray-500">{user.email}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-gray-700 capitalize">{user.role.replace('_', ' ')}</td>
                          <td className="px-4 py-3 text-gray-700">{formatDate(user.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Platform Snapshot</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
                <span className="text-gray-600">Total Users Loaded</span>
                <span className="font-semibold text-gray-900">{loading ? '...' : users.length}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
                <span className="text-gray-600">Archived Companies</span>
                <span className="font-semibold text-gray-900">{loading ? '...' : summary.archivedCompanies}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
                <span className="text-gray-600">Plans Expiring Soon</span>
                <span className="font-semibold text-gray-900">{loading ? '...' : summary.expiringSoon}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
                <span className="text-gray-600">Active Subscription Plans</span>
                <span className="font-semibold text-gray-900">{loading ? '...' : summary.activeSubscriptionPlans}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
                <span className="text-gray-600">Companies on Trial</span>
                <span className="font-semibold text-gray-900">{loading ? '...' : summary.companiesOnTrial}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
                <span className="text-gray-600">Total Employees Across Platform</span>
                <span className="font-semibold text-gray-900">{loading ? '...' : summary.totalEmployeesAcrossPlatform}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
