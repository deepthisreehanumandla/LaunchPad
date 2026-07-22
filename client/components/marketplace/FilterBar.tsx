'use client';

import type { ProjectCategory } from '@/types/project';
import { PROJECT_CATEGORY_OPTIONS } from '@/lib/validation/projectConstants';
import { SearchIcon, FilterIcon, ChevronDownIcon } from '@/components/ui/icons';

interface FilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  category: ProjectCategory | '';
  onCategoryChange: (value: ProjectCategory | '') => void;
  techStack: string;
  onTechStackChange: (value: string) => void;
}

export function FilterBar({
  search,
  onSearchChange,
  category,
  onCategoryChange,
  techStack,
  onTechStackChange,
}: FilterBarProps) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-neutral-200 bg-white p-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search projects by title, description, or tech stack…"
          className="w-full rounded-lg border border-neutral-200 bg-neutral-50 py-2.5 pl-9 pr-3 text-sm outline-none transition placeholder:text-neutral-400 focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-100"
        />
      </div>

      <div className="relative sm:w-56">
        <FilterIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
        <input
          type="text"
          value={techStack}
          onChange={(e) => onTechStackChange(e.target.value)}
          placeholder="Tech e.g. React, Node.js"
          className="w-full rounded-lg border border-neutral-200 bg-neutral-50 py-2.5 pl-9 pr-3 text-sm outline-none transition placeholder:text-neutral-400 focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-100"
        />
      </div>

      <div className="relative sm:w-52">
        <select
          value={category}
          onChange={(e) => onCategoryChange(e.target.value as ProjectCategory | '')}
          className="w-full appearance-none rounded-lg border border-neutral-200 bg-neutral-50 py-2.5 pl-3 pr-9 text-sm outline-none transition focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-100"
        >
          <option value="">All categories</option>
          {PROJECT_CATEGORY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
      </div>
    </div>
  );
}
