'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth/tokenStore';

export function useRequireAuth() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isInitializing = useAuthStore((state) => state.isInitializing);

  useEffect(() => {
    if (!isInitializing && !user) {
      router.replace('/login');
    }
  }, [isInitializing, user, router]);

  return { user, isReady: !isInitializing && Boolean(user) };
}
