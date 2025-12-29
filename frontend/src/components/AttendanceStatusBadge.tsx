'use client';

import type { AttendanceDay } from '../lib/api/attendance';

const STATUS_STYLES: Record<AttendanceDay['status'], string> = {
  PRESENT: 'bg-green-100 text-green-800',
  LATE: 'bg-yellow-100 text-yellow-800',
  HALF_DAY: 'bg-orange-100 text-orange-800',
  ABSENT: 'bg-red-100 text-red-800',
  ON_LEAVE: 'bg-blue-100 text-blue-800',
  WEEKEND: 'bg-gray-100 text-gray-700',
  HOLIDAY: 'bg-purple-100 text-purple-800',
};

type AttendanceStatusBadgeProps = {
  status: AttendanceDay['status'];
};

export default function AttendanceStatusBadge({ status }: AttendanceStatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap px-2 py-0.5 rounded-full text-[10px] font-semibold leading-none ${STATUS_STYLES[status]}`}
    >
      {status.replace('_', ' ')}
    </span>
  );
}
