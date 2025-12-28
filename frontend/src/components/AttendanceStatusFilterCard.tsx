'use client';

type AttendanceStatusFilterCardProps = {
  status: string;
  options: { value: string; label: string }[];
  onStatusChange: (value: string) => void;
  onClear: () => void;
};

export default function AttendanceStatusFilterCard({
  status,
  options,
  onStatusChange,
  onClear,
}: AttendanceStatusFilterCardProps) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="text-sm font-semibold text-gray-900">Status Filter</div>
      <label className="flex flex-col gap-1 text-xs font-medium text-gray-600">
        Status
        <select
          value={status}
          onChange={(e) => onStatusChange(e.target.value)}
          className="h-9 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All</option>
          {options.map((option) => (
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
        Clear Status
      </button>
    </div>
  );
}
