'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../../../../components/DashboardLayout';
import { PageHeader } from '../../../../components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Input } from '../../../../components/ui/input';
import { leaveApi, type LeaveRequest, type LeaveType } from '../../../../lib/api/leave';

type PeriodMode = 'MONTH' | 'YEAR' | 'CUSTOM';
type UsageMode = 'APPROVED_ONLY' | 'APPROVED_AND_PENDING';

type UsageRow = {
  leaveTypeId: string;
  leaveTypeName: string;
  allocatedDays: number;
  approvedDays: number;
  pendingDays: number;
  takenDays: number;
  remainingDays: number;
  usagePercent: number;
  isLowBalance: boolean;
};

function toMonthInputValue(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function toIsoRangeStart(date: Date): string {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0).toISOString();
}

function toIsoRangeEnd(date: Date): string {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999).toISOString();
}

export default function EmployeeLeaveUsagesPage() {
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [periodMode, setPeriodMode] = useState<PeriodMode>('YEAR');
  const [usageMode, setUsageMode] = useState<UsageMode>('APPROVED_ONLY');
  const [annualResetEnabled, setAnnualResetEnabled] = useState(true);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<string>(toMonthInputValue(new Date()));
  const [customFrom, setCustomFrom] = useState<string>('');
  const [customTo, setCustomTo] = useState<string>('');

  const yearOptions = useMemo(() => {
    const current = new Date().getFullYear();
    return Array.from({ length: 7 }, (_, i) => current - 5 + i);
  }, []);

  const range = useMemo(() => {
    if (periodMode === 'MONTH') {
      const [yearStr, monthStr] = selectedMonth.split('-');
      const year = Number(yearStr);
      const month = Number(monthStr) - 1;
      const start = new Date(year, month, 1);
      const end = new Date(year, month + 1, 0);
      return {
        dateFrom: toIsoRangeStart(start),
        dateTo: toIsoRangeEnd(end),
        label: `${start.toLocaleDateString('en-US', { month: 'long' })} ${start.getFullYear()}`,
      };
    }

    if (periodMode === 'CUSTOM') {
      if (!customFrom || !customTo) {
        return { dateFrom: undefined, dateTo: undefined, label: 'Custom Range (select dates)' };
      }
      const start = new Date(customFrom);
      const end = new Date(customTo);
      if (start.getTime() > end.getTime()) {
        return { dateFrom: undefined, dateTo: undefined, label: 'Custom Range (invalid range)' };
      }
      return {
        dateFrom: toIsoRangeStart(start),
        dateTo: toIsoRangeEnd(end),
        label: `${start.toLocaleDateString('en-GB')} - ${end.toLocaleDateString('en-GB')}`,
      };
    }

    const start = new Date(selectedYear, 0, 1);
    const end = new Date(selectedYear, 11, 31);
    return {
      dateFrom: toIsoRangeStart(start),
      dateTo: toIsoRangeEnd(end),
      label: `${selectedYear} (Annual)`,
    };
  }, [periodMode, selectedMonth, customFrom, customTo, selectedYear]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const leaveTypePromise = leaveApi.getLeaveTypes({ isActive: true, page: 1, limit: 100 });

        const allRequests: LeaveRequest[] = [];
        let currentPage = 1;
        let totalPages = 1;
        do {
          const res = await leaveApi.listMy({
            page: currentPage,
            limit: 100,
            dateFrom: range.dateFrom,
            dateTo: range.dateTo,
          });
          allRequests.push(...(res.data || []));
          totalPages = res.meta?.totalPages || 1;
          currentPage += 1;
        } while (currentPage <= totalPages);

        const leaveTypeRes = await leaveTypePromise;
        setLeaveTypes(leaveTypeRes.data || []);
        setRequests(allRequests);
      } catch (err: any) {
        setError(err?.message || 'Failed to load leave usage data');
        setLeaveTypes([]);
        setRequests([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [range.dateFrom, range.dateTo]);

  const usageRows = useMemo(() => {
    return leaveTypes.map((type) => {
      const byType = requests.filter((request) => request.leaveTypeId === type.id);
      const approvedDays = byType
        .filter((request) => request.status === 'APPROVED')
        .reduce((sum, request) => sum + request.totalDays, 0);
      const pendingDays = byType
        .filter((request) => request.status === 'PENDING')
        .reduce((sum, request) => sum + request.totalDays, 0);

      const takenDays = usageMode === 'APPROVED_ONLY' ? approvedDays : approvedDays + pendingDays;
      const remainingDays = Math.max(0, type.allocatedDays - takenDays);
      const usagePercent = type.allocatedDays > 0 ? Math.min(100, (takenDays / type.allocatedDays) * 100) : 0;
      const isLowBalance = remainingDays <= 1 && type.allocatedDays > 0;

      return {
        leaveTypeId: type.id,
        leaveTypeName: type.name,
        allocatedDays: type.allocatedDays,
        approvedDays,
        pendingDays,
        takenDays,
        remainingDays,
        usagePercent,
        isLowBalance,
      } satisfies UsageRow;
    });
  }, [leaveTypes, requests, usageMode]);

  const totals = useMemo(() => {
    const allocated = usageRows.reduce((sum, row) => sum + row.allocatedDays, 0);
    const pending = usageRows.reduce((sum, row) => sum + row.pendingDays, 0);
    const taken = usageRows.reduce((sum, row) => sum + row.takenDays, 0);
    const remaining = Math.max(0, allocated - taken);
    const lowBalanceTypes = usageRows.filter((row) => row.isLowBalance).length;
    return { allocated, taken, pending, remaining, lowBalanceTypes };
  }, [usageRows]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Leave Usages"
          description="Track leave usage by period and leave type."
        />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
          <Card>
            <CardContent className="pt-6">
              <p className="text-xs text-gray-500">Total Allocated</p>
              <p className="text-2xl font-semibold text-gray-900">{totals.allocated.toFixed(1)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-xs text-gray-500">Taken ({usageMode === 'APPROVED_ONLY' ? 'Approved' : 'Approved + Pending'})</p>
              <p className="text-2xl font-semibold text-emerald-600">{totals.taken.toFixed(1)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-xs text-gray-500">Pending</p>
              <p className="text-2xl font-semibold text-amber-600">{totals.pending.toFixed(1)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-xs text-gray-500">Remaining</p>
              <p className="text-2xl font-semibold text-blue-600">{totals.remaining.toFixed(1)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-xs text-gray-500">Low Balance Types</p>
              <p className={`text-2xl font-semibold ${totals.lowBalanceTypes > 0 ? 'text-rose-600' : 'text-gray-900'}`}>
                {totals.lowBalanceTypes}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Period</label>
              <select
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                value={periodMode}
                onChange={(e) => setPeriodMode(e.target.value as PeriodMode)}
              >
                <option value="MONTH">This Month</option>
                <option value="YEAR">This Year</option>
                <option value="CUSTOM">Custom</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Usage Mode</label>
              <select
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                value={usageMode}
                onChange={(e) => setUsageMode(e.target.value as UsageMode)}
              >
                <option value="APPROVED_ONLY">Approved Only</option>
                <option value="APPROVED_AND_PENDING">Approved + Pending</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Annual Reset</label>
              <label className="flex items-center gap-2 rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={annualResetEnabled}
                  onChange={(e) => setAnnualResetEnabled(e.target.checked)}
                  className="h-4 w-4"
                />
                Leave resets yearly
              </label>
            </div>

            {periodMode === 'MONTH' && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Month</label>
                <Input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} />
              </div>
            )}

            {periodMode === 'YEAR' && annualResetEnabled && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Year</label>
                <select
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                >
                  {yearOptions.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {periodMode === 'CUSTOM' && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">From</label>
                  <Input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">To</label>
                  <Input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Leave Types ({range.label})</CardTitle>
          </CardHeader>
          <CardContent>
            {error && <div className="mb-3 text-sm text-red-600">{error}</div>}
            {loading ? (
              <div className="text-sm text-gray-600">Loading leave usages...</div>
            ) : usageRows.length === 0 ? (
              <div className="text-sm text-gray-600">No leave usage data found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">Leave Type</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">Allocated</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">Taken</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">Pending</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">Usage</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {usageRows.map((row) => {
                      const query = new URLSearchParams();
                      query.set('leaveTypeId', row.leaveTypeId);
                      query.set('status', usageMode === 'APPROVED_ONLY' ? 'APPROVED' : 'ALL');

                      return (
                        <tr key={row.leaveTypeId} className={row.isLowBalance ? 'bg-rose-50' : ''}>
                          <td className="px-3 py-2 text-gray-900">{row.leaveTypeName}</td>
                          <td className="px-3 py-2 text-gray-700">{row.allocatedDays.toFixed(1)}</td>
                          <td className="px-3 py-2 text-gray-700">{row.takenDays.toFixed(1)}</td>
                          <td className="px-3 py-2 text-gray-700">{row.pendingDays.toFixed(1)}</td>
                          <td className="px-3 py-2">
                            <div className="w-44">
                              <div className="h-2 rounded-full bg-gray-200">
                                <div
                                  className={`h-2 rounded-full ${row.isLowBalance ? 'bg-rose-500' : 'bg-emerald-500'}`}
                                  style={{ width: `${Math.min(100, row.usagePercent)}%` }}
                                />
                              </div>
                              <div className="mt-1 text-xs text-gray-600">
                                {row.usagePercent.toFixed(1)}% used
                                {row.pendingDays > 0 && usageMode === 'APPROVED_ONLY'
                                  ? ` (+${row.pendingDays.toFixed(1)} pending)`
                                  : ''}
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-2">
                            <Link
                              className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
                              href={`/dashboard/employee/leave?${query.toString()}`}
                            >
                              View requests
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
