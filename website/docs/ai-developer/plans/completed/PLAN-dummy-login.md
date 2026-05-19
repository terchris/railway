# Feature: Dummy login picker — log in as each PostgreSQL/JWT role

> **IMPLEMENTATION RULES:** Before implementing this plan, read and follow:
> - [WORKFLOW.md](../../WORKFLOW.md) - The implementation process
> - [PLANS.md](../../PLANS.md) - Plan structure and best practices

## Status: Backlog

**Goal**: Replace the JWT-paste login on `/admin/login` with a role picker that shows the four PostgreSQL roles documented in [`postgres-roles.md`](../../../contributors/postgres-roles.md) for context and lets the user log in as **anon** or as **authenticated** with any of five capability profiles (Full admin, Registrations admin, Content editor, App-log viewer, Users admin). This is dummy scaffolding for the eventual Okta/Authentik integration; it never replaces an IdP but it lets every contributor exercise the capability gates end-to-end today.

**Last Updated**: 2026-05-19

---

## Overview

[`postgres-roles.md`](../../../contributors/postgres-roles.md) documents four PostgreSQL roles for PostgREST: `railway_owner`, `anon`, `authenticated`, `authenticator`. Only two of those are session-level — `railway_owner` owns DDL and `authenticator` is the PostgREST connection role. PostgREST `SET ROLE`s to `anon` or `authenticated` per request based on the JWT.

Today the only ways to log into `/admin` are:

1. Paste an HS256 staff JWT (verifies against `JWT_SECRET`).
2. Type `ADMIN_PASSWORD` in dev to mint a broad 6-cap "bootstrap" JWT (`mintBootstrapStaffJwt`).
3. Auto-login from `POSTGREST_ADMIN_JWT` / `POSTGREST_STAFF_JWT_UIS` in env (gated by `NODE_ENV === 'development'` or `ADMIN_BOOTSTRAP_SESSION_FROM_ENV=1`).

None of those let you exercise different capability profiles or see what the public-anon experience looks like without rebuilding/restarting.

The dummy login adds a UI in front of `/admin/login` that presents:

- **All four PG roles** as a context table — `railway_owner` and `authenticator` are listed with a short "DDL only" / "PostgREST connection role" note and a disabled button (so the doc and the UI stay aligned).
- **Five session profiles** that mint a real HS256 staff JWT with a specific `capabilities` subset:
  - Full admin → `["admin"]` (treated as all-caps by `staffEffectiveCapabilitySet`)
  - Registrations admin → `["registrations:read","registrations:write"]`
  - Content editor → `["content:read","content:write"]`
  - App-log viewer → `["app_log:read"]`
  - Users admin → `["users:read","users:write"]`
- **anon** → clears the session cookie and redirects to `/`. The public surfaces work with `POSTGREST_ANON_JWT` and don't need a session.

The existing JWT-paste form remains available as a "manual mode" link for power users who want to verify a UIS-issued token by hand.

### Why this design

- **Future migration is concrete**: Okta/Authentik will issue an ID token whose group claims map to a capability set. The server already mints HS256 PostgREST staff JWTs from a known capability list (`mintHs256Jwt`); the dummy picker simulates that exact mapping today. Migration becomes "replace the picker with an IdP redirect and a claims→caps mapper."
- **Capability gates already exist in the UI**: `src/app/admin/(dashboard)/layout.tsx` reads `staffEffectiveCapabilitySet()` and passes it to `AdminSidebarNav`. Once you log in as Registrations admin, the sidebar already hides Content/App-log/Users links. The dummy picker just feeds different inputs into a pipeline that already works.
- **PostgREST stays authoritative**: minted JWTs are real HS256 tokens signed with `JWT_SECRET`. PostgREST verifies them server-side; RLS enforces capability gates at the row level. The picker doesn't bypass anything — it just picks which token gets minted.

### Gating decision

**No env gate.** The page is part of the app surface and ships in every environment, per request. The PLAN includes a doc note flagging this so it's a deliberate choice that gets revisited when Okta/Authentik lands. Risk owner is the maintainer; this PLAN records the choice but doesn't relitigate it.

---

## Phase 1: Role-profile model — DONE

### Tasks

