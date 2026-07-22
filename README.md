# LaunchPad

Student collaboration and project-discovery platform. See `launchpad-system-design.md` for the full architecture, database design, and API contract this implementation follows.

## Repository layout

```
launchpad/
├── server/   # Express + TypeScript API
└── client/   # Next.js + TypeScript frontend
```

## Phase 1 — Foundation (this delivery)

Implemented:

- **Project scaffolding** for both `server/` and `client/`: TypeScript, ESLint, Prettier, `.env.example`.
- **Database connection** (`server/src/config/database.ts`) and **Redis connection** (`server/src/config/redis.ts`), the latter used by rate limiting now and the Socket.IO adapter starting Phase 4.
- **Base Mongoose models**: `User` (`server/src/modules/users/user.model.ts`) and `Project` (`server/src/modules/projects/project.model.ts`), matching the design doc's schema exactly.
- **JWT auth**, end to end:
  - `RefreshToken` model with hashed, revocable, TTL-expiring tokens.
  - `authService`: register, login, refresh (with rotation + reuse detection), logout, logout-all.
  - `authController` + `/api/v1/auth/*` routes, rate-limited.
  - `authenticate` middleware (access-token verification), `validate` middleware (Zod), `rateLimiter` middleware (Redis-backed), and the centralized `errorHandler`.
- **Landing page** (unchanged design, now wired to `/register` and `/marketplace`) and **auth pages** (`/login`, `/register`) with a working register → session → redirect flow.
- **Frontend auth plumbing**: in-memory access-token store (never `localStorage`), a fetch client that auto-attaches the access token and silently refreshes it on a 401, and a `SessionProvider` that restores a session on page reload via the httpOnly refresh cookie.

Not yet implemented in Phase 1 (landed in Phase 2, below, or later phases): user profile endpoints, project CRUD, marketplace, team formation, workspace, chat, tasks, resources, notifications, analytics, showcase.

## Phase 2 — Core Identity & Projects (this delivery)

Implemented:

- **User Profile**: `GET/PATCH /users/me`, public `GET /users/:id` (email never exposed), `GET /users/:id/projects` (created + contributed, populated), profile completion scoring. Frontend: `/profile/[userId]` (public view) and `/profile/edit` (own profile form) with skills/interests as tag inputs and GitHub/LinkedIn/Portfolio links.
- **Project Management**: full CRUD (`POST/GET/PATCH/DELETE /projects/:id`), category + purpose enforcement (team-formation → marketplace visibility; personal-showcase → showcase-only, matching the business rules in the design doc). Delete is implemented as an **archive** (`status: 'archived'`, `deletedAt` set) rather than a hard delete, per the design doc's §12 recommendation — this preserves other users' `contributedProjects` references. Frontend: `/projects/new` (create) and `/projects/:id/edit` (edit, creator-only).
- **Project Marketplace**: `GET /projects` with search (MongoDB text index), category filter, tech-stack filter, and pagination — scoped to `purpose: team-formation` projects only, matching the business rule that personal-showcase projects don't appear in the marketplace. Bookmarking (`POST /projects/:id/bookmark`, `GET /users/me/bookmarks`) with a dedicated `Bookmark` collection and denormalized `bookmarksCount`. Frontend: `/marketplace` (browse/search/filter/bookmark), `/marketplace/[projectId]` (details page), and `/bookmarks` (a saved-projects view, so bookmarking is actually visible somewhere, not just a toggle).
- A lightweight shared `AppHeader` now provides navigation between Marketplace / Create Project / My Profile / Log Out — added under `marketplace/`, `profile/`, and `projects/` layouts only, so the finalized landing page is untouched.
- **Automated tests** (`server/tests/`): integration tests using Jest + Supertest against an in-memory MongoDB (`mongodb-memory-server`) and a mocked Redis (`ioredis-mock`), covering auth (register/login/refresh/rotation/reuse-detection/logout), user profile CRUD + public profile, and project CRUD + marketplace search/filter/pagination/bookmarking.

Not yet implemented (Phase 3+): join requests/invitations, workspace shell, chat, tasks, resources, notifications, analytics, showcase pages.

### Running the backend tests

```bash
cd server
npm install
npm test
```

> **Note:** in the sandbox used to generate this code, `bash_tool` has no network access, so `npm install` and `npm test` could not actually be executed here — no dependency has been installed or run. The test suite is written to pass against a real environment once you run `npm install && npm test`; please run it yourself and treat that as the actual verification step before treating Phase 2 as confirmed on your end.



### Prerequisites

- Node.js 18+
- MongoDB running locally (or a connection string to a replica set)
- Redis running locally

### Backend

```bash
cd server
cp .env.example .env   # fill in real secrets — see below
npm install
npm run dev             # starts on http://localhost:5000
```

