#!/usr/bin/env node
/**
 * Verifies PostgREST staff JWT + full admin SSR flow (cookie login, dashboards, logout).
 * Reads `.env`; does not echo secrets.
 */
import fs from "node:fs"
import path from "node:path"

const root = path.resolve(import.meta.dirname, "..")
const envPath = path.join(root, ".env")

function envValue(raw, key) {
  const m = raw.match(new RegExp(`^${key}=(.*)$`, "m"))
  if (!m) return ""
  let v = m[1]?.trim() ?? ""
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    v = v.slice(1, -1)
  }
  return v
}

/** `POSTGREST_ADMIN_JWT` wins; else UIS handoff variable. */
function staffJwtFromRaw(raw) {
  return envValue(raw, "POSTGREST_ADMIN_JWT") || envValue(raw, "POSTGREST_STAFF_JWT_UIS")
}

/** First-party cookie pairs from response (name=value); ignores Expires/etc. */
function cookieHeaderFromResponse(res) {
  const getter = /** @type {Headers & { getSetCookie?: () => string[] }} */ (res.headers).getSetCookie
  let parts = getter?.call(res.headers) ?? null
  if (!parts?.length) {
    const single = res.headers.get("set-cookie")
    if (!single) return ""
    /** Next may collapse to one header; railway_admin_session appears once — split on comma before name= only if brittle; prefer getSetCookie. */
    parts = [single.split(/,(?=\s*[A-Za-z_-]+=)/).map((s) => s.trim())].flat()
  }
  return parts.map((c) => c.split(";")[0].trim()).filter(Boolean).join("; ")
}

async function assertPostgRESTAdminJWt(pgUrl, token) {
  const u = `${pgUrl.replace(/\/$/, "")}/registrations?select=id&limit=1`
  const res = await fetch(u, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Accept-Profile": "railway",
      Prefer: "count=exact",
    },
  })
  const txt = await res.text()
  if (!res.ok) {
    console.error("[smoke] PostgREST /registrations failed:", res.status, txt.slice(0, 240))
    process.exit(2)
  }
  try {
    const j = JSON.parse(txt)
    if (!Array.isArray(j)) throw new Error("expected array JSON")
  } catch {
    console.error("[smoke] PostgREST response not JSON array:", txt.slice(0, 200))
    process.exit(2)
  }
}

async function main() {
  const raw = fs.readFileSync(envPath, "utf8")
  const jwtSecret = envValue(raw, "JWT_SECRET")
  const jwt = staffJwtFromRaw(raw)
  const pgUrl = envValue(raw, "POSTGREST_URL")

  const app = (process.env.APP_URL ?? "http://localhost:3010").replace(/\/$/, "")

  if (!jwtSecret) {
    console.error("[smoke] Missing JWT_SECRET in .env (required to verify HS256 session JWT on login)")
    process.exit(1)
  }
  if (!jwt) {
    console.error("[smoke] Missing POSTGREST_ADMIN_JWT or POSTGREST_STAFF_JWT_UIS in .env")
    process.exit(1)
  }
  if (!pgUrl) {
    console.error("[smoke] Missing POSTGREST_URL")
    process.exit(1)
  }

  await assertPostgRESTAdminJWt(pgUrl, jwt)

  const loginRes = await fetch(`${app}/api/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ staffJwt: jwt }),
  })
  if (!loginRes.ok) {
    const j = await loginRes.text()
    console.error("[smoke] Login failed:", loginRes.status, j)
    process.exit(3)
  }

  const cookies = cookieHeaderFromResponse(loginRes)
  if (!cookies || !cookies.includes("railway_admin_session=")) {
    console.error("[smoke] Login response missing Set-Cookie for admin session")
    process.exit(3)
  }

  const adminRes = await fetch(`${app}/admin`, {
    headers: { Cookie: cookies },
  })
  const adminHtml = await adminRes.text()
  if (!adminRes.ok) {
    console.error("[smoke] GET /admin failed:", adminRes.status)
    process.exit(4)
  }
  if (adminHtml.includes("Krever staff-JWT.")) {
    console.error("[smoke] Dashboard still shows staff-JWT placeholder — restart Next so staff env loads")
    process.exit(4)
  }
  if (
    !(adminHtml.includes("Antall registreringer") && adminHtml.includes("Åpne tabellen"))
  ) {
    console.error("[smoke] Dashboard HTML missing expected admin content")
    process.exit(4)
  }
  if (!/<p class="text-3xl font-semibold tabular-nums">\d+<\/p>/.test(adminHtml)) {
    const m = /<p class="text-sm text-red-700">([^<]*)<\/p>/.exec(adminHtml)
    console.error("[smoke] Registration count missing; PostgREST error:", m?.[1]?.trim() ?? "(none)")
    process.exit(4)
  }

  const regRes = await fetch(`${app}/admin/registrations`, {
    headers: { Cookie: cookies },
  })
  const regHtml = await regRes.text()
  if (!regRes.ok) {
    console.error("[smoke] GET /admin/registrations failed:", regRes.status)
    process.exit(5)
  }
  if (!/>\s*Tabell\s*<\/h3>/.test(regHtml)) {
    console.error("[smoke] Registrations page missing Tabell section — staff JWT unset or SSR error")
    process.exit(5)
  }
  const hasTable = regHtml.includes("<table") && regHtml.includes("Navn") && regHtml.includes("E-post")
  const emptyOk =
    regHtml.includes("Ingen rader ennå.") || regHtml.includes("Ingen rader matcher filteret eller databasen er tom.")
  const postgRESTErr =
    /<p class="[^"]*text-red-700[^"]*">([^<]*)<\/p>/.exec(regHtml)?.[1]?.trim() ?? ""

  if (!hasTable && !emptyOk && !postgRESTErr) {
    console.error("[smoke] Registrations body unexpected shape")
    process.exit(5)
  }
  if (postgRESTErr) {
    console.error("[smoke] PostgREST error on registrations page:", postgRESTErr)
    process.exit(6)
  }

  const outRes = await fetch(`${app}/api/admin/logout`, {
    method: "POST",
    headers: { Cookie: cookies },
  })
  if (!outRes.ok) {
    console.error("[smoke] Logout failed:", outRes.status)
    process.exit(7)
  }

  const gate = await fetch(`${app}/admin`, { redirect: "manual" })
  if (gate.status !== 307 && gate.status !== 302) {
    console.error("[smoke] Expected redirect to login after logout, got", gate.status)
    process.exit(8)
  }
  const loc = gate.headers.get("location") ?? ""
  if (!loc.includes("/admin/login")) {
    console.error("[smoke] Unexpected Location after unauthenticated /admin:", loc)
    process.exit(8)
  }

  console.log("[smoke] OK — PostgREST staff JWT, /admin count, /admin/registrations, logout gate")
}

main().catch((e) => {
  console.error("[smoke]", e)
  process.exit(99)
})
