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

## Product / architecture docs

Investigation and target design live in the Craft repo under `terchris/` (see `terchris/new/`).
