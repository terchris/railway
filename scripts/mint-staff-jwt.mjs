#!/usr/bin/env node
/**
 * Emit a HS256 JWT for PostgREST `authenticated` role (local/dev only).
 * Reads JWT_SECRET from project root `.env`. Claim shape matches railway.has_capability().
 *
 * Usage: node scripts/mint-staff-jwt.mjs [--no-print]
 */
import { createHmac } from "node:crypto"
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

function base64Url(buf) {
  return Buffer.from(buf)
    .toString("base64")
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/, "")
}

const envText = fs.readFileSync(envPath, "utf8")
const secret = envValue(envText, "JWT_SECRET")
if (!secret) {
  console.error(`Missing JWT_SECRET in ${envPath}`)
  process.exit(1)
}

/** Broad staff capabilities for exercising admin surfaces; tighten in prod. */
const payload = {
  role: "authenticated",
  capabilities: [
    "registrations:read",
    "registrations:write",
    "content:read",
    "content:write",
    "app_log:read",
    "app_log:write",
  ],
  exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 365,
  aud: "railway",
}

const header = { alg: "HS256", typ: "JWT" }
const hb = Buffer.from(JSON.stringify(header), "utf8")
const pb = Buffer.from(JSON.stringify(payload), "utf8")
const h = base64Url(hb)
const p = base64Url(pb)
const sig = createHmac("sha256", secret).update(`${h}.${p}`).digest()
const jwt = `${h}.${p}.${base64Url(sig)}`

if (!process.argv.includes("--no-print")) {
  console.log(jwt)
}
