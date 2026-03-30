import PayrollPeriodDetailPage from '../../../../../components/payroll/PayrollPeriodDetailPage';

export default async function HRManagerPayrollPeriodDetailPage({
  params,
}: {
  params: Promise<{ periodId: string }>;
}) {
  const { periodId } = await params;
  return <PayrollPeriodDetailPage periodId={periodId} basePath="/dashboard/hrmanager/payroll" />;
}
