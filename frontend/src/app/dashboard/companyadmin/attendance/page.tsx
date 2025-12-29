'use client';

import { useEffect, useMemo, useState } from 'react';
import { CalendarCheck, Clock, FileClock, Pencil, UserCheck, UserX } from 'lucide-react';
import DashboardLayout from '../../../../components/DashboardLayout';
import { DataTable, type Column } from '../../../../components/DataTable';
import { PageHeader } from '../../../../components/PageHeader';
import { StatsGrid } from '../../../../components/StatsGrid';
import AttendanceFilterBar from '../../../../components/AttendanceFilterBar';
import AttendanceStatusBadge from '../../../../components/AttendanceStatusBadge';
import { AddButton } from '../../../../components/AddButton';
import { AddAttendanceModal } from '../../../../components/AddAttendanceModal';
import { UpdateAttendanceModal } from '../../../../components/UpdateAttendanceModal';
import { attendanceApi, type AttendanceRecord } from '../../../../lib/api/attendance';
import { employeeApi, type Employee } from '../../../../lib/api/employee';
import { workShiftApi, type WorkShift } from '../../../../lib/api/workshift';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = [
  { value: 'PRESENT', label: 'Present' },
  { value: 'LATE', label: 'Late' },
  { value: 'HALF_DAY', label: 'Half Day' },
  { value: 'ABSENT', label: 'Absent' },
  { value: 'ON_LEAVE', label: 'On Leave' },
  { value: 'WEEKEND', label: 'Weekend' },
  { value: 'HOLIDAY', label: 'Holiday' },
];

const formatDate = (value?: string | null) => {
  if (!value) return '-';
  const date = new Date(value);
  return date.toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    timeZone: 'Asia/Kathmandu',
  });
};

const toKtmIsoDate = (dateStr: string, endOfDay = false) => {
  if (!dateStr) return undefined;
  const time = endOfDay ? '23:59:59' : '00:00:00';
  return new Date(`${dateStr}T${time}+05:45`).toISOString();
};

const toKtmDateString = (value: string) => {
  const date = new Date(value);
  const utcMs = date.getTime() + date.getTimezoneOffset() * 60000;
  const ktm = new Date(utcMs + 345 * 60000);
  return ktm.toISOString().slice(0, 10);
};

const formatTime = (value?: string | null) => {
  if (!value) return '-';
  return new Date(value).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Kathmandu',
  });
};

const formatDuration = (minutes: number) => {
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hrs === 0 && mins === 0) return '-';
  if (hrs === 0) return `${mins}m`;
  return `${hrs}h ${mins}m`;
};

