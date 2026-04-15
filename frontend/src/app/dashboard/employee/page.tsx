'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../../components/DashboardLayout';
import { AttendanceCard } from '../../../components/AttendanceCard';
import EmployeeLeaveUsagePieChart from '../../../components/EmployeeLeaveUsagePieChart';
import { PageHeader } from '../../../components/PageHeader';
import { QuickActionsGrid } from '../../../components/QuickActionsGrid';
import { StatsGrid } from '../../../components/StatsGrid';
import { Button } from '../../../components/ui/button';
import { attendanceApi, type AttendanceDay } from '../../../lib/api/attendance';
import { leaveApi, type LeaveStatsItem } from '../../../lib/api/leave';
import { CalendarDays, ClipboardCheck, FileText, LogIn, LogOut, UserCircle } from 'lucide-react';

export default function EmployeeDashboard() {
  const [isLoading, setIsLoading] = useState(false);
  const [lastAttendance, setLastAttendance] = useState<AttendanceDay | null>(null);
  const [leaveStats, setLeaveStats] = useState<LeaveStatsItem[]>([]);
  const [leaveStatsLoading, setLeaveStatsLoading] = useState(false);

  const hasRecordForToday = !!lastAttendance;
  const hasCheckedIn = !!lastAttendance?.checkInTime;
  const hasCheckedOut = !!lastAttendance?.checkOutTime;
  const todayStatus = !lastAttendance
    ? 'Not Checked In'
    : lastAttendance.status === 'ON_LEAVE'
      ? 'On Leave'
      : hasCheckedIn || hasCheckedOut
        ? 'Present'
        : 'Not Checked In';

  useEffect(() => {
    (async () => {
      try {
        const today = await attendanceApi.getMyToday();
        if (today) {
          setLastAttendance(today);
        }
      } catch {
        // Ignore initial load errors for now
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        setLeaveStatsLoading(true);
        const res = await leaveApi.getMyStats();
        setLeaveStats(res.data || []);
      } catch {
        setLeaveStats([]);
      } finally {
        setLeaveStatsLoading(false);
      }
    })();
  }, []);

  async function getCurrentLocation() {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      return {};
    }

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        });
      });

      return {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
    } catch {
      return {};
    }
  }

  async function handleCheckIn() {
    try {
      setIsLoading(true);
      const location = await getCurrentLocation();
      const res = await attendanceApi.checkIn(location);
      setLastAttendance(res.data);
      toast.success(res.message || 'Clocked in');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to check in');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCheckOut() {
    try {
      setIsLoading(true);
      const location = await getCurrentLocation();
      const res = await attendanceApi.checkOut(location);
      setLastAttendance(res.data);
      toast.success(res.message || 'Clocked out');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to check out');
    } finally {
      setIsLoading(false);
    }
  }
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Employee Dashboard"
          description="Welcome to your personal workspace"
          actions={(
            <div className="flex items-center gap-3">
              {!hasRecordForToday && (
                <Button
                  onClick={handleCheckIn}
                  disabled={isLoading}
                  variant="blue"
                >
                  {isLoading ? (
                    'Please wait...'
                  ) : (
                    <>
                      <LogIn className="h-4 w-4" />
                      Clock in
                    </>
                  )}
                </Button>
              )}
              {hasCheckedIn && !hasCheckedOut && (
                <Button
                  onClick={handleCheckOut}
                  disabled={isLoading}
                  variant="red"
                >
                  {isLoading ? (
                    'Please wait...'
                  ) : (
                    <>
                      <LogOut className="h-4 w-4" />
                      Clock out
                    </>
                  )}
                </Button>
              )}
            </div>
          )}
        />

        <StatsGrid
          columns={3}
          stats={[
            {
              label: 'Leave Balance',
              value: '15 days',
              icon: <CalendarDays className="h-4 w-4" />,
              iconBgColor: 'blue',
            },
            {
              label: 'Pending Requests',
              value: 2,
              icon: <ClipboardCheck className="h-4 w-4" />,
              iconBgColor: 'green',
            },
            {
              label: 'Today Status',
              value: todayStatus,
              icon: <UserCircle className="h-4 w-4" />,
              iconBgColor: 'purple',
            },
          ]}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <QuickActionsGrid
            title="Quick Actions"
            columns={2}
            actions={[
              {
                label: 'Request Leave',
                href: '/dashboard/employee/leave',
                icon: (
                  <CalendarDays className="h-full w-full" />
                ),
                color: 'blue',
              },
              {
                label: 'View Payslips',
                href: '/dashboard/employee/payslips',
                icon: (
                  <FileText className="h-full w-full" />
                ),
                color: 'green',
              },
              {
                label: 'View Attendance',
                href: '/dashboard/employee/attendance',
                icon: (
                  <CalendarDays className="h-full w-full" />
                ),
                color: 'purple',
              },
            ]}
          />

          <AttendanceCard attendance={lastAttendance} />
        </div>

        <EmployeeLeaveUsagePieChart leaveStats={leaveStats} loading={leaveStatsLoading} />
      </div>
    </DashboardLayout>
  );
}
