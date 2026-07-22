'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth/tokenStore';
import { authApi } from '@/lib/api/auth';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { cn } from '@/lib/cn';
import { BookmarkIcon, LogoutIcon, MenuIcon, CloseIcon, PlusIcon } from '@/components/ui/icons';

function NavLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={cn(
        'rounded-md px-3 py-2 text-sm font-medium transition-colors',
        active ? 'text-brand-600' : 'text-neutral-600 hover:text-neutral-900',
      )}
    >
      {children}
    </Link>
  );
}

export function AppHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const clearSession = useAuthStore((state) => state.clearSession);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  async function handleLogout() {
    setIsMobileMenuOpen(false);
    try {
      await authApi.logout();
    } finally {
      clearSession();
      router.push('/');
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
        <Link href="/" className="flex items-center gap-2 text-[15px] font-semibold text-neutral-900">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-brand-500 text-xs font-bold text-white">
            L
          </span>
          LaunchPad
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex">
          <NavLink href="/marketplace" active={pathname?.startsWith('/marketplace') ?? false}>
            Marketplace
          </NavLink>

          {user && (
            <>
              <NavLink href="/bookmarks" active={pathname?.startsWith('/bookmarks') ?? false}>
                Bookmarks
              </NavLink>
              <NavLink
                href={`/profile/${user._id}`}
                active={pathname?.startsWith('/profile') ?? false}
              >
                Profile
              </NavLink>
            </>
          )}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <>
              <Link
                href="/projects/new"
                className="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white shadow-xs transition hover:bg-brand-600"
              >
                <PlusIcon className="h-4 w-4" />
                New project
              </Link>
              <NotificationBell />
              <button
                type="button"
                onClick={handleLogout}
                title="Log out"
                aria-label="Log out"
                className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-800"
              >
                <LogoutIcon className="h-[18px] w-[18px]" />
              </button>
              <Link
                href={`/profile/${user._id}`}
                className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-neutral-200 bg-brand-50 text-sm font-semibold text-brand-700 transition hover:border-brand-300"
                aria-label="My profile"
              >
                {user.name?.charAt(0).toUpperCase() ?? '?'}
              </Link>
            </>
          ) : (
            <>
              <Link href="/login" className="rounded-md px-3 py-2 text-sm font-medium text-neutral-600 hover:text-neutral-900">
                Log in
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white shadow-xs transition hover:bg-brand-600"
              >
                Get started
              </Link>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen((open) => !open)}
          className="flex h-9 w-9 items-center justify-center rounded-md text-neutral-600 hover:bg-neutral-100 md:hidden"
          aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={isMobileMenuOpen}
        >
          {isMobileMenuOpen ? <CloseIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile nav panel */}
      {isMobileMenuOpen && (
        <nav className="flex flex-col gap-1 border-t border-neutral-200 bg-white px-6 py-4 md:hidden animate-fadeIn">
          <Link
            href="/marketplace"
            onClick={() => setIsMobileMenuOpen(false)}
            className="rounded-md px-3 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            Marketplace
          </Link>

          {user ? (
            <>
              <Link
                href="/projects/new"
                onClick={() => setIsMobileMenuOpen(false)}
                className="rounded-md px-3 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
              >
                New project
              </Link>
              <Link
                href="/bookmarks"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
              >
                <BookmarkIcon className="h-4 w-4" /> Bookmarks
              </Link>
              <Link
                href="/notifications"
                onClick={() => setIsMobileMenuOpen(false)}
                className="rounded-md px-3 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
              >
                Notifications
              </Link>
              <Link
                href={`/profile/${user._id}`}
                onClick={() => setIsMobileMenuOpen(false)}
                className="rounded-md px-3 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
              >
                My profile
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="mt-1 rounded-md border-t border-neutral-100 px-3 py-2.5 text-left text-sm font-medium text-red-600 hover:bg-red-50"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="rounded-md px-3 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
              >
                Log in
              </Link>
              <Link
                href="/register"
                onClick={() => setIsMobileMenuOpen(false)}
                className="mt-1 rounded-lg bg-brand-500 px-3 py-2.5 text-center text-sm font-medium text-white hover:bg-brand-600"
              >
                Get started
              </Link>
            </>
          )}
        </nav>
      )}
    </header>
  );
}
