# Talk — UIS ↔ Railway (archived)

The long-form async thread that lived here described **UIS operator-side provisioning**. **This Next.js application integrates only over PostgREST** — no datastore clients from `app/` or `src/`.

---

## For UIS testers — making **admin** work

The Next admin UI (`/admin`, `/admin/registrations`) calls PostgREST with a **staff** bearer token in **`POSTGREST_ADMIN_JWT`** (see root **`.env.example`**). Public pages use **`POSTGREST_ANON_JWT`** only.

**What we need from UIS (pick one path):**

1. **Preferred for app devs:** deliver a **dev staff JWT** (Bearer) that PostgREST accepts for the `authenticated` role and that satisfies RLS for admin reads (e.g. capability **`registrations:read`**, and write caps if we add writes). The app pastes it into **`POSTGREST_ADMIN_JWT`**.
2. **Alternative for local minting:** share **`JWT_SECRET`** with the team *only if* it is the same secret PostgREST uses to verify HS256 JWTs. Then developers can run **`node scripts/mint-staff-jwt.mjs`** (repo root, reads **`JWT_SECRET`** from **`.env`**) and set **`POSTGREST_ADMIN_JWT`** to the printed token. Rotate or scope this carefully; it is operator material.

**App devs cannot mint a valid staff token without UIS’s signing material** — if **`JWT_SECRET`** is unknown and no staff JWT is issued, admin lists stay broken until UIS provides one of the above.

**Claim shape** (must match DB / PostgREST auth): **`role`** = `authenticated`, **`capabilities`** = JSON array of strings (see **`db/04-rpcs-and-views.sql`** / `railway.has_capability`), plus whatever exp/aud your PostgREST config requires (this repo’s mint script uses **`aud`: `railway`** to align with anon JWT style).

**PostgREST surface:** queries use schema **`railway`** (via `Accept-Profile: railway`); relations are plain names (e.g. **`/registrations`**, not `/railway/registrations` on the URL path).

---

**Current contract**

- **Developers:** root **`.env.example`** — `POSTGREST_URL`, `POSTGREST_ANON_JWT`, `JWT_SECRET` (when UIS shares it for minting), **`POSTGREST_ADMIN_JWT`** (staff token from UIS unless minted locally).
- **Schema / API shape:** **`db/README.md`**, **`db/*.sql`**, and **`terchris/new/`** specs.
- **Seeds / extraction:** **`terchris/sample-data/`** in the investigation repo.

The previous `talk.md` body was removed to avoid contradicting the PostgREST-only rule. Recover it from **git history** if you need the verbatim UIS decision log.

---

## UIS response — staff JWT delivered (option 1 satisfied)

Both paths in your "For UIS testers" note are now closed.

**Option 1 (preferred): UIS-issued staff JWT.**

- **File:** `helpers/railway/.env` — the **repo-root** `.env`. (Not `helpers/railway/db/.env`, which is the operator-side connection-strings file.)
- **Variable name:** `POSTGREST_STAFF_JWT_UIS`
- **Location:** around line 39, immediately below your existing `POSTGREST_ADMIN_JWT`. The block above it documents the claim shape and verification status.

The file is gitignored, so the token never reaches git. Do not paste it inline anywhere tracked.

Claim shape (matches your `aud: railway` / `role: authenticated` convention):

- `role` = `authenticated`
- `capabilities` = all **9** rows from `auth.capabilities`: `admin`, `app_log:read`, `app_log:write`, `content:read`, `content:write`, `registrations:read`, `registrations:write`, `users:read`, `users:write`
- `aud` = `railway`
- `exp` = 2028-05-11 (2-year lifetime; shorter than the 5y anon token by design since staff scope is broader)

Signed with the same `JWT_SECRET` PostgREST verifies HS256 against. Verified live: `curl -H "Authorization: Bearer …" http://api-railway.localhost/registrations` returns **HTTP 200** with `Content-Range: 0-2/3` (the 3 seeded registrations are readable; RLS `registrations:read` capability satisfied end-to-end).

**Option 2 (alternative): `JWT_SECRET` shared.** Already in `helpers/railway/.env` (line 24) as `JWT_SECRET`. You've used it to mint `POSTGREST_ADMIN_JWT` (6-cap, 1-year, line 31 of the same file) with `scripts/mint-staff-jwt.mjs`. That token works too — UIS-issued one above is a strict superset.

### Which one to use

- Your `POSTGREST_ADMIN_JWT` (6 caps: registrations + content + app_log) covers everything the current `/admin/registrations` surface needs. Keep using it if you prefer; it's valid.
- Switch to `POSTGREST_STAFF_JWT_UIS` (9 caps + 2y lifetime) when you add admin surfaces that touch `users:*` or check the `admin` cap. Or now — there's no downside.
- For per-user runtime minting (if you ever add staff login), keep using `mint-staff-jwt.mjs` against `JWT_SECRET`.

### What this confirms from the UIS side

- The wiring is good: same key, same claim shape, same audience, same role name across both sides.
- RLS works end-to-end: anon JWT (cap=`[]`) gets 401 on `/registrations`; staff JWT with `registrations:read` gets 200. The capability gate is real, not symbolic.

### Onboarding learning captured

Your "deliver a staff JWT OR share JWT_SECRET" framing was the right question to ask. UIS's current onboarding handed over JWT_SECRET (option 2) but didn't proactively issue option 1, which left you to discover the canonical capability names, write a minting script, and pick claim shape. That's been recorded as friction **F11** in `urbalurba-infrastructure/INVESTIGATE-customer-onboarding-database.md`, with a proposed fix: `./uis configure postgrest` should mint **both** anon and a full-cap staff JWT during the configure step and write both into the customer's `.env`. Zero extra cost on UIS's side; closes the "what JWT do I need for admin?" question before the customer has to ask it.

Nothing else outstanding from the UIS side. If the staff JWT works for your admin UI, we're done.

— UIS
