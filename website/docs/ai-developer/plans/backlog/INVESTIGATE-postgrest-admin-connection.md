# Investigate: PostgREST admin connection (UIS staff JWT delivery)

> **IMPLEMENTATION RULES:** Before implementing this plan, read and follow:
> - [WORKFLOW.md](../../WORKFLOW.md) - The implementation process
> - [PLANS.md](../../PLANS.md) - Plan structure and best practices

## Status: Backlog

**Goal**: Determine whether the original "can't reach UIS-local PostgREST as staff" problem is fully resolved by the UIS handoff in `talk/talk.md`, and decide what (if anything) the Railway side should change to align with UIS's recommended JWT.

**Last Updated**: 2026-05-18

---

## Background

The admin surfaces (`/admin`, `/admin/registrations`, etc.) call PostgREST with a **staff** bearer token. Public pages use the anon token. Before this round, the app could not reach PostgREST as a staff role because UIS had not delivered a staff JWT — the dev side had only `JWT_SECRET` and a locally-minted token from `scripts/mint-staff-jwt.mjs` (6 capabilities, 1-year expiry).

The thread in `talk/talk.md` ends with UIS confirming:

- They issued a staff JWT as `POSTGREST_STAFF_JWT_UIS` in the repo-root `.env` around line 39, **9 capabilities** (full set from `auth.capabilities`), `aud=railway`, `role=authenticated`, 2-year expiry, signed with the same `JWT_SECRET`.
- They verified live: `curl -H "Authorization: Bearer …" http://api-railway.localhost/registrations` returns **HTTP 200** with `Content-Range: 0-2/3` (3 seeded rows readable; RLS `registrations:read` capability satisfied end-to-end).
- The 6-cap `POSTGREST_ADMIN_JWT` already covers `/admin/registrations`. No downside to switching to the 9-cap `POSTGREST_STAFF_JWT_UIS`.
- They captured the onboarding friction as **F11** in their infra repo so a future `./uis configure postgrest` will mint and write both anon and staff JWTs automatically.

UIS verdict: *"Nothing else outstanding from the UIS side. If the staff JWT works for your admin UI, we're done."*

---

## Questions to Answer

1. Does the admin flow actually work end-to-end against the live UIS PostgREST now? (Answered by running `npm run smoke:admin`.)
2. Which token is the app currently using — `POSTGREST_ADMIN_JWT` (locally-minted, 6 caps) or `POSTGREST_STAFF_JWT_UIS` (UIS-issued, 9 caps)? Should that change?
3. Are there code or docs assumptions that pre-date the UIS handoff and should be updated?

---

## Current State (Railway side)

### `.env` (gitignored)

All required variables are present:

| Line | Variable | Status |
|------|----------|--------|
| 13 | `POSTGREST_URL` | set |
| 19 | `POSTGREST_ANON_JWT` | set |
| 24 | `JWT_SECRET` | set |
| 27 | `ADMIN_PASSWORD` | set |
| 28 | `ADMIN_COOKIE_SECRET` | set |
| 31 | `POSTGREST_ADMIN_JWT` | set (locally-minted, 6 caps per `scripts/mint-staff-jwt.mjs`) |
| 39 | `POSTGREST_STAFF_JWT_UIS` | set (UIS-issued, 9 caps) |

Line numbers match UIS's claim in `talk.md` exactly.

### Token resolution precedence

Both the server code and the smoke test pick `POSTGREST_ADMIN_JWT` first and fall back to `POSTGREST_STAFF_JWT_UIS`:

- `src/lib/admin-postgrest.ts:10-14` — `envStaffPostgrestJwt()` returns `POSTGREST_ADMIN_JWT` if set, else `POSTGREST_STAFF_JWT_UIS`.
- `scripts/smoke-admin-flow.mjs:23-25` — `staffJwtFromRaw()` does the same.
- Session cookie (admin login) JWT is preferred over either env JWT (`admin-postgrest.ts:17-22`).

So **today the app uses the 6-cap locally-minted `POSTGREST_ADMIN_JWT`**, even though the 9-cap UIS-issued token is also configured.

### `.env.example`

