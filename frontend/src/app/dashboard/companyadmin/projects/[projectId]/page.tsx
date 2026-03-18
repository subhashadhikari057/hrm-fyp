import ProjectAdminDetailPage from '../../../../../components/project/ProjectAdminDetailPage';

export default async function CompanyAdminProjectDetailPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  return <ProjectAdminDetailPage projectId={projectId} basePath="/dashboard/companyadmin/projects" />;
}
