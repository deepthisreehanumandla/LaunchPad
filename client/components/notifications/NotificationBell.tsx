'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { notificationsApi } from '@/lib/api/notifications';
import { useSocket } from '@/lib/socket/useSocket';
import { BellIcon } from '@/components/ui/icons';

export function NotificationBell() {
  const [count, setCount] = useState(0);
  const socket = useSocket();

  useEffect(() => {
    let cancelled = false;
    notificationsApi
      .unreadCount()
      .then((c) => {
        if (!cancelled) setCount(c);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!socket) return;

    // The server emits this right after any notification is created (see
    // notification.service.ts), so the badge updates the instant a join
    // request or a decision comes in — no polling needed.
    function handleUnreadCount(payload: { count: number }) {
      setCount(payload.count);
    }

    socket.on('notification:unread-count', handleUnreadCount);
    return () => {
      socket.off('notification:unread-count', handleUnreadCount);
    };
  }, [socket]);

  return (
    <Link
      href="/notifications"
      className="relative flex h-9 w-9 items-center justify-center rounded-full text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-800"
      aria-label={count > 0 ? `Notifications, ${count} unread` : 'Notifications'}
    >
      <BellIcon className="h-[18px] w-[18px]" />
      {count > 0 && (
        <span className="absolute right-1 top-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold leading-none text-white ring-2 ring-white">
          {count > 9 ? '9+' : count}
        </span>
      )}
    </Link>
  );
}
