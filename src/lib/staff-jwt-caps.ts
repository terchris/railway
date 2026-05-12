import { staffPostgrestJwt } from "@/lib/admin-postgrest"
import { decodeJwtPayloadUnsafe } from "@/lib/staff-jwt-hs256"

/** Known capability strings referenced by Railway admin UI / RLS (`08-auth.md` patterns). */
export const KNOWN_CAPABILITY_GROUPS = [
  "admin",
  "registrations:read",
  "registrations:write",
  "content:read",
  "content:write",
  "app_log:read",
  "app_log:write",
  "users:read",
  "users:write",
] as const

/** Raw capability strings embedded in the configured staff JWT (PostgREST `request.jwt.claims`). */
export async function parseStaffJwtCapabilitiesRaw(): Promise<string[]> {
  const token = await staffPostgrestJwt()
  if (!token) return []
  const payload = decodeJwtPayloadUnsafe(token)
  if (!payload) return []
  const caps = payload.capabilities
  if (!Array.isArray(caps)) return []
  return caps.filter((x): x is string => typeof x === "string")
}

/**
 * Effective capability set for **admin UI gating only**.
 * When `admin` is present, treat as broad access for sidebar links.
 * PostgREST/RLS remains authoritative for actual reads/writes.
 */
export async function staffEffectiveCapabilitySet(): Promise<Set<string>> {
  const raw = await parseStaffJwtCapabilitiesRaw()
  const set = new Set(raw)
  if (set.has("admin")) {
    return new Set(KNOWN_CAPABILITY_GROUPS)
  }
  return set
}

export async function staffJwtExpiryUnix(): Promise<number | null> {
  const token = await staffPostgrestJwt()
  if (!token) return null
  const payload = decodeJwtPayloadUnsafe(token)
  if (!payload || typeof payload.exp !== "number") return null
  return payload.exp
}
