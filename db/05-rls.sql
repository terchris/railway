-- 05-rls.sql — Row-level security: enable RLS + policies + revokes
--
-- Idempotency: SAFE TO RE-RUN. `drop policy if exists` precedes every
-- `create policy`. `alter table ... enable row level security` is
-- idempotent (no-op if already enabled). Revokes are idempotent.
--
-- Spec sources:
--   - terchris/new/04-postgrest-api.md  "Row-level security" — full pattern for activities + registrations + children + app_log
--   - terchris/new/08-auth.md            "Sample policies on editorial tables" + "Registrations"
--   - terchris/new/04-postgrest-api.md  line 526 verbatim:
--       "Apply the same pattern to text_content, activity_categories,
--        activity_settings, user_languages, membership_statuses,
--        membership_options, no_selected_activity_options,
--        evaluation_questions, evaluation_options."
--
-- Pattern-extension notes (called out for review):
--
--   1. Singletons text_content, activity_settings, and activity_categories
--      do NOT have an is_enabled column (verified in 03-data-model.md).
--      For these three, the anon SELECT policy uses `using (true)` instead
--      of `using (is_enabled)` — anon can read every row (there is only
--      one row in each singleton; all rows in activity_categories are
--      categories the form needs to render). The PostgREST spec's GET
--      example for activity_categories has no `is_enabled=eq.true` filter,
--      consistent with this.
--
--   2. All other editorial tables follow the 3-policy template verbatim
--      from 08-auth.md "Sample policies on editorial tables".
--
--   3. Registration child tables (registration_activities,
--      registration_languages, no_selected_activity_answers,
--      evaluation_answers) follow the same pattern as registrations: read
--      gated by registrations:read, no anon access. The spec gives a
--      single example (registration_activities) with a comment
--      "(repeated for the other three child tables)" — I repeat them
--      explicitly. UPDATE/DELETE on children: only via cascade or via the
--      parent registration's policy chain. Children get only a SELECT
--      policy; mutations happen through the SECURITY DEFINER submit RPC
--      or through cascade-delete from the parent.
--
-- Prerequisites: 01–04 have run. All tables exist; has_capability() exists.


set role railway_owner;

set search_path = railway, public;


-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  EDITORIAL TABLES — 3-policy template (anon read, auth read, auth write) ║
-- ╚══════════════════════════════════════════════════════════════════════╝

-- ──────────────────────────────────────────────────────────────────────
-- text_content (singleton — no is_enabled)
-- ──────────────────────────────────────────────────────────────────────
alter table railway.text_content enable row level security;

drop policy if exists text_content_anon_read  on railway.text_content;
drop policy if exists text_content_auth_read  on railway.text_content;
drop policy if exists text_content_auth_write on railway.text_content;

create policy text_content_anon_read on railway.text_content
  for select to anon
  using (true);
create policy text_content_auth_read on railway.text_content
  for select to authenticated
  using (railway.has_capability('content:read'));
create policy text_content_auth_write on railway.text_content
  for all to authenticated
  using      (railway.has_capability('content:write'))
  with check (railway.has_capability('content:write'));


-- ──────────────────────────────────────────────────────────────────────
-- activity_settings (singleton — no is_enabled)
-- ──────────────────────────────────────────────────────────────────────
alter table railway.activity_settings enable row level security;

drop policy if exists activity_settings_anon_read  on railway.activity_settings;
drop policy if exists activity_settings_auth_read  on railway.activity_settings;
drop policy if exists activity_settings_auth_write on railway.activity_settings;

create policy activity_settings_anon_read on railway.activity_settings
  for select to anon
  using (true);
create policy activity_settings_auth_read on railway.activity_settings
  for select to authenticated
  using (railway.has_capability('content:read'));
create policy activity_settings_auth_write on railway.activity_settings
  for all to authenticated
  using      (railway.has_capability('content:write'))
  with check (railway.has_capability('content:write'));


-- ──────────────────────────────────────────────────────────────────────
-- activity_categories (no is_enabled column; anon sees all)
-- ──────────────────────────────────────────────────────────────────────
alter table railway.activity_categories enable row level security;

