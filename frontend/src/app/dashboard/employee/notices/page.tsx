'use client';

import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../../../../components/DashboardLayout';
import { PageHeader } from '../../../../components/PageHeader';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { noticesApi, type Notice } from '../../../../lib/api/notices';
import toast from 'react-hot-toast';

const PRIORITY_BADGE: Record<string, string> = {
  HIGH: 'bg-red-100 text-red-700',
  NORMAL: 'bg-blue-100 text-blue-700',
  LOW: 'bg-gray-100 text-gray-700',
};

const formatDate = (value?: string | null) => {
  if (!value) return '-';
  return new Date(value).toLocaleString('en-GB', {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

function PriorityPill({ priority }: { priority: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${PRIORITY_BADGE[priority] || 'bg-gray-100 text-gray-700'}`}>
      {priority}
    </span>
  );
}

export default function EmployeeNoticesPage() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [page] = useState(1);
  const [limit] = useState(20);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await noticesApi.listMy({ search: search || undefined, unreadOnly, page, limit });
      setNotices(res.data || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load notices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, unreadOnly, page, limit]);

  const unreadCount = useMemo(() => notices.filter((n) => !n.isRead).length, [notices]);

  const handleMarkRead = async (id: string) => {
    try {
      await noticesApi.markRead(id);
      toast.success('Marked as read');
      load();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to mark as read');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Notices"
          description="Company announcements and updates."
        />

        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 md:flex-row md:items-center">
            <Input
              placeholder="Search by title or content"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="md:w-1/2"
            />
            <div className="flex items-center gap-2">
              <input
                id="unreadOnly"
                type="checkbox"
                checked={unreadOnly}
                onChange={(e) => setUnreadOnly(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="unreadOnly" className="text-sm text-gray-700">
                Show only unread ({unreadCount})
              </label>
            </div>
          </CardContent>
        </Card>

        {error && <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        <div className="grid gap-4">
          {loading && <div className="text-sm text-gray-600">Loading notices...</div>}
          {!loading && notices.length === 0 && (
            <div className="rounded-md border border-dashed border-gray-300 px-4 py-6 text-center text-sm text-gray-600">
              No notices found.
            </div>
          )}

          {!loading && notices.map((notice) => (
            <Card key={notice.id} className="border border-gray-200">
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <PriorityPill priority={notice.priority} />
                    <span className={`text-xs font-semibold ${notice.isRead ? 'text-gray-500' : 'text-blue-700'}`}>
                      {notice.isRead ? 'Read' : 'Unread'}
                    </span>
                  </div>
                  <CardTitle className="text-lg leading-tight text-gray-900">{notice.title}</CardTitle>
                  <p className="text-sm text-gray-700 whitespace-pre-line">{notice.body}</p>
                </div>
                {!notice.isRead && (
                  <Button variant="blue" size="sm" onClick={() => handleMarkRead(notice.id)}>
                    Mark as Read
                  </Button>
                )}
              </CardHeader>
              <CardContent className="flex flex-wrap gap-4 text-xs text-gray-600">
                <div>
                  <span className="font-semibold text-gray-700">Publish:</span> {formatDate(notice.publishAt)}
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Expires:</span> {formatDate(notice.expiresAt)}
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Company-wide:</span> {notice.isCompanyWide ? 'Yes' : 'Targeted'}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
