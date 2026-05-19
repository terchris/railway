---
sidebar_position: 4
---

# PostgreSQL roles

Railway’s database layer defines **four PostgreSQL roles** for PostgREST. They are created in **`db/01-roles.sql`** (run before `02`–`05`). Passwords and login secrets are assigned **out of band** by UIS or operators — never committed to git.

This is separate from the **`role` claim inside a JWT** (`authenticated`), which tells PostgREST which of the API roles to `SET ROLE` to after verifying the token.

## The four roles

| Role | Login | Used by | Purpose |
|------|-------|---------|---------|
| **`railway_owner`** | Yes | Migrations / DDL | Owns objects in the `railway` and `auth` schemas; `SECURITY DEFINER` functions run as this role |
| **`anon`** | No | PostgREST (public) | Public API session after `SET ROLE`; RLS policies `TO anon` gate anonymous reads and registration RPCs |
| **`authenticated`** | No | PostgREST (staff) | Staff/admin API session after `SET ROLE`; RLS policies `TO authenticated` gate admin reads and writes |
| **`authenticator`** | Yes | PostgREST process | Runtime DB user in `PGRST_DB_URI`; `NOINHERIT` so privileges come only via `SET ROLE` to `anon` or `authenticated` |

**Count: 4 roles** in the canonical Railway schema bundle.

## How PostgREST uses them

```
PostgREST pod                    PostgreSQL (railway DB)
─────────────                    ───────────────────────
     │                           railway_owner  (owns DDL / DEFINER fns)
     │  PGRST_DB_URI login
     └──────────────────────────► authenticator  (LOGIN, NOINHERIT)
                                        │
                         SET ROLE ◄────┴────► anon            (public JWT / no JWT)
                         SET ROLE ──────────► authenticated (staff JWT, role claim)
```

1. PostgREST connects to the database as **`authenticator`** (from the deployment secret / `PGRST_DB_URI`).
2. For each HTTP request it verifies the Bearer JWT (when present) and runs **`SET ROLE`** to either **`anon`** or **`authenticated`** depending on the JWT’s **`role`** claim and your PostgREST config.
3. Row-level security in **`db/05-rls.sql`** is written as `TO anon` or `TO authenticated` — not `TO authenticator`.

Grants wiring `authenticator` → `anon` / `authenticated` are at the bottom of **`db/01-roles.sql`**:

```sql
grant anon          to authenticator;
grant authenticated to authenticator;
```

## JWT `role` vs Postgres role names

| JWT claim | Postgres role PostgREST switches to | Typical use in this app |
|-----------|-------------------------------------|-------------------------|
| (no / anon token) | **`anon`** | Public registration form payload, `submit_registration` |
| `role: "authenticated"` + capabilities | **`authenticated`** | Admin UI (`/admin/*`), staff SSR |

Staff tokens are minted with **`aud: railway`** and a **`capabilities`** array; see root **`.env.example`** and **`talk/talk.md`** for UIS handoff.

## UIS naming (do not confuse with the four above)

UIS **`./uis configure postgrest`** may create **app-prefixed** roles such as `railway_web_anon` and `railway_authenticator`. **This repo’s spec uses the canonical names `anon` and `authenticator`.** RLS in `db/05-rls.sql` targets `anon` / `authenticated`.

If the PostgREST deployment points at `PGRST_DB_ANON_ROLE=railway_web_anon` but those roles were dropped in favour of the canonical ones, every unauthenticated request fails with `role "railway_web_anon" does not exist`. Fix by aligning deployment env with the four roles from **`01-roles.sql`** (see **`website/docs/ai-developer/plans/backlog/INVESTIGATE-postgrest-admin-connection.md`**).

When both **`railway-postgrest`** and **`atlas-postgrest`** run in UIS, the Next.js app must use the **railway** PostgREST base URL only — not Atlas’s instance.

## Related files

| Topic | Location (repo root) |
|-------|----------------------|
| Role DDL | `db/01-roles.sql` |
| Schemas `railway` + `auth` | `db/02-schemas-and-extensions.sql` |
| RLS policies | `db/05-rls.sql` |
| UIS / schema handoff | `db/README.md` |
| App env vars | [Getting started](getting-started.md#environment-variables), `.env.example` |
| PostgREST-only rule (app) | [Project conventions](project-conventions.md#postgrest-only-data-access) |
| PostgREST deploy / anon-role issues | [INVESTIGATE postgrest admin connection](../ai-developer/plans/backlog/INVESTIGATE-postgrest-admin-connection.md) |

## Apply order (UIS / operators)

Run the numbered SQL bundle in order: **`01-roles.sql`** → **`02`** → **`03`** → **`04`** → **`05`**, then seeds per **`terchris/sample-data/README.md`**. See **`db/README.md`** for the full handoff checklist.

## Dummy login (development)

`/admin/login` ships with a **role picker** that lets you log in as `anon` or as `authenticated` with one of five capability profiles (Full admin, Registrations admin, Content editor, App-log viewer, Users admin). The two non-session PG roles (`railway_owner`, `authenticator`) appear on the picker as disabled rows with an explanation — they exist to make the doc above and the UI line up.

The picker mints **real** HS256 staff JWTs signed with `JWT_SECRET`. PostgREST verifies them; RLS enforces capabilities exactly as for UIS-issued tokens. "Dummy" refers to user identity (no IdP backs it yet), not to bypassing security.

This is **temporary scaffolding for the eventual Okta/Authentik integration.** When an IdP lands, the picker is replaced by an IdP-redirect button and the picker route becomes a development-only escape hatch (or is deleted). See [`PLAN-dummy-login.md`](../ai-developer/plans/completed/PLAN-dummy-login.md) for the implementation and [`testing-dummy-login.md`](testing-dummy-login.md) for the per-role test checklist.

## End-user docs per role

End users (volunteers + staff) read Norwegian guides organised by login role, not by database concept. The DB roles + capability profiles documented above map 1:1 to those guides:

| DB / cap profile | End-user guide |
|---|---|
| `anon` | [Slik melder du deg på](../users/public-registration.md) |
| `authenticated` + `admin` | [Full administrator](../users/admin/full-admin.md) |
| `authenticated` + `registrations:read/write` | [Registreringsadministrator](../users/admin/registrations-admin.md) |
| `authenticated` + `content:read/write` | [Innholdsredaktør](../users/admin/content-editor.md) |
| `authenticated` + `app_log:read` | [App-logg-leser](../users/admin/app-log-viewer.md) |
| `authenticated` + `users:read/write` | [Brukeradministrator](../users/admin/users-admin.md) |

The end-user guides describe what each role *sees* and *does* in the admin UI; this page describes how the underlying capability check works.
