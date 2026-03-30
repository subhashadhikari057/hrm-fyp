'use client';

import type { PayslipRecord } from '../../lib/api/payroll';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

function formatCurrency(value: number) {
  return `NPR ${value.toLocaleString()}`;
}

function formatDate(value?: string | null) {
  return value ? new Date(value).toLocaleDateString('en-GB') : 'Not set';
}

interface PayslipDetailsCardProps {
  payslip: PayslipRecord;
}

export function PayslipDetailsCard({ payslip }: PayslipDetailsCardProps) {
  const earnings = (payslip.lineItems || []).filter((item) => item.type === 'EARNING');
  const deductions = (payslip.lineItems || []).filter((item) => item.type === 'DEDUCTION');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{payslip.payrollPeriod?.periodLabel || 'Payslip'}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">Gross Salary</p>
            <p className="mt-2 text-lg font-semibold text-gray-900">{formatCurrency(payslip.grossSalary)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">Monthly TDS</p>
            <p className="mt-2 text-lg font-semibold text-amber-700">{formatCurrency(payslip.monthlyTds)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">SSF Contribution</p>
            <p className="mt-2 text-lg font-semibold text-blue-700">{formatCurrency(payslip.ssfEmployeeContribution)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">Net Salary</p>
            <p className="mt-2 text-lg font-semibold text-emerald-700">{formatCurrency(payslip.netSalary)}</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Earnings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {earnings.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                <span className="text-sm text-gray-700">{item.title}</span>
                <span className="text-sm font-semibold text-gray-900">{formatCurrency(item.amount)}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Deductions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {deductions.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                <span className="text-sm text-gray-700">{item.title}</span>
                <span className="text-sm font-semibold text-gray-900">{formatCurrency(item.amount)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>SSF Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-blue-700">Employee SSF</p>
            <p className="mt-2 text-sm font-semibold text-blue-900">{formatCurrency(payslip.ssfEmployeeContribution)}</p>
          </div>
          <div className="rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-indigo-700">Employer SSF</p>
            <p className="mt-2 text-sm font-semibold text-indigo-900">{formatCurrency(payslip.ssfEmployerContribution)}</p>
          </div>
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-emerald-700">Total SSF Deposit</p>
            <p className="mt-2 text-sm font-semibold text-emerald-900">{formatCurrency(payslip.totalSsfContribution)}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tax Snapshot</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">Projected Annual Income</p>
            <p className="mt-2 text-sm font-semibold text-gray-900">{formatCurrency(payslip.projectedAnnualIncome)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">Taxable Annual Income</p>
            <p className="mt-2 text-sm font-semibold text-gray-900">{formatCurrency(payslip.taxableAnnualIncome)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">Annual Tax Liability</p>
            <p className="mt-2 text-sm font-semibold text-gray-900">{formatCurrency(payslip.annualTaxLiability)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">Tax Paid To Date</p>
            <p className="mt-2 text-sm font-semibold text-gray-900">{formatCurrency(payslip.taxPaidToDate)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">Generated At</p>
            <p className="mt-2 text-sm font-semibold text-gray-900">{formatDate(payslip.generatedAt)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">Marital Status</p>
            <p className="mt-2 text-sm font-semibold text-gray-900">{payslip.isMarried ? 'Married' : 'Unmarried'}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">Status</p>
            <p className="mt-2 text-sm font-semibold text-gray-900">{payslip.status}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
