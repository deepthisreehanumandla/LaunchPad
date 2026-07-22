'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { usersApi } from '@/lib/api/users';
import { useAuthStore } from '@/lib/auth/tokenStore';
import { ProjectCard } from '@/components/project-card/ProjectCard';
import { ProjectCardSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { FolderIcon, GithubIcon, LinkedinIcon, GlobeIcon } from '@/components/ui/icons';
import type { UserProfile } from '@/types/user';
import type { Project } from '@/types/project';

export default function PublicProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const currentUser = useAuthStore((state) => state.user);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [createdProjects, setCreatedProjects] = useState<Project[]>([]);
  const [contributedProjects, setContributedProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    Promise.all([usersApi.getPublicProfile(userId), usersApi.getUserProjects(userId)])
      .then(([userResult, projectsResult]) => {
        if (cancelled) return;
        setProfile(userResult);
        setCreatedProjects(projectsResult.created);
        setContributedProjects(projectsResult.contributed);
      })
      .catch(() => {
        if (!cancelled) setError('This profile could not be found.');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (isLoading) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-12">
        <div className="mb-10 flex flex-col items-start gap-6 sm:flex-row sm:items-center">
          <div className="skeleton h-24 w-24 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-6 w-40" />
            <div className="skeleton h-4 w-56" />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <ProjectCardSkeleton />
          <ProjectCardSkeleton />
        </div>
      </main>
    );
  }

  if (error || !profile) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-16 text-center text-sm text-red-600">
        {error ?? 'Profile not found.'}
      </main>
    );
  }

  const isOwnProfile = currentUser?._id === profile._id;

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <div className="mb-10 flex flex-col items-start gap-6 rounded-xl border border-neutral-200 bg-white p-6 sm:flex-row sm:items-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={profile.profilePicture || 'https://api.dicebear.com/7.x/initials/svg?seed=' + profile.name}
          alt={profile.name}
          className="h-24 w-24 rounded-full border border-neutral-200 object-cover"
        />

        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold text-neutral-900">{profile.name}</h1>
            {isOwnProfile && (
              <Link
                href="/profile/edit"
                className="rounded-lg border border-neutral-300 px-3 py-1 text-xs font-medium text-neutral-700 transition hover:border-neutral-400"
              >
                Edit profile
              </Link>
            )}
          </div>
          <p className="mt-1 text-sm text-neutral-500">
            {[profile.branch, profile.university].filter(Boolean).join(' · ')}
            {profile.graduationYear ? ` · Class of ${profile.graduationYear}` : ''}
          </p>

          <div className="mt-3 flex gap-3 text-sm">
            {profile.socialLinks?.github && (
              <a
                href={profile.socialLinks.github}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-neutral-500 transition hover:text-brand-600"
              >
                <GithubIcon className="h-4 w-4" /> GitHub
              </a>
            )}
            {profile.socialLinks?.linkedin && (
              <a
                href={profile.socialLinks.linkedin}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-neutral-500 transition hover:text-brand-600"
              >
                <LinkedinIcon className="h-4 w-4" /> LinkedIn
              </a>
            )}
            {profile.socialLinks?.portfolio && (
              <a
                href={profile.socialLinks.portfolio}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-neutral-500 transition hover:text-brand-600"
              >
                <GlobeIcon className="h-4 w-4" /> Portfolio
              </a>
            )}
          </div>
        </div>
      </div>

      {profile.bio && (
        <p className="mb-8 whitespace-pre-line leading-relaxed text-neutral-700">{profile.bio}</p>
      )}

      {profile.skills.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-neutral-400">Skills</h2>
          <div className="flex flex-wrap gap-2">
            {profile.skills.map((skill) => (
              <Badge key={skill} tone="brand">
                {skill}
              </Badge>
            ))}
          </div>
        </section>
      )}

      {profile.interests.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-neutral-400">Interests</h2>
          <div className="flex flex-wrap gap-2">
            {profile.interests.map((interest) => (
              <Badge key={interest} tone="neutral">
                {interest}
              </Badge>
            ))}
          </div>
        </section>
      )}

      <section className="mb-10">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-400">
          Projects created ({createdProjects.length})
        </h2>
        {createdProjects.length === 0 ? (
          <EmptyState compact icon={<FolderIcon className="h-4 w-4" />} title="No projects created yet." />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {createdProjects.map((project) => (
              <ProjectCard key={project._id} project={project} />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-400">
          Projects contributed to ({contributedProjects.length})
        </h2>
        {contributedProjects.length === 0 ? (
          <EmptyState compact icon={<FolderIcon className="h-4 w-4" />} title="No contributions yet." />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {contributedProjects.map((project) => (
              <ProjectCard key={project._id} project={project} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
