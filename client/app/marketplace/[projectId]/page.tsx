'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { projectsApi } from '@/lib/api/projects';
import { teamsApi } from '@/lib/api/teams';
import { usersApi } from '@/lib/api/users';
import { useAuthStore } from '@/lib/auth/tokenStore';
import { useSocket } from '@/lib/socket/useSocket';
import { categoryLabel, PROJECT_PURPOSE_OPTIONS } from '@/lib/validation/projectConstants';
import { JoinRequestButton } from '@/components/teams/JoinRequestButton';
import { JoinRequestsPanel } from '@/components/teams/JoinRequestsPanel';
import { OnlineDot } from '@/components/teams/OnlineDot';
import { TeamChat } from '@/components/chat/TeamChat';
import { TaskBoard } from '@/components/tasks/TaskBoard';
import { ActivityTimeline } from '@/components/activity/ActivityTimeline';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { StarIcon, ExternalLinkIcon, GithubIcon } from '@/components/ui/icons';
import type { Project } from '@/types/project';

function purposeLabel(purpose: string): string {
  return PROJECT_PURPOSE_OPTIONS.find((opt) => opt.value === purpose)?.label ?? purpose;
}

const STATUS_TONE: Record<string, 'green' | 'neutral' | 'amber'> = {
  active: 'green',
  completed: 'neutral',
  archived: 'amber',
};

