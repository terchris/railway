---
sidebar_position: 3
---

# Project Conventions

Hard rules and gotchas every contributor needs to know.

## PostgREST-Only Data Access

**This is a hard rule.** All data access in this app goes over HTTP through PostgREST.

What this means in practice:

- **No `DATABASE_URL` in the app.** The env var should not appear in `.env`, `.env.example`, or anywhere in `src/` or `app/`.
- **No relational DB drivers or ORMs** in `app/` or `src/` — no `pg`, `postgres`, `kysely`, `prisma`, `drizzle`, `typeorm`, etc.
- **Use `POSTGREST_URL` + JWT** via `src/lib/postgrest.ts` (or plain `fetch` when the helper does not fit).
- **The SQL under `db/`** is a UIS schema bundle for PostgREST. Next.js never runs it and never opens a datastore socket. Treat `db/` as a handoff artifact, not application code.

### Why

The deployment target (UIS) provisions PostgREST as the only data plane the app is allowed to reach. Going direct to Postgres would bypass UIS's auth, RLS, and audit story, and would break the deployment model.

### How to apply

When adding a feature that needs data:

1. Add or extend a PostgREST view / RPC under `db/` (this gets handed off to UIS).
2. Call it from the Next.js app over HTTP — use `src/lib/postgrest.ts` or `fetch` with the right headers (`Accept-Profile`, `Prefer`, `Authorization: Bearer <jwt>`).
3. If you need an admin-scoped call from the server, use the staff JWT (`POSTGREST_ADMIN_JWT` / `POSTGREST_STAFF_JWT_UIS`).

The database defines **four PostgreSQL roles** for PostgREST (`railway_owner`, `anon`, `authenticated`, `authenticator`) — see [PostgreSQL roles](postgres-roles.md) for how they relate to JWTs and UIS deploy naming.

Reference patterns live in the Atlas repo (`atlas/atlas-frontend/src/lib/api.ts`) and are summarised in the root `README.md`.

## Next.js — Not the Version You Know

The repo runs a **canary Next.js (`16.3.0-canary.*`)** with React 19. APIs, conventions, and file structure can differ from what's in your editor's autocomplete or your training data.

**Before writing Next.js code:**

- Read the relevant guide in `node_modules/next/dist/docs/` — these ship with the installed version and are authoritative.
- Heed deprecation notices the build prints.
- Don't paste patterns from older Next.js tutorials without checking they still apply.

## Code Hygiene

- Run `npm run lint` and `npm run build` before opening a PR; both must pass.
- Keep changes scoped — separate refactors from feature work into separate commits or PRs.
- Don't add comments that just restate what the code does. Comments should explain a non-obvious *why*.

## Temporary scaffolding

- **Dummy login picker (`/admin/login`)** is shipped in every environment — there is no env gate. Treat it as **development scaffolding**: convenient for exercising capability gates without an IdP, but it lets anyone with `JWT_SECRET` mint themselves a staff session by clicking. Replace with Okta/Authentik before production use. See [PostgreSQL roles → Dummy login](postgres-roles.md#dummy-login-development) for the broader context.

## Commits and Pull Requests

- Use a feature branch (`feature/<short-name>` or similar) — don't push directly to `main`.
- Commit messages: imperative mood, short subject line, body if the *why* needs explaining.
- Open a PR when ready; CI must pass before merge.

## Documentation

When behaviour changes, update the docs in the same PR. See [Documentation](documentation.md) for how this site is structured.
