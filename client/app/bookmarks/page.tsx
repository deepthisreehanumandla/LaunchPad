'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { usersApi } from '@/lib/api/users';
import { ProjectCard } from '@/components/project-card/ProjectCard';
import { ProjectCardSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { BookmarkIcon } from '@/components/ui/icons';
import type { Project } from '@/types/project';

export default function BookmarksPage() {
  const { isReady } = useRequireAuth();

  const [bookmarks, setBookmarks] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isReady) return;

    let cancelled = false;
    usersApi
      .getMyBookmarks()
      .then((results) => {
        if (!cancelled) setBookmarks(results);
      })
      .catch(() => {
        if (!cancelled) setError('Could not load your bookmarks. Please try again.');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isReady]);

  function handleBookmarkChange(projectId: string, isBookmarked: boolean) {
    // A card in this list was un-bookmarked — drop it from view immediately
    // rather than waiting for the next full reload.
    if (!isBookmarked) {
      setBookmarks((prev) => prev.filter((project) => project._id !== projectId));
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="mb-1 text-2xl font-semibold tracking-tight text-neutral-900">My bookmarks</h1>
      <p className="mb-8 text-sm text-neutral-500">Projects you&apos;ve saved for later.</p>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {!isReady || isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <ProjectCardSkeleton key={i} />
          ))}
        </div>
      ) : !error && bookmarks.length === 0 ? (
        <EmptyState
          icon={<BookmarkIcon className="h-5 w-5" />}
          title="No bookmarks yet"
          description="Save a project from the marketplace to find it here later."
          action={
            <Link
              href="/marketplace"
              className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-600"
            >
              Browse marketplace
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {bookmarks.map((project) => (
            <ProjectCard key={project._id} project={project} onBookmarkChange={handleBookmarkChange} />
          ))}
        </div>
      )}
    </main>
  );
}
