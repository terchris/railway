# Continuation context — Railway Next.js vs Craft investigation repo

Use this when working **only** in `helpers/railway`; the full product investigation lives elsewhere.

## Sister workspace (investigation + legacy app)

| What | Path |
| ---- | ---- |
| **Craft CMS monolith + docs** | `/Users/terje.christensen/learn/oslo-rodekors/railway-main` |
| **Rewrite analysis (read this first for behaviour)** | `railway-main/terchris/new/` — numbered `01-..11-*.md`, start at `README.md` |
| **As-is system docs** | `railway-main/terchris/*.md` (`01-overview.md` … `10-glossary.md`) |
| **Validation / decisions / dump notes** | `railway-main/terchris/cursor-comments/` — `01-validation-review.md`, `02-real-data-evaluation.md`, `03-decisions.md` (D1–D10), `04-second-pass-review.md` |
| **Production-derived seeds + extractor** | `railway-main/terchris/sample-data/` — `extract-from-craft-dump.py`, `01..05.sql`, dump filename in README |

Do **not** duplicate schema or RPC specs here; implement against `terchris/new/03-data-model.md`, `04-postgrest-api.md`, `06-public-form.md`, `07-admin-app.md`, `08-auth.md`.

## What this repo (`helpers/railway`) is

- Next.js **16** App Router, TS, Tailwind **4**, ESLint.
- **`output: "standalone"`** + **`Dockerfile`** for UIS/Kubernetes builds; skip Docker while iterating locally — use **`npm run dev`** instead.
- First deployment target: **local UIS**; ingress hostname intent **`http://railway.localhost`** (configured in UIS manifests, not committed here yet).
- **PostgREST** is how this app reaches data (`POSTGREST_URL` + JWT; see `.env.example`). **Do not wire SQL drivers or connection strings into app runtime code.**
- **`README.md`** — UIS notes + pointer to **Atlas** PostgREST patterns: `~/learn/helpers/atlas/atlas-frontend/src/lib/api.ts`.

Railway should follow **terchris** architecture: PostgREST **behind** Next (Bearer JWT, CSP), **not** browser-exposed `NEXT_PUBLIC_*` to PostgREST unless deliberately chosen.

## UIS platform

- Catalogue / docs: https://uis.sovereignsky.no/
- Described in `terchris/new/` (`01-goals-and-constraints.md`, `02-target-architecture.md`, `11-risks-and-open-questions.md` Q10).

## Decisions already recorded (high level)

- **Q2 revisions:** skipped for v1 (`03-decisions.md` **D10**, `11-risks-and-open-questions.md`).
- **Hosting:** UIS; `railway.localhost` for local cluster.
- **Activity limits:** primary vs additional arrays; prod `activity_selection_limit = 1`; `0` = unlimited server-side (see `terchris/new/04-postgrest-api.md`).
- **Auth:** `anon` + `authenticated` + JWT **capabilities** + RLS (`08-auth.md`).
- **Migration:** staff preview replaces shadow mode (`03-decisions.md` **D2**, `10-migration-plan.md`).

## Agent transcripts

Past Cursor chats may appear under the **parent** project path’s agent transcripts dir (same machine); cite only parent UUID filenames if needed — folder layout is not important for implementation.

## Next implementation steps (when you start coding)

1. Add `lib/postgrest.ts` (or `@supabase/postgrest-js`) aligned with `terchris/new/05-nextjs-frontend.md`.
2. Wire env from UIS (`POSTGREST_URL`, anon JWT for RSC, session JWT for admin).
3. Port form + admin per `terchris/new/06`, `07`; CSP/middleware per `05`.
4. Exercise parity behaviour against **`terchris/sample-data/`** through **HTTP** (`pg()` / `fetch`), once PostgREST is running on UIS with those seeds loaded.
---

*Written so a new Cursor session opened on `helpers/railway` can locate full specs and history without searching.*
