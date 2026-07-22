'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { projectsApi } from '@/lib/api/projects';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { FilterBar } from '@/components/marketplace/FilterBar';
import { ProjectCard } from '@/components/project-card/ProjectCard';
import { ProjectCardSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { SearchIcon, PlusIcon } from '@/components/ui/icons';
import type { Project, ProjectCategory, Pagination } from '@/types/project';

export default function MarketplacePage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<ProjectCategory | ''>('');
  const [techStack, setTechStack] = useState('');
  const [page, setPage] = useState(1);

  const [projects, setProjects] = useState<Project[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const debouncedSearch = useDebouncedValue(search, 400);
  const debouncedTechStack = useDebouncedValue(techStack, 400);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, category, debouncedTechStack]);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    projectsApi
      .list({
        search: debouncedSearch || undefined,
        category: category || undefined,
        techStack: debouncedTechStack || undefined,
        page,
        limit: 12,
      })
      .then(({ projects: results, pagination: meta }) => {
        if (cancelled) return;
        setProjects(results);
        setPagination(meta ?? null);
      })
      .catch(() => {
        if (!cancelled) setError('Could not load projects. Please try again.');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedSearch, category, debouncedTechStack, page]);

  const hasActiveFilters = Boolean(search || category || techStack);

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Project marketplace</h1>
          <p className="mt-1 text-sm text-neutral-500">Find a project that needs your skills.</p>
        </div>
        <Link
          href="/projects/new"
          className="inline-flex w-fit items-center gap-1.5 rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-medium text-white shadow-xs transition hover:bg-brand-600"
        >
          <PlusIcon className="h-4 w-4" />
          Create project
        </Link>
      </div>

      <div className="mb-8">
        <FilterBar
          search={search}
          onSearchChange={setSearch}
          category={category}
          onCategoryChange={setCategory}
          techStack={techStack}
          onTechStackChange={setTechStack}
        />
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <ProjectCardSkeleton key={i} />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <EmptyState
          icon={<SearchIcon className="h-5 w-5" />}
          title={hasActiveFilters ? 'No projects match your search' : 'No projects yet'}
          description={
            hasActiveFilters
              ? 'Try a different keyword, tech stack, or category.'
              : 'Be the first to post a project looking for teammates.'
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard key={project._id} project={project} />
          ))}
        </div>
      )}

      {pagination && pagination.totalPages > 1 && (
        <div className="mt-10 flex items-center justify-center gap-3">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition hover:border-neutral-400 disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-sm text-neutral-500">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            type="button"
            disabled={page >= pagination.totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition hover:border-neutral-400 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </main>
  );
}
