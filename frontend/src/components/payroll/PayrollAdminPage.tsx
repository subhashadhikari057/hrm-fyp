'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../DashboardLayout';
import { PageHeader } from '../PageHeader';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import {
  payrollApi,
  type CreatePayrollPeriodPayload,
  type PayrollPeriodRecord,
  type PayrollSettingsRecord,
  type PayrollPeriodStatus,
} from '../../lib/api/payroll';
import { PayrollPeriodModal } from './PayrollPeriodModal';
import { PayrollSettingsModal } from './PayrollSettingsModal';

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function periodStatusClass(status: PayrollPeriodStatus) {
  switch (status) {
    case 'FINALIZED':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700';
    case 'PROCESSED':
      return 'border-blue-200 bg-blue-50 text-blue-700';
    default:
      return 'border-amber-200 bg-amber-50 text-amber-700';
  }
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-GB');
}

interface PayrollAdminPageProps {
  detailBasePath?: string;
}

export default function PayrollAdminPage({ detailBasePath = '/dashboard/companyadmin/payroll' }: PayrollAdminPageProps) {
  const [periods, setPeriods] = useState<PayrollPeriodRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<PayrollPeriodStatus | 'ALL'>('ALL');
  const [modalOpen, setModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<PayrollSettingsRecord | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(false);

  const stats = useMemo(
    () => ({
      draft: periods.filter((period) => period.status === 'DRAFT').length,
      processed: periods.filter((period) => period.status === 'PROCESSED').length,
      finalized: periods.filter((period) => period.status === 'FINALIZED').length,
    }),
    [periods],
  );

  const loadPeriods = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await payrollApi.listAdminPayrollPeriods({
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        page,
        limit: 10,
      });
      setPeriods(response.data || []);
      setTotalPages(response.meta?.totalPages || 1);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to load payroll periods'));
      setPeriods([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPeriods();
  }, [page, statusFilter]);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await payrollApi.getAdminPayrollSettings();
        setSettings(response.data);
      } catch {
        setSettings(null);
      }
    };
    void loadSettings();
  }, []);

  const handleCreate = async (payload: CreatePayrollPeriodPayload) => {
    setCreating(true);
    try {
      await payrollApi.createAdminPayrollPeriod(payload);
      toast.success('Payroll period created successfully');
      setModalOpen(false);
      setPage(1);
      await loadPeriods();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Failed to create payroll period'));
    } finally {
      setCreating(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Payroll"
          description="Manage monthly payroll periods and open a detailed payroll workspace for generation and review."
          actions={
            <>
              <Button variant="outline" onClick={() => setSettingsOpen(true)}>
                Payroll Settings
              </Button>
              <Button variant="blue" onClick={() => setModalOpen(true)}>
                <Plus className="h-4 w-4" />
                Create Period
              </Button>
            </>
          }
        />

        {settings ? (
          <Card>
            <CardContent className="grid grid-cols-1 gap-4 pt-6 md:grid-cols-4">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-700">Tax Deduction</p>
                <p className="mt-1 text-lg font-semibold text-slate-900">{settings.enableTaxDeduction ? 'Enabled' : 'Disabled'}</p>
              </div>
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-blue-700">Employee SSF</p>
                <p className="mt-1 text-lg font-semibold text-blue-800">{settings.enableEmployeeSsf ? `${(settings.employeeSsfRate * 100).toFixed(0)}%` : 'Disabled'}</p>
              </div>
              <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-indigo-700">Employer SSF</p>
                <p className="mt-1 text-lg font-semibold text-indigo-800">{settings.enableEmployerSsf ? `${(settings.employerSsfRate * 100).toFixed(0)}%` : 'Disabled'}</p>
              </div>
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">Payroll Rules</p>
                <p className="mt-1 text-sm font-semibold text-emerald-800">Company-specific deduction setup</p>
              </div>
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardContent className="grid grid-cols-1 gap-4 pt-6 md:grid-cols-3">
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-amber-700">Draft</p>
              <p className="mt-1 text-2xl font-semibold text-amber-800">{stats.draft}</p>
            </div>
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-blue-700">Processed</p>
              <p className="mt-1 text-2xl font-semibold text-blue-800">{stats.processed}</p>
            </div>
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">Finalized</p>
              <p className="mt-1 text-2xl font-semibold text-emerald-800">{stats.finalized}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <CardTitle>Payroll Periods</CardTitle>
            <select
              className="h-10 min-w-52 rounded-md border border-gray-300 bg-white px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as PayrollPeriodStatus | 'ALL');
                setPage(1);
              }}
            >
              <option value="ALL">All statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="PROCESSED">Processed</option>
              <option value="FINALIZED">Finalized</option>
            </select>
          </CardHeader>
          <CardContent>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}

            {loading ? (
              <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-8 text-sm text-gray-600">Loading payroll periods...</div>
            ) : periods.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-sm text-gray-600">No payroll periods found.</div>
            ) : (
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                {periods.map((period) => (
                  <Link
                    key={period.id}
                    href={`${detailBasePath}/${period.id}`}
                    className="block rounded-xl border border-gray-200 bg-white p-5 transition-colors hover:border-blue-300 hover:bg-blue-50/30"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-base font-semibold text-gray-900">{period.periodLabel}</h3>
                        <p className="mt-1 text-sm text-gray-600">Fiscal Year {period.fiscalYearLabel}</p>
                      </div>
                      <span className={`inline-flex rounded-md border px-2 py-1 text-[11px] font-medium ${periodStatusClass(period.status)}`}>
                        {period.status}
                      </span>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2 text-xs text-gray-600">
                      <span className="rounded-full bg-gray-100 px-2.5 py-1">{formatDate(period.startDate)} - {formatDate(period.endDate)}</span>
                      <span className="rounded-full bg-gray-100 px-2.5 py-1">{period._count?.payslips || 0} payslips</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            <div className="mt-6 flex items-center justify-between gap-3 border-t border-gray-100 pt-4 text-sm text-gray-600">
              <span>Page {page} of {totalPages}</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((prev) => Math.max(1, prev - 1))}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((prev) => prev + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <PayrollPeriodModal open={modalOpen} onOpenChange={setModalOpen} loading={creating} onSubmit={handleCreate} />
      <PayrollSettingsModal
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        settings={settings}
        loading={settingsLoading}
        onSubmit={async (payload) => {
          setSettingsLoading(true);
          try {
            const response = await payrollApi.updateAdminPayrollSettings(payload);
            setSettings(response.data);
            toast.success('Payroll settings updated successfully');
            setSettingsOpen(false);
          } catch (err: unknown) {
            toast.error(getErrorMessage(err, 'Failed to update payroll settings'));
          } finally {
            setSettingsLoading(false);
          }
        }}
      />
    </DashboardLayout>
  );
}
