'use client';

import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../../../../../components/DashboardLayout';
import { PageHeader } from '../../../../../components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../../components/ui/card';
import { Input } from '../../../../../components/ui/input';
import AttendanceCalendar from '../../../../../components/AttendanceCalendar';
import { attendanceApi, type AttendanceDay } from '../../../../../lib/api/attendance';
import { employeeApi, type Employee } from '../../../../../lib/api/employee';
import toast from 'react-hot-toast';

const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
const endOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);

const toIso = (d: Date) => d.toISOString();

export default function CompanyAdminEmployeeAttendancePage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [currentMonth, setCurrentMonth] = useState<Date>(startOfMonth(new Date()));
  const [attendance, setAttendance] = useState<AttendanceDay[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadEmployees = async () => {
    try {
      const res = await employeeApi.getEmployees({ page: 1, limit: 50 });
      setEmployees(res.data || []);
      if (!selectedEmployeeId && res.data?.length) {
        setSelectedEmployeeId(res.data[0].id);
      }
    } catch (err) {
      console.error('Failed to load employees', err);
      toast.error('Failed to load employees');
    }
  };

  const loadAttendance = async () => {
    if (!selectedEmployeeId) {
      setAttendance([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const from = startOfMonth(currentMonth);
      const to = endOfMonth(currentMonth);
      const res = await attendanceApi.getAttendance({
        employeeId: selectedEmployeeId,
        dateFrom: toIso(from),
        dateTo: toIso(to),
        page: 1,
        limit: 100,
      });
      setAttendance(res.data || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load attendance');
      toast.error(err?.message || 'Failed to load attendance');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadAttendance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEmployeeId, currentMonth]);

  const employeeOptions = useMemo(
    () =>
      employees.map((e) => ({
        value: e.id,
        label: `${e.firstName} ${e.lastName}${e.employeeCode ? ` (${e.employeeCode})` : ''}`,
      })),
    [employees],
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Employee Attendance"
          description="View an employee's monthly attendance on a calendar."
        />

        <Card>
          <CardHeader>
            <CardTitle>Select Employee & Month</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Employee</label>
              <select
                className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
              >
                <option value="">Select employee...</option>
                {employeeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Jump to month</label>
              <Input
                type="month"
                value={`${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`}
                onChange={(e) => {
                  const [y, m] = e.target.value.split('-').map(Number);
                  setCurrentMonth(startOfMonth(new Date(y, (m || 1) - 1, 1)));
                }}
              />
            </div>
          </CardContent>
        </Card>

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
