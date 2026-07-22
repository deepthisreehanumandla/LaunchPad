'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { Project } from '@/types/project';
import { categoryLabel } from '@/lib/validation/projectConstants';
import { projectsApi } from '@/lib/api/projects';
import { useAuthStore } from '@/lib/auth/tokenStore';
import { Badge } from '@/components/ui/Badge';
import { StarIcon } from '@/components/ui/icons';

interface ProjectCardProps {
  project: Project;
  onBookmarkChange?: (projectId: string, isBookmarked: boolean) => void;
}

export function ProjectCard({ project, onBookmarkChange }: ProjectCardProps) {
  const user = useAuthStore((state) => state.user);
  const [isBookmarked, setIsBookmarked] = useState(Boolean(project.isBookmarked));
  const [isToggling, setIsToggling] = useState(false);

  const creator = typeof project.creator === 'object' ? project.creator : null;

  async function handleBookmarkClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!user || isToggling) return;

    setIsToggling(true);
    const previous = isBookmarked;
    setIsBookmarked(!previous); // optimistic

    try {
      const { bookmarked } = await projectsApi.toggleBookmark(project._id);
      setIsBookmarked(bookmarked);
      onBookmarkChange?.(project._id, bookmarked);
    } catch {
      setIsBookmarked(previous); // revert on failure
    } finally {
      setIsToggling(false);
    }
  }

  return (
    <Link
      href={`/marketplace/${project._id}`}
      className="group flex flex-col gap-3 rounded-xl border border-neutral-200 bg-white p-5 transition-all duration-150 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-card"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1.5">
          <Badge tone="brand">{categoryLabel(project.category)}</Badge>
          <h3 className="text-base font-semibold text-neutral-900 transition group-hover:text-brand-600">
            {project.title}
          </h3>
        </div>

        {user && (
          <button
            type="button"
            onClick={handleBookmarkClick}
            aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark project'}
            className={`shrink-0 rounded-full border p-2 transition ${
              isBookmarked
                ? 'border-brand-200 bg-brand-50 text-brand-600'
                : 'border-neutral-200 text-neutral-300 hover:border-neutral-300 hover:text-neutral-400'
            }`}
          >
            <StarIcon filled={isBookmarked} className="h-4 w-4" />
          </button>
        )}
      </div>

      <p className="line-clamp-2 text-sm leading-relaxed text-neutral-500">{project.shortDescription}</p>

      {project.techStack.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {project.techStack.slice(0, 5).map((tech) => (
            <Badge key={tech} tone="neutral">
              {tech}
            </Badge>
          ))}
        </div>
      )}

      <div className="mt-1 flex items-center justify-between border-t border-neutral-100 pt-3 text-xs text-neutral-400">
        <span className="truncate">{creator ? `by ${creator.name}` : ''}</span>
        <span className="shrink-0">
          {project.members?.length ?? 0}/{project.teamSize} on team
        </span>
      </div>
    </Link>
  );
}
