'use client';

import { useState, useEffect } from 'react';
import { BarChart3, Building2, Settings, UserCheck, UserPlus, UsersRound } from 'lucide-react';
import DashboardLayout from '../../../components/DashboardLayout';
import { StatsGrid } from '../../../components/StatsGrid';
import { PageHeader } from '../../../components/PageHeader';
import { QuickActionsGrid } from '../../../components/QuickActionsGrid';
import { statsApi } from '../../../lib/api/stats';

export default function CompanyAdminDashboard() {
  const [stats, setStats] = useState([
    {
      label: 'Total Employees',
      value: 0,
      iconBgColor: 'blue' as const,
      icon: <UsersRound className="h-4 w-4" />,
    },
    {
      label: 'Active Employees',
      value: 0,
      iconBgColor: 'green' as const,
      icon: <UserCheck className="h-4 w-4" />,
    },
    {
      label: 'Departments',
      value: 0,
      iconBgColor: 'purple' as const,
      icon: <Building2 className="h-4 w-4" />,
    },
    {
      label: 'New Hires This Month',
      value: 0,
      iconBgColor: 'orange' as const,
      icon: <UserPlus className="h-4 w-4" />,
    },
  ]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await statsApi.getCompanyAdminStats();
        setStats([
          {
            label: 'Total Employees',
            value: data.totalEmployees,
            iconBgColor: 'blue' as const,
            icon: <UsersRound className="h-4 w-4" />,
          },
          {
            label: 'Active Employees',
            value: data.activeEmployees,
            iconBgColor: 'green' as const,
            icon: <UserCheck className="h-4 w-4" />,
          },
          {
            label: 'Departments',
            value: data.totalDepartments,
            iconBgColor: 'purple' as const,
            icon: <Building2 className="h-4 w-4" />,
          },
          {
            label: 'New Hires This Month',
            value: data.newHiresThisMonth,
            iconBgColor: 'orange' as const,
            icon: <UserPlus className="h-4 w-4" />,
          },
        ]);
      } catch (error) {
        console.error('Error fetching company admin stats:', error);
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
          title="Company Admin Dashboard"
          description="Manage your company and employees"
        />

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <StatsGrid stats={stats} columns={4} />
        )}

        <QuickActionsGrid
          title="Company Management"
          columns={2}
          actions={[
            {
              label: 'Manage Employees',
              href: '/dashboard/companyadmin/employees',
              icon: (
                <UsersRound className="h-full w-full" />
              ),
              color: 'blue',
            },
            {
              label: 'View Departments',
              href: '/dashboard/companyadmin/departments',
              icon: (
                <Building2 className="h-full w-full" />
              ),
              color: 'green',
            },
            {
              label: 'Company Settings',
              href: '/dashboard/companyadmin/settings',
              icon: (
                <Settings className="h-full w-full" />
              ),
              color: 'purple',
            },
            {
              label: 'View Reports',
              href: '/dashboard/companyadmin/reports',
              icon: (
                <BarChart3 className="h-full w-full" />
              ),
              color: 'orange',
            },
          ]}
        />
      </div>
    </DashboardLayout>
  );
}
