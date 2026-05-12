-- 01-roles.sql — Roles for PostgREST (`railway` + `auth` DDL)
--
-- Idempotency: IDEMPOTENT. Roles wrapped in DO blocks that skip when the
-- role already exists. Safe to re-run; will not silently overwrite an
-- existing role's password / login flags.
--
-- Spec sources:
--   - helpers/railway/db/README.md       UIS deliverables (roles summary)
--   - terchris/new/04-postgrest-api.md  "## Configuration"
--   - terchris/new/08-auth.md           "## Postgres roles"
--
-- Roles created (in dependency order):
--   1. railway_owner   — owns every railway object; SECURITY DEFINER fns run as this
--   2. anon            — public API role (PostgREST SET ROLE target)
--   3. authenticated   — staff API role (PostgREST SET ROLE target)
--   4. authenticator   — PostgREST runtime login role; NOINHERIT; can SET ROLE to anon/authenticated
--
-- Passwords / LOGIN secrets are NOT set here. UIS or the platform assigns them
-- out-of-band when wiring PostgREST (never commit literals to git).

-- ──────────────────────────────────────────────────────────────────────
-- railway_owner — DDL / object owner
-- ──────────────────────────────────────────────────────────────────────
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'railway_owner') then
    create role railway_owner with login;
    -- LOGIN password assigned by UIS / operator tooling (out-of-band)
  end if;
end$$;


-- ──────────────────────────────────────────────────────────────────────
-- anon — public PostgREST role (NOLOGIN; reached via SET ROLE)
-- ──────────────────────────────────────────────────────────────────────
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin;
  end if;
end$$;


-- ──────────────────────────────────────────────────────────────────────
-- authenticated — staff PostgREST role (NOLOGIN; reached via SET ROLE)
-- ──────────────────────────────────────────────────────────────────────
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin;
  end if;
end$$;


-- ──────────────────────────────────────────────────────────────────────
-- authenticator — PostgREST runtime role (LOGIN, NOINHERIT)
-- ──────────────────────────────────────────────────────────────────────
-- NOINHERIT is required so that SET ROLE is the only way to acquire the
-- application role's privileges — direct INHERIT would leak grants.
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'authenticator') then
    create role authenticator with login noinherit;
    -- LOGIN credential assigned out-of-band; referenced by PostgREST db-uri secret
  end if;
end$$;

-- Permit authenticator to SET ROLE to either application role. Idempotent.
grant anon          to authenticator;
grant authenticated to authenticator;