export default function ProjectDetailsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isTogglingBookmark, setIsTogglingBookmark] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);
  const [onlineUserIds, setOnlineUserIds] = useState<string[]>([]);
  const socket = useSocket();

  function loadProject() {
    return projectsApi.getById(projectId).then((result) => setProject(result));
  }

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    loadProject()
      .catch(() => {
        if (!cancelled) setError('This project could not be found.');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  // Separately check whether the viewer already has a pending join request
  // for this project, so the button can show "Request Pending" instead of
  // letting them send a duplicate. Kept as its own effect/endpoint rather
  // than baked into GET /projects/:id, since that endpoint is shared Phase 2
  // functionality this phase doesn't modify.
  useEffect(() => {
    if (!user) {
      setHasPendingRequest(false);
      return;
    }
    let cancelled = false;
    usersApi
      .getMyJoinRequests()
      .then((sent) => {
        if (cancelled) return;
        const pending = sent.some(
          (r) =>
            r.status === 'pending' &&
            (typeof r.project === 'object' ? r.project._id : r.project) === projectId,
        );
        setHasPendingRequest(pending);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [user, projectId]);

  async function handleBookmark() {
    if (!user || !project || isTogglingBookmark) return;
    setIsTogglingBookmark(true);
    try {
      const { bookmarked } = await projectsApi.toggleBookmark(project._id);
      setProject({ ...project, isBookmarked: bookmarked });
    } finally {
      setIsTogglingBookmark(false);
    }
  }

  async function handleDelete() {
    if (!project) return;
    const confirmed = window.confirm(
      'Delete this project permanently? This cannot be undone — the project, its tasks, chat history, and all related data will be removed.',
    );
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      await projectsApi.remove(project._id);
      router.push('/marketplace');
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleRemoveMember(memberUserId: string) {
    if (!project) return;
    const confirmed = window.confirm('Remove this member from the project?');
    if (!confirmed) return;

    setRemovingMemberId(memberUserId);
    try {
      await teamsApi.removeMember(project._id, memberUserId);
      await loadProject();
    } finally {
      setRemovingMemberId(null);
    }
  }

  useEffect(() => {
    if (!socket) return;

    function handlePresenceUpdate(payload: { projectId: string; onlineUserIds: string[] }) {
      if (payload.projectId === projectId) {
        setOnlineUserIds(payload.onlineUserIds);
      }
    }

    socket.on('presence:update', handlePresenceUpdate);
    return () => {
      socket.off('presence:update', handlePresenceUpdate);
      setOnlineUserIds([]);
    };
  }, [socket, projectId]);

  if (isLoading) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-12">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="mt-3 h-9 w-2/3" />
        <Skeleton className="mt-2 h-4 w-1/3" />
        <div className="mt-8 flex flex-col gap-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </main>
    );
  }

  if (error || !project) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16 text-center">
        <p className="text-sm text-red-600">{error ?? 'Project not found.'}</p>
        <Link href="/marketplace" className="mt-4 inline-block text-sm font-medium text-brand-600 hover:underline">
          Back to marketplace
        </Link>
      </main>
    );
  }

  const creator = typeof project.creator === 'object' ? project.creator : null;
  const isOwner = user && creator && user._id === creator._id;
  const isMember = user ? project.members.some((m) => m.user._id === user._id) : false;
  const isFull = project.members.length >= project.teamSize;
  const canRequestToJoin =
    user &&
    !isOwner &&
    !isMember &&
    project.purpose === 'team-formation' &&
    project.status === 'active';

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge tone="brand">{categoryLabel(project.category)}</Badge>
            <Badge tone={STATUS_TONE[project.status] ?? 'neutral'} className="capitalize">
              {project.status}
            </Badge>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-neutral-900">{project.title}</h1>
          <p className="mt-1.5 text-sm text-neutral-500">
            {purposeLabel(project.purpose)}
            {creator && (
              <>
                {' · '}
                by{' '}
                <Link href={`/profile/${creator._id}`} className="text-brand-600 hover:underline">
                  {creator.name}
                </Link>
              </>
            )}
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          {canRequestToJoin &&
            (isFull ? (
              <span className="rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-2 text-sm font-medium text-neutral-400">
                Team full
              </span>
            ) : (
              <JoinRequestButton
                projectId={project._id}
                hasPendingRequest={hasPendingRequest}
                onRequested={() => setHasPendingRequest(true)}
              />
            ))}
          {user && !isOwner && (
            <button
              type="button"
              onClick={handleBookmark}
              disabled={isTogglingBookmark}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-4 py-2 text-sm font-medium transition ${
                project.isBookmarked
                  ? 'border-brand-200 bg-brand-50 text-brand-600'
                  : 'border-neutral-300 bg-white text-neutral-700 hover:border-neutral-400'
              }`}
            >
              <StarIcon filled={project.isBookmarked} className="h-4 w-4" />
              {project.isBookmarked ? 'Bookmarked' : 'Bookmark'}
            </button>
          )}
          {isOwner && (
            <>
              <Link
                href={`/projects/${project._id}/edit`}
                className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition hover:border-neutral-400"
              >
                Edit
              </Link>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition hover:border-red-300 hover:bg-red-50 disabled:opacity-60"
              >
                Delete
              </button>
            </>
          )}
        </div>
      </div>

      {project.bannerImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={project.bannerImage}
          alt={`${project.title} banner`}
          className="mb-8 h-64 w-full rounded-xl border border-neutral-200 object-cover"
        />
      )}

      {isOwner && <JoinRequestsPanel projectId={project._id} onDecision={loadProject} />}

      <section className="mb-8">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-neutral-400">About</h2>
        <p className="whitespace-pre-line leading-relaxed text-neutral-700">{project.detailedDescription}</p>
      </section>

      {(project.githubUrl || project.liveDemoUrl) && (
        <section className="mb-8 flex flex-wrap gap-3">
          {project.githubUrl && (
            <a
              href={project.githubUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition hover:border-neutral-400"
            >
              <GithubIcon className="h-4 w-4" />
              GitHub repository
            </a>
          )}
          {project.liveDemoUrl && (
            <a
              href={project.liveDemoUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition hover:border-neutral-400"
            >
              <ExternalLinkIcon className="h-4 w-4" />
              Live demo
            </a>
          )}
        </section>
      )}

      {project.techStack.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-neutral-400">Tech stack</h2>
          <div className="flex flex-wrap gap-2">
            {project.techStack.map((tech) => (
              <Badge key={tech} tone="neutral">
                {tech}
              </Badge>
            ))}
          </div>
        </section>
      )}

      {project.purpose === 'team-formation' && project.requiredSkills.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-neutral-400">
            Required skills
          </h2>
          <div className="flex flex-wrap gap-2">
            {project.requiredSkills.map((skill) => (
              <Badge key={skill} tone="brand">
                {skill}
              </Badge>
            ))}
          </div>
        </section>
      )}

      <section className="mb-8 grid grid-cols-2 gap-4 rounded-xl border border-neutral-200 bg-white p-5 sm:grid-cols-4">
        <div>
          <p className="text-xs text-neutral-400">Team size</p>
          <p className="mt-0.5 text-lg font-semibold text-neutral-900">{project.teamSize}</p>
        </div>
        <div>
          <p className="text-xs text-neutral-400">Members</p>
          <p className="mt-0.5 text-lg font-semibold text-neutral-900">
            {project.members.length} / {project.teamSize}
          </p>
        </div>
        <div>
          <p className="text-xs text-neutral-400">Status</p>
          <p className="mt-0.5 text-lg font-semibold capitalize text-neutral-900">{project.status}</p>
        </div>
        {project.deadline && (
          <div>
            <p className="text-xs text-neutral-400">Deadline</p>
            <p className="mt-0.5 text-lg font-semibold text-neutral-900">
              {new Date(project.deadline).toLocaleDateString()}
            </p>
          </div>
        )}
      </section>

      {(isOwner || isMember) && (
        <>
          <TeamChat projectId={project._id} />
          <TaskBoard
            projectId={project._id}
            members={project.members}
            currentUserId={user?._id}
            isOwner={Boolean(isOwner)}
          />
          <ActivityTimeline projectId={project._id} />
        </>
      )}

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-400">Members</h2>
        <ul className="flex flex-col divide-y divide-neutral-100 rounded-xl border border-neutral-200 bg-white">
          {project.members.map((member) => (
            <li key={member.user._id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
              <div className="flex items-center gap-3">
                <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-700">
                  {member.user.name.charAt(0).toUpperCase()}
                  <span className="absolute -bottom-0.5 -right-0.5">
                    <OnlineDot isOnline={onlineUserIds.includes(member.user._id)} />
                  </span>
                </span>
                <Link
                  href={`/profile/${member.user._id}`}
                  className="font-medium text-neutral-700 transition hover:text-brand-600 hover:underline"
                >
                  {member.user.name}
                </Link>
                <Badge tone="neutral" className="capitalize">
                  {member.role}
                </Badge>
              </div>
              {isOwner && member.role !== 'creator' && (
                <button
                  type="button"
                  onClick={() => handleRemoveMember(member.user._id)}
                  disabled={removingMemberId === member.user._id}
                  className="text-xs font-medium text-red-600 hover:underline disabled:opacity-60"
                >
                  Remove
                </button>
              )}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
