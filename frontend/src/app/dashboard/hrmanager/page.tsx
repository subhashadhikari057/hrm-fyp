'use client';

import { useState, useEffect } from 'react';
import { ClipboardCheck, Clock, Star, UserPlus, Users, UsersRound } from 'lucide-react';
import DashboardLayout from '../../../components/DashboardLayout';
import { StatsGrid } from '../../../components/StatsGrid';
import { PageHeader } from '../../../components/PageHeader';
import { QuickActionsGrid } from '../../../components/QuickActionsGrid';
import { statsApi } from '../../../lib/api/stats';

export default function HRManagerDashboard() {
  const [stats, setStats] = useState([
    {
      label: 'Active Employees',
      value: 0,
      iconBgColor: 'blue' as const,
      icon: <Users className="h-4 w-4" />,
    },
    {
      label: 'New Hires',
      value: 0,
      iconBgColor: 'green' as const,
      icon: <UserPlus className="h-4 w-4" />,
    },
    {
      label: 'Total Employees',
      value: 0,
      iconBgColor: 'purple' as const,
      icon: <UsersRound className="h-4 w-4" />,
    },
    {
      label: 'On Leave',
      value: 0,
      iconBgColor: 'yellow' as const,
      icon: <Clock className="h-4 w-4" />,
    },
  ]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await statsApi.getHRManagerStats();
        setStats([
          {
            label: 'Active Employees',
            value: data.activeEmployees,
            iconBgColor: 'blue' as const,
            icon: <Users className="h-4 w-4" />,
          },
          {
            label: 'New Hires',
            value: data.newHires,
            iconBgColor: 'green' as const,
            icon: <UserPlus className="h-4 w-4" />,
          },
          {
            label: 'Total Employees',
            value: data.totalEmployees,
            iconBgColor: 'purple' as const,
            icon: <UsersRound className="h-4 w-4" />,
          },
          {
            label: 'On Leave',
            value: data.employeesOnLeave,
            iconBgColor: 'yellow' as const,
            icon: <Clock className="h-4 w-4" />,
          },
        ]);
      } catch (error) {
        console.error('Error fetching HR manager stats:', error);
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
          title="HR Manager Dashboard"
          description="Manage human resources and employee operations"
        />

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <StatsGrid stats={stats} columns={4} />
        )}

        <QuickActionsGrid
          title="HR Operations"
          columns={3}
          actions={[
            {
              label: 'Manage Employees',
              href: '/dashboard/hrmanager/employees',
              icon: (
                <Users className="h-full w-full" />
              ),
              color: 'blue',
            },
            {
              label: 'Process Leave Requests',
              href: '/dashboard/hrmanager/leave-requests',
              icon: (
                <ClipboardCheck className="h-full w-full" />
              ),
              color: 'green',
            },
            {
              label: 'Employee Reviews',
              href: '/dashboard/hrmanager/reviews',
              icon: (
                <Star className="h-full w-full" />
              ),
              color: 'purple',
            },
          ]}
        />
      </div>
    </DashboardLayout>
  );
}