```
# UIS kan levere kun én av disse:
POSTGREST_ADMIN_JWT=
# Full kapabilitetsliste fra UIS configure (prioriteres ikke — brukes bare hvis linjen over er tom):
POSTGREST_STAFF_JWT_UIS=
```

The comment explicitly states the `_UIS` variant is the fallback ("prioriteres ikke"). This was correct when UIS could only ship one of the two — now UIS reliably ships both, so the precedence question is worth re-opening.

### Application code

- `src/lib/postgrest.ts` — single source of truth for the PostgREST HTTP client. Uses schema `railway` (`Accept-Profile: railway`). Takes an optional `accessToken`; falls back to `POSTGREST_ANON_JWT`. No DB drivers anywhere — the PostgREST-only hard rule is upheld.
- `src/lib/admin-postgrest.ts` — staff variant. Cookie JWT > env JWT.
- `scripts/mint-staff-jwt.mjs` — mints a 6-cap, 1-year token. Useful as a local fallback when UIS only shares `JWT_SECRET`.

---

## Options

### Option A — Keep current precedence, do nothing

**What:** Leave `POSTGREST_ADMIN_JWT` winning. Verify with `npm run smoke:admin`.

**Pros:**
- Zero code/doc change.
- The 6-cap token already covers every admin surface currently shipped.
- The locally-minted token is easier to rotate during development (just re-run `mint-staff-jwt.mjs`).

**Cons:**
- Future admin surfaces that need `users:*` or the `admin` capability will silently fail until someone notices and switches tokens.
- The `.env.example` comments and the precedence diverge from UIS's recommendation (`POSTGREST_STAFF_JWT_UIS` is a strict superset).

### Option B — Flip precedence: prefer `POSTGREST_STAFF_JWT_UIS`

**What:**
- `envStaffPostgrestJwt()` checks `POSTGREST_STAFF_JWT_UIS` first.
- `smoke-admin-flow.mjs` mirrors the change.
- `.env.example` comment updated: `POSTGREST_STAFF_JWT_UIS` is canonical, `POSTGREST_ADMIN_JWT` is a local-mint fallback.

**Pros:**
- Aligns with UIS's "no downside to switching" guidance and the future `./uis configure postgrest` flow (F11).
- New admin surfaces touching `users:*` work out of the box.
- Closes one source of "why am I getting RLS denials?" confusion.

**Cons:**
- Tiny diff in two files plus a doc tweak.
- The 9-cap token has a 2-year lifetime; if it gets accidentally checked into a screenshot or log, the blast radius is bigger than the 1-year local-mint token.

### Option C — Surface both transparently (no precedence change)

**What:** Log on server startup which token name is in use (without printing the token). Update `.env.example` to clarify "set one of the two, both work."

**Pros:**
- Helps debugging without forcing a behavior change.

**Cons:**
- Adds startup logging surface area for a one-time question. Doesn't actually fix the future-surface-needs-users:*-cap concern.

---

## Recommendation

**Run the smoke test first** (no code change) — that answers Q1 with certainty. If it passes, follow with Option B in a small PLAN:

