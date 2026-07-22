import { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';
import { Spinner } from './Spinner';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const VARIANT_STYLES: Record<ButtonVariant, string> = {
  primary:
    'bg-brand-500 text-white shadow-xs hover:bg-brand-600 active:bg-brand-700 disabled:hover:bg-brand-500',
  secondary:
    'border border-neutral-300 bg-white text-neutral-700 hover:border-neutral-400 hover:bg-neutral-50 active:bg-neutral-100',
  ghost: 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900',
  danger: 'border border-red-200 text-red-600 hover:border-red-300 hover:bg-red-50',
};

const SIZE_STYLES: Record<ButtonSize, string> = {
  sm: 'px-3.5 py-1.5 text-sm',
  md: 'px-5 py-2.5 text-sm',
};

export function Button({
  isLoading,
  disabled,
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || isLoading}
      className={cn(
        'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-medium transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-60',
        VARIANT_STYLES[variant],
        SIZE_STYLES[size],
        className,
      )}
      {...props}
    >
      {isLoading && <Spinner className="h-3.5 w-3.5" />}
      {children}
    </button>
  );
}
