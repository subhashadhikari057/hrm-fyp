import ProjectEmployeeDetailPage from '../../../../../components/project/ProjectEmployeeDetailPage';

export default async function EmployeeProjectDetailPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  return <ProjectEmployeeDetailPage projectId={projectId} basePath="/dashboard/employee/projects" />;
}