1. Flip precedence in `admin-postgrest.ts` + `smoke-admin-flow.mjs`.
2. Update `.env.example` comments so the canonical/fallback labels match the UIS handoff reality.
3. Update `db/README.md` / root `README.md` admin sections to note that UIS now ships a staff JWT directly (no need to mint locally unless UIS hasn't run `./uis configure postgrest` yet).
4. No code change to `src/lib/postgrest.ts` — the core client is fine.

If the smoke test fails, the failure mode (HTTP status / response body) tells us where to look next — likely a separate INVESTIGATE.

---

## Next Steps

- [x] Run `npm run smoke:admin` against a Next dev server with the current `.env`. → **FAILED** with F12.
- [x] Reconcile with UIS-side findings → F12 = UIS's **F10**; UIS independently surfaced **F8** (= our F13) on the same pod. Both are documented in `learn/helpers/urbalurba-infrastructure/website/docs/ai-developer/plans/backlog/INVESTIGATE-docs-customer-onboarding-database.md`.
- [ ] Await user/maintainer go-ahead for UIS to run the two `kubectl set env` commands (anon role + JWT secret binding). Draft authorization is in `Railway-Dev - Message 2` at the new talk path.
- [ ] After UIS reports the rollout is green, re-run `npm run smoke:admin`. Expected: exit 0.
- [ ] If green, draft `PLAN-postgrest-prefer-uis-staff-jwt.md` per Option B above (precedence flip + doc updates). This is purely a Railway-side change, no UIS coordination needed.
- [ ] Capture the two `kubectl set env` commands in our recovery runbook (likely `db/README.md` or a new `db/RECOVERY.md`) until UIS lands the upstream B.5 fix.

---

## Finding F12 — PostgREST is running without `PGRST_JWT_SECRET`

> **Reconciled with UIS — same root cause as their F10.** UIS confirmed in
> [`talk.md`](../talk/talk1.md) Message 3 that this is identical to friction
> **F10** already on their backlog (file path on this machine:
> `learn/helpers/urbalurba-infrastructure/website/docs/ai-developer/plans/backlog/INVESTIGATE-docs-customer-onboarding-database.md`,
> §F10 lines 188-208): `./uis configure postgrest` writes `PGRST_JWT_SECRET`
> into the K8s secret, but `./uis deploy postgrest` doesn't bind it into the
> pod env. Use F10 as the canonical reference; F12 was our independent
> rediscovery from the Railway side. UIS-side fix is a one-line YAML change in
> the deploy template (their B.5 in the same INVESTIGATE).

**Date:** 2026-05-18
**Where:** UIS-local `http://api-railway.localhost`
**Severity:** Blocks all staff-role admin reads. Anon also fails because the same secret verifies anon JWTs.

### Symptom

`npm run smoke:admin` fails at the first PostgREST request:

```
[smoke] PostgREST /registrations failed: 500 {"code":"PGRST300","details":null,"hint":null,"message":"Server lacks JWT secret"}
```

### Probe

All three tokens hit `GET /registrations?select=id&limit=1` with `Accept-Profile: railway`:

| Token | Source | Caps | Response |
|-------|--------|------|----------|
| `POSTGREST_ANON_JWT` | UIS-issued | `[]` | `500 PGRST300 "Server lacks JWT secret"` |
| `POSTGREST_ADMIN_JWT` | locally minted via `scripts/mint-staff-jwt.mjs` using `.env` `JWT_SECRET` | 6 caps | `500 PGRST300 "Server lacks JWT secret"` |
| `POSTGREST_STAFF_JWT_UIS` | UIS-issued | 9 caps | `500 PGRST300 "Server lacks JWT secret"` |

Base reachability is fine — `GET /` returns `401`, confirming PostgREST is up and answering.

### Diagnosis

`PGRST300` means **PostgREST has no JWT secret configured** — the env var `PGRST_JWT_SECRET` (or its config equivalent) is not set on the running process. PostgREST therefore cannot verify *any* HS256 token, regardless of which key signed it.

This is distinct from:
- `PGRST301/302` — token invalid or expired (would mean a key mismatch).
- `401` with no body — anon path with insufficient role privileges (would mean RLS denied, not auth missing).

The PostgREST instance was verified working by UIS in `talk/talk.md` ("Verified live: ... returns HTTP 200 with Content-Range: 0-2/3"). Something has drifted between that verification and now — most likely a pod restart or reconfigure that dropped the env var.

### What UIS needs to do

1. On the running PostgREST process for `api-railway.localhost`, ensure `PGRST_JWT_SECRET` is set to the same HS256 secret that signed `POSTGREST_STAFF_JWT_UIS` (and that the Railway `.env` `JWT_SECRET` matches, so local-mint also works).
2. Confirm with: `curl -H "Authorization: Bearer <staff-jwt>" -H "Accept-Profile: railway" http://api-railway.localhost/registrations?select=id&limit=1` → expect `200` with a JSON array (or `Content-Range: 0-N/M`), not `500`.
3. If the deployment is managed by `./uis configure postgrest`, this likely needs the configure step to persist the secret across pod restarts (and may be related to the F11 onboarding fix already in flight).

### What Railway side can verify after UIS fixes it

Re-run `npm run smoke:admin`. Expected: exit 0 and "OK — PostgREST staff JWT, /admin count, /admin/registrations, logout gate".

---

## Finding F13 — Anon `PGRST_DB_ANON_ROLE` is clobbered to UIS default (= UIS's F8)

**Discovered by:** UIS, reported in
[`website/docs/ai-developer/talk/talk.md`](../talk/talk1.md) Messages 1-2 (and reconciled in Message 3).
**Same as:** UIS F8 in `learn/helpers/urbalurba-infrastructure/website/docs/ai-developer/plans/backlog/INVESTIGATE-docs-customer-onboarding-database.md` (§F8 lines 157-170).
**Severity:** Blocks every unauthenticated request to `api-railway.localhost`; silent to the staff-JWT smoke path (which always sends an `Authorization` header and hits F10/F12 instead).

### What happened

A recent UIS-side undeploy + redeploy of `railway-postgrest` rewrote the field patch that set `PGRST_DB_ANON_ROLE=anon` back to the UIS default `railway_web_anon`. The role `railway_web_anon` was dropped during the original onboarding (in favour of the canonical `anon` role our 39 `TO anon` RLS policies target), so PostgREST now boots pointing at a non-existent role.

### Symptom

```
$ curl -sS http://api-railway.localhost/
{"code":"22023","message":"role \"railway_web_anon\" does not exist"}
HTTP=401
```

Our smoke test didn't surface this because it always sends `Authorization: Bearer <jwt>`, which causes PostgREST to try the JWT path first — and that fails with F10/F12 before ever falling back to the anon role.

### Why both failures hit the same pod

| Request | Path through PostgREST | Failure |
|---|---|---|
| No `Authorization` header | `SET ROLE railway_web_anon` | **F13/F8** — `role does not exist` (401) |
| Any `Authorization: Bearer <jwt>` | verify HS256 against `PGRST_JWT_SECRET` | **F12/F10** — `Server lacks JWT secret` (500 PGRST300) |

Two independent regressions, same pod. Both need to land before the API is fully functional.

### Fix UIS proposed

Single `kubectl set env` per finding, no SQL, no GRANT changes:

```bash
# F13/F8 — restore canonical anon role:
kubectl set env -n postgrest deploy/railway-postgrest PGRST_DB_ANON_ROLE=anon

# F12/F10 — bind PGRST_JWT_SECRET from the K8s secret into the pod env:
kubectl set env -n postgrest deploy/railway-postgrest \
  --from=secret/railway-postgrest --keys=PGRST_JWT_SECRET
```

Both trigger a pod rollout (~10s). After that we re-run `npm run smoke:admin` and expect green.

### Long-term

The two `kubectl set env` commands are **field patches**, not permanent fixes. They will be clobbered again on the next `./uis configure postgrest` or `./uis undeploy + deploy postgrest --app railway` cycle. The real fixes are UIS-side:

- F8 → `./uis configure postgrest --authenticator <name> --anon-role <name>` flags so the customer's existing DDL controls naming.
- F10 → bind `PGRST_JWT_SECRET` from the K8s secret to the deployment env in UIS's PostgREST deployment template (UIS calls this B.5 in their INVESTIGATE).

Until both land, the two `kubectl set env` commands belong in our recovery runbook.

---

## References

- [`talk.md` (new canonical path)](../talk/talk1.md) — UIS Messages 1-3
- `talk/talk.md` (archive) — original handoff, Railway-Dev Message 1 (F12)
- UIS-side INVESTIGATE: `learn/helpers/urbalurba-infrastructure/website/docs/ai-developer/plans/backlog/INVESTIGATE-docs-customer-onboarding-database.md` — friction F1-F11, especially F8 and F10
- `src/lib/postgrest.ts` — core PostgREST client
- `src/lib/admin-postgrest.ts` — staff token resolution
- `scripts/smoke-admin-flow.mjs` — end-to-end admin SSR + PostgREST smoke
- `scripts/mint-staff-jwt.mjs` — local staff-JWT minter
- `.env.example` — env contract
- `db/README.md` — UIS deliverables checklist
