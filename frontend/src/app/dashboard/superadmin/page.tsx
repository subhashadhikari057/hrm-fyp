'use client';

import React, { useState, useEffect } from 'react';
import { BarChart3, Building2, CheckCircle2, ScrollText, UserCog, Users } from 'lucide-react';
import DashboardLayout from '../../../components/DashboardLayout';
import { StatsGrid } from '../../../components/StatsGrid';
import { PageHeader } from '../../../components/PageHeader';
import { QuickActionsGrid } from '../../../components/QuickActionsGrid';
import { statsApi } from '../../../lib/api/stats';

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<Array<{
    label: string;
    value: string | number;
    iconBgColor: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'yellow' | 'indigo' | 'pink' | 'gray';
    icon: React.ReactNode;
  }>>([
    {
      label: 'Total Companies',
      value: 0,
      iconBgColor: 'blue' as const,
      icon: <Building2 className="h-4 w-4" />,
    },
    {
      label: 'Total Users',
      value: 0,
      iconBgColor: 'green' as const,
      icon: <Users className="h-4 w-4" />,
    },
    {
      label: 'Active Companies',
      value: 0,
      iconBgColor: 'purple' as const,
      icon: <CheckCircle2 className="h-4 w-4" />,
    },
    {
      label: 'Company Admins',
      value: 0,
      iconBgColor: 'orange' as const,
      icon: <UserCog className="h-4 w-4" />,
    },
  ]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await statsApi.getSuperAdminStats();
        setStats([
          {
            label: 'Total Companies',
            value: data.totalCompanies,
            iconBgColor: 'blue' as const,
            icon: <Building2 className="h-4 w-4" />,
          },
          {
            label: 'Total Users',
            value: data.totalUsers.toLocaleString(),
            iconBgColor: 'green' as const,
            icon: <Users className="h-4 w-4" />,
          },
          {
            label: 'Active Companies',
            value: data.activeCompanies,
            iconBgColor: 'purple' as const,
            icon: <CheckCircle2 className="h-4 w-4" />,
          },
          {
            label: 'Company Admins',
            value: data.totalCompanyAdmins,
            iconBgColor: 'orange' as const,
            icon: <UserCog className="h-4 w-4" />,
          },
        ]);
      } catch (error) {
        console.error('Error fetching super admin stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Super Admin Dashboard"
          description="Full system access and management"
        />

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <StatsGrid stats={stats} columns={4} />
        )}

        <QuickActionsGrid
          title="Quick Actions"
          columns={3}
          actions={[
            {
              label: 'Manage Companies',
              href: '/dashboard/superadmin/companies',
              icon: (
                <Building2 className="h-full w-full" />
              ),
              color: 'blue',
            },
            {
              label: 'View System Logs',
              href: '/dashboard/superadmin/logs',
              icon: (
                <ScrollText className="h-full w-full" />
              ),
              color: 'green',
            },
            {
              label: 'Generate Reports',
              href: '/dashboard/superadmin/reports',
              icon: (
                <BarChart3 className="h-full w-full" />
              ),
              color: 'purple',
            },
          ]}
        />
      </div>
    </DashboardLayout>
  );
}
