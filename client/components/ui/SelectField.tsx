import { SelectHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';
import { ChevronDownIcon } from './icons';

interface Option {
  value: string;
  label: string;
}

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: Option[];
  error?: string;
}

export function SelectField({ label, options, error, id, className, ...props }: SelectFieldProps) {
  const inputId = id ?? props.name;

  return (
    <div className="flex flex-col gap-1.5 text-left">
      <label htmlFor={inputId} className="text-sm font-medium text-neutral-700">
        {label}
      </label>
      <div className="relative">
        <select
          id={inputId}
          className={cn(
            'w-full appearance-none rounded-lg border border-neutral-300 bg-white px-3.5 py-2.5 pr-9 text-sm text-neutral-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100',
            error && 'border-red-300 focus:border-red-400 focus:ring-red-100',
            className,
          )}
          aria-invalid={Boolean(error)}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
