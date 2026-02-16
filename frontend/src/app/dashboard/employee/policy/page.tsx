'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '../../../../components/DashboardLayout';
import { PageHeader } from '../../../../components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { policyApi, type Policy } from '../../../../lib/api/policy';

function formatDate(value?: string | null) {
  if (!value) return '-';
  return new Date(value).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function EmployeePolicyPage() {
  const [policy, setPolicy] = useState<Policy | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCurrentPolicy = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await policyApi.getCurrentPolicy();
        setPolicy(response.data);
      } catch (err: any) {
        setError(err?.message || 'Failed to load current policy');
        setPolicy(null);
      } finally {
        setLoading(false);
      }
    };

    loadCurrentPolicy();
  }, []);

  const latestVersion = policy?.versions?.[0] || null;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Current Policy"
          description="View your company’s currently active policy and latest version."
        />

        <Card>
          <CardHeader>
            <CardTitle>Policy Details</CardTitle>
          </CardHeader>
          <CardContent>
            {error && <div className="mb-3 text-sm text-red-600">{error}</div>}
            {loading ? (
              <div className="text-sm text-gray-600">Loading policy...</div>
            ) : !policy || !latestVersion ? (
              <div className="text-sm text-gray-600">No active policy available.</div>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-gray-500">Title</p>
                  <p className="text-sm font-semibold text-gray-900">{policy.title}</p>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-gray-500">Version</p>
                    <p className="text-sm text-gray-700">v{latestVersion.version}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Effective From</p>
                    <p className="text-sm text-gray-700">{formatDate(latestVersion.effectiveFrom)}</p>
                  </div>
                </div>
                <div className="rounded-md border border-gray-200 bg-gray-50 p-3">
                  <pre className="whitespace-pre-wrap text-sm text-gray-800">{latestVersion.content}</pre>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
