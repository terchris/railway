-- 02-schemas-and-extensions.sql — Extensions, schemas, ownership, USAGE grants
--
-- Idempotency: IDEMPOTENT. `create extension if not exists` and `create
-- schema if not exists` are both idempotent in Postgres. Safe to re-run.
--
-- Spec sources:
--   - terchris/new/03-data-model.md   "Extensions required: citext"
--   - terchris/new/03-data-model.md   "Schema name: everything lives in a railway Postgres schema"
--   - terchris/new/08-auth.md         "create extension if not exists citext;"
--                                     "create schema auth;"
--
-- Prerequisite: 01-roles.sql must have run first (the schemas are owned by
-- railway_owner, which 01 creates).


-- ──────────────────────────────────────────────────────────────────────
-- Extensions
-- ──────────────────────────────────────────────────────────────────────
-- citext: case-insensitive text, required for auth.users.email (08-auth.md).
-- Lives in the public schema by default; that's fine — it's a type provider,
-- not application surface.
create extension if not exists citext;


-- ──────────────────────────────────────────────────────────────────────
-- Schemas
-- ──────────────────────────────────────────────────────────────────────
-- railway: PostgREST's primary exposed schema (db-schemas = "railway").
--          Holds all editorial / form / registration / log tables.
create schema if not exists railway authorization railway_owner;

-- auth: staff identities. Exists in Postgres but NOT exposed via PostgREST
--       (db-schemas only mentions "railway"). PostgREST never reads
--       auth.* directly; it consumes capability claims from the JWT.
create schema if not exists auth authorization railway_owner;


-- ──────────────────────────────────────────────────────────────────────
-- USAGE grants on the schemas
-- ──────────────────────────────────────────────────────────────────────
-- All three application roles need USAGE on `railway` to reach any
-- table/function in it. RLS + per-object grants decide what they can do.
grant usage on schema railway to anon, authenticated, authenticator;

-- `auth` is not exposed via PostgREST, but Next.js's server-side login
-- code reaches it directly via the railway_owner connection (for password
-- verification, capability lookup, invite/reset flows). Other roles do not
-- get USAGE on `auth` — keeps the public surface narrow.
-- (railway_owner already has USAGE as schema owner.)
