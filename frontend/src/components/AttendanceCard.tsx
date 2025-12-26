'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

export interface AttendanceSummary {
  status?: string | null;
  checkInTime?: string | null;
  checkOutTime?: string | null;
  totalWorkMinutes?: number | null;
  lateMinutes?: number | null;
  overtimeMinutes?: number | null;
}

interface AttendanceCardProps {
  attendance: AttendanceSummary | null;
  title?: string;
}

const statusStyles: Record<string, string> = {
  present: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  late: 'bg-rose-50 text-rose-700 border-rose-200',
  absent: 'bg-slate-50 text-slate-700 border-slate-200',
  on_leave: 'bg-blue-50 text-blue-700 border-blue-200',
};

function formatTime(value?: string | null) {
  if (!value) return '-';
  const date = new Date(value);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatMinutes(total?: number | null) {
  if (!total && total !== 0) return '-';
  if (total < 60) return `${total} min`;
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  return minutes ? `${hours}h ${minutes}m` : `${hours}h`;
}

function formatStatus(value?: string | null) {
  if (!value) return 'Unknown';
  return value.replace('_', ' ').replace(/\b\w/g, (m) => m.toUpperCase());
}

export function AttendanceCard({ attendance, title = "Today's Attendance" }: AttendanceCardProps) {
  const rawStatus = attendance?.status ?? 'unknown';
  const statusKey = rawStatus.toLowerCase();
  const statusClass = statusStyles[statusKey] || 'bg-blue-50 text-blue-700 border-blue-200';
  const showStatus = Boolean(attendance?.status);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold text-gray-900">{title}</CardTitle>
        {showStatus && (
          <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${statusClass}`}>
            {formatStatus(rawStatus)}
          </span>
        )}
      </CardHeader>
      <CardContent>
        {attendance ? (
          <div className="grid gap-3 text-sm text-gray-700 sm:grid-cols-2">
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Check-in</p>
              <p className="text-base font-semibold text-gray-900">
                {formatTime(attendance.checkInTime)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Check-out</p>
              <p className="text-base font-semibold text-gray-900">
                {formatTime(attendance.checkOutTime)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Worked</p>
              <p className="text-base font-semibold text-gray-900">
                {formatMinutes(attendance.totalWorkMinutes)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Late by</p>
              <p className="text-base font-semibold text-gray-900">
                {attendance.lateMinutes && attendance.lateMinutes > 0
                  ? formatMinutes(attendance.lateMinutes)
                  : '-'}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Overtime</p>
              <p className="text-base font-semibold text-gray-900">
                {attendance.overtimeMinutes && attendance.overtimeMinutes > 0
                  ? formatMinutes(attendance.overtimeMinutes)
                  : '-'}
              </p>
            </div>
          </div>
        ) : (
          <div className="text-sm text-gray-600">
            No attendance recorded for today.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
