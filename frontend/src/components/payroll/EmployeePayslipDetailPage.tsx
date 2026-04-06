'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import DashboardLayout from '../DashboardLayout';
import { useBreadcrumbs } from '../AppBreadcrumbs';
import { PageHeader } from '../PageHeader';
import { Card, CardContent } from '../ui/card';
import { payrollApi, type PayslipRecord } from '../../lib/api/payroll';
import { PayslipDetailsCard } from './PayslipDetailsCard';

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

interface EmployeePayslipDetailPageProps {
  payslipId: string;
  basePath: string;
}

export default function EmployeePayslipDetailPage({ payslipId, basePath }: EmployeePayslipDetailPageProps) {
  const [payslip, setPayslip] = useState<PayslipRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useBreadcrumbs(
    payslip
      ? [
          { href: basePath.replace(/\/payslips$/, ''), label: 'Dashboard' },
          { href: basePath, label: 'Payslips' },
          { label: payslip.payrollPeriod?.periodLabel || 'Payslip Details' },
        ]
      : null,
  );

  useEffect(() => {
    const loadPayslip = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await payrollApi.getMyPayslipById(payslipId);
        setPayslip(response.data);
      } catch (err: unknown) {
        setError(getErrorMessage(err, 'Failed to load payslip'));
      } finally {
        setLoading(false);
      }
    };

    void loadPayslip();
  }, [payslipId]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title={payslip?.payrollPeriod?.periodLabel || 'Payslip'}
          description="Review your salary breakdown, tax deduction, and net pay for this payroll period."
          actions={
            <Link href={basePath} className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-900 hover:bg-slate-100">
              <ArrowLeft className="h-4 w-4" />
              Back to Payslips
            </Link>
          }
        />

        {error ? <Card><CardContent className="pt-6 text-sm text-red-600">{error}</CardContent></Card> : null}

        {loading || !payslip ? (
          <Card><CardContent className="pt-6 text-sm text-gray-600">Loading payslip...</CardContent></Card>
        ) : (
          <PayslipDetailsCard payslip={payslip} />
        )}
      </div>
    </DashboardLayout>
  );
}
