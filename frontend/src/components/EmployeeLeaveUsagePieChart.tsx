'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import type { LeaveStatsItem } from '../lib/api/leave';

type EmployeeLeaveUsagePieChartProps = {
  leaveStats: LeaveStatsItem[];
  loading?: boolean;
};

export default function EmployeeLeaveUsagePieChart({
  leaveStats,
  loading = false,
}: EmployeeLeaveUsagePieChartProps) {
  const totals = useMemo(() => {
    const allocated = leaveStats.reduce((sum, row) => sum + row.allocatedDays, 0);
    const used = leaveStats.reduce((sum, row) => sum + row.usedDays, 0);
    const pending = leaveStats.reduce((sum, row) => sum + row.pendingDays, 0);
    const remaining = Math.max(0, allocated - used - pending);
    return { allocated, used, pending, remaining };
  }, [leaveStats]);

  const gradient = useMemo(() => {
    if (totals.allocated <= 0) return 'conic-gradient(#e5e7eb 0deg 360deg)';
    const usedDeg = (totals.used / totals.allocated) * 360;
    const pendingDeg = (totals.pending / totals.allocated) * 360;
    const remainingDeg = Math.max(0, 360 - usedDeg - pendingDeg);

    return `conic-gradient(
      #10b981 0deg ${usedDeg}deg,
      #f59e0b ${usedDeg}deg ${usedDeg + pendingDeg}deg,
      #3b82f6 ${usedDeg + pendingDeg}deg ${usedDeg + pendingDeg + remainingDeg}deg
    )`;
  }, [totals]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Leave Usage Overview</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-sm text-gray-600">Loading chart...</div>
        ) : (
          <div className="flex flex-col items-center gap-4 md:flex-row md:items-start">
            <div className="relative h-48 w-48 rounded-full" style={{ background: gradient }}>
              <div className="absolute inset-7 flex items-center justify-center rounded-full bg-white">
                <div className="text-center">
                  <div className="text-xs text-gray-500">Allocated</div>
                  <div className="text-lg font-semibold text-gray-900">{totals.allocated.toFixed(1)}</div>
                </div>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="inline-block h-3 w-3 rounded-full bg-emerald-500" />
                <span className="text-gray-700">Taken: {totals.used.toFixed(1)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block h-3 w-3 rounded-full bg-amber-500" />
                <span className="text-gray-700">Pending: {totals.pending.toFixed(1)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block h-3 w-3 rounded-full bg-blue-500" />
                <span className="text-gray-700">Remaining: {totals.remaining.toFixed(1)}</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
