'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { ProjectForm } from '@/components/projects/ProjectForm';
import { projectsApi } from '@/lib/api/projects';
import { PageSpinner } from '@/components/ui/Spinner';
import type { Project } from '@/types/project';

export default function EditProjectPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const router = useRouter();
  const { isReady, user } = useRequireAuth();

  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isReady) return;

    let cancelled = false;
    projectsApi
      .getById(projectId)
      .then((result) => {
        if (cancelled) return;
        const creatorId = typeof result.creator === 'object' ? result.creator._id : result.creator;
        if (creatorId !== user?._id) {
          setError('Only the project creator can edit this project.');
          return;
        }
        setProject(result);
      })
      .catch(() => {
        if (!cancelled) setError('This project could not be found.');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isReady, projectId, user?._id]);

  if (!isReady || isLoading) {
    return <PageSpinner label="Loading…" />;
  }

  if (error || !project) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-16 text-center text-sm text-red-600">
        {error ?? 'Project not found.'}
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="mb-1 text-2xl font-semibold tracking-tight text-neutral-900">Edit project</h1>
      <p className="mb-8 text-sm text-neutral-500">Update your project details below.</p>

      <ProjectForm
        submitLabel="Save changes"
        initialValues={project}
        onSubmit={async (input) => {
          const updated = await projectsApi.update(project._id, input);
          router.push(`/marketplace/${updated._id}`);
          return updated;
        }}
      />
    </main>
  );
}
