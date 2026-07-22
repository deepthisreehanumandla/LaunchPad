'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { teamsApi } from '@/lib/api/teams';
import { useSocket } from '@/lib/socket/useSocket';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import type { JoinRequest, JoinRequestUserRef } from '@/types/team';
import type { Notification } from '@/types/notification';

interface JoinRequestsPanelProps {
  projectId: string;
  onDecision: () => void;
}

export function JoinRequestsPanel({ projectId, onDecision }: JoinRequestsPanelProps) {
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [decidingId, setDecidingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const socket = useSocket();

  function refresh() {
    return teamsApi.listPendingForProject(projectId).then(setRequests);
  }

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    teamsApi
      .listPendingForProject(projectId)
      .then((results) => {
        if (!cancelled) setRequests(results);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  useEffect(() => {
    if (!socket) return;

    // The owner already sits in their own personal room (see
    // sockets/index.ts), so this fires the instant someone sends a request
    // to THIS project while the owner has the page open. Re-fetching (rather
    // than trying to reconstruct a JoinRequest from the notification payload)
    // keeps this simple and always consistent with the server's state.
    function handleNewNotification(notification: Notification) {
      if (notification.type === 'join-request' && notification.project?._id === projectId) {
        void refresh();
      }
    }

    socket.on('notification:new', handleNewNotification);
    return () => {
      socket.off('notification:new', handleNewNotification);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, projectId]);

  async function handleDecision(requestId: string, decision: 'accept' | 'reject') {
    setDecidingId(requestId);
    setError(null);
    try {
      if (decision === 'accept') {
        await teamsApi.acceptJoinRequest(projectId, requestId);
      } else {
        await teamsApi.rejectJoinRequest(projectId, requestId);
      }
      setRequests((prev) => prev.filter((r) => r._id !== requestId));
      onDecision();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setDecidingId(null);
    }
  }

  if (isLoading) {
    return (
      <section className="mb-8 rounded-xl border border-neutral-200 bg-white p-5">
        <Skeleton className="h-4 w-40" />
      </section>
    );
  }

  if (requests.length === 0) {
    return null;
  }

  return (
    <section className="mb-8 rounded-xl border border-brand-100 bg-brand-50/60 p-5">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-brand-700">
        Join requests ({requests.length})
      </h2>

      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      <ul className="flex flex-col gap-2.5">
        {requests.map((request) => {
          const requester = request.requester as JoinRequestUserRef;
          return (
            <li
              key={request._id}
              className="flex flex-col gap-3 rounded-lg border border-neutral-100 bg-white p-3.5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <Link
                  href={`/profile/${requester._id}`}
                  className="font-medium text-neutral-900 transition hover:text-brand-600 hover:underline"
                >
                  {requester.name}
                </Link>
                {request.message && <p className="mt-0.5 text-sm text-neutral-600">{request.message}</p>}
              </div>

              <div className="flex shrink-0 gap-2">
                <Button
                  onClick={() => handleDecision(request._id, 'accept')}
                  isLoading={decidingId === request._id}
                  size="sm"
                >
                  Accept
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleDecision(request._id, 'reject')}
                  disabled={decidingId === request._id}
                >
                  Reject
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
