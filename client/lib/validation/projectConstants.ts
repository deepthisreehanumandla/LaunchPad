import type { ProjectCategory, ProjectPurpose } from '@/types/project';

export const PROJECT_CATEGORY_OPTIONS: { value: ProjectCategory; label: string }[] = [
  { value: 'startup', label: 'Startup' },
  { value: 'hackathon', label: 'Hackathon' },
  { value: 'final-year', label: 'Final-Year Project' },
  { value: 'research', label: 'Research' },
  { value: 'open-source', label: 'Open Source' },
  { value: 'personal', label: 'Personal Project' },
];

export const PROJECT_PURPOSE_OPTIONS: { value: ProjectPurpose; label: string }[] = [
  { value: 'team-formation', label: 'Looking for Team Members' },
  { value: 'personal-showcase', label: 'Personal Project / Portfolio Showcase' },
];

export function categoryLabel(category: ProjectCategory): string {
  return PROJECT_CATEGORY_OPTIONS.find((opt) => opt.value === category)?.label ?? category;
}
