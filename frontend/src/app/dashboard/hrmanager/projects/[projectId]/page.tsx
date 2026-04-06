import ProjectAdminDetailPage from '../../../../../components/project/ProjectAdminDetailPage';

export default async function HRManagerProjectDetailPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  return <ProjectAdminDetailPage projectId={projectId} basePath="/dashboard/hrmanager/projects" />;
}
