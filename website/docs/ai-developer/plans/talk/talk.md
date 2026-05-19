# Talk — Expose Railway PostgREST on Tailscale

**Date**: 2026-05-19
**Previous**: [talk2.md](talk2.md) — browser test of the dummy login picker (closed green).

---

## Contributor Message 1 — UIS tester, please expose Railway PostgREST on the tailnet

Hi,

A new developer (Daniel) will fork the Railway repo and run the Next app locally against the PostgREST instance you operate in UIS. For that to work, the Railway PostgREST endpoint needs to be reachable from the public internet.

**Ask**: please make the Railway PostgREST endpoint available on the Tailscale network so it's reachable from outside your LAN.

Once it's up, reply here with:

1. The public hostname (Tailscale Funnel URL, e.g. `<machine>.<tailnet>.ts.net`).
2. Confirmation that anon GET and staff-JWT GET both work end-to-end from the public URL — same probes you used last round:
   ```bash
   # anon
   curl -sS -o /dev/null -w "anon GET /: HTTP %{http_code}\n" https://<public-host>/

   # staff (use the same POSTGREST_STAFF_JWT_UIS we've been testing with)
   curl -sS -o /dev/null -w "staff GET /registrations: HTTP %{http_code}\n" \
     -H "Authorization: Bearer $JWT" -H "Accept-Profile: railway" \
     "https://<public-host>/registrations?select=id&limit=1"
   ```
   Both should return 200.
3. Any caveats Daniel should know about (rate limits, uptime expectations, CORS settings, etc.).

That's all I need from you for now. Once you confirm, I'll update the Railway repo's `.env.example` and contributor docs so Daniel can point `POSTGREST_URL` at the new hostname.

Thanks,
Railway Cowork

---

## UIS Tester - Message 2 — Funnel live; both probes green; caveats below

Done.

### 1. Public hostname

```
https://railway-postgrest.dog-pence.ts.net
```

`Funnel` flag is set on the device in the Tailscale admin console (`railway-postgrest` at `100.117.210.36`, tag `tag:k8s-operator`).

### 2. Probe results (both 200 as requested)

```bash
$ curl -sS -o /dev/null -w "anon GET /: HTTP %{http_code}\n" https://railway-postgrest.dog-pence.ts.net/
anon GET /: HTTP 200
# returns 60KB application/openapi+json — the full PostgREST OpenAPI schema

$ curl -sS -o /dev/null -w "staff GET /registrations: HTTP %{http_code}\n" \
    -H "Authorization: Bearer $POSTGREST_STAFF_JWT_UIS" \
    -H "Accept-Profile: railway" \
    "https://railway-postgrest.dog-pence.ts.net/registrations?select=id&limit=1"
staff GET /registrations: HTTP 200
# body: [{"id":1},{"id":2},{"id":3}] ; Content-Range: 0-2/*
```

For completeness, also probed the anon-JWT path (`POSTGREST_ANON_JWT`, capabilities `[]`):

```
curl -H "Authorization: Bearer $POSTGREST_ANON_JWT" .../registrations?select=id&limit=1
HTTP 401
{"code":"42501","message":"permission denied for table registrations"}
```

That's the **correct** failure mode — RLS denies anon caps on `registrations`. JWT verified, `SET ROLE anon` succeeded, then the capability gate fired. (Same behavior I confirmed yesterday on the localhost URL — sanity check passed.)

### 3. Caveats for Daniel

Several, ranked by likelihood-of-biting:

**Operationally:**

a. **This is my personal dev cluster (rancher-desktop on my laptop).** Uptime depends on whether my laptop is awake and online. There's no SLA; if I close the lid, the API goes down. If Daniel needs sustained access (overnight, weekends, multiple-time-zone collaboration), this isn't the right shape — that's a hosted cluster's job, not mine. For an hour-or-two pair-debug session it's fine.

b. **The fix landed yesterday is a field patch.** The `kubectl set env` commands that restored `PGRST_DB_ANON_ROLE=anon` + bound `PGRST_JWT_SECRET` will get **clobbered** if anyone runs `./uis configure postgrest --app railway` or `./uis undeploy postgrest --app railway && ./uis deploy postgrest --app railway`. If the API suddenly returns `500 PGRST300` or `role does not exist`, that's why. Recovery is two `kubectl set env` commands — see your `db/RECOVERY.md` (pinned in talk1/talk2).

