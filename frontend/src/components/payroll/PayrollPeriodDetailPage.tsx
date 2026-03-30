'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowLeft, FileText, PlayCircle, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../DashboardLayout';
import { PageHeader } from '../PageHeader';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { useBreadcrumbs } from '../AppBreadcrumbs';
import {
  payrollApi,
  type PayrollPeriodDetailRecord,
  type PayslipRecord,
  type PayrollSummaryRecord,
} from '../../lib/api/payroll';
import { PayslipPreviewModal } from './PayslipPreviewModal';

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function formatCurrency(value: number) {
  return `NPR ${value.toLocaleString()}`;
}

function formatDate(value?: string | null) {
  return value ? new Date(value).toLocaleDateString('en-GB') : 'Not set';
}

function statusClass(status: string) {
  switch (status) {
    case 'FINALIZED':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700';
    case 'PROCESSED':
      return 'border-blue-200 bg-blue-50 text-blue-700';
    default:
      return 'border-amber-200 bg-amber-50 text-amber-700';
  }
}

interface PayrollPeriodDetailPageProps {
  periodId: string;
  basePath: string;
}

export default function PayrollPeriodDetailPage({ periodId, basePath }: PayrollPeriodDetailPageProps) {
  const [period, setPeriod] = useState<PayrollPeriodDetailRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<'generate' | 'finalize' | null>(null);
  const [selectedPayslip, setSelectedPayslip] = useState<PayslipRecord | null>(null);
  const [payslipLoading, setPayslipLoading] = useState(false);
  const [summary, setSummary] = useState<PayrollSummaryRecord | null>(null);

  useBreadcrumbs(
    period
      ? [
          { href: basePath.replace(/\/payroll$/, ''), label: 'Dashboard' },
          { href: basePath, label: 'Payroll' },
          { label: period.periodLabel },
        ]
      : null,
  );

  const loadPeriod = async () => {
    setLoading(true);
    setError(null);
    try {
      const [response, summaryResponse] = await Promise.all([
        payrollApi.getAdminPayrollPeriodById(periodId),
        payrollApi.getAdminPayrollSummary(),
      ]);
      setPeriod(response.data);
      setSummary(summaryResponse.data);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to load payroll period'));
      setPeriod(null);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPeriod();
  }, [periodId]);

  const handleGenerate = async () => {
    setActionLoading('generate');
    try {
      const response = await payrollApi.generateAdminPayroll(periodId);
      toast.success(response.message || 'Payroll generated successfully');
      await loadPeriod();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Failed to generate payroll'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleFinalize = async () => {
    setActionLoading('finalize');
    try {
      const response = await payrollApi.finalizeAdminPayroll(periodId);
      toast.success(response.message || 'Payroll finalized successfully');
      await loadPeriod();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Failed to finalize payroll'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleOpenPayslip = async (payslipId: string) => {
    setPayslipLoading(true);
    setSelectedPayslip(null);

    try {
      const response = await payrollApi.getAdminPayslipById(payslipId);
      setSelectedPayslip(response.data);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Failed to load payslip details'));
    } finally {
      setPayslipLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title={period?.periodLabel || 'Payroll Workspace'}
          description="Generate, review, and finalize monthly payroll for company employees."
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <Link href={basePath} className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-900 hover:bg-slate-100">
                <ArrowLeft className="h-4 w-4" />
                Back to Payroll
              </Link>
              <Button
                variant="outline"
                disabled={!period || period.status === 'FINALIZED' || actionLoading !== null}
                onClick={() => void handleGenerate()}
              >
                <PlayCircle className="h-4 w-4" />
                {actionLoading === 'generate' ? 'Generating...' : 'Generate Payroll'}
              </Button>
              <Button
                variant="green"
                disabled={!period || period.status !== 'PROCESSED' || actionLoading !== null}
                onClick={() => void handleFinalize()}
              >
                <ShieldCheck className="h-4 w-4" />
                {actionLoading === 'finalize' ? 'Finalizing...' : 'Finalize Payroll'}
              </Button>
            </div>
          }
        />

        {error ? <Card><CardContent className="pt-6 text-sm text-red-600">{error}</CardContent></Card> : null}

        {loading || !period ? (
          <Card><CardContent className="pt-6 text-sm text-gray-600">Loading payroll workspace...</CardContent></Card>
        ) : (
          <>
            <Card>
              <CardContent className="grid grid-cols-1 gap-4 pt-6 md:grid-cols-5">
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Status</p>
                  <span className={`mt-2 inline-flex rounded-full border px-3 py-1.5 text-xs font-medium ${statusClass(period.status)}`}>{period.status}</span>
                </div>
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-blue-700">Employees</p>
                  <p className="mt-2 text-2xl font-semibold text-blue-800">{period.summary.totalEmployees}</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-700">Gross Total</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">{formatCurrency(period.summary.totalGross)}</p>
                </div>
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-amber-700">Total TDS</p>
                  <p className="mt-2 text-lg font-semibold text-amber-800">{formatCurrency(period.summary.totalTds)}</p>
                </div>
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-emerald-700">Net Total</p>
                  <p className="mt-2 text-lg font-semibold text-emerald-800">{formatCurrency(period.summary.totalNet)}</p>
                </div>
              </CardContent>
            </Card>

            {summary ? (
              <Card>
                <CardHeader>
                  <CardTitle>Company Tax and SSF Snapshot</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                    <p className="text-xs uppercase tracking-wide text-amber-700">Tax Paid Till Date</p>
                    <p className="mt-2 text-lg font-semibold text-amber-800">{formatCurrency(summary.totalTdsPaid)}</p>
                  </div>
                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                    <p className="text-xs uppercase tracking-wide text-blue-700">Employee SSF</p>
                    <p className="mt-2 text-lg font-semibold text-blue-800">{formatCurrency(summary.totalEmployeeSsf)}</p>
                  </div>
                  <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-4">
                    <p className="text-xs uppercase tracking-wide text-indigo-700">Employer SSF</p>
                    <p className="mt-2 text-lg font-semibold text-indigo-800">{formatCurrency(summary.totalEmployerSsf)}</p>
                  </div>
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                    <p className="text-xs uppercase tracking-wide text-emerald-700">Total SSF</p>
                    <p className="mt-2 text-lg font-semibold text-emerald-800">{formatCurrency(summary.totalSsfContribution)}</p>
                  </div>
                </CardContent>
              </Card>
            ) : null}

            <Card>
              <CardHeader>
                <CardTitle>Payroll Summary</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div><p className="text-xs uppercase tracking-wide text-gray-500">Fiscal Year</p><p className="mt-2 text-sm font-semibold text-gray-900">{period.fiscalYearLabel}</p></div>
                <div><p className="text-xs uppercase tracking-wide text-gray-500">Date Range</p><p className="mt-2 text-sm font-semibold text-gray-900">{formatDate(period.startDate)} - {formatDate(period.endDate)}</p></div>
                <div><p className="text-xs uppercase tracking-wide text-gray-500">Processed At</p><p className="mt-2 text-sm font-semibold text-gray-900">{formatDate(period.processedAt)}</p></div>
                <div><p className="text-xs uppercase tracking-wide text-gray-500">Finalized At</p><p className="mt-2 text-sm font-semibold text-gray-900">{formatDate(period.finalizedAt)}</p></div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payslips</CardTitle>
              </CardHeader>
              <CardContent>
                {period.payslips.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-sm text-gray-600">Generate payroll to create payslips for this period.</div>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left font-medium text-gray-600">Employee</th>
                          <th className="px-4 py-3 text-left font-medium text-gray-600">Gross</th>
                          <th className="px-4 py-3 text-left font-medium text-gray-600">TDS</th>
                          <th className="px-4 py-3 text-left font-medium text-gray-600">Net</th>
                          <th className="px-4 py-3 text-left font-medium text-gray-600">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 bg-white">
                        {period.payslips.map((payslip) => (
                          <tr key={payslip.id}>
                            <td className="px-4 py-3 text-gray-700">{payslip.employee?.firstName} {payslip.employee?.lastName}</td>
                            <td className="px-4 py-3 text-gray-700">{formatCurrency(payslip.grossSalary)}</td>
                            <td className="px-4 py-3 text-gray-700">{formatCurrency(payslip.monthlyTds)}</td>
                            <td className="px-4 py-3 font-medium text-gray-900">{formatCurrency(payslip.netSalary)}</td>
                            <td className="px-4 py-3">
                              <Button variant="outline" size="sm" onClick={() => void handleOpenPayslip(payslip.id)}>
                                <FileText className="h-4 w-4" />
                                View
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <PayslipPreviewModal
        open={!!selectedPayslip || payslipLoading}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedPayslip(null);
            setPayslipLoading(false);
          }
        }}
        payslip={selectedPayslip}
        loading={payslipLoading}
      />
    </DashboardLayout>
  );
}
