import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

type BadgeTone = 'brand' | 'neutral' | 'green' | 'amber' | 'red';

const TONE_STYLES: Record<BadgeTone, string> = {
  brand: 'bg-brand-50 text-brand-700',
  neutral: 'bg-neutral-100 text-neutral-600',
  green: 'bg-emerald-50 text-emerald-700',
  amber: 'bg-amber-50 text-amber-700',
  red: 'bg-red-50 text-red-700',
};

export function Badge({
  children,
  tone = 'neutral',
  className,
}: {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex w-fit items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
        TONE_STYLES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
