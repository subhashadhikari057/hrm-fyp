import type { ComplaintStatus } from '../../lib/api/complaints';

const STATUS_CLASSES: Record<ComplaintStatus, string> = {
  OPEN: 'bg-amber-100 text-amber-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  CLOSED: 'bg-emerald-100 text-emerald-700',
};

export function ComplaintStatusBadge({ status }: { status: ComplaintStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${STATUS_CLASSES[status]}`}
    >
      {status.replace('_', ' ')}
    </span>
  );
}