- [x] 1.1 Create `src/lib/dummy-login-roles.ts` exporting:
  - `type RoleKind = "pg-role" | "session-profile"`
  - `type RoleProfile = { id: string; label: string; description: string; kind: RoleKind; sessionRole: "anon" | "authenticated" | null; capabilities: readonly string[] | null; disabled: boolean; disabledReason?: string }`
  - `DUMMY_LOGIN_ROLES: readonly RoleProfile[]` with these entries, in this order:
    1. `railway_owner` (kind=pg-role, disabled, reason "Owns DDL / SECURITY DEFINER functions — not a session role")
    2. `anon` (kind=session-profile, sessionRole='anon', capabilities=null, NOT disabled — clicking clears cookie)
    3. `authenticated_full_admin` (sessionRole='authenticated', capabilities=['admin'])
    4. `authenticated_registrations` (sessionRole='authenticated', capabilities=['registrations:read','registrations:write'])
    5. `authenticated_content` (sessionRole='authenticated', capabilities=['content:read','content:write'])
    6. `authenticated_applog` (sessionRole='authenticated', capabilities=['app_log:read'])
    7. `authenticated_users` (sessionRole='authenticated', capabilities=['users:read','users:write'])
    8. `authenticator` (kind=pg-role, disabled, reason "PostgREST runtime connection role — never appears in a user session")
  - `findRoleProfile(id: string): RoleProfile | undefined` helper.
- [x] 1.2 Capabilities reference `KNOWN_CAPABILITY_GROUPS` from `staff-jwt-caps.ts` so a future cap addition shows up via type/unit checks if needed.

### Validation

User confirms the profile list matches their intent for the picker UI.

---

## Phase 2: Server route to mint + set cookie — DONE

### Tasks

- [x] 2.1 Add `src/app/api/admin/login/dummy/route.ts` exporting `POST`:
  - Body: `{ profileId: string }`. Reject other shapes with 400.
  - Require `JWT_SECRET` from env; 503 with the same Norwegian message shape as `/api/admin/login` if missing.
  - Look up `findRoleProfile(profileId)`. 404 if unknown; 409 if `disabled`.
  - For `sessionRole === 'anon'`: clear `ADMIN_SESSION_COOKIE` (set to empty with `maxAge: 0`); return `{ ok: true, redirect: '/' }`.
  - For `sessionRole === 'authenticated'`: mint HS256 via `mintHs256Jwt(secret, { role: 'authenticated', capabilities, aud: 'railway', exp: now + 7d })`; set cookie via `adminSessionCookieOptsForToken`; return `{ ok: true, redirect: '/admin' }`.
- [x] 2.2 Verify the minted token round-trips through `verifyAdminSessionCookieValue` before setting the cookie (defence in depth — same pattern as the existing login route).
- [x] 2.3 Add minimal request logging (no JWT values in logs). ✓ Deferred — Next dev server already logs the route hit; no JWT material in the response body or logs.

### Validation

```bash
# With dev server on :3010 and JWT_SECRET in .env:
curl -i -X POST http://localhost:3010/api/admin/login/dummy \
  -H "Content-Type: application/json" \
  -d '{"profileId":"authenticated_registrations"}'
```

Expect HTTP 200, a `Set-Cookie: railway_admin_session=…` header, and `{"ok":true,"redirect":"/admin"}`.

---

## Phase 3: Login page UI — DONE

### Tasks

- [x] 3.1 Add `src/components/admin/dummy-login-picker.tsx` — a client component that:
  - Renders a section header "Dummy login (development scaffolding for Okta/Authentik)"
  - Renders one card / button per `DUMMY_LOGIN_ROLES` entry. Disabled entries render as muted cards with the `disabledReason` shown below the label.
  - On click of an enabled entry: POSTs to `/api/admin/login/dummy`, then uses `router.push(redirect)` from the response. (Used Next.js router instead of `window.location.assign` so client-side nav works.)
  - Capability profiles display the cap list as small badges below the label.
- [x] 3.2 Modify `src/app/admin/login/page.tsx` to render `<DummyLoginPicker />` above the existing `<AdminLoginForm />`. The manual JWT-paste form is hidden behind a `?manual=1` link rather than an inline toggle — same effect, simpler markup.
- [ ] 3.3 Deferred — picker references "PostgreSQL roles" in copy but doesn't link to the doc directly. Will revisit in Phase 4 when adding the postgres-roles.md update; cross-link can go either way.
- [x] 3.4 **Changed during implementation** — per user direction, auto-bootstrap is now opt-in via `?auto=1` so the picker is the default surface. CI / smoke tests still use `/api/admin/login` directly (not the page), so this is non-breaking.

### Validation

Manual click-through with `npm run dev`:

1. Visit `http://localhost:3010/admin/login`. The picker is visible with all 7 entries.
2. Click "Full admin" → redirected to `/admin`; sidebar shows all sections.
3. Logout. Click "Registrations admin" → redirected to `/admin`; sidebar shows only Registrations.
4. Logout. Click "anon" → redirected to `/`; revisiting `/admin` returns to the login picker.
5. Click "railway_owner" — disabled, no action.

User confirms each works.

---

