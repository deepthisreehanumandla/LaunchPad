'use client';

import { useEffect, useState } from 'react';
import { activityApi } from '@/lib/api/activity';
import { Skeleton } from '@/components/ui/Skeleton';
import type { Activity } from '@/types/activity';

interface ActivityTimelineProps {
  projectId: string;
}

function timeAgo(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const TYPE_ICON: Record<Activity['type'], string> = {
  'task-created': '＋',
  'task-assigned': '👤',
  'task-status-changed': '↔',
  'task-completed': '✓',
};

export function ActivityTimeline({ projectId }: ActivityTimelineProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    activityApi
      .list(projectId)
      .then(({ activities: results }) => {
        if (!cancelled) setActivities(results);
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  if (isLoading) {
    return (
      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-400">Activity</h2>
        <div className="flex flex-col gap-3 rounded-xl border border-neutral-200 bg-white p-4">
          <Skeleton className="h-3.5 w-3/4" />
          <Skeleton className="h-3.5 w-1/2" />
          <Skeleton className="h-3.5 w-2/3" />
        </div>
      </section>
    );
  }

  if (activities.length === 0) {
    return null;
  }

  return (
    <section className="mb-8">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-400">Activity</h2>
      <ul className="flex flex-col divide-y divide-neutral-100 rounded-xl border border-neutral-200 bg-white">
        {activities.map((activity) => (
          <li key={activity._id} className="flex items-start gap-3 px-4 py-3 text-sm text-neutral-600">
            <span
              aria-hidden
              className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-xs text-neutral-500"
            >
              {TYPE_ICON[activity.type]}
            </span>
            <span className="flex-1">{activity.message}</span>
            <span className="shrink-0 text-xs text-neutral-400">{timeAgo(activity.createdAt)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
