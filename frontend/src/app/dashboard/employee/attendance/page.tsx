'use client';

import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../../../../components/DashboardLayout';
import { PageHeader } from '../../../../components/PageHeader';
import AttendanceCalendar from '../../../../components/AttendanceCalendar';
import { attendanceApi, type AttendanceDay } from '../../../../lib/api/attendance';

export default function EmployeeAttendancePage() {
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [attendance, setAttendance] = useState<AttendanceDay[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const monthRange = useMemo(() => {
    const start = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const end = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0, 23, 59, 59, 999);
    return { start, end };
  }, [currentMonth]);

  useEffect(() => {
    const fetchAttendance = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await attendanceApi.getMyAttendance({
          dateFrom: monthRange.start.toISOString(),
          dateTo: monthRange.end.toISOString(),
          page: 1,
          limit: 100,
        });
        setAttendance(response.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load attendance');
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, [monthRange.start, monthRange.end]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="My Attendance"
          description="Track your daily attendance and status"
        />

        <AttendanceCalendar
          currentMonth={currentMonth}
          onMonthChange={setCurrentMonth}
          attendance={attendance}
          loading={loading}
          error={error}
        />
        
      </div>
    </DashboardLayout>
  );
}
