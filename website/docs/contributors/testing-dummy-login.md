---
sidebar_position: 6
---

# Testing the dummy login picker

A step-by-step checklist for verifying that every role in the dummy login picker (`/admin/login`) does what it should. Run this whenever you touch the picker, the admin session cookie, the capability gating, or the role-profile model in `src/lib/dummy-login-roles.ts`.

The "dummy" in dummy login refers to user identity (no IdP backs it yet — that arrives with Okta/Authentik). The minted tokens are **real** HS256 JWTs signed with `JWT_SECRET`; PostgREST and RLS enforce capability gates exactly as in production.

## Preconditions

Before running the spec:

- `.env` has at minimum `POSTGREST_URL`, `POSTGREST_ANON_JWT`, `JWT_SECRET`. See [Getting started](getting-started.md#environment-variables).
- PostgREST at `POSTGREST_URL` is reachable and verifies HS256 against the same `JWT_SECRET`. If `npm run smoke:admin` fails with `500 PGRST300 "Server lacks JWT secret"` or `401 role "railway_web_anon" does not exist`, see [INVESTIGATE postgrest admin connection](../ai-developer/plans/backlog/INVESTIGATE-postgrest-admin-connection.md) — those are UIS-side regressions, not a Railway-side bug.
- Next.js dev server is running on port 3010: `npm run dev`.
- Browser DevTools open with the Application → Cookies panel visible for `localhost:3010`. The cookie to watch is **`railway_admin_session`**.

## What the picker shows

Visit **`http://localhost:3010/admin/login`** (no query string). Expected:

| Row | Kind | Clickable | Notes |
|-----|------|-----------|-------|
| `railway_owner` | PG role | No (greyed out) | Disabled reason visible: *"Owns DDL / SECURITY DEFINER functions — not a session role."* |
| `anon` | Profile | Yes | Description: *"Offentlig PostgREST-økt. Sletter admin-cookien."* No capability badges. |
| Full admin | Profile | Yes | Cap badge: `admin` |
| Registrations admin | Profile | Yes | Cap badges: `registrations:read`, `registrations:write` |
| Content editor | Profile | Yes | Cap badges: `content:read`, `content:write` |
| App-log viewer | Profile | Yes | Cap badge: `app_log:read` |
| Users admin | Profile | Yes | Cap badges: `users:read`, `users:write` |
| `authenticator` | PG role | No (greyed out) | Disabled reason visible: *"PostgREST runtime connection role — never appears in a user session."* |

There should also be a small **"Manuell innlogging (lim inn staff‑JWT)"** link below the picker — clicking it appends `?manual=1` and shows the JWT-paste form for power users.

## Per-role test

Run each block below in order. After each test, **log out** before the next test:

1. From inside `/admin`, click the "Logg ut" button (bottom of the sidebar). You should land back on `/admin/login` with the picker.
2. Equivalently, manually clear the `railway_admin_session` cookie in DevTools and reload.

### 1. `anon` — clears the admin cookie

1. From `/admin/login`, click **`anon`**.
2. **Expected**: page redirects to `/` (the public registration form). No `railway_admin_session` cookie present in DevTools.
3. Visit `http://localhost:3010/admin` directly. **Expected**: redirected back to `/admin/login` (the dashboard layout in `src/app/admin/(dashboard)/layout.tsx` enforces this).

### 2. Full admin — `admin` capability (all sidebar sections)

1. From `/admin/login`, click **Full admin**.
2. **Expected**: redirected to `/admin`. `railway_admin_session` cookie set.
3. Verify the sidebar shows **all five groups**:
   - Oversikt
   - Registreringer (Liste, CSV eksport)
   - Utskrift (Manuskript, Papirskjema)
   - Aktivitet og skjema (Aktiviteter, Tilleggsaktiviteter, Skjematekster, Skjemadata)
   - Drift (App‑logg)
   - Konto (Mine tilganger)
4. Click **Registreringer → Liste**. Page loads with the table of seeded registrations.
5. Decode the cookie at [jwt.io](https://jwt.io/) (paste the cookie value, ignore the "invalid signature" warning — it's HS256, jwt.io can't verify without the secret). Payload should contain:
   - `role: "authenticated"`
   - `capabilities: ["admin"]`
   - `aud: "railway"`
   - `exp` ≈ 7 days in the future

### 3. Registrations admin — narrow capability set

1. Logout. Click **Registrations admin**.
2. **Expected sidebar**: Oversikt, **Registreringer**, Konto. (No Utskrift, no Aktivitet og skjema, no Drift.)
3. Visit `/admin/registrations`. Page loads.
4. Manually visit `/admin/text-content` (a content surface, not linked from the sidebar for this role). **Expected**: page loads but data fetch shows an error or empty state — PostgREST/RLS rejects the read because the JWT lacks `content:read`.
5. Cookie payload (decoded): `capabilities: ["registrations:read","registrations:write"]`.

### 4. Content editor — content caps only

1. Logout. Click **Content editor**.
2. **Expected sidebar**: Oversikt, **Utskrift**, **Aktivitet og skjema**, Konto. (No Registreringer, no Drift.)
3. Visit `/admin/activities`. Page loads with seeded activities.
4. Manually visit `/admin/registrations`. **Expected**: page loads but the data fetch shows an error or empty state (RLS rejects).
5. Cookie payload: `capabilities: ["content:read","content:write"]`.

### 5. App-log viewer — app_log:read only

1. Logout. Click **App-log viewer**.
2. **Expected sidebar**: Oversikt, **Drift**, Konto.
3. Visit `/admin/app-log`. Page loads (likely empty — `auth.app_log` had 0 rows at last UIS DB snapshot).
4. Manually visit `/admin/registrations` and `/admin/activities`. Both should show empty/error from RLS.
5. Cookie payload: `capabilities: ["app_log:read"]`.

### 6. Users admin — users caps (sidebar currently has no users-cap items)

1. Logout. Click **Users admin**.
2. **Expected sidebar**: Oversikt, Konto only. The sidebar has no entries gated on `users:*` today — Users admin shows the same nav as an authenticated user with no caps would. This is correct; the cap is exercised at the PostgREST/RLS layer, not in the sidebar.
3. Cookie payload: `capabilities: ["users:read","users:write"]`.
4. (Optional — once a users-admin page exists, extend this block to verify it loads here and fails for the other roles.)

### 7. `railway_owner` — disabled

1. Logout. Hover on the **`railway_owner`** row. **Expected**: row is muted, cursor is `not-allowed`. The disabled reason text is visible below the label.
2. Try to click it. **Expected**: nothing happens; no cookie is set; no redirect.
3. From DevTools console, run:
   ```js
   fetch('/api/admin/login/dummy', {
     method: 'POST',
     headers: {'Content-Type': 'application/json'},
     body: JSON.stringify({profileId: 'railway_owner'})
   }).then(r => r.json().then(j => ({status: r.status, body: j})))
   ```
   **Expected**: `{status: 409, body: {error: "Profilen «railway_owner» kan ikke logges inn som: Owns DDL / SECURITY DEFINER functions — not a session role."}}`. The server enforces the disabled state independently of the UI.

### 8. `authenticator` — disabled

Same as `railway_owner`. Repeat the row inspection and the console probe with `profileId: 'authenticator'`. Expect `409` with the *"PostgREST runtime connection role — never appears in a user session."* message.

## Manual JWT-paste fallback

1. From `/admin/login`, click **"Manuell innlogging (lim inn staff‑JWT)"**.
2. URL becomes `/admin/login?manual=1`. The picker is still visible *and* the JWT-paste form renders below it.
3. Paste a valid staff JWT (e.g., `POSTGREST_ADMIN_JWT` from `.env`) into the textarea, click **Logg inn**. Expected: redirect to `/admin`, cookie set.

## Env-JWT auto-bootstrap (CI / smoke)

This path bypasses the picker for automation:

1. Visit `/admin/login?auto=1` with `bootstrapAllowed` true (it is in dev) and a valid env JWT (`POSTGREST_ADMIN_JWT` or `POSTGREST_STAFF_JWT_UIS`).
2. **Expected**: 307 redirect to `/api/admin/bootstrap-session`, which sets the cookie and redirects to `/admin`.

This is what `npm run smoke:admin` exercises indirectly via the `/api/admin/login` route (it POSTs the staff JWT rather than visiting the page, but the resulting cookie is the same shape).

## API-level smoke (no browser)

If the browser UI is broken, you can still verify the route behavior:

```bash
# Happy paths
for id in anon authenticated_full_admin authenticated_registrations authenticated_content authenticated_applog authenticated_users; do
  printf "%-32s  " "$id"
  curl -s -o /dev/null -w "HTTP %{http_code}\n" -X POST http://localhost:3010/api/admin/login/dummy \
    -H "Content-Type: application/json" \
    -d "{\"profileId\":\"$id\"}"
done

# Should all be 200.

# Disabled roles
for id in railway_owner authenticator; do
  printf "%-32s  " "$id"
  curl -s -o /dev/null -w "HTTP %{http_code}\n" -X POST http://localhost:3010/api/admin/login/dummy \
    -H "Content-Type: application/json" \
    -d "{\"profileId\":\"$id\"}"
done

# Should both be 409.

# Bad input
curl -s -o /dev/null -w "unknown:    HTTP %{http_code}\n" -X POST http://localhost:3010/api/admin/login/dummy \
  -H "Content-Type: application/json" -d '{"profileId":"bogus"}'         # 404
curl -s -o /dev/null -w "empty body: HTTP %{http_code}\n" -X POST http://localhost:3010/api/admin/login/dummy \
  -H "Content-Type: application/json" -d '{}'                            # 400
```

## What to do when a test fails

- **Picker doesn't render**: check the Next dev server console. Likely a TypeScript or JSX error in `src/components/admin/dummy-login-picker.tsx`.
- **Click does nothing**: open the Network tab. The POST to `/api/admin/login/dummy` should appear. If it returns 4xx/5xx, the response body has the Norwegian error message.
- **Cookie not set**: response was 200 but `Set-Cookie` header missing — check `src/lib/admin-session.ts` `adminSessionCookieOptsForToken`.
- **Sidebar shows wrong items**: decode the cookie's JWT payload. The `capabilities` array there is what `staffEffectiveCapabilitySet()` in `src/lib/staff-jwt-caps.ts` consumes. If the JWT looks right but the sidebar is wrong, the bug is in the cap-set logic, not the picker.
- **PostgREST returns 500 PGRST300 or 401 role does not exist**: not a Railway-side bug. See [INVESTIGATE postgrest admin connection](../ai-developer/plans/backlog/INVESTIGATE-postgrest-admin-connection.md) for the UIS-side recovery commands.

## Related

- [PostgreSQL roles](postgres-roles.md) — what `anon` / `authenticated` mean at the DB level
- [Project conventions](project-conventions.md) — the PostgREST-only data-access rule
- [Plan: Dummy login picker](../ai-developer/plans/completed/PLAN-dummy-login.md) — the implementation plan this spec validates
