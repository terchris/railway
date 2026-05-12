-- 04-rpcs-and-views.sql — RPCs, views, grants
--
-- Idempotency: PARTIAL. Functions use CREATE OR REPLACE (safe to re-run;
-- preserves dependent objects). Views use CREATE OR REPLACE for the same
-- reason. GRANT / REVOKE statements are idempotent in Postgres.
--
-- Spec sources:
--   - terchris/new/08-auth.md            "How RLS reads capabilities" — railway.has_capability(text)
--   - terchris/new/04-postgrest-api.md   "Reads (RSC fetches…)" — railway.public_form_payload view
--   - terchris/new/04-postgrest-api.md   "Writes (anon) → The function" — railway.submit_registration(jsonb)
--   - terchris/new/04-postgrest-api.md   "Health check" — railway.app_log_alert_count()
--   - terchris/new/06-public-form.md     "log_event" call-site context
--   - Railway-Dev Message 1 (talk/talk.md)  full SQL for railway.log_event signature
--
-- Prerequisites: 01–03 have run; tables and enums exist; railway_owner owns them.


-- All CREATE statements run as railway_owner so functions/views are
-- owned by the right role (relevant for SECURITY DEFINER and security_invoker semantics).
set role railway_owner;

set search_path = railway, public;


-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  has_capability(text) — RLS helper                                   ║
-- ╚══════════════════════════════════════════════════════════════════════╝
-- 08-auth.md "How RLS reads capabilities" verbatim. Reads the JWT
-- capabilities claim PostgREST puts into request.jwt.claims.
-- The trailing `, true` argument to current_setting makes it return NULL
-- (instead of erroring) when no JWT is present — anon paths are safe.

create or replace function railway.has_capability(cap text)
returns boolean
language sql
stable
as $$
  select coalesce(
    (
      current_setting('request.jwt.claims', true)::jsonb -> 'capabilities'
    ) ? cap,
    false
  );
$$;

-- has_capability is called from RLS USING/CHECK clauses on every table.
-- Both application roles need EXECUTE.
revoke all on function railway.has_capability(text) from public;
grant execute on function railway.has_capability(text) to anon, authenticated;


-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  public_form_payload — bundle for RSC reads                          ║
-- ╚══════════════════════════════════════════════════════════════════════╝
-- 04-postgrest-api.md "Reads (RSC fetches…)" verbatim.
-- The view returns a single jsonb column "payload" containing every list
-- the public form needs, with is_enabled filters applied per table.
-- (activity_categories has no is_enabled column — included unfiltered.)
-- Default Postgres view security: runs as the view OWNER (railway_owner),
-- so it bypasses anon's RLS on the underlying tables. That's intentional —
-- the view is the controlled read interface for anon; the WHERE is_enabled
-- clauses inside it are what stop anon seeing disabled rows.

create or replace view railway.public_form_payload as
select jsonb_build_object(
  'text_content',                 (select to_jsonb(t) from railway.text_content t),
  'activity_settings',            (select to_jsonb(s) from railway.activity_settings s),
  'activity_categories',          (select coalesce(jsonb_agg(to_jsonb(c) order by c.sort_order), '[]'::jsonb)
                                    from railway.activity_categories c),
  'activities',                   (select coalesce(jsonb_agg(to_jsonb(a) order by a.sort_order), '[]'::jsonb)
                                    from railway.activities a where a.is_enabled),
  'user_languages',               (select coalesce(jsonb_agg(to_jsonb(l) order by l.name), '[]'::jsonb)
                                    from railway.user_languages l where l.is_enabled),
  'membership_statuses',          (select coalesce(jsonb_agg(to_jsonb(m) order by m.sort_order), '[]'::jsonb)
                                    from railway.membership_statuses m where m.is_enabled),
  'no_selected_activity_options', (select coalesce(jsonb_agg(to_jsonb(o) order by o.sort_order), '[]'::jsonb)
                                    from railway.no_selected_activity_options o where o.is_enabled),
  'evaluation_questions',         (select coalesce(jsonb_agg(to_jsonb(q) order by q.sort_order), '[]'::jsonb)
                                    from railway.evaluation_questions q where q.is_enabled),
  'evaluation_options',           (select coalesce(jsonb_agg(to_jsonb(o) order by o.sort_order), '[]'::jsonb)
                                    from railway.evaluation_options o where o.is_enabled)
) as payload;

grant select on railway.public_form_payload to anon;