export default function CompanyAdminAttendancePage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [todayLoading, setTodayLoading] = useState(true);
  const [todaySummary, setTodaySummary] = useState({
    present: 0,
    late: 0,
    halfDay: 0,
    absent: 0,
    onLeave: 0,
  });
  const [rangeLoading, setRangeLoading] = useState(true);
  const [rangeSummary, setRangeSummary] = useState({
    total: 0,
    present: 0,
    late: 0,
    halfDay: 0,
    absent: 0,
    onLeave: 0,
  });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [workShifts, setWorkShifts] = useState<WorkShift[]>([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModal, setEditModal] = useState<{
    isOpen: boolean;
    record: AttendanceRecord | null;
  }>({ isOpen: false, record: null });
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const fetchAttendance = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await attendanceApi.getAttendance({
          status: statusFilter ? (statusFilter as AttendanceRecord['status']) : undefined,
          employeeId: employeeId || undefined,
          dateFrom: dateFrom ? toKtmIsoDate(dateFrom) : undefined,
          dateTo: dateTo ? toKtmIsoDate(dateTo, true) : undefined,
          page,
          limit,
        });

        setRecords(response.data);
        setTotal(response.meta?.total || response.data.length);
        setTotalPages(response.meta?.totalPages || 1);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load attendance');
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, [statusFilter, employeeId, dateFrom, dateTo, page, limit, refreshTrigger]);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await employeeApi.getEmployees({
          page: 1,
          limit: 100,
        });
        setEmployees(response.data);
      } catch (err) {
        console.error('Failed to load employees for filters', err);
      }
    };

    fetchEmployees();
  }, []);

  useEffect(() => {
    const fetchWorkShifts = async () => {
      try {
        const response = await workShiftApi.getWorkShifts({
          isActive: true,
          page: 1,
          limit: 100,
        });
        setWorkShifts(response.data);
      } catch (err) {
        console.error('Failed to load work shifts', err);
      }
    };

    fetchWorkShifts();
  }, []);

  const employeeOptions = useMemo(
    () =>
      employees.map((employee) => ({
        value: employee.id,
        label: `${employee.firstName} ${employee.lastName}${employee.employeeCode ? ` (${employee.employeeCode})` : ''}`,
      })),
    [employees],
  );

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

        const fetchCount = async (status: AttendanceRecord['status']) => {
          const response = await attendanceApi.getAttendance({
            status,
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
          present: present + late + halfDay,
          late,
          halfDay,
          absent,
          onLeave,
        });
      } catch (err) {
        console.error('Failed to load today summary', err);
      } finally {
        setTodayLoading(false);
      }
    };

    fetchTodaySummary();
  }, []);

  useEffect(() => {
    const fetchRangeSummary = async () => {
      setRangeLoading(true);
      try {
        const dateFromIso = dateFrom ? toKtmIsoDate(dateFrom) : undefined;
        const dateToIso = dateTo ? toKtmIsoDate(dateTo, true) : undefined;

        const fetchCount = async (status?: AttendanceRecord['status']) => {
          const response = await attendanceApi.getAttendance({
            status,
            employeeId: employeeId || undefined,
            dateFrom: dateFromIso,
            dateTo: dateToIso,
            page: 1,
            limit: 1,
          });
          return response.meta?.total ?? response.data.length;
        };

        const [totalCount, present, late, halfDay, absent, onLeave] = await Promise.all([
          fetchCount(),
          fetchCount('PRESENT'),
          fetchCount('LATE'),
          fetchCount('HALF_DAY'),
          fetchCount('ABSENT'),
          fetchCount('ON_LEAVE'),
        ]);

        setRangeSummary({
          total: totalCount,
          present: present + late + halfDay,
          late,
          halfDay,
          absent,
          onLeave,
        });
      } catch (err) {
        console.error('Failed to load range summary', err);
      } finally {
        setRangeLoading(false);
      }
    };

    fetchRangeSummary();
  }, [dateFrom, dateTo, employeeId, refreshTrigger]);

  const columns: Column<AttendanceRecord>[] = [
    {
      key: 'date',
      header: 'Date',
      render: (item) => <span className="text-sm font-medium text-gray-900">{formatDate(item.date)}</span>,
    },
    {
      key: 'employee',
      header: 'Employee',
      render: (item) => {
        const name = item.employee
          ? `${item.employee.firstName ?? ''} ${item.employee.lastName ?? ''}`.trim()
          : 'Unknown';
        const code = item.employee?.employeeCode ? `(${item.employee.employeeCode})` : null;
        return (
          <div className="min-w-[180px]">
            <div className="text-sm font-semibold text-gray-900">{name || 'Unknown'}</div>
            <div className="text-xs text-gray-500">{code || '-'}</div>
          </div>
        );
      },
    },
    {
      key: 'workShift',
      header: 'Shift',
      render: (item) => {
        const shiftName = item.workShift?.name || 'Default';
        const shiftCode = item.workShift?.code ? `(${item.workShift.code})` : null;
        return (
          <div className="min-w-[120px] text-xs text-gray-600">
            <div className="text-sm font-medium text-gray-900 truncate" title={shiftName}>
              {shiftName}
            </div>
            <div className="truncate" title={shiftCode || '-'}>
              {shiftCode || '-'}
            </div>
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => <AttendanceStatusBadge status={item.status} />,
    },
    {
      key: 'checkInTime',
      header: 'Check In',
      render: (item) => <span className="text-sm text-gray-700">{formatTime(item.checkInTime)}</span>,
    },
    {
      key: 'checkOutTime',
      header: 'Check Out',
      render: (item) => <span className="text-sm text-gray-700">{formatTime(item.checkOutTime)}</span>,
    },
    {
      key: 'totalWorkMinutes',
      header: 'Worked',
      render: (item) => <span className="text-sm text-gray-700">{formatDuration(item.totalWorkMinutes)}</span>,
    },
    {
      key: 'lateMinutes',
      header: 'Late',
      render: (item) => <span className="text-sm text-gray-700">{formatDuration(item.lateMinutes)}</span>,
    },
    {
      key: 'source',
      header: 'Source',
      render: (item) => (
        <span className="text-xs font-semibold uppercase text-gray-500">
          {item.source}
        </span>
      ),
    },
  ];

  const actions = (record: AttendanceRecord) => (
    <button
      onClick={(event) => {
        event.stopPropagation();
        setEditModal({ isOpen: true, record });
      }}
      className="text-blue-600 hover:text-blue-800 transition-colors"
      title="Edit attendance"
    >
      <Pencil className="h-4 w-4" />
    </button>
  );

  const handleExport = async () => {
    setExporting(true);
    try {
      const blob = await attendanceApi.exportAttendance({
        status: statusFilter ? (statusFilter as AttendanceRecord['status']) : undefined,
        employeeId: employeeId || undefined,
        dateFrom: dateFrom ? toKtmIsoDate(dateFrom) : undefined,
        dateTo: dateTo ? toKtmIsoDate(dateTo, true) : undefined,
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `attendance-export-${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Attendance exported');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to export attendance';
      toast.error(message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Attendance"
          description="Monitor daily attendance records for your company"
          actions={
            <div className="flex items-center gap-2">
              <AddButton
                label={exporting ? 'Exporting...' : 'Export'}
                variant="outline"
                onClick={handleExport}
                disabled={exporting}
              />
              <AddButton label="Add Attendance" onClick={() => setAddModalOpen(true)} />
            </div>
          }
        />

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-gray-900">Today Overview</h2>
            {todayLoading && <span className="text-xs text-gray-500">Updating...</span>}
          </div>
          <StatsGrid
            stats={[
              {
                label: 'Present',
                value: todaySummary.present,
                iconBgColor: 'green' as const,
                icon: <UserCheck className="h-4 w-4" />,
              },
              {
                label: 'Absent',
                value: todaySummary.absent,
                iconBgColor: 'red' as const,
                icon: <UserX className="h-4 w-4" />,
              },
              {
                label: 'Late',
                value: todaySummary.late,
                iconBgColor: 'yellow' as const,
                icon: <Clock className="h-4 w-4" />,
              },
              {
                label: 'Half Day',
                value: todaySummary.halfDay,
                iconBgColor: 'orange' as const,
                icon: <CalendarCheck className="h-4 w-4" />,
              },
              {
                label: 'On Leave',
                value: todaySummary.onLeave,
                iconBgColor: 'blue' as const,
                icon: <FileClock className="h-4 w-4" />,
              },
            ]}
            columns={5}
          />
        </div>

        <AttendanceFilterBar
          dateFrom={dateFrom}
          dateTo={dateTo}
          status={statusFilter}
          statusOptions={STATUS_OPTIONS}
          employeeId={employeeId}
          employeeOptions={employeeOptions}
          onDateFromChange={(value) => {
            setDateFrom(value);
            setPage(1);
          }}
          onDateToChange={(value) => {
            setDateTo(value);
            setPage(1);
          }}
          onStatusChange={(value) => {
            setStatusFilter(value);
            setPage(1);
          }}
          onEmployeeChange={(value) => {
            setEmployeeId(value);
            setPage(1);
          }}
          onClear={() => {
            setDateFrom('');
            setDateTo('');
            setStatusFilter('');
            setEmployeeId('');
            setPage(1);
          }}
        />

        {employeeId && dateFrom && dateTo && (
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-gray-900">Range Summary</h3>
              {rangeLoading && <span className="text-xs text-gray-500">Updating...</span>}
            </div>
            <div className="mt-3 grid gap-2 text-xs sm:grid-cols-2 lg:grid-cols-6">
              {[
                { label: 'Total Days', value: rangeSummary.total },
                { label: 'Present', value: rangeSummary.present },
                { label: 'Absent', value: rangeSummary.absent },
                { label: 'Late', value: rangeSummary.late },
                { label: 'Half Day', value: rangeSummary.halfDay },
                { label: 'On Leave', value: rangeSummary.onLeave },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2 text-gray-700"
                >
                  <span className="text-gray-500">{item.label}</span>
                  <span className="font-semibold text-gray-900">
                    {item.value} / {rangeSummary.total}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <DataTable
          data={records}
          columns={columns}
          actions={actions}
          loading={loading}
          searchable={false}
          serverSide
          pagination={{
            page,
            limit,
            total,
            totalPages,
          }}
          onPageChange={(nextPage) => setPage(nextPage)}
          onPageSizeChange={(nextLimit) => {
            setLimit(nextLimit);
            setPage(1);
          }}
          emptyMessage="No attendance records found."
        />
      </div>

      <AddAttendanceModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSuccess={() => {
          setRefreshTrigger((prev) => prev + 1);
        }}
        employees={employees}
        workShifts={workShifts}
      />
      <UpdateAttendanceModal
        isOpen={editModal.isOpen}
        onClose={() => setEditModal({ isOpen: false, record: null })}
        onSuccess={() => {
          setRefreshTrigger((prev) => prev + 1);
        }}
        record={editModal.record}
        workShifts={workShifts}
      />
    </DashboardLayout>
  );
}