drop policy if exists activity_categories_anon_read  on railway.activity_categories;
drop policy if exists activity_categories_auth_read  on railway.activity_categories;
drop policy if exists activity_categories_auth_write on railway.activity_categories;

create policy activity_categories_anon_read on railway.activity_categories
  for select to anon
  using (true);
create policy activity_categories_auth_read on railway.activity_categories
  for select to authenticated
  using (railway.has_capability('content:read'));
create policy activity_categories_auth_write on railway.activity_categories
  for all to authenticated
  using      (railway.has_capability('content:write'))
  with check (railway.has_capability('content:write'));


-- ──────────────────────────────────────────────────────────────────────
-- activities (08-auth.md verbatim canonical example)
-- ──────────────────────────────────────────────────────────────────────
alter table railway.activities enable row level security;

drop policy if exists activities_anon_read  on railway.activities;
drop policy if exists activities_auth_read  on railway.activities;
drop policy if exists activities_auth_write on railway.activities;

create policy activities_anon_read on railway.activities
  for select to anon
  using (is_enabled);
create policy activities_auth_read on railway.activities
  for select to authenticated
  using (railway.has_capability('content:read'));
create policy activities_auth_write on railway.activities
  for all to authenticated
  using      (railway.has_capability('content:write'))
  with check (railway.has_capability('content:write'));


-- ──────────────────────────────────────────────────────────────────────
-- user_languages (has is_enabled)
-- ──────────────────────────────────────────────────────────────────────
alter table railway.user_languages enable row level security;

drop policy if exists user_languages_anon_read  on railway.user_languages;
drop policy if exists user_languages_auth_read  on railway.user_languages;
drop policy if exists user_languages_auth_write on railway.user_languages;

create policy user_languages_anon_read on railway.user_languages
  for select to anon
  using (is_enabled);
create policy user_languages_auth_read on railway.user_languages
  for select to authenticated
  using (railway.has_capability('content:read'));
create policy user_languages_auth_write on railway.user_languages
  for all to authenticated
  using      (railway.has_capability('content:write'))
  with check (railway.has_capability('content:write'));


-- ──────────────────────────────────────────────────────────────────────
-- membership_statuses (has is_enabled)
-- ──────────────────────────────────────────────────────────────────────
alter table railway.membership_statuses enable row level security;

drop policy if exists membership_statuses_anon_read  on railway.membership_statuses;
drop policy if exists membership_statuses_auth_read  on railway.membership_statuses;
drop policy if exists membership_statuses_auth_write on railway.membership_statuses;

create policy membership_statuses_anon_read on railway.membership_statuses
  for select to anon
  using (is_enabled);
create policy membership_statuses_auth_read on railway.membership_statuses
  for select to authenticated
  using (railway.has_capability('content:read'));
create policy membership_statuses_auth_write on railway.membership_statuses
  for all to authenticated
  using      (railway.has_capability('content:write'))
  with check (railway.has_capability('content:write'));


-- ──────────────────────────────────────────────────────────────────────
-- membership_options (has is_enabled)
-- ──────────────────────────────────────────────────────────────────────
alter table railway.membership_options enable row level security;

drop policy if exists membership_options_anon_read  on railway.membership_options;
drop policy if exists membership_options_auth_read  on railway.membership_options;
drop policy if exists membership_options_auth_write on railway.membership_options;

create policy membership_options_anon_read on railway.membership_options
  for select to anon
  using (is_enabled);
create policy membership_options_auth_read on railway.membership_options
  for select to authenticated
  using (railway.has_capability('content:read'));
create policy membership_options_auth_write on railway.membership_options
  for all to authenticated
  using      (railway.has_capability('content:write'))
  with check (railway.has_capability('content:write'));


-- ──────────────────────────────────────────────────────────────────────
-- no_selected_activity_options (has is_enabled)
-- ──────────────────────────────────────────────────────────────────────
alter table railway.no_selected_activity_options enable row level security;

drop policy if exists no_selected_activity_options_anon_read  on railway.no_selected_activity_options;
drop policy if exists no_selected_activity_options_auth_read  on railway.no_selected_activity_options;
drop policy if exists no_selected_activity_options_auth_write on railway.no_selected_activity_options;

