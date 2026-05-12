import { cookies } from "next/headers"

import {
  ADMIN_SESSION_COOKIE,
  verifyAdminSessionCookieValue,
} from "@/lib/admin-session"
import { pg } from "@/lib/postgrest"

/** Sync read — server‑kun bearer fra miljø (POSTGREST_ADMIN_JWT / POSTGREST_STAFF_JWT_UIS). */
export function envStaffPostgrestJwt(): string | undefined {
  const a = process.env.POSTGREST_ADMIN_JWT?.trim()
  if (a) return a
  return process.env.POSTGREST_STAFF_JWT_UIS?.trim() || undefined
}

/** Aktiv staff bearer: først gyldig JWT fra innloggings‑cookie, ellers miljøvariabel. */
export async function staffPostgrestJwt(): Promise<string | undefined> {
  const jar = await cookies()
  const raw = jar.get(ADMIN_SESSION_COOKIE)?.value?.trim()
  if (raw && verifyAdminSessionCookieValue(raw)) return raw
  return envStaffPostgrestJwt()
}

export async function isStaffPostgrestJwtConfigured(): Promise<boolean> {
  return !!(await staffPostgrestJwt())
}

/** PostgREST client using staff JWT; `null` when ingen bearer er tilgjengelig. */
export async function pgStaff() {
  const token = await staffPostgrestJwt()
  if (!token) return null
  return pg(token)
}
