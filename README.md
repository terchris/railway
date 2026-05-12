# Railway (Oslo Røde Kors) — Next.js

Volunteer registration front-end and admin (rewrite target), packaged for **[UIS](https://uis.sovereignsky.no/)**.

PostgreSQL and PostgREST run as separate UIS platform services; this repo is **only the Next.js app** in a container.

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Copy `.env.example` to `.env.local` when you wire PostgREST from a local UIS stack.

## Local UIS cluster URL

When deployed to a **local UIS** cluster, ingress typically follows UIS naming (e.g. Traefik + `*.localhost`). This app is expected to be reachable as:

**[http://railway.localhost](http://railway.localhost)**

Exact hostname is configured in your UIS/Kubernetes manifests, not in this repo.

## Container image

Uses Next.js **`output: "standalone"`** for a minimal runtime image.

```bash
docker build -t railway-app .
docker run --rm -p 3000:3000 railway-app
```

The process listens on `0.0.0.0:3000` inside the container (required for ingress).

## Reference: Atlas UIS patterns (`learn/helpers/atlas`)

The **Atlas** monorepo at `~/learn/helpers/atlas` shows **two** ways to talk to data from Next.js — useful when wiring this app against UIS Postgres + PostgREST:

| Pattern | Location | Mechanism |
| ------- | -------- | --------- |
| **PostgREST (HTTP)** | `atlas/atlas-frontend/src/lib/api.ts` | `fetch` to `NEXT_PUBLIC_API_URL` (Atlas default `http://api-atlas.localhost`). Typed rows via generated OpenAPI types; **`Accept-Profile`** for non-default PostgREST schemas; **`Prefer: count=exact`** for counts; **`cache: "no-store"`** so empty responses are not cached across reloads. |
| **Postgres (direct)** | `atlas/atlas-contributor-frontend/src/lib/db.ts` | [`postgres`](https://github.com/porsager/postgres) package + **`DATABASE_URL`**, server-only tagged-template queries; global singleton pool for Next.js hot reload. |

Env templates: `atlas-frontend/.env.example`, `atlas-contributor-frontend/.env.example`.

**Railway vs Atlas:** The Oslo Røde Kors rewrite docs (`railway-main` repo, `terchris/new/`) keep PostgREST **behind** Next.js (Bearer JWT, CSP). Reuse Atlas **fetch / headers / error** idioms from `api.ts`, but prefer **`POSTGREST_URL` server-only** (no `NEXT_PUBLIC_*`) unless you intentionally expose anonymous reads to the browser.

## Product / architecture docs

Investigation and target design live in the Craft repo under `terchris/` (see `terchris/new/`).
