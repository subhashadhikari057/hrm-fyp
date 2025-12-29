'use client';

import { CalendarRange } from 'lucide-react';

type AttendanceFilterBarProps = {
  dateFrom: string;
  dateTo: string;
  status: string;
  statusOptions: { value: string; label: string }[];
  employeeId: string;
  employeeOptions: { value: string; label: string }[];
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onEmployeeChange: (value: string) => void;
  onClear: () => void;
};

export default function AttendanceFilterBar({
  dateFrom,
  dateTo,
  status,
  statusOptions,
  employeeId,
  employeeOptions,
  onDateFromChange,
  onDateToChange,
  onStatusChange,
  onEmployeeChange,
  onClear,
}: AttendanceFilterBarProps) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
        <CalendarRange className="h-4 w-4 text-gray-500" />
        Attendance Range
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="flex flex-col gap-1 text-xs font-medium text-gray-600">
          From
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => onDateFromChange(e.target.value)}
            className="h-9 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-gray-600">
          To
          <input
            type="date"
            value={dateTo}
            onChange={(e) => onDateToChange(e.target.value)}
            className="h-9 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-gray-600">
          Status
          <select
            value={status}
            onChange={(e) => onStatusChange(e.target.value)}
            className="h-9 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All</option>
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-gray-600">
          Employee
          <select
            value={employeeId}
            onChange={(e) => onEmployeeChange(e.target.value)}
            className="h-9 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All</option>
            {employeeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={onClear}
          className="h-9 rounded-lg border border-gray-200 bg-gray-50 px-3 text-xs font-semibold text-gray-600 hover:bg-gray-100"
        >
          Clear Filters
        </button>
      </div>
    </div>
  );
}
