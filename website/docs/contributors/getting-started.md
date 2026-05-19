---
sidebar_position: 2
---

# Getting Started

Set up Railway on your laptop and get the dev server running.

## Prerequisites

- **Node.js 20+** — the Next.js app and the Docusaurus site both require it
- **Git**
- Access to a **PostgREST** instance (UIS-provided or local) — see [Project Conventions](project-conventions.md#postgrest-only-data-access) for why this is required

## Clone and Install

```bash
git clone <repo-url>
cd railway
npm install
```

## Environment Variables

Copy the example file and fill in the values for your environment:

```bash
cp .env.example .env
```

Required for any real work:

| Variable | Purpose |
|----------|---------|
| `POSTGREST_URL` | Base URL of the PostgREST instance backing the app |
| `POSTGREST_ANON_JWT` | Anonymous JWT for public endpoints |
| `JWT_SECRET` | HS256 secret matching the PostgREST instance (verifies admin session cookies) |

Admin development helpers (optional):

| Variable | Purpose |
|----------|---------|
| `ADMIN_PASSWORD` | Mints a wide staff JWT for quick admin login during development |
| `POSTGREST_ADMIN_JWT` / `POSTGREST_STAFF_JWT_UIS` | Server-side fallback JWTs for SSR when no session cookie is present |
| `ADMIN_BOOTSTRAP_SESSION_FROM_ENV` | Auto-login at `/admin/login` using the staff JWT (development only — gate behind a private network in production) |

Public site hardening:

| Variable | Purpose |
|----------|---------|
| `PRIMARY_SITE_URL` | Comma-separated origins allowed to call the registration API |
| `REGISTRATION_RELAX_FETCH_METADATA` | Disable Fetch Metadata checks if your ingress strips the headers |

UIS may run both `railway-postgrest` and `atlas-postgrest`. Railway needs the **railway** instance only — check ingress via `./uis status` for the current host.

## Run the Dev Server

```bash
npm run dev
```

The dev server listens on **`http://localhost:3010`**. (The Docker image still listens on **3001** — that port is part of the UIS ingress contract; only the dev port changed.)

For deployed local UIS clusters, the app is typically reachable at **`http://railway.localhost`** through Traefik — the exact hostname is configured in your UIS/Kubernetes manifests, not in this repo.

## Sanity Checks

Before opening a PR:

```bash
npm run lint
npm run build
```

## Project Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Next.js dev server on `:3010` |
| `npm run build` | Production build |
| `npm run start` | Run the production build |
| `npm run lint` | ESLint |
| `npm run smoke:admin` | End-to-end smoke test of the admin login + registrations table |
| `npm run docs:screens` | Capture admin-surface screenshots (Playwright) into `doc/screenshots/` |
| `npm run video:promo` | Build the promotional MP4 from captured screens |

## Docker (Deployment Only)

The `Dockerfile` is for UIS / release builds, not day-to-day development:

```bash
docker build -t railway-app .
docker run --rm -p 3001:3001 railway-app
```

The container listens on `0.0.0.0:3001` (`PORT=3001`) so UIS ingress `targetPort` wiring works.