create policy no_selected_activity_options_anon_read on railway.no_selected_activity_options
  for select to anon
  using (is_enabled);
create policy no_selected_activity_options_auth_read on railway.no_selected_activity_options
  for select to authenticated
  using (railway.has_capability('content:read'));
create policy no_selected_activity_options_auth_write on railway.no_selected_activity_options
  for all to authenticated
  using      (railway.has_capability('content:write'))
  with check (railway.has_capability('content:write'));


-- ──────────────────────────────────────────────────────────────────────
-- evaluation_questions (has is_enabled)
-- ──────────────────────────────────────────────────────────────────────
alter table railway.evaluation_questions enable row level security;

drop policy if exists evaluation_questions_anon_read  on railway.evaluation_questions;
drop policy if exists evaluation_questions_auth_read  on railway.evaluation_questions;
drop policy if exists evaluation_questions_auth_write on railway.evaluation_questions;

create policy evaluation_questions_anon_read on railway.evaluation_questions
  for select to anon
  using (is_enabled);
create policy evaluation_questions_auth_read on railway.evaluation_questions
  for select to authenticated
  using (railway.has_capability('content:read'));
create policy evaluation_questions_auth_write on railway.evaluation_questions
  for all to authenticated
  using      (railway.has_capability('content:write'))
  with check (railway.has_capability('content:write'));


-- ──────────────────────────────────────────────────────────────────────
-- evaluation_options (has is_enabled)
-- ──────────────────────────────────────────────────────────────────────
alter table railway.evaluation_options enable row level security;

drop policy if exists evaluation_options_anon_read  on railway.evaluation_options;
drop policy if exists evaluation_options_auth_read  on railway.evaluation_options;
drop policy if exists evaluation_options_auth_write on railway.evaluation_options;

create policy evaluation_options_anon_read on railway.evaluation_options
  for select to anon
  using (is_enabled);
create policy evaluation_options_auth_read on railway.evaluation_options
  for select to authenticated
  using (railway.has_capability('content:read'));
create policy evaluation_options_auth_write on railway.evaluation_options
  for all to authenticated
  using      (railway.has_capability('content:write'))
  with check (railway.has_capability('content:write'));


-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  REGISTRATIONS + CHILDREN — registrations:read / :write              ║
-- ╚══════════════════════════════════════════════════════════════════════╝
-- 04-postgrest-api.md / 08-auth.md verbatim for registrations.
-- Children: pattern-extension per the spec's "(repeated for the other
-- three child tables)" comment.

-- ──────────────────────────────────────────────────────────────────────
-- registrations (verbatim from spec)
-- ──────────────────────────────────────────────────────────────────────
alter table railway.registrations enable row level security;

drop policy if exists registrations_auth_read   on railway.registrations;
drop policy if exists registrations_auth_write  on railway.registrations;
drop policy if exists registrations_auth_delete on railway.registrations;

create policy registrations_auth_read on railway.registrations
  for select to authenticated
  using (railway.has_capability('registrations:read'));

create policy registrations_auth_write on railway.registrations
  for update to authenticated
  using      (railway.has_capability('registrations:write'))
  with check (railway.has_capability('registrations:write'));

create policy registrations_auth_delete on railway.registrations
  for delete to authenticated
  using (railway.has_capability('registrations:write'));

-- No INSERT policy: the only insert path is submit_registration().
revoke insert on railway.registrations from authenticated;
revoke all    on railway.registrations from anon;


-- ──────────────────────────────────────────────────────────────────────
-- registration_activities (read-only for authenticated; revoke from anon)
-- ──────────────────────────────────────────────────────────────────────
alter table railway.registration_activities enable row level security;

drop policy if exists registration_activities_auth_read on railway.registration_activities;

create policy registration_activities_auth_read on railway.registration_activities
  for select to authenticated
  using (railway.has_capability('registrations:read'));

revoke all on railway.registration_activities from anon;


-- ──────────────────────────────────────────────────────────────────────
-- registration_languages
-- ──────────────────────────────────────────────────────────────────────
alter table railway.registration_languages enable row level security;

