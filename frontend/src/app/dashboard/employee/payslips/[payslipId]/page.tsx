import EmployeePayslipDetailPage from '../../../../../components/payroll/EmployeePayslipDetailPage';

export default async function EmployeePayslipDetailRoutePage({
  params,
}: {
  params: Promise<{ payslipId: string }>;
}) {
  const { payslipId } = await params;
  return <EmployeePayslipDetailPage payslipId={payslipId} basePath="/dashboard/employee/payslips" />;
}
