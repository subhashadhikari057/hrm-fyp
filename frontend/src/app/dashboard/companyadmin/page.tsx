'use client';

import { useState, useEffect } from 'react';
import { BarChart3, Building2, Settings, UserCheck, UserPlus, UsersRound } from 'lucide-react';
import DashboardLayout from '../../../components/DashboardLayout';
import { StatsGrid } from '../../../components/StatsGrid';
import { PageHeader } from '../../../components/PageHeader';
import { QuickActionsGrid } from '../../../components/QuickActionsGrid';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { statsApi } from '../../../lib/api/stats';
import { attendanceApi } from '../../../lib/api/attendance';

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
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [todaySummary, setTodaySummary] = useState({
    present: 0,
    absent: 0,
    late: 0,
    halfDay: 0,
    onLeave: 0,
  });
  const [todayLoading, setTodayLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await statsApi.getCompanyAdminStats();
        setTotalEmployees(data.totalEmployees);
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

  useEffect(() => {
    const fetchTodaySummary = async () => {
      setTodayLoading(true);
      try {
        const today = new Date();
        const start = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate(),
          0,
          0,
          0,
          0,
        );
        const end = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate(),
          23,
          59,
          59,
          999,
        );
        const dateFromIso = start.toISOString();
        const dateToIso = end.toISOString();

        const fetchCount = async (status: string) => {
          const response = await attendanceApi.getAttendance({
            status: status as any,
            dateFrom: dateFromIso,
            dateTo: dateToIso,
            page: 1,
            limit: 1,
          });
          return response.meta?.total ?? response.data.length;
        };

        const [present, late, halfDay, absent, onLeave] = await Promise.all([
          fetchCount('PRESENT'),
          fetchCount('LATE'),
          fetchCount('HALF_DAY'),
          fetchCount('ABSENT'),
          fetchCount('ON_LEAVE'),
        ]);

        setTodaySummary({
          present,
          late,
          halfDay,
          absent,
          onLeave,
        });
      } catch (error) {
        console.error('Error fetching today attendance summary:', error);
      } finally {
        setTodayLoading(false);
      }
    };

    fetchTodaySummary();
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

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <CardTitle className="text-base">Today Attendance Overview</CardTitle>
            <span className="text-xs text-gray-500">
              {new Date().toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
              })}
            </span>
          </CardHeader>
          <CardContent>
            {todayLoading ? (
              <div className="text-sm text-gray-500">Loading today summary...</div>
            ) : (
              <div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-5">
                {[
                  {
                    label: 'Present',
                    value: `${todaySummary.present} / ${
                      totalEmployees || todaySummary.present
                    }`,
                    accent: 'text-emerald-700',
                  },
                  {
                    label: 'Absent',
                    value: `${todaySummary.absent} / ${
                      totalEmployees || todaySummary.absent
                    }`,
                    accent: 'text-rose-700',
                  },
                  {
                    label: 'Late',
                    value: `${todaySummary.late} / ${
                      totalEmployees || todaySummary.late
                    }`,
                    accent: 'text-amber-700',
                  },
                  {
                    label: 'Half Day',
                    value: `${todaySummary.halfDay} / ${
                      totalEmployees || todaySummary.halfDay
                    }`,
                    accent: 'text-orange-700',
                  },
                  {
                    label: 'On Leave',
                    value: `${todaySummary.onLeave} / ${
                      totalEmployees || todaySummary.onLeave
                    }`,
                    accent: 'text-blue-700',
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2"
                  >
                    <span className="text-xs font-medium text-gray-500">{item.label}</span>
                    <span className={`text-lg font-semibold ${item.accent}`}>{item.value}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

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
