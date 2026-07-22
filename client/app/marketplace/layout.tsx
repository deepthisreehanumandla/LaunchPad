import { AppHeader } from '@/components/layout/AppHeader';

export default function MarketplaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppHeader />
      {children}
    </>
  );
}