-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  submit_registration(jsonb) — the only anon write path               ║
-- ╚══════════════════════════════════════════════════════════════════════╝
-- 04-postgrest-api.md "## The function" verbatim. SECURITY DEFINER so the
-- function (running as railway_owner) can insert into railway.registrations
-- and its children even though anon has no direct INSERT grant. The pinned
-- search_path stops a malicious schema in the role's path from shadowing
-- railway tables.

create or replace function railway.submit_registration(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = railway, pg_temp
as $$
declare
  v_registration_id  bigint;
  v_membership       railway.membership_statuses;
  v_show_member      boolean;
  v_limit            int;
  v_primary          bigint[];
  v_additional       bigint[];
  v_languages        bigint[];
  v_all_activities   bigint[];
  v_no_act_option    bigint;
  v_no_act_input     text;
  v_eval             jsonb;
  v_eval_q           bigint;
  v_eval_opt         bigint;
  v_eval_text        text;
begin
  -- ---------------- 1. Parse arrays ----------------
  v_primary := coalesce(
    (select array_agg(value::bigint)
       from jsonb_array_elements_text(payload->'primary_activity_ids')),
    array[]::bigint[]
  );
  v_additional := coalesce(
    (select array_agg(value::bigint)
       from jsonb_array_elements_text(payload->'additional_activity_ids')),
    array[]::bigint[]
  );
  v_languages := coalesce(
    (select array_agg(value::bigint)
       from jsonb_array_elements_text(payload->'language_ids')),
    array[]::bigint[]
  );

  -- ---------------- 2. Activity limit (primary only; 0 = unlimited) ----------------
  v_limit := coalesce(
    (select activity_selection_limit from railway.activity_settings limit 1),
    0
  );
  if v_limit > 0 and coalesce(array_length(v_primary, 1), 0) > v_limit then
    raise exception 'ACTIVITY_SELECTION_LIMIT_EXCEEDED' using errcode = 'P0001';
  end if;

  -- ---------------- 3. Membership exists and is enabled ----------------
  select * into v_membership
    from railway.membership_statuses
   where id = (payload->>'membership_status_id')::bigint
     and is_enabled;
  if v_membership.id is null then
    raise exception 'INVALID_SUBMIT_DATA' using errcode = 'P0001';
  end if;
  v_show_member := v_membership.show_membership_options;

  -- ---------------- 4. Validate id existence + enabled state ----------------
  if exists (
    select 1 from unnest(v_primary) as t(id)
    where not exists (
      select 1
        from railway.activities a
        join railway.activity_categories c on c.id = a.category_id
       where a.id = t.id and a.is_enabled and not c.is_additional
    )
  ) then
    raise exception 'INVALID_SUBMIT_DATA' using errcode = 'P0001';
  end if;
  if exists (
    select 1 from unnest(v_additional) as t(id)
    where not exists (
      select 1
        from railway.activities a
        join railway.activity_categories c on c.id = a.category_id
       where a.id = t.id and a.is_enabled and c.is_additional
    )
  ) then
    raise exception 'INVALID_SUBMIT_DATA' using errcode = 'P0001';
  end if;
  if exists (
    select 1 from unnest(v_languages) as t(id)
    where not exists (
      select 1 from railway.user_languages l
       where l.id = t.id and l.is_enabled
    )
  ) then
    raise exception 'INVALID_SUBMIT_DATA' using errcode = 'P0001';
  end if;

  v_all_activities := v_primary || v_additional;

  -- ---------------- 5. Mutual exclusion: no_selected_activity_* only when no activities ----------------
  if coalesce(array_length(v_all_activities, 1), 0) > 0 then
    v_no_act_option := null;
    v_no_act_input  := '';
  else
    v_no_act_option := nullif(payload->>'no_selected_activity_option_id', '')::bigint;
    v_no_act_input  := coalesce(payload->>'no_selected_activity_input', '');
    if v_no_act_option is not null then
      perform 1 from railway.no_selected_activity_options
        where id = v_no_act_option and is_enabled;
      if not found then
        raise exception 'INVALID_SUBMIT_DATA' using errcode = 'P0001';
      end if;
    end if;
  end if;

  -- ---------------- 6. Insert parent ----------------
  insert into railway.registrations (
    name, email, phone, membership_status_id, comment
  ) values (
    payload->>'name',
    payload->>'email',
    payload->>'phone',
    v_membership.id,
    coalesce(payload->>'comment', '')
  )
  returning id into v_registration_id;

  -- ---------------- 7. Activities (primary first, then additional, preserving order) ----------------
  if coalesce(array_length(v_all_activities, 1), 0) > 0 then
    insert into railway.registration_activities (registration_id, activity_id, sort_order)
    select v_registration_id, a, ord
      from unnest(v_all_activities) with ordinality as t(a, ord);
  end if;

  -- ---------------- 8. Languages ----------------
  if coalesce(array_length(v_languages, 1), 0) > 0 then
    insert into railway.registration_languages (registration_id, language_id, sort_order)
    select v_registration_id, l, ord
      from unnest(v_languages) with ordinality as t(l, ord);
  end if;

  -- ---------------- 9. Optional "no selected activity" answer ----------------
  if v_no_act_option is not null then
    insert into railway.no_selected_activity_answers (
      registration_id, option_id, input_value
    ) values (v_registration_id, v_no_act_option, v_no_act_input);
  end if;

  -- ---------------- 10. Evaluation answers (skip empty pairs) ----------------
  for v_eval in
    select value from jsonb_array_elements(coalesce(payload->'evaluation_answers', '[]'::jsonb))
  loop
    v_eval_q    := nullif(v_eval->>'question_id', '')::bigint;
    v_eval_opt  := nullif(v_eval->>'option_id', '')::bigint;
    v_eval_text := coalesce(trim(v_eval->>'input_value'), '');

    if v_eval_q is null then
      continue;
    end if;
    if v_eval_opt is null and v_eval_text = '' then
      continue;
    end if;

    perform 1 from railway.evaluation_questions
      where id = v_eval_q and is_enabled;
    if not found then
      raise exception 'INVALID_SUBMIT_DATA' using errcode = 'P0001';
    end if;
    if v_eval_opt is not null then
      perform 1 from railway.evaluation_options
        where id = v_eval_opt and is_enabled;
      if not found then
        raise exception 'INVALID_SUBMIT_DATA' using errcode = 'P0001';
      end if;
    end if;

    insert into railway.evaluation_answers (
      registration_id, question_id, option_id, input_value
    ) values (
      v_registration_id,
      v_eval_q,
      v_eval_opt,
      case when v_eval_opt is null then v_eval_text else '' end
    );
  end loop;

  return jsonb_build_object(
    'registration_id',         v_registration_id,
    'show_membership_options', v_show_member
  );
end$$;

revoke all on function railway.submit_registration(jsonb) from public;
grant  execute on function railway.submit_registration(jsonb) to anon;
-- Owner already correct via `set role railway_owner` above. Explicit alter
-- kept for clarity / parity with the spec snippets:
alter function railway.submit_registration(jsonb) owner to railway_owner;


-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  app_log_alert_count() — anonymous health check                      ║
-- ╚══════════════════════════════════════════════════════════════════════╝
-- 04-postgrest-api.md "Health check" verbatim.

create or replace function railway.app_log_alert_count()
returns int
language sql
stable
security definer
set search_path = railway, pg_temp
as $$
  select count(*)::int from railway.app_log where alert;
$$;

revoke all on function railway.app_log_alert_count() from public;
grant  execute on function railway.app_log_alert_count() to anon;
alter  function railway.app_log_alert_count() owner to railway_owner;


-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  log_event — anon-callable single-row inserter                       ║
-- ╚══════════════════════════════════════════════════════════════════════╝
-- Synthesized per Railway-Dev Message 1's recommendation. The call-site
-- pattern is documented in 06-public-form.md:
--   pg().rpc("log_event", { type, category, alert, message })
-- so the four args mirror app_log's columns 1:1. Used by the public-form
-- honeypot path and any other anon writes that need to land an app_log row.

create or replace function railway.log_event(
  p_type     railway.app_log_type,
  p_category text,
  p_alert    boolean,
  p_message  text
) returns void
language plpgsql
security definer
set search_path = railway, pg_temp
as $$
begin
  insert into railway.app_log (type, category, alert, message)
  values (p_type, p_category, p_alert, p_message);
end;
$$;

revoke all on function railway.log_event(railway.app_log_type, text, boolean, text) from public;
grant  execute on function railway.log_event(railway.app_log_type, text, boolean, text) to anon;
alter  function railway.log_event(railway.app_log_type, text, boolean, text) owner to railway_owner;


reset role;
