# PostgREST backend — schema contract for UIS

This folder holds **executable SQL** (`01–05*.sql`) that defines the relational model, RLS, and RPC surface **UIS exposes through PostgREST**. The canonical prose + fenced SQL source of truth remains **`terchris/new/`** (`03-data-model.md`, `04-postgrest-api.md`, `08-auth.md`, etc.).

## What this repo assumes

| Layer | Responsibility |
| ----- | ---------------- |
| **UIS** | Runs PostgREST, applies DDL/seeds via their toolchain, exposes `POSTGREST_URL` (e.g. Traefik hostname or in-cluster DNS). |
| **This Next.js app** | Calls **HTTP only**: `POSTGREST_URL`, `Authorization: Bearer …` (`anon` JWT for public reads; staff JWT when implemented). See root **`.env.example`**. **No DB connections from application code — PostgREST HTTP only.** |
| **`db/*.sql`** | Schema bundle UIS (or migrations) executes so PostgREST’s OpenAPI reflects the rewrite; not invoked by Next.js at runtime. |

## TL;DR for UIS testers

| Do | Don’t |
| --- | --- |
| Apply **`db/01–05.sql`** + **`terchris/sample-data/01–05*.sql`** in the order given in **`terchris/sample-data/README.md`**. | **`pg_restore` / replay** legacy Craft **`railway--*.sql`** into this database — wrong schema (`elements`, `entries`, Craft tables). |

**Why:** The Craft dump beside `extract-from-craft-dump.py` is for **extracting seed rows**, not loading the rewrite runtime schema.

After DDL + PostgREST: hand developers **`POSTGREST_URL`**, **`POSTGREST_ANON_JWT`**, and **`JWT_SECRET`** (or UIS secret wiring) — not raw database login strings for the app.

When UIS runs **`railway-postgrest`** and **`atlas-postgrest`** together, the Railway app uses only the **`railway-postgrest`** base URL (**`./uis status`** lists the Healthy endpoint; hostnames change when ingress is updated).

## UIS deliverables (inventory)

Verbatim column DDL, policies, and function bodies: **`terchris/new`** fenced blocks (and this repo’s `db/*.sql` where checked in). Summary checklist:

1. **Database** named for the rewrite (docs use `railway`), **not** created from the Craft backup.
2. **Extension** `citext` (required for `auth.users.email`).
3. **Schemas** `railway` + `auth` with objects from **`03` / `04` / `08`** (tables, triggers, `public_form_payload`, `has_capability`, `submit_registration`, `app_log_alert_count`, `log_event`, RLS, grants).
4. **PostgREST roles** — four roles in **`01-roles.sql`**: `railway_owner`, `anon`, `authenticated`, `authenticator` (**`db-uri` / JWT config** per **`04-postgrest-api.md`**). PostgREST connects as `authenticator` and `SET ROLE`s to `anon` or `authenticated`. Documented for contributors: **`website/docs/contributors/postgres-roles.md`**.
5. **Networking** so PostgREST can reach its DB listener on the platform network.

PostgREST `db-uri` and internal listener details are **UIS configuration**, not vars in this app.

## Seeds

After schema exists: load **`terchris/sample-data/01…05*.sql`** in order per that folder’s README. Never load Craft **`railway--*.sql`** into this database.

## Optional follow-up

Add **`db/migrations/`** or one concatenated **`schema.sql`** when you want UIS to apply a single artefact instead of numbered files.

## References

| Topic | Location |
| ----- | -------- |
| Data model | `railway-main/terchris/new/03-data-model.md` |
| PostgREST API | `railway-main/terchris/new/04-postgrest-api.md` |
| Auth / JWT / RLS | `railway-main/terchris/new/08-auth.md` |
| Seeds | `railway-main/terchris/sample-data/README.md` |
| App env | repo root **`.env.example`** |

Relative path (if both under `learn/`): `../../oslo-rodekors/railway-main/terchris/new/`
