'use client';

import { useMemo } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card } from './ui/card';
import type { AttendanceDay } from '../lib/api/attendance';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const STATUS_STYLES: Record<AttendanceDay['status'], string> = {
  PRESENT: 'bg-green-100 text-green-800',
  LATE: 'bg-yellow-100 text-yellow-800',
  HALF_DAY: 'bg-orange-100 text-orange-800',
  ABSENT: 'bg-red-100 text-red-800',
  ON_LEAVE: 'bg-blue-100 text-blue-800',
  WEEKEND: 'bg-gray-100 text-gray-700',
  HOLIDAY: 'bg-purple-100 text-purple-800',
};

const STATUS_DOT: Record<AttendanceDay['status'], string> = {
  PRESENT: 'bg-green-500',
  LATE: 'bg-yellow-500',
  HALF_DAY: 'bg-orange-500',
  ABSENT: 'bg-red-500',
  ON_LEAVE: 'bg-blue-500',
  WEEKEND: 'bg-gray-500',
  HOLIDAY: 'bg-purple-500',
};

type AttendanceCalendarProps = {
  currentMonth: Date;
  onMonthChange: (next: Date) => void;
  attendance: AttendanceDay[];
  loading?: boolean;
  error?: string | null;
};

export default function AttendanceCalendar({
  currentMonth,
  onMonthChange,
  attendance,
  loading,
  error,
}: AttendanceCalendarProps) {
  const monthLabel = currentMonth.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const attendanceMap = useMemo(() => {
    const map = new Map<string, AttendanceDay>();
    attendance.forEach((day) => {
      const d = new Date(day.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
        d.getDate(),
      ).padStart(2, '0')}`;
      map.set(key, day);
    });
    return map;
  }, [attendance]);

  const calendarCells = useMemo(() => {
    const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const startDay = startOfMonth.getDay();
    const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
    const totalCells = Math.ceil((startDay + daysInMonth) / 7) * 7;

    return Array.from({ length: totalCells }, (_, index) => {
      const dayNumber = index - startDay + 1;
      const isCurrentMonth = dayNumber >= 1 && dayNumber <= daysInMonth;
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), dayNumber);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
        date.getDate(),
      ).padStart(2, '0')}`;
      return { dayNumber, isCurrentMonth, key };
    });
  }, [currentMonth]);

  return (
    <Card className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm max-w-5xl mx-auto">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-gray-900">
            <CalendarDays className="h-5 w-5" />
            <span className="text-lg font-semibold">{monthLabel}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                onMonthChange(
                  new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1),
                )
              }
              className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() =>
                onMonthChange(
                  new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1),
                )
              }
              className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold text-gray-700">
          {(Object.keys(STATUS_STYLES) as AttendanceDay['status'][]).map((status) => (
            <div
              key={status}
              className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-2 py-1"
            >
              <span className={`h-2 w-2 rounded-full ${STATUS_DOT[status]}`} />
              <span>{status.replace('_', ' ')}</span>
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mt-6 grid grid-cols-7 gap-2 text-center text-xs font-semibold text-gray-500">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className={`py-2 ${day === 'Sat' ? 'text-red-500' : ''}`}
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {calendarCells.map((cell) => {
          const day = attendanceMap.get(cell.key);
          const status = day?.status;
          const isPresentDay = status === 'PRESENT' || status === 'LATE' || status === 'HALF_DAY';
          const isAbsentDay = status === 'ABSENT';
          return (
            <div
              key={cell.key}
              className={`min-h-[76px] rounded-xl border border-gray-200 p-2 text-sm ${
                cell.isCurrentMonth ? '' : 'bg-gray-50 text-gray-400'
              } ${
                cell.isCurrentMonth
                  ? isPresentDay
                    ? 'bg-green-100 border-green-300'
                    : isAbsentDay
                      ? 'bg-red-50 border-red-200'
                      : 'bg-white'
                  : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <span className="text-[11px] font-semibold text-gray-700">
                  {cell.isCurrentMonth ? cell.dayNumber : ''}
                </span>
                {status && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${STATUS_STYLES[status]}`}
                  >
                    {status.replace('_', ' ')}
                  </span>
                )}
              </div>
              {day?.checkInTime && (
                <div className="mt-2 text-[11px] text-gray-600">
                  In:{' '}
                  {new Date(day.checkInTime).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              )}
              {day?.checkOutTime && (
                <div className="text-[11px] text-gray-600">
                  Out:{' '}
                  {new Date(day.checkOutTime).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {loading && (
        <div className="mt-4 text-sm text-gray-500">Loading attendance...</div>
      )}
    </Card>
  );
}
