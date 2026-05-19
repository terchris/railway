# Investigate: `app_log_alert_count` RPC denies EXECUTE for `authenticated`

> **IMPLEMENTATION RULES:** Before implementing this plan, read and follow:
> - [WORKFLOW.md](../../WORKFLOW.md) - The implementation process
> - [PLANS.md](../../PLANS.md) - Plan structure and best practices

## Status: Backlog

**Goal**: Decide whether the admin dashboard's Oversikt should be calling `railway.app_log_alert_count()` at all, and — if yes — whether the DDL should grant EXECUTE to `authenticated`, or whether the admin should call a different RPC/view. Discovered by [Tailway Cowork in `talk.md` Message 2](../talk/talk.md), Surprise S1.

**Last Updated**: 2026-05-19

---

## Background

Browser testing of the dummy login picker ([`PLAN-dummy-login.md`](../completed/PLAN-dummy-login.md)) surfaced an unrelated regression on the admin Oversikt page: a card labelled "App‑log · åpne varsler" renders the raw PostgREST error

```
permission denied for function app_log_alert_count
```

for **every** role tested (Full admin, Registrations admin, Content editor, App-log viewer, Users admin, post-manual-paste, post-auto-bootstrap). Even the 9-cap `admin` profile hits it.

This isn't a picker bug — the picker mints valid HS256 JWTs and PostgREST accepts them. The mismatch is between the dashboard's call site and the function's grants.

## Reproduction

```bash
JWT=$(grep -E "^POSTGREST_STAFF_JWT_UIS=" /Users/terje.christensen/learn/helpers/railway/.env | cut -d= -f2-)
curl -sS -X POST "http://api-railway.localhost/rpc/app_log_alert_count" \
  -H "Authorization: Bearer $JWT" \
  -H "Accept-Profile: railway" \
  -H "Content-Type: application/json" \
  -d '{}'
# HTTP 403
# {"code":"42501","details":null,"hint":null,"message":"permission denied for function app_log_alert_count"}
```

Same result with `POSTGREST_ADMIN_JWT` (the 6-cap locally-minted token). PostgREST verifies the JWT, `SET ROLE authenticated` succeeds, then the function call fails because `authenticated` has no EXECUTE on it.

## Root cause

`db/04-rpcs-and-views.sql` lines 290-306:

```sql
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
```

The function was designed as an **anonymous health check** — the spec (`terchris/new/04-postgrest-api.md`) describes it that way. Only `anon` has EXECUTE. The function is `SECURITY DEFINER`, so once invoked it reads `app_log` as the owner (`railway_owner`) and bypasses RLS for the count — which is exactly what an anonymous health endpoint needs.

The admin Oversikt page calls this same RPC to surface the alert count on the dashboard, but it does so under a staff JWT (`role: authenticated`). `authenticated` lacks EXECUTE → 42501.

## Open questions

1. **Is the admin dashboard supposed to call `app_log_alert_count`?** The function name says "health check" not "admin metric." It might be that the dashboard was wired to a convenient existing RPC rather than a purpose-built one.
2. **If yes, should `authenticated` get EXECUTE?** Or just `authenticated` users who hold `app_log:read`? PostgREST/RLS can't cap-gate EXECUTE on a `SECURITY DEFINER` function directly — the gate would have to live inside the function body (e.g., `if not has_capability('app_log:read') then return null; end if;`).
3. **Anon should still work.** Whatever the fix, don't break the public health-check use case.

## Options

### Option A — Grant EXECUTE to `authenticated` (broad)

Add `grant execute on function railway.app_log_alert_count() to authenticated;` to `04-rpcs-and-views.sql`. Re-apply via UIS.

**Pros**: smallest diff; admin sees the count.
**Cons**: every `authenticated` JWT can read the count, even one without `app_log:read`. Probably fine for a single integer, but worth flagging.

### Option B — Capability-gate inside the function body

Keep grants narrow but check `has_capability('app_log:read')` inside the body:

```sql
create or replace function railway.app_log_alert_count()
returns int
language plpgsql
stable
security definer
set search_path = railway, pg_temp
as $$
begin
  -- anon: always allowed (public health check)
  -- authenticated: must hold app_log:read
  if current_setting('request.jwt.claims', true) is not null
     and current_setting('request.jwt.claims', true)::jsonb ->> 'role' = 'authenticated'
     and not railway.has_capability('app_log:read')
  then
    return 0;
  end if;
  return (select count(*)::int from railway.app_log where alert);
end;
$$;
grant execute on function railway.app_log_alert_count() to anon, authenticated;
```

**Pros**: capability gate honoured for staff sessions; anon path unchanged.
**Cons**: more code; mixes capability logic into what was a one-liner; non-`app_log:read` admins see `0` (same UX problem as Tailway's S2 surprise).

### Option C — New admin-only RPC `app_log_alert_count_admin`

Leave the public one alone. Add a parallel RPC granted only to `authenticated` (or gated on `app_log:read` inside). Repoint the dashboard call site.

**Pros**: cleanest separation; the public health-check contract is preserved verbatim.
**Cons**: two RPCs doing the same query; one more thing to keep in sync.

### Option D — Stop calling it from the admin dashboard

If the admin doesn't need this exact metric, drop the card or replace it with a different read (e.g., `select count(*) from railway.app_log where alert` directly, gated by RLS on `app_log` — assuming the policy lets `app_log:read` see alert rows).

**Pros**: zero DDL change; the picker's empty-cap-set roles stop seeing the error.
**Cons**: loses the dashboard metric, or shifts the work to a different RLS-gated read.

## Recommendation

Without knowing the product intent for the Oversikt card, I lean **Option A + Tailway's S2 suggestion**: grant EXECUTE to `authenticated`, and render the card with a friendly empty/unauthorized state for roles that don't hold `app_log:read`. That gives admin/registrations/users sessions a useful metric while keeping the public health-check path identical.

But this is a small DDL change that UIS needs to apply, and it touches the `auth.capabilities` model. Worth a brief consult with whoever wrote `04-postgrest-api.md`'s "Health check" section before changing the contract.

---

## Next Steps

- [ ] Decide between Options A / B / C / D with whoever owns the data model (probably Terje per `terchris/new/`).
- [ ] If Option A: update `db/04-rpcs-and-views.sql`, hand to UIS, re-verify with `curl` and a browser click on `/admin`.
- [ ] If Options B-D: write a PLAN with the specific changes (DDL, Next.js call sites, dashboard UX).
- [ ] Separately, address Tailway's S2 (silent "0" for missing-cap roles) — likely a dashboard-side change regardless of which RPC option lands.

---

## References

- `db/04-rpcs-and-views.sql:290-306` — function definition + grants
- `terchris/new/04-postgrest-api.md` — "Health check" section (canonical spec)
- [`talk.md` Message 2](../talk/talk.md) — Tailway's browser-test report (S1 + S2)
- [`PLAN-dummy-login.md`](../completed/PLAN-dummy-login.md) — feature plan that surfaced the regression during testing