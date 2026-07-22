import { AppHeader } from '@/components/layout/AppHeader';

export default function ProjectsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppHeader />
      {children}
    </>
  );
}
