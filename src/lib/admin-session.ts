import { createHash, timingSafeEqual } from "node:crypto"

import { decodeJwtPayloadUnsafe, mintHs256Jwt, verifyHs256Jwt } from "@/lib/staff-jwt-hs256"

export const ADMIN_SESSION_COOKIE = "railway_admin_session"

/** Upper bound on HttpOnly cookie lifetime (JWT `exp` may be sooner). */
const SESSION_TTL_SEC = 60 * 60 * 24 * 7 // 7 days

/** SHA-256 digests for fixed-length timing-safe comparison. */
function digestPassword(pw: string): Buffer {
  return createHash("sha256").update(pw, "utf8").digest()
}

/** True when provided password matches `ADMIN_PASSWORD` (bootstrap login only). */
export function adminPasswordMatches(provided: string, expectedPlain: string): boolean {
  if (!provided || !expectedPlain) return false
  try {
    return timingSafeEqual(digestPassword(provided), digestPassword(expectedPlain))
  } catch {
    return false
  }
}

/**
 * Validates HS256 JWT signed with `JWT_SECRET`, unexpired, `role = authenticated`.
 * Cookie holds the same bearer PostgREST expects on `Authorization`.
 */
export function verifyAdminSessionCookieValue(token: string | undefined): boolean {
  if (!token?.trim()) return false
  const secret = process.env.JWT_SECRET?.trim()
  if (!secret) return false
  const r = verifyHs256Jwt(secret, token.trim())
  if (!r.ok) return false
  return r.payload.role === "authenticated"
}

export function cookieMaxAgeSecForStaffJwt(token: string): number {
  const payload = decodeJwtPayloadUnsafe(token.trim())
  const exp = payload?.exp
  if (typeof exp !== "number" || !Number.isFinite(exp)) return SESSION_TTL_SEC
  const left = exp - Math.floor(Date.now() / 1000)
  return Math.max(60, Math.min(left, SESSION_TTL_SEC))
}

export function adminSessionCookieOptsForToken(token: string) {
  return {
    httpOnly: true as const,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/" as const,
    maxAge: cookieMaxAgeSecForStaffJwt(token),
  }
}

/** Mint a broad-capabilities staff JWT for password bootstrap (requires `JWT_SECRET`). */
export function mintBootstrapStaffJwt(secret: string): string {
  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL_SEC
  return mintHs256Jwt(secret, {
    role: "authenticated",
    capabilities: [
      "registrations:read",
      "registrations:write",
      "content:read",
      "content:write",
      "app_log:read",
      "app_log:write",
    ],
    exp,
    aud: "railway",
  })
}
