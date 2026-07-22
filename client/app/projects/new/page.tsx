'use client';

import { useRouter } from 'next/navigation';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { ProjectForm } from '@/components/projects/ProjectForm';
import { projectsApi } from '@/lib/api/projects';
import { PageSpinner } from '@/components/ui/Spinner';

export default function NewProjectPage() {
  const router = useRouter();
  const { isReady } = useRequireAuth();

  if (!isReady) {
    return <PageSpinner label="Loading…" />;
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="mb-1 text-2xl font-semibold tracking-tight text-neutral-900">Create a project</h1>
      <p className="mb-8 text-sm text-neutral-500">
        Tell other students what you&apos;re building and what kind of help you need.
      </p>

      <ProjectForm
        submitLabel="Create project"
        onSubmit={async (input) => {
          const project = await projectsApi.create(input);
          router.push(`/marketplace/${project._id}`);
          return project;
        }}
      />
    </main>
  );
}
