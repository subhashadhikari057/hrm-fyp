'use client';

import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import DashboardLayout from '../DashboardLayout';
import { PageHeader } from '../PageHeader';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { policyApi, type Policy } from '../../lib/api/policy';
import { PolicyFormModal } from './PolicyFormModal';

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

export default function PolicyHubManagementPage() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [updateOpen, setUpdateOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadPolicies = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await policyApi.listPolicies();
      setPolicies(response.data || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load policies');
      setPolicies([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPolicies();
  }, []);

  const activePolicy = useMemo(
    () => policies.find((policy) => policy.isActive) || null,
    [policies],
  );

  const handleCreate = async (payload: { title?: string; content: string; version?: string; effectiveFrom?: string }) => {
    if (!payload.title) {
      toast.error('Title is required');
      return;
    }

    setSaving(true);
    try {
      await policyApi.createPolicy({
        title: payload.title,
        content: payload.content,
        effectiveFrom: payload.effectiveFrom,
      });
      toast.success('Policy created and published');
      setCreateOpen(false);
      await loadPolicies();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to create policy');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (payload: { title?: string; content: string; version?: string; effectiveFrom?: string }) => {
    if (!activePolicy) {
      toast.error('No active policy found');
      return;
    }
    if (!payload.version) {
      toast.error('Version is required');
      return;
    }

    setSaving(true);
    try {
      await policyApi.updatePolicy(activePolicy.id, {
        title: payload.title,
        content: payload.content,
        version: payload.version,
        effectiveFrom: payload.effectiveFrom,
      });
      toast.success('New policy version published');
      setUpdateOpen(false);
      await loadPolicies();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update policy');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Policy Hub"
          description="Create and publish company policy versions."
          actions={
            <div className="flex gap-2">
              <Button variant="blue" onClick={() => setCreateOpen(true)}>
                Add Policy
              </Button>
              <Button
                variant="default"
                onClick={() => setUpdateOpen(true)}
                disabled={!activePolicy}
              >
                Update Active Policy
              </Button>
            </div>
          }
        />

        <Card>
          <CardHeader>
            <CardTitle>Active Policy</CardTitle>
          </CardHeader>
          <CardContent>
            {error && <div className="mb-3 text-sm text-red-600">{error}</div>}
            {loading ? (
              <div className="text-sm text-gray-600">Loading policy...</div>
            ) : !activePolicy ? (
              <div className="text-sm text-gray-600">No active policy yet.</div>
            ) : (
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500">Title</p>
                  <p className="text-sm font-semibold text-gray-900">{activePolicy.title}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Latest Version</p>
                  <p className="text-sm text-gray-700">
                    v{activePolicy.versions[0]?.version ?? '-'} • Effective: {formatDate(activePolicy.versions[0]?.effectiveFrom)}
                  </p>
                </div>
                <div className="rounded-md border border-gray-200 bg-gray-50 p-3">
                  <pre className="whitespace-pre-wrap text-sm text-gray-800">
                    {activePolicy.versions[0]?.content || '-'}
                  </pre>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Policy Versions</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-sm text-gray-600">Loading versions...</div>
            ) : policies.length === 0 ? (
              <div className="text-sm text-gray-600">No policies found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">Policy</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">Version</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">Status</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">Effective</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">Published</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {policies.flatMap((policy) =>
                      policy.versions.map((version) => (
                        <tr key={version.id} className="hover:bg-gray-50">
                          <td className="px-3 py-2 text-gray-900">{policy.title}</td>
                          <td className="px-3 py-2 text-gray-700">v{version.version}</td>
                          <td className="px-3 py-2">
                            <span
                              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${policy.isActive && policy.versions[0]?.id === version.id ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'}`}
                            >
                              {policy.isActive && policy.versions[0]?.id === version.id ? 'ACTIVE' : 'ARCHIVE'}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-gray-700">{formatDate(version.effectiveFrom)}</td>
                          <td className="px-3 py-2 text-gray-700">{formatDate(version.createdAt)}</td>
                        </tr>
                      )),
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <PolicyFormModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        mode="create"
        loading={saving}
        onSubmit={handleCreate}
      />

      <PolicyFormModal
        open={updateOpen}
        onOpenChange={setUpdateOpen}
        mode="update"
        loading={saving}
        initialTitle={activePolicy?.title || ''}
        initialVersion={activePolicy?.versions?.[0]?.version || ''}
        onSubmit={handleUpdate}
      />
    </DashboardLayout>
  );
}
