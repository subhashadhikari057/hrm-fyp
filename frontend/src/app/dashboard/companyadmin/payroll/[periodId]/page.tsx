import PayrollPeriodDetailPage from '../../../../../components/payroll/PayrollPeriodDetailPage';

export default async function CompanyAdminPayrollPeriodDetailPage({
  params,
}: {
  params: Promise<{ periodId: string }>;
}) {
  const { periodId } = await params;
  return <PayrollPeriodDetailPage periodId={periodId} basePath="/dashboard/companyadmin/payroll" />;
}
