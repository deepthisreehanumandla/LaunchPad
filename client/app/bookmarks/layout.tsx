import { AppHeader } from '@/components/layout/AppHeader';

export default function BookmarksLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppHeader />
      {children}
    </>
  );
}
