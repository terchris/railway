---
sidebar_position: 9
---

# API surface

Two surfaces sit between a Railway client and the data: the **Next.js API routes** the app itself exposes under `/api/*`, and the **PostgREST surface** the app reads from and writes to over HTTP. This page documents both, and points at the live OpenAPI doc for the authoritative PostgREST shape.

## Why two surfaces

The Next.js routes exist for things PostgREST can't do safely from a browser: minting and sealing session cookies, validating the registration `Origin`/`Referer` header, running the honeypot check, and the public submit (which goes through a single RPC that wraps the multi-table write in a transaction).

Everything else — reading content, listing registrations, the admin grids — is the Next server-side calling **PostgREST directly** with the staff JWT from the session cookie. Those calls don't go through the Next `/api/*` surface; they go through the PostgREST surface listed below.

## Next.js API routes

All routes live under `src/app/api/`. Each is one `route.ts` file exporting the methods listed below.

| Method | Path | Auth | What it does |
|---|---|---|---|
| `GET` | [`/api/health`](https://github.com/terchris/railway/blob/main/src/app/api/health/route.ts) | none | Liveness probe. Calls PostgREST RPC `app_log_alert_count`; returns `{ ok, alerts }` or 502/503 if PostgREST is unreachable. |
| `POST` | [`/api/registrations`](https://github.com/terchris/railway/blob/main/src/app/api/registrations/route.ts) | none (origin-gated) | Public registration submit. Validates `Origin`/`Referer` against `PRIMARY_SITE_URL`, runs the honeypot, proxies to PostgREST RPC `submit_registration`. |
| `POST` | [`/api/admin/login`](https://github.com/terchris/railway/blob/main/src/app/api/admin/login/route.ts) | password or JWT | Staff login. Accepts `{ password }` (matched against `ADMIN_PASSWORD`, then a broad bootstrap JWT is minted with `JWT_SECRET`) **or** `{ staffJwt }` (verified against `JWT_SECRET`). On success: sets the `ADMIN_SESSION_COOKIE`. |
| `POST` | [`/api/admin/login/dummy`](https://github.com/terchris/railway/blob/main/src/app/api/admin/login/dummy/route.ts) | none (dev tool) | Dummy login picker. Accepts `{ profileId }` (one of the entries in [`src/lib/dummy-login-roles.ts`](https://github.com/terchris/railway/blob/main/src/lib/dummy-login-roles.ts)), mints a JWT with the profile's capabilities via `JWT_SECRET`, sets the session cookie. Used by `/admin/login`. |
| `POST` | [`/api/admin/logout`](https://github.com/terchris/railway/blob/main/src/app/api/admin/logout/route.ts) | session cookie | Clears `ADMIN_SESSION_COOKIE`. Returns `{ ok: true }`. |
| `GET` | [`/api/admin/bootstrap-session`](https://github.com/terchris/railway/blob/main/src/app/api/admin/bootstrap-session/route.ts) | env-controlled | **Dev / explicit opt-in only.** Reads `POSTGREST_ADMIN_JWT` or `POSTGREST_STAFF_JWT_UIS` from the environment, verifies it, sets it as the session cookie, redirects to `/admin`. Enabled when `NODE_ENV=development` **or** `ADMIN_BOOTSTRAP_SESSION_FROM_ENV=1`. Returns 404 otherwise. |

### Session cookie

All admin auth paths converge on one cookie: `ADMIN_SESSION_COOKIE` (HttpOnly, SameSite=Lax, `Secure` in prod), whose value is the staff JWT itself. The same JWT is used to call PostgREST from server-side React. There's no separate session store.

### Public submit (`/api/registrations`) — gates

In order:

1. `Content-Type: application/json` check (415 otherwise).
2. `validateRegistrationPostOrigin` — `Origin`/`Referer` must match `PRIMARY_SITE_URL`, and `Sec-Fetch-Site: cross-site` is rejected unless `REGISTRATION_RELAX_FETCH_METADATA=1`.
3. JSON parse (400 on failure).
4. Honeypot field check — non-empty value logs `log_event` with `category: 'honeypot'` and 200s without persisting the row.
5. Pass-through to PostgREST RPC `submit_registration`.

Mapping PostgREST error codes back to user-facing messages happens in [`src/lib/public-form/errors.ts`](https://github.com/terchris/railway/blob/main/src/lib/public-form/errors.ts).

## PostgREST surface

The Next app talks to a single PostgREST instance over HTTP. Configuration:

- **URL**: `POSTGREST_URL` (server-side only; never exposed to the browser).
- **Schema**: `railway` (sent via `Accept-Profile: railway` header by [`src/lib/postgrest.ts`](https://github.com/terchris/railway/blob/main/src/lib/postgrest.ts)).
- **Auth**: HS256 JWTs signed with `JWT_SECRET`. Anon path uses `POSTGREST_ANON_JWT`; staff path uses the session cookie's JWT (or `POSTGREST_ADMIN_JWT` / `POSTGREST_STAFF_JWT_UIS` as fallback).
- **Capability gating**: each table/RPC has RLS that calls `railway.has_capability(<cap>)` against the `capabilities` array in the JWT. See [PostgreSQL roles](postgres-roles.md) for the model.

### Live OpenAPI doc

PostgREST publishes its own OpenAPI spec at the root of its URL. Open it in a browser for the authoritative, always-current list of tables, views, columns, and RPCs:

**Local dev (Traefik): [http://api-railway.localhost/](http://api-railway.localhost/)**
**Public (Tailscale Funnel): [https://railway-postgrest.dog-pence.ts.net/](https://railway-postgrest.dog-pence.ts.net/)**

A 60 KB JSON blob; load it in Swagger UI or a JSON viewer for navigation. This is the source of truth — the table below is a hand-curated subset of what the Next app actually uses, not an exhaustive PostgREST inventory.

### Tables and views the Next app reads

All under the `railway` schema. Capability requirement is what the RLS policy gates against; "anon" means the table is readable without a staff JWT (still subject to row filters).

| Table / view | Used for | Capability |
|---|---|---|
| `activities` | Wizard step "Aktiviteter" + admin `/admin/activities` | `content:read` (admin); `anon` (public form) |
| `activity_categories` | Admin `/admin/activity-categories` | `content:read` |
| `activity_settings` | Admin `/admin/activity-settings` | `content:read` |
| `app_log` | Admin `/admin/app-log` | `app_log:read` |
| `evaluation_options` | Wizard + admin `/admin/eval-options` | `content:read`; `anon` (public form) |
| `evaluation_questions` | Wizard + admin `/admin/eval-questions` | `content:read`; `anon` (public form) |
| `membership_options` | Wizard + admin `/admin/membership-options` | `content:read`; `anon` (public form) |
| `membership_statuses` | Admin `/admin/membership-statuses` | `content:read` |
| `no_selected_activity_options` | Wizard fallback + admin `/admin/no-selected-options` | `content:read`; `anon` (public form) |
| `public_form_payload` | View — single payload the public wizard hydrates from | `anon` |
| `registration_activities` | Admin registration detail | `registrations:read` |
| `registrations` | Admin `/admin/registrations` + detail | `registrations:read` |
| `text_content` | Admin `/admin/text-content` + public form headers | `content:read`; `anon` (public form) |
| `user_languages` | Admin `/admin/languages` | `content:read` |

The Next app does not currently write through any table — all writes go through RPCs (next section). When admin "write" surfaces land (currently scaffolded but not all wired up), they'll touch the corresponding table with `*:write` capability checked by RLS.

### RPCs the Next app calls

PostgreSQL functions in the `railway` schema, exposed by PostgREST as `POST /rpc/<name>`. Capability requirement is enforced inside the function body via `auth.has_capability(...)`.

| RPC | Called from | What it does | Capability |
|---|---|---|---|
| `submit_registration` | `/api/registrations` | Wraps the multi-table public submit in one transaction. Inserts into `registrations`, then `registration_activities`, then writes the evaluation answers. Returns the registration id or a PostgREST error code surfaced by [`public-form/errors.ts`](https://github.com/terchris/railway/blob/main/src/lib/public-form/errors.ts). | `anon` |
| `log_event` | `/api/registrations` (honeypot path) + ad-hoc audit calls | Inserts a row into `app_log`. Used by the honeypot path with `category: 'honeypot'`. | `anon` for honeypot path; `app_log:write` otherwise |
| `app_log_alert_count` | `/api/health` | Returns the count of unacknowledged alerts in `app_log`. Used as the liveness probe. | `anon` (denies `authenticated` — see [INVESTIGATE-app-log-alert-count-permission.md](../ai-developer/plans/backlog/INVESTIGATE-app-log-alert-count-permission.md) for the open question on whether to widen this). |

## Calling PostgREST directly

For local debugging or scripting against the cluster from outside the Next app:

```bash
# Anon read (e.g. introspection)
curl "$POSTGREST_URL/" -H "Accept-Profile: railway"

# Staff read of registrations (needs a JWT with registrations:read)
curl -H "Authorization: Bearer $POSTGREST_STAFF_JWT_UIS" \
     -H "Accept-Profile: railway" \
     "$POSTGREST_URL/registrations?select=id,created_at&limit=10"

# Public submit RPC (anon)
curl -X POST \
     -H "Accept-Profile: railway" \
     -H "Content-Type: application/json" \
     -d '{ "p_payload": { ... } }' \
     "$POSTGREST_URL/rpc/submit_registration"
```

JWTs are HS256 with `aud: railway`. To mint one locally that matches the cluster's `JWT_SECRET`, run [`node scripts/mint-staff-jwt.mjs`](https://github.com/terchris/railway/blob/main/scripts/mint-staff-jwt.mjs).

## Related

- [Getting started](getting-started.md) — repo setup, env vars, first run
- [PostgreSQL roles](postgres-roles.md) — the four PG roles + the capability model RLS uses
- [Project conventions](project-conventions.md) — coding style, file layout
- [Test of dummy login picker](testing-dummy-login.md) — per-role JWT shape and which surfaces light up