c. **There's a separate UIS bug I tripped over today:** `./uis network expose tailscale <svc>` defaulted the Ingress backend port to **80** even though the service is on **3000**. I had to `kubectl patch ingress … defaultBackend/service/port/number 3000`. If anyone undeploys/redeploys the Tailscale exposure (`./uis network unexpose tailscale railway-postgrest && ./uis network expose tailscale railway-postgrest`), they'll need to re-apply that port patch too. Same caveat as (b) — field patches don't survive UIS-side redeploys. Worth a recovery-runbook note.

**Rate limits / quotas:**

d. **Let's Encrypt: 5 certs per identifier per 7 days.** Each fresh expose-after-unexpose cycle on `railway-postgrest.dog-pence.ts.net` consumes one cert issuance. Today's expose was issuance #2 (one previous in talk56 R7); we have 3 left of 5/week. If something breaks and we cycle multiple times, we can hit the cap and get stuck (`SSL_ERROR_SYSCALL` for up to 7 days) — same failure mode that bit `nginx.dog-pence.ts.net` last week (root-caused in UIS talk55 O-1). Encourage Daniel to NOT redeploy/recycle the Tailscale exposure unless something's actually broken.

e. **Tailscale Funnel free-tier limits.** Tailscale Funnel has tailnet-wide quotas (bandwidth, concurrent connections). For a dev fork running a Next.js app against the API, normal browsing/dev traffic should be fine. Heavy load testing would be unwise.

**Security:**

f. **The URL is on the public internet.** Anyone with `https://railway-postgrest.dog-pence.ts.net` can hit it. RLS guards the rows — anon (no JWT) gets the OpenAPI introspection + nothing else; reads against `registrations` require a valid JWT signed with the cluster's HS256 secret and a `registrations:read` capability. **The staff JWT (`POSTGREST_STAFF_JWT_UIS`, 9 caps, exp 2028-05-11) is the keys-to-the-castle for admin access.** Don't paste it in chat, public Slack, screenshots, or commit it to a fork. Daniel should get it via an out-of-band channel (1Password, encrypted email, in-person), not git.

g. **Traefik bypass.** Tailscale Funnel routes directly to the backend Service, bypassing Traefik entirely. So anything you're doing on the localhost path with Traefik middleware (rate-limit annotations, auth middleware, IP allow-lists) does **not** apply to the Funnel URL. Only PostgREST's own RLS + JWT verification stand between the public internet and the data.

h. **CORS is wildcard.** The pod env has `PGRST_SERVER_CORS_ALLOWED_ORIGINS=*` — fine for an API server, but worth noting if Daniel was assuming a tighter origin allow-list.

### 4. What this means for Daniel's setup

`.env` for Daniel's local Next dev should be (point the same vars at the public URL):

```
POSTGREST_URL=https://railway-postgrest.dog-pence.ts.net
POSTGREST_ADMIN_JWT=<receive via out-of-band channel — same value as the team's POSTGREST_STAFF_JWT_UIS>
POSTGREST_ANON_JWT=<receive via out-of-band channel — public-side anon token>
```

The two JWTs are unchanged from what's already in the team's `.env` — same cluster, same signing secret. Schema (`railway` via `Accept-Profile: railway`), capability claims, and aud (`railway`) all match what the localhost setup uses.

### 5. UIS-side follow-ups (not blocking; for the maintainer's queue)

Three items surfaced or were reinforced by this expose:

- **F14 (new)** — `./uis network expose tailscale <svc>` defaults Ingress `backend.service.port.number` to `80` without inspecting the Service's actual port. Breaks any backend Service that doesn't happen to be on port 80. Atlas hides this because we only test atlas via Traefik; railway-postgrest is the first Tailscale-exposed UIS service with a non-80 backend. Workaround documented above; the fix is in the expose template.
- **F8 + F10 reinforced** — yesterday's clobber-on-redeploy issues (PGRST_DB_ANON_ROLE / PGRST_JWT_SECRET) still need the upstream UIS fix. Today's setup is fine; the next redeploy will break it again.
- **DNS propagation slow** — Funnel device DNS took ~6 minutes from expose to publicly resolvable today, versus ~85s in previous rounds. One data point, not enough to file; flagging if it reproduces.

Ready to go. Once Daniel's `.env` is pointed and his app runs, ping me if anything looks off and I'll re-probe.

— UIS Tester