drop policy if exists registration_languages_auth_read on railway.registration_languages;

create policy registration_languages_auth_read on railway.registration_languages
  for select to authenticated
  using (railway.has_capability('registrations:read'));

revoke all on railway.registration_languages from anon;


-- ──────────────────────────────────────────────────────────────────────
-- no_selected_activity_answers
-- ──────────────────────────────────────────────────────────────────────
alter table railway.no_selected_activity_answers enable row level security;

drop policy if exists no_selected_activity_answers_auth_read on railway.no_selected_activity_answers;

create policy no_selected_activity_answers_auth_read on railway.no_selected_activity_answers
  for select to authenticated
  using (railway.has_capability('registrations:read'));

revoke all on railway.no_selected_activity_answers from anon;


-- ──────────────────────────────────────────────────────────────────────
-- evaluation_answers
-- ──────────────────────────────────────────────────────────────────────
alter table railway.evaluation_answers enable row level security;

drop policy if exists evaluation_answers_auth_read on railway.evaluation_answers;

create policy evaluation_answers_auth_read on railway.evaluation_answers
  for select to authenticated
  using (railway.has_capability('registrations:read'));

revoke all on railway.evaluation_answers from anon;


-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  APP_LOG — app_log:read / :write; anon path via log_event RPC        ║
-- ╚══════════════════════════════════════════════════════════════════════╝
-- 04-postgrest-api.md "App-log:" verbatim.

alter table railway.app_log enable row level security;

drop policy if exists app_log_read  on railway.app_log;
drop policy if exists app_log_write on railway.app_log;

create policy app_log_read on railway.app_log
  for select to authenticated
  using (railway.has_capability('app_log:read'));

create policy app_log_write on railway.app_log
  for update to authenticated
  using      (railway.has_capability('app_log:write'))
  with check (railway.has_capability('app_log:write'));

-- Anon writes go through SECURITY DEFINER log_event(), never direct.
revoke all on railway.app_log from anon;


-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  TABLE-LEVEL GRANTS (sit alongside RLS — required for PostgREST)     ║
-- ╚══════════════════════════════════════════════════════════════════════╝
-- RLS gates which ROWS a role can see/touch; grants gate whether the role
-- can attempt the operation at all. Both layers matter.
--
-- Pattern-extension: the specs don't enumerate per-table grants explicitly,
-- so I derive them from the RLS policies + the PostgREST API spec.

-- anon: SELECT on editorial / reference tables (RLS filters to is_enabled
-- where applicable; the singletons + activity_categories use using(true)).
grant select on
  railway.text_content,
  railway.activity_settings,
  railway.activity_categories,
  railway.activities,
  railway.user_languages,
  railway.membership_statuses,
  railway.membership_options,
  railway.no_selected_activity_options,
  railway.evaluation_questions,
  railway.evaluation_options
to anon;

-- authenticated: broad CRUD on the editorial schema; RLS decides what
-- a given JWT actually does. INSERT on activity_settings is meaningless
-- (singleton), but PostgREST won't expose it as POST anyway.
grant select, insert, update, delete on
  railway.text_content,
  railway.activity_settings,
  railway.activity_categories,
  railway.activities,
  railway.user_languages,
  railway.membership_statuses,
  railway.membership_options,
  railway.no_selected_activity_options,
  railway.evaluation_questions,
  railway.evaluation_options
to authenticated;

-- authenticated: registrations + children — registrations:read/:write
-- decides what they actually do per row via RLS. INSERT on registrations
-- is revoked above (only submit_registration() inserts).
grant select, update, delete on railway.registrations              to authenticated;
grant select                  on railway.registration_activities    to authenticated;
grant select                  on railway.registration_languages     to authenticated;
grant select                  on railway.no_selected_activity_answers to authenticated;
grant select                  on railway.evaluation_answers          to authenticated;

-- authenticated: app_log — read with app_log:read, update (clear alerts)
-- with app_log:write.
grant select, update on railway.app_log to authenticated;

-- Sequence usage for INSERTs that authenticated performs on editorial
-- tables (Postgres needs USAGE on the implicit identity sequences).
grant usage, select on all sequences in schema railway to authenticated;


reset role;