Generate strong values for `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` (32+ random characters each, and make sure they're different from each other). For example:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### Frontend

```bash
cd client
cp .env.example .env.local
npm install
npm run dev              # starts on http://localhost:3000
```

### Verifying the setup

1. `GET http://localhost:5000/health` should return `{ success: true, data: { status: "ok", ... } }`.
2. Visit `http://localhost:3000` — the landing page should render, centered, per the finalized design.
3. Click **Get Started** → fill out the register form → you should land on `/profile/edit`.
4. Reload the page — `SessionProvider` should silently call `/auth/refresh` and obtain a fresh access token without you having to log in again, and `useRequireAuth` should not bounce you back to `/login`.
5. Visit `/marketplace`, create a project, bookmark someone else's, and check `/bookmarks` — the card there should show as bookmarked (★), with the correct team size and creator name.

## Debugging Pass (post-Phase-2, pre-Phase-3)

After a local run surfaced runtime issues, every Phase 1 and Phase 2 backend module was re-audited. Fixes:

1. **Registration crash — `tokenHash` required validation error.** `issueTokenPair()` used to create a `RefreshToken` with a placeholder `tokenHash: ''`, then compute and save the real hash afterward — but `tokenHash` is a required field, so the initial `create()` failed validation before the update could ever run. Fixed by pre-generating the document's `_id`, signing the refresh JWT with it, computing the hash, and creating the document once, fully formed, in a single atomic write. Rotation, reuse-detection, and the JWT `jti` architecture are all unchanged.
2. **Duplicate Mongoose index warnings** on `User.email` and `RefreshToken.tokenHash` — each field already declares `unique: true` (which creates an index on its own); a redundant explicit `.index(...)` call for the same field was also present. Removed the redundant calls; all other indexes (skills, TTL, compound marketplace filters, text search, bookmark uniqueness) are untouched.
3. **Atlas production gap**: `autoIndex` is (correctly) disabled in production, but nothing was explicitly building indexes otherwise — so on a real Atlas deployment with `NODE_ENV=production`, the email/tokenHash unique constraints and the refresh-token TTL cleanup would never actually get created. Fixed by explicitly calling `Model.init()` on every registered model right after connecting, regardless of environment.
4. **Duplicate-email race condition**: two concurrent registrations for the same email could both pass the pre-check and race at `create()` — newly relevant now that the unique index is guaranteed to exist (fix #3 made this race "live" for the first time). Added explicit `E11000` duplicate-key handling so it returns a clean `409 EMAIL_TAKEN` instead of leaking a raw 500.
5. **Bookmarks page showed every project as *not* bookmarked**: `bookmarkService.listForUser` never set `isBookmarked` on the projects it returned, so `ProjectCard` defaulted to the un-bookmarked star everywhere on `/bookmarks`.
6. **`teamSize` silently missing** from two independently-maintained (and drifted) field-projection strings, used by the bookmarks and profile created/contributed-projects endpoints — cards on those pages showed no team size. Centralized into one exported `PROJECT_CARD_SUMMARY_FIELDS` constant so the two can't drift apart again.
7. **Inconsistent `creator` population**: the same two endpoints returned `creator` as a raw ObjectId instead of a populated `{name, ...}` object, so "by {creator's name}" silently disappeared on those pages while working on the marketplace. Fixed by nesting the `populate` call and centralizing the referenced-user field list into `PUBLIC_USER_REF_FIELDS`.
8. **Missing bookmark personalization on public profiles**: `GET /users/:id/projects` never annotated `isBookmarked` for the viewer at all (no route even had `optionalAuthenticate`). Added the middleware and wired the same per-viewer bookmark computation already used by the marketplace/details endpoints.

All 5 auth flows (register, login, refresh, logout, logout-all) were re-verified end-to-end, including token rotation and reuse-detection, by executing a line-for-line JavaScript mirror of `auth.service.ts`'s control flow against an in-memory store with the same validation/uniqueness semantics as the real Mongoose schemas — 7/7 scenarios passed. Tests were added/extended for every fix above.

**What could not be done in this sandbox:** `bash_tool` has no network access here (`npm install` returns `403 Forbidden` from the registry), so `npm install`, `npm test`, and running the app against real MongoDB/Redis were not possible. Every fix above was verified by rigorous manual control-flow tracing and, where the logic didn't depend on external packages, by actually executing an equivalent script with Node's built-ins. This is not a substitute for running `npm test` and the app itself in your environment — please do that as the real verification step.

## Next up: Phase 3 — Team Formation & Resources

- Join requests, invitations, accept/reject, membership management.
- Project workspace shell (overview, members, settings tabs).
- Resources module: add/edit/remove project links (GitHub, live demo, docs, prototype, presentation, video, other), Resources tab in the workspace.
