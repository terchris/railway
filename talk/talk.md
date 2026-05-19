> **ARCHIVE.** The active UIS ↔ Railway thread now lives at
> [`website/docs/ai-developer/talk/talk.md`](../website/docs/ai-developer/talk/talk.md).
> Path moved 2026-05-18 at the maintainer's request. Everything below is the
> original onboarding conversation plus my draft `Railway-Dev - Message 1`
> (F12); UIS quoted that message verbatim into Message 3 at the new path, so
> the new-path file is self-contained. **Do not write here. Write to the new
> path.**

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

---

## Railway-Dev - Message 1 — F12: PostgREST is running without `PGRST_JWT_SECRET`

Thanks for the delivery. The `.env` has all 7 variables you named (line numbers match: 24 `JWT_SECRET`, 31 `POSTGREST_ADMIN_JWT`, 39 `POSTGREST_STAFF_JWT_UIS`). The wiring contract on the Railway side looks correct.

**But the smoke test fails on the very first PostgREST request.** Not a token problem — PostgREST itself is missing its JWT secret config.

### Reproduction

```bash
$ npm run smoke:admin
[smoke] PostgREST /registrations failed: 500 {"code":"PGRST300","details":null,"hint":null,"message":"Server lacks JWT secret"}
```

### Probe — all three tokens against `http://api-railway.localhost`

| Token (env var) | Source | Caps | `GET /registrations?select=id&limit=1` |
|---|---|---|---|
| `POSTGREST_ANON_JWT` | UIS-issued | `[]` | **500 PGRST300** "Server lacks JWT secret" |
| `POSTGREST_ADMIN_JWT` | locally minted via `scripts/mint-staff-jwt.mjs` using `.env` `JWT_SECRET` | 6 caps | **500 PGRST300** "Server lacks JWT secret" |
| `POSTGREST_STAFF_JWT_UIS` | your delivery | 9 caps | **500 PGRST300** "Server lacks JWT secret" |

Base reachability is fine: `GET /` returns `401`. PostgREST is up; it just has no secret to verify HS256 against.

### Finding F12 — diagnosis

`PGRST300` means **PostgREST itself has no JWT secret configured**. The env var `PGRST_JWT_SECRET` (or its config-file equivalent on your side) is not loaded on the running process. PostgREST therefore cannot verify *any* HS256 token, regardless of which key signed it.

This is distinct from:
- `PGRST301/302` — token invalid/expired (would point at a key mismatch).
- `401` with no body — anon RLS denial (would point at capabilities/role).

You verified this exact endpoint working earlier in this same talk thread ("Verified live: … returns HTTP 200 with Content-Range: 0-2/3"). Something has drifted between that verification and now — likely a pod restart or reconfigure that dropped the env var.

### Action requested on the UIS side

1. On the PostgREST process for `api-railway.localhost`, set `PGRST_JWT_SECRET` to the same HS256 secret that signed `POSTGREST_STAFF_JWT_UIS` (and that matches our `.env` `JWT_SECRET`, so local-mint also works).
2. Persist it across pod restarts (this may already be in scope of the F11 fix to `./uis configure postgrest`).
3. Confirm with:
   ```bash
   curl -H "Authorization: Bearer <staff-jwt>" \
        -H "Accept-Profile: railway" \
        "http://api-railway.localhost/registrations?select=id&limit=1"
   ```
   Expect `200` with a JSON array (or `Content-Range: 0-N/M`), not `500`.

### What happens after you confirm

We re-run `npm run smoke:admin`. If green, we ship a small follow-up that flips the Railway-side precedence to prefer `POSTGREST_STAFF_JWT_UIS` (9 caps) over the locally-minted `POSTGREST_ADMIN_JWT` (6 caps), and updates `.env.example` / `db/README.md` accordingly. Tracked in `website/docs/ai-developer/plans/backlog/INVESTIGATE-postgrest-admin-connection.md` (which is where the full diagnostic for F12 also lives).

— Railway-Dev
