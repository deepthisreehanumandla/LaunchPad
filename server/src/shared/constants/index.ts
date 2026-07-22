export const PROJECT_CATEGORIES = [
  'startup',
  'hackathon',
  'final-year',
  'research',
  'open-source',
  'personal',
] as const;

export const PROJECT_PURPOSES = ['team-formation', 'personal-showcase'] as const;

export const PROJECT_STATUSES = ['active', 'completed', 'archived'] as const;

export const PROJECT_VISIBILITY = ['marketplace', 'private', 'showcase-only'] as const;

export const JOIN_REQUEST_STATUSES = ['pending', 'accepted', 'rejected', 'cancelled'] as const;

export const PROJECT_MEMBER_ROLES = ['creator', 'member'] as const;

// Only the types Phase 3 (Team Formation) actually emits — chat/task/mention
// notification types are intentionally not listed here since those features
// are not implemented yet.
export const NOTIFICATION_TYPES = ['join-request', 'request-accepted', 'request-rejected'] as const;

export const RATE_LIMITS = {
  AUTH: { windowMs: 15 * 60 * 1000, max: 20 }, // 20 requests / 15 min per IP on auth routes
  DEFAULT: { windowMs: 15 * 60 * 1000, max: 300 },
} as const;
