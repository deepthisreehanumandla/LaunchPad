'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { notificationsApi } from '@/lib/api/notifications';
import { useSocket } from '@/lib/socket/useSocket';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageSpinner } from '@/components/ui/Spinner';
import { InboxIcon } from '@/components/ui/icons';
import { cn } from '@/lib/cn';
import type { Notification } from '@/types/notification';

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

export default function NotificationsPage() {
  const { isReady } = useRequireAuth();
  const socket = useSocket();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMarkingAll, setIsMarkingAll] = useState(false);

  useEffect(() => {
    if (!isReady) return;
    let cancelled = false;
    notificationsApi
      .list()
      .then(({ notifications: results }) => {
        if (!cancelled) setNotifications(results);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isReady]);

  useEffect(() => {
    if (!socket) return;

    function handleNewNotification(notification: Notification) {
      setNotifications((prev) => {
        if (prev.some((n) => n._id === notification._id)) return prev; // avoid duplicates
        return [notification, ...prev];
      });
    }

    socket.on('notification:new', handleNewNotification);
    return () => {
      socket.off('notification:new', handleNewNotification);
    };
  }, [socket]);

  async function handleMarkAsRead(notificationId: string) {
    setNotifications((prev) =>
      prev.map((n) => (n._id === notificationId ? { ...n, read: true } : n)),
    );
    await notificationsApi.markAsRead(notificationId);
  }

  async function handleMarkAllAsRead() {
    setIsMarkingAll(true);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await notificationsApi.markAllAsRead();
    } finally {
      setIsMarkingAll(false);
    }
  }

  const hasUnread = notifications.some((n) => !n.read);

  if (!isReady || isLoading) {
    return <PageSpinner label="Loading notifications…" />;
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Notifications</h1>
        {hasUnread && (
          <Button onClick={handleMarkAllAsRead} isLoading={isMarkingAll} variant="secondary" size="sm">
            Mark all as read
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <EmptyState
          icon={<InboxIcon className="h-5 w-5" />}
          title="You're all caught up"
          description="You don't have any notifications yet."
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {notifications.map((notification) => (
            <li
              key={notification._id}
              onClick={() => !notification.read && handleMarkAsRead(notification._id)}
              className={cn(
                'flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition',
                notification.read
                  ? 'border-neutral-200 bg-white hover:border-neutral-300'
                  : 'border-brand-200 bg-brand-50/60 hover:border-brand-300',
              )}
            >
              {!notification.read && (
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-500" aria-hidden />
              )}
              <div className={cn('flex flex-1 flex-col gap-1', notification.read && 'ml-5')}>
                <p className="text-sm text-neutral-800">
                  {notification.project ? (
                    <Link
                      href={`/marketplace/${notification.project._id}`}
                      className="hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {notification.message}
                    </Link>
                  ) : (
                    notification.message
                  )}
                </p>
                <span className="text-xs text-neutral-400">{timeAgo(notification.createdAt)}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
