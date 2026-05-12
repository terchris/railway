# Railway (Oslo Røde Kors) — Next.js

Volunteer registration front-end and admin (rewrite target), packaged for **[UIS](https://uis.sovereignsky.no/)**.

**Switching workspaces:** full investigation paths and next coding steps are in **[`.cursor/CONTINUATION.md`](.cursor/CONTINUATION.md)**.

UIS runs **PostgREST** against the Railway schema; this repo is the **Next.js app** (`npm run dev` on your machine during development; the **Dockerfile** is for UIS / release builds). **All data access is HTTP to PostgREST** (`POSTGREST_URL`, Bearer JWT).

**UIS / PostgREST handoff** (schema bundle + what developers need): **[`db/README.md`](db/README.md)** and root **`.env.example`**.

## Local development

Use **`npm run dev`** on this machine — it is faster than rebuilding Docker images on every change.

```bash
npm install
npm run dev   # http://localhost:3001
```

Sanity-check without Docker (still quick):

```bash
npm run lint
npm run build
```

Open **[http://localhost:3001](http://localhost:3001)** (port **3001** avoids clashes with apps on `:3000`).

Copy **`.env.example`** → **`.env`** and set **`POSTGREST_URL`** / **`POSTGREST_ANON_JWT`** once PostgREST is available (UIS handoff above).

For production-facing registration API hardening, set **`PRIMARY_SITE_URL`** (comma-separated origins); see **`REGISTRATION_RELAX_FETCH_METADATA`** in `.env.example` if an ingress strips fetch metadata headers.

### Admin (utkast)

- URL: **`/admin`** (innlogging **`/admin/login`**).
- **JWT-økt:** Lim inn gyldig HS256 staff‑JWT (samme format som PostgREST); lagres som HttpOnly‑cookie og verifiseres med **`JWT_SECRET`**. Valgfritt **`ADMIN_PASSWORD`** mint bred staff‑JWT for enkel utvikling (krever også **`JWT_SECRET`**).
- **Lokalt (`next dev`):** Gyldig **`POSTGREST_ADMIN_JWT`** / **`POSTGREST_STAFF_JWT_UIS`** som matcher **`JWT_SECRET`** gir **automatisk innlogging** ved besøk på **`/admin/login`** (sett **`ADMIN_BOOTSTRAP_SESSION_FROM_ENV=1`** for samme oppførsel i produksjon — kun bak sikker tilgang).
- **Server‑fallback:** `POSTGREST_ADMIN_JWT` / `POSTGREST_STAFF_JWT_UIS` brukes av SSR når ingen gyldig økt‑JWT finnes (drift/CI).

## Local UIS cluster URL

When deployed to a **local UIS** cluster, ingress typically follows UIS naming (e.g. Traefik + `*.localhost`). This app is expected to be reachable as:

**[http://railway.localhost](http://railway.localhost)**

Exact hostname is configured in your UIS/Kubernetes manifests, not in this repo.

## Docker image (UIS / CI)

For **deployment** — not required while you develop locally. Uses Next.js **`output: "standalone"`** for a minimal runtime image.

```bash
docker build -t railway-app .
docker run --rm -p 3001:3001 railway-app
```

The process listens on `0.0.0.0:3001` inside the container (`PORT=3001`, required for UIS ingress targetPort wiring).

## Reference: Atlas UIS patterns (`learn/helpers/atlas`)

The **Atlas** monorepo at `~/learn/helpers/atlas` has a **PostgREST (HTTP)** front-end pattern that matches what Railway uses:

| Pattern | Location | Mechanism |
| ------- | -------- | --------- |
| **PostgREST (HTTP)** | `atlas/atlas-frontend/src/lib/api.ts` | `fetch` to `NEXT_PUBLIC_API_URL` (Atlas default `http://api-atlas.localhost`). Typed rows via generated OpenAPI types; **`Accept-Profile`** for non-default PostgREST schemas; **`Prefer: count=exact`** for counts; **`cache: "no-store"`** so empty responses are not cached across reloads. |

Env template for comparison: `atlas-frontend/.env.example` alongside root **`.env.example`** here.

**Railway:** Reuse Atlas **fetch / headers / error** idioms from `api.ts`, with **`POSTGREST_URL` server-only** (no `NEXT_PUBLIC_*` for PostgREST) unless you intentionally expose anonymous reads to the browser.

## Product / architecture docs

Investigation and target design live in the Craft repo under `terchris/` (see `terchris/new/`).