## Phase 4: Docs + smoke — DONE

### Tasks

- [x] 4.1 Add a short "Dummy login (development)" subsection at the bottom of [`postgres-roles.md`](../../../contributors/postgres-roles.md) explaining what the picker does and that it's temporary scaffolding for Okta/Authentik.
- [x] 4.2 Add a row to [`project-conventions.md`](../../../contributors/project-conventions.md) under "Code hygiene" (new "Temporary scaffolding" subsection) noting the dummy login is currently always-available and must be replaced with IdP-driven login before production use.
- [x] 4.3 **Added scope (user request):** Write [`testing-dummy-login.md`](../../../contributors/testing-dummy-login.md) — a per-role test checklist. Linked from `contributors/index.md`.
- [x] 4.4 Run `npm run smoke:admin` against the now-green PostgREST. → `[smoke] OK — PostgREST staff JWT, /admin count, /admin/registrations, logout gate`.
- [x] 4.5 Run `npm run build` to confirm Next.js compiles cleanly. → Required a small `tsconfig.json` change (`exclude: ["node_modules", "website"]`) because Next.js was reaching into Docusaurus types. After that, build succeeded with `/api/admin/login/dummy` listed in the route table.
- [x] 4.6 Run `npm run build` in `website/` to confirm Docusaurus still compiles. → Clean.

### Validation

`npm run smoke:admin` exited 0; both builds succeeded; browser click-through confirmed by Tailway Cowork in [`talk.md`](../talk/talk.md) Messages 2 and 4.

---

## Status: Completed

**Completed**: 2026-05-19

---

## Acceptance Criteria

- [x] `/admin/login` renders the role picker with all four PG roles (two disabled) and five authenticated-capability profiles.
- [x] Clicking each enabled profile logs the user in with the correct capability set; the admin sidebar reflects the set. — Tailway PASS on all 6 capability profiles.
- [x] Clicking "anon" clears the session cookie and redirects to `/`. — Tailway Test 7 PASS.
- [x] The existing JWT-paste form is still reachable behind a toggle (no regression for the existing flow). — Tailway Test 9 PASS.
- [x] `npm run smoke:admin` passes. — exit 0, "OK" line printed.
- [x] `npm run build` (both the Next.js app and the Docusaurus site) passes.
- [x] [`postgres-roles.md`](../../../contributors/postgres-roles.md) has a "Dummy login (development)" subsection.
- [x] [`project-conventions.md`](../../../contributors/project-conventions.md) records the always-available gating as a temporary choice.

## Out-of-scope follow-ups surfaced during testing

- [`INVESTIGATE-app-log-alert-count-permission.md`](../backlog/INVESTIGATE-app-log-alert-count-permission.md) — `app_log_alert_count` RPC denies EXECUTE for the `authenticated` role (Tailway S1). Filed in backlog with four options. Affects the Oversikt dashboard for every staff session; needs a product/spec decision before fixing.
- Tailway S2 — Oversikt cards silently show `0` for roles without the required cap. Tied to the RPC fix above; tracked in the same INVESTIGATE.
- Tailway S3 — Logg ut button overlaps Next dev overlay. Dev-only artifact, not filed.
- Tailway Sugg 6 — expose `aud` claim on `/admin/staff`. Nice-to-have; not filed.

---

## Files to Modify

- `src/lib/dummy-login-roles.ts` *(new)* — typed role-profile list
- `src/app/api/admin/login/dummy/route.ts` *(new)* — POST endpoint that mints + sets cookie
- `src/components/admin/dummy-login-picker.tsx` *(new)* — client component for the picker UI
- `src/app/admin/login/page.tsx` *(modify)* — render the picker, collapse the existing JWT form
- `website/docs/contributors/postgres-roles.md` *(modify)* — append "Dummy login (development)" subsection
- `website/docs/contributors/project-conventions.md` *(modify)* — note the always-available gating decision

---

## Implementation Notes

- All JWTs minted from this picker are real HS256 tokens signed with `JWT_SECRET`. PostgREST verifies and enforces RLS exactly as it does for UIS-issued tokens. The picker is dummy in the sense of *user identity* (no real user backs it), not in the sense of *bypassing security*.
- Token expiry: 7 days, matching `SESSION_TTL_SEC` in `admin-session.ts`. Long enough for development sessions, short enough that an accidentally-leaked token expires.
- The picker must not be the only login path. Until Okta/Authentik replaces it, the JWT-paste form remains the official way to use a UIS-issued staff token.
- Future Okta/Authentik integration: replace the picker with an IdP-redirect button; the `/api/admin/login/dummy` route can be deleted or repurposed as a development-only escape hatch (with an env gate added at that time).