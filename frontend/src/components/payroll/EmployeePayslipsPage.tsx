'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import DashboardLayout from '../DashboardLayout';
import { PageHeader } from '../PageHeader';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { payrollApi, type PayslipRecord, type PayrollSummaryRecord } from '../../lib/api/payroll';

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function formatCurrency(value: number) {
  return `NPR ${value.toLocaleString()}`;
}

interface EmployeePayslipsPageProps {
  detailBasePath?: string;
}

export default function EmployeePayslipsPage({ detailBasePath = '/dashboard/employee/payslips' }: EmployeePayslipsPageProps) {
  const [payslips, setPayslips] = useState<PayslipRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [summary, setSummary] = useState<PayrollSummaryRecord | null>(null);

  const loadPayslips = async () => {
    setLoading(true);
    setError(null);
    try {
      const [response, summaryResponse] = await Promise.all([
        payrollApi.listMyPayslips({
          page,
          limit: 10,
        }),
        payrollApi.getMyPayrollSummary(),
      ]);
      setPayslips(response.data || []);
      setTotalPages(response.meta?.totalPages || 1);
      setSummary(summaryResponse.data);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to load payslips'));
      setPayslips([]);
      setTotalPages(1);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPayslips();
  }, [page]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader title="Payslips" description="View your monthly payslips, tax deductions, and salary breakdowns." />

        {summary ? (
          <Card>
            <CardContent className="grid grid-cols-1 gap-4 pt-6 md:grid-cols-4">
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-amber-700">Tax Paid Till Date</p>
                <p className="mt-1 text-2xl font-semibold text-amber-800">{formatCurrency(summary.totalTdsPaid)}</p>
              </div>
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-blue-700">Your SSF</p>
                <p className="mt-1 text-2xl font-semibold text-blue-800">{formatCurrency(summary.totalEmployeeSsf)}</p>
              </div>
              <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-indigo-700">Company SSF</p>
                <p className="mt-1 text-2xl font-semibold text-indigo-800">{formatCurrency(summary.totalEmployerSsf)}</p>
              </div>
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">Total SSF Deposit</p>
                <p className="mt-1 text-2xl font-semibold text-emerald-800">{formatCurrency(summary.totalSsfContribution)}</p>
              </div>
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>My Payslips</CardTitle>
          </CardHeader>
          <CardContent>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}

            {loading ? (
              <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-8 text-sm text-gray-600">Loading payslips...</div>
            ) : payslips.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-sm text-gray-600">No payslips available yet.</div>
            ) : (
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                {payslips.map((payslip) => (
                  <Link
                    key={payslip.id}
                    href={`${detailBasePath}/${payslip.id}`}
                    className="block rounded-xl border border-gray-200 bg-white p-5 transition-colors hover:border-blue-300 hover:bg-blue-50/30"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-base font-semibold text-gray-900">{payslip.payrollPeriod?.periodLabel || 'Payslip'}</h3>
                        <p className="mt-1 text-sm text-gray-600">Fiscal Year {payslip.payrollPeriod?.fiscalYearLabel || '-'}</p>
                      </div>
                      <span className="inline-flex rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-[11px] font-medium text-gray-700">
                        {payslip.status}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-lg bg-gray-50 px-3 py-2">
                        <p className="text-xs text-gray-500">Net Salary</p>
                        <p className="mt-1 font-semibold text-gray-900">{formatCurrency(payslip.netSalary)}</p>
                      </div>
                      <div className="rounded-lg bg-gray-50 px-3 py-2">
                        <p className="text-xs text-gray-500">Monthly TDS</p>
                        <p className="mt-1 font-semibold text-gray-900">{formatCurrency(payslip.monthlyTds)}</p>
                      </div>
                    </div>

                    <div className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-blue-700">
                      <FileText className="h-4 w-4" />
                      View Payslip
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
    </DashboardLayout>
  );
}
