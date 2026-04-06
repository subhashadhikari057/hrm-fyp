import type { ReactNode } from 'react';
import type { ComplaintRecord } from '../../lib/api/complaints';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { ComplaintStatusBadge } from './ComplaintStatusBadge';

const PRIORITY_CLASSES: Record<string, string> = {
  LOW: 'bg-gray-100 text-gray-700',
  MEDIUM: 'bg-orange-100 text-orange-700',
  HIGH: 'bg-rose-100 text-rose-700',
};

function formatDateTime(value?: string | null) {
  if (!value) return '-';
  return new Date(value).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface ComplaintDetailPanelProps {
  complaint: ComplaintRecord | null;
  loading?: boolean;
  showEmployee?: boolean;
  asCard?: boolean;
}

export function ComplaintDetailPanel({
  complaint,
  loading = false,
  showEmployee = false,
  asCard = true,
}: ComplaintDetailPanelProps) {
  const wrap = (children: ReactNode) => {
    if (!asCard) {
      return <>{children}</>;
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle>Complaint Details</CardTitle>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    );
  };

  if (loading) {
    return wrap(<div className="text-sm text-gray-600">Loading complaint details...</div>);
  }

  if (!complaint) {
    return wrap(<div className="text-sm text-gray-600">Select a complaint to view details.</div>);
  }

  const employeeName = complaint.employee
    ? `${complaint.employee.firstName ?? ''} ${complaint.employee.lastName ?? ''}`.trim()
    : '';

  return wrap(
    <div className="space-y-4">
        <div className="space-y-2 rounded-md border border-gray-200 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <ComplaintStatusBadge status={complaint.status} />
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${PRIORITY_CLASSES[complaint.priority] ?? PRIORITY_CLASSES.MEDIUM}`}
            >
              {complaint.priority}
            </span>
          </div>

          <div>
            <p className="text-xs text-gray-500">Title</p>
            <p className="text-sm font-medium text-gray-900">{complaint.title}</p>
          </div>

          <div>
            <p className="text-xs text-gray-500">Description</p>
            <p className="whitespace-pre-wrap text-sm text-gray-700">{complaint.description}</p>
          </div>

          {showEmployee && (
            <div>
              <p className="text-xs text-gray-500">Employee</p>
              <p className="text-sm text-gray-700">
                {employeeName || '-'}
                {complaint.employee?.employeeCode ? ` (${complaint.employee.employeeCode})` : ''}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <p className="text-xs text-gray-500">Created</p>
              <p className="text-sm text-gray-700">{formatDateTime(complaint.createdAt)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Closed</p>
              <p className="text-sm text-gray-700">{formatDateTime(complaint.closedAt)}</p>
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-gray-900">Notes Timeline</h4>
          {!complaint.notes || complaint.notes.length === 0 ? (
            <p className="mt-2 text-sm text-gray-600">No notes added yet.</p>
          ) : (
            <div className="mt-2 space-y-2">
              {complaint.notes.map((note) => (
                <div key={note.id} className="rounded-md border border-gray-200 bg-gray-50 p-3">
                  <p className="whitespace-pre-wrap text-sm text-gray-800">{note.note}</p>
                  <p className="mt-2 text-xs text-gray-500">
                    {note.authorUser?.fullName || note.authorUser?.email || 'System'} •{' '}
                    {formatDateTime(note.createdAt)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>,
  );
}
