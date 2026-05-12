-- 03-tables.sql — Enums, tables, indexes, set_updated_at trigger
--
-- Idempotency: NOT IDEMPOTENT for tables/enums (per Railway-Dev Message 2:
-- "for tables, constraints, RLS, functions prefer clarity over silent
-- drift … if a re-run would hide a mistake, fail loud"). Re-running this
-- file against a populated DB will raise 42P07 (duplicate_table) or 42710
-- (duplicate_object) — exactly what we want in dev.
--
-- The set_updated_at() function is CREATE OR REPLACE (functions are safer
-- to overwrite — the body changes, the signature doesn't).
--
-- Spec sources:
--   - terchris/new/03-data-model.md   verbatim — every CREATE TABLE / TYPE / INDEX
--   - terchris/new/08-auth.md         verbatim — auth.users / capabilities / user_capabilities / invites / password_resets, and auth.effective_user_capabilities view
--   - This file: applies set_updated_at trigger to the 11 railway tables
--     that have updated_at columns (interpretation per spec: "attach to
--     every editorial table … repeated for each table with an updated_at column").
--
-- Prerequisites: 01-roles.sql + 02-schemas-and-extensions.sql have run.
-- railway_owner exists and the connecting user can SET ROLE to it.


-- Run as railway_owner so every CREATE here is owned by the right role.
set role railway_owner;

set search_path = railway, public;


-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  RAILWAY SCHEMA — ENUMS                                              ║
-- ╚══════════════════════════════════════════════════════════════════════╝

-- 03-data-model.md "evaluation_questions"
create type railway.evaluation_question_type as enum ('select', 'text');

-- 03-data-model.md "app_log"
create type railway.app_log_type as enum ('INFO', 'WARNING', 'ERROR', 'REGISTRATION');


-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  RAILWAY SCHEMA — EDITORIAL TABLES                                   ║
-- ╚══════════════════════════════════════════════════════════════════════╝

-- ──────────────────────────────────────────────────────────────────────
-- text_content (singleton; 03-data-model.md verbatim)
-- ──────────────────────────────────────────────────────────────────────
create table railway.text_content (
  id              boolean primary key default true check (id),  -- forces single row
  content_page_title                              text not null default '',
  content_submitted_page_title                    text not null default '',
  content_intro_title                             text not null default '',
  content_intro_text                              text not null default '',
  content_activities_title                        text not null default '',
  content_activities_text                         text not null default '',
  content_activity_categories_text                text not null default '',
  content_activities_footnote                     text not null default '',
  content_no_selected_activity_title              text not null default '',
  content_no_selected_activity_text               text not null default '',
  content_about_you_title                         text not null default '',
  content_about_you_text                          text not null default '',
  content_contact_information_title               text not null default '',
  content_contact_information_text                text not null default '',
  content_language_title                          text not null default '',
  content_language_text                           text not null default '',
  content_membership_title                        text not null default '',
  content_membership_text                         text not null default '',
  content_confirmation_title                      text not null default '',
  content_confirmation_text                       text not null default '',
  content_no_selected_activity_confirmation_title text not null default '',
  content_no_selected_activity_confirmation_text  text not null default '',
  content_selected_activities_confirmation_title  text not null default '',
  content_selected_activities_confirmation_text   text not null default '',
  content_comment_title                           text not null default '',
  content_comment_text                            text not null default '',
  content_evaluation_title                        text not null default '',
  content_evaluation_text                         text not null default '',
  content_consent_title                           text not null default '',
  content_consent_text                            text not null default '',
  content_submitted_title                         text not null default '',
  content_submitted_text                          text not null default '',
  content_become_member_title                     text not null default '',
  content_become_member_text                      text not null default '',
  content_become_member_footnote                  text not null default '',
  updated_at      timestamptz not null default now()
);

-- ──────────────────────────────────────────────────────────────────────
-- activity_settings (singleton; 03-data-model.md verbatim)
-- ──────────────────────────────────────────────────────────────────────
create table railway.activity_settings (
  id boolean primary key default true check (id),
  activity_selection_limit int not null default 0,
  updated_at timestamptz not null default now()
);

-- ──────────────────────────────────────────────────────────────────────
-- activity_categories (03-data-model.md verbatim)
-- ──────────────────────────────────────────────────────────────────────
create table railway.activity_categories (
  id            bigint generated always as identity primary key,
  name          text not null,
  sort_order    int  not null default 0,
  is_additional boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index on railway.activity_categories (sort_order);

-- ──────────────────────────────────────────────────────────────────────
-- activities (03-data-model.md verbatim)
-- ──────────────────────────────────────────────────────────────────────
create table railway.activities (
  id                bigint generated always as identity primary key,
  category_id       bigint not null references railway.activity_categories(id)
                      on delete cascade,
  name              text not null,
  info              text not null default '',
  internal_info     text not null default '',
  needs_volunteers  boolean not null default true,
  has_speaking_time boolean not null default false,
  has_film_clip     boolean not null default false,
  is_enabled        boolean not null default true,
  sort_order        int not null default 0,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index on railway.activities (category_id, sort_order);
create index on railway.activities (needs_volunteers) where needs_volunteers;

-- ──────────────────────────────────────────────────────────────────────
-- user_languages (03-data-model.md verbatim)
-- ──────────────────────────────────────────────────────────────────────
create table railway.user_languages (
  id           bigint generated always as identity primary key,
  name         text not null,
  place_at_top boolean not null default false,
  is_enabled   boolean not null default true,
  sort_order   int not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ──────────────────────────────────────────────────────────────────────
-- membership_statuses (03-data-model.md verbatim)
-- ──────────────────────────────────────────────────────────────────────
create table railway.membership_statuses (
  id                      bigint generated always as identity primary key,
  label                   text not null,
  show_membership_options boolean not null default false,
  sort_order              int not null default 0,
  is_enabled              boolean not null default true,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

-- ──────────────────────────────────────────────────────────────────────
-- membership_options (03-data-model.md verbatim)
-- ──────────────────────────────────────────────────────────────────────
create table railway.membership_options (
  id            bigint generated always as identity primary key,
  name          text not null,
  link          text not null,
  info          text not null default '',
  is_vipps_link boolean not null default false,
  sort_order    int not null default 0,
  is_enabled    boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ──────────────────────────────────────────────────────────────────────
-- no_selected_activity_options (03-data-model.md verbatim)
-- ──────────────────────────────────────────────────────────────────────
create table railway.no_selected_activity_options (
  id                bigint generated always as identity primary key,
  label             text not null,
  has_input_field   boolean not null default false,
  input_field_label text not null default '',
  input_field_info  text not null default '',
  sort_order        int not null default 0,
  is_enabled        boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- ──────────────────────────────────────────────────────────────────────
-- evaluation_questions (03-data-model.md verbatim)
-- ──────────────────────────────────────────────────────────────────────
create table railway.evaluation_questions (
  id            bigint generated always as identity primary key,
  label         text not null,
  question_type railway.evaluation_question_type not null,
  sort_order    int not null default 0,
  is_enabled    boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ──────────────────────────────────────────────────────────────────────
-- evaluation_options (03-data-model.md verbatim)
-- ──────────────────────────────────────────────────────────────────────
create table railway.evaluation_options (
  id         bigint generated always as identity primary key,
  label      text not null,
  value      text not null,
  sort_order int not null default 0,
  is_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  RAILWAY SCHEMA — SUBMISSION TABLES                                  ║
-- ╚══════════════════════════════════════════════════════════════════════╝

-- ──────────────────────────────────────────────────────────────────────
-- registrations (03-data-model.md verbatim)
-- ──────────────────────────────────────────────────────────────────────
create table railway.registrations (
  id                   bigint generated always as identity primary key,
  is_confirmed         boolean not null default false,
  name                 text not null,
  email                text not null,
  phone                text not null,
  membership_status_id bigint not null
                        references railway.membership_statuses(id)
                        on delete restrict,
  comment              text not null default '',
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
create index on railway.registrations (created_at desc);
create index on railway.registrations (is_confirmed);

-- ──────────────────────────────────────────────────────────────────────
-- registration_activities (join; 03-data-model.md verbatim)
-- ──────────────────────────────────────────────────────────────────────
create table railway.registration_activities (
  registration_id bigint not null
    references railway.registrations(id) on delete cascade,
  activity_id     bigint not null
    references railway.activities(id) on delete restrict,
  sort_order      int not null default 0,
  primary key (registration_id, activity_id)
);

-- ──────────────────────────────────────────────────────────────────────
-- registration_languages (join; 03-data-model.md verbatim)
-- ──────────────────────────────────────────────────────────────────────
create table railway.registration_languages (
  registration_id bigint not null
    references railway.registrations(id) on delete cascade,
  language_id     bigint not null
    references railway.user_languages(id) on delete restrict,
  sort_order      int not null default 0,
  primary key (registration_id, language_id)
);

-- ──────────────────────────────────────────────────────────────────────
-- no_selected_activity_answers (03-data-model.md verbatim)
-- ──────────────────────────────────────────────────────────────────────
create table railway.no_selected_activity_answers (
  id              bigint generated always as identity primary key,
  registration_id bigint not null unique
    references railway.registrations(id) on delete cascade,
  option_id       bigint not null
    references railway.no_selected_activity_options(id) on delete restrict,
  input_value     text not null default '',
  created_at      timestamptz not null default now()
);

-- ──────────────────────────────────────────────────────────────────────
-- evaluation_answers (03-data-model.md verbatim)
-- ──────────────────────────────────────────────────────────────────────
create table railway.evaluation_answers (
  id              bigint generated always as identity primary key,
  registration_id bigint not null
    references railway.registrations(id) on delete cascade,
  question_id     bigint not null
    references railway.evaluation_questions(id) on delete restrict,
  option_id       bigint
    references railway.evaluation_options(id) on delete restrict,
  input_value     text not null default '',
  created_at      timestamptz not null default now(),
  constraint evaluation_answer_has_value check (
    (option_id is not null and input_value = '')
    or
    (option_id is null and input_value <> '')
  ),
  constraint evaluation_answer_one_per_question
    unique (registration_id, question_id)
);
create index on railway.evaluation_answers (registration_id);


-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  RAILWAY SCHEMA — OPERATIONAL TABLES                                 ║
-- ╚══════════════════════════════════════════════════════════════════════╝

-- ──────────────────────────────────────────────────────────────────────
-- app_log (03-data-model.md verbatim)
-- ──────────────────────────────────────────────────────────────────────
create table railway.app_log (
  id         bigint generated always as identity primary key,
  type       railway.app_log_type not null,
  category   text not null,
  alert      boolean not null default false,
  message    text not null,
  created_at timestamptz not null default now()
);
create index on railway.app_log (alert) where alert;
create index on railway.app_log (created_at desc);


-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  AUTH SCHEMA — STAFF IDENTITIES                                      ║
-- ╚══════════════════════════════════════════════════════════════════════╝
-- All blocks verbatim from terchris/new/08-auth.md.

-- ──────────────────────────────────────────────────────────────────────
-- auth.users
-- ──────────────────────────────────────────────────────────────────────
create table auth.users (
  id                  bigint generated always as identity primary key,
  email               citext not null unique,
  password_hash       text,                       -- nullable for SSO-only users (08-auth.md)
  display_name        text not null default '',
  is_disabled         boolean not null default false,
  email_verified_at   timestamptz,
  failed_login_count  int not null default 0,
  locked_until        timestamptz,
  last_login_at       timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- ──────────────────────────────────────────────────────────────────────
-- auth.capabilities
-- ──────────────────────────────────────────────────────────────────────
create table auth.capabilities (
  name text primary key
);

-- Seed the capability vocabulary explicitly per Railway-Dev Message 2:
-- "08-auth.md is canonical for the capability vocabulary".
-- This list must match terchris/sample-data/04-auth.sql exactly.
insert into auth.capabilities (name) values
  ('content:read'),
  ('content:write'),
  ('registrations:read'),
  ('registrations:write'),
  ('users:read'),
  ('users:write'),
  ('app_log:read'),
  ('app_log:write'),
  ('admin');

-- ──────────────────────────────────────────────────────────────────────
-- auth.user_capabilities
-- ──────────────────────────────────────────────────────────────────────
create table auth.user_capabilities (
  user_id    bigint not null references auth.users(id) on delete cascade,
  capability text not null references auth.capabilities(name) on update cascade,
  granted_at timestamptz not null default now(),
  granted_by bigint references auth.users(id),
  primary key (user_id, capability)
);

-- ──────────────────────────────────────────────────────────────────────
-- auth.effective_user_capabilities (view; admin implies everything)
-- ──────────────────────────────────────────────────────────────────────
create or replace view auth.effective_user_capabilities as
select uc.user_id, c.name as capability
from auth.user_capabilities uc
cross join auth.capabilities c
where uc.capability = 'admin'
union
select uc.user_id, uc.capability
from auth.user_capabilities uc;

-- ──────────────────────────────────────────────────────────────────────
-- auth.invites (08-auth.md "Staff user administration → Tables")
-- ──────────────────────────────────────────────────────────────────────
create table auth.invites (
  id          bigint generated always as identity primary key,
  user_id     bigint not null references auth.users(id) on delete cascade,
  token_hash  text not null unique,
  expires_at  timestamptz not null,
  consumed_at timestamptz,
  created_at  timestamptz not null default now()
);
create index on auth.invites (user_id) where consumed_at is null;

-- ──────────────────────────────────────────────────────────────────────
-- auth.password_resets
-- ──────────────────────────────────────────────────────────────────────
create table auth.password_resets (
  id          bigint generated always as identity primary key,
  user_id     bigint not null references auth.users(id) on delete cascade,
  token_hash  text not null unique,
  expires_at  timestamptz not null,
  consumed_at timestamptz,
  created_at  timestamptz not null default now()
);
create index on auth.password_resets (user_id) where consumed_at is null;


-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  set_updated_at TRIGGER FUNCTION + TRIGGER APPLICATIONS              ║
-- ╚══════════════════════════════════════════════════════════════════════╝
-- Function body from 03-data-model.md verbatim.
-- Trigger applications: PATTERN-EXTENSION. The spec says "(… repeated for
-- each table with an updated_at column …)". I'm applying the trigger to
-- the 11 tables that have an updated_at column:
--   railway: text_content, activity_settings, activity_categories,
--            activities, user_languages, membership_statuses,
--            membership_options, no_selected_activity_options,
--            evaluation_questions, evaluation_options, registrations
--   auth:    users
-- Tables WITHOUT updated_at (no trigger): registration_activities,
-- registration_languages, no_selected_activity_answers, evaluation_answers,
-- app_log, capabilities, user_capabilities, invites, password_resets.

create or replace function railway.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end$$;

create trigger trg_set_updated_at before update on railway.text_content
  for each row execute function railway.set_updated_at();
create trigger trg_set_updated_at before update on railway.activity_settings
  for each row execute function railway.set_updated_at();
create trigger trg_set_updated_at before update on railway.activity_categories
  for each row execute function railway.set_updated_at();
create trigger trg_set_updated_at before update on railway.activities
  for each row execute function railway.set_updated_at();
create trigger trg_set_updated_at before update on railway.user_languages
  for each row execute function railway.set_updated_at();
create trigger trg_set_updated_at before update on railway.membership_statuses
  for each row execute function railway.set_updated_at();
create trigger trg_set_updated_at before update on railway.membership_options
  for each row execute function railway.set_updated_at();
create trigger trg_set_updated_at before update on railway.no_selected_activity_options
  for each row execute function railway.set_updated_at();
create trigger trg_set_updated_at before update on railway.evaluation_questions
  for each row execute function railway.set_updated_at();
create trigger trg_set_updated_at before update on railway.evaluation_options
  for each row execute function railway.set_updated_at();
create trigger trg_set_updated_at before update on railway.registrations
  for each row execute function railway.set_updated_at();

-- auth.users also has updated_at — apply same trigger. (08-auth.md doesn't
-- spell this out explicitly but the column has the same semantics.)
create trigger trg_set_updated_at before update on auth.users
  for each row execute function railway.set_updated_at();


reset role;
