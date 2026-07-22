import { cn } from '@/lib/cn';

interface OnlineDotProps {
  isOnline: boolean;
}

export function OnlineDot({ isOnline }: OnlineDotProps) {
  return (
    <span
      className={cn(
        'inline-block h-2 w-2 rounded-full ring-2 ring-white',
        isOnline ? 'bg-emerald-500' : 'bg-neutral-300',
      )}
      title={isOnline ? 'Online' : 'Offline'}
    />
  );
}
