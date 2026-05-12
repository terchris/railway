import { cookies } from "next/headers"

import {
  ADMIN_SESSION_COOKIE,
  verifyAdminSessionCookieValue,
} from "@/lib/admin-session"
import { pgStaff } from "@/lib/admin-postgrest"

export type RequireAdminStaffResult =
  | { ok: true; staff: NonNullable<Awaited<ReturnType<typeof pgStaff>>> }
  | { ok: false; msg: string }

export async function requireAdminStaff(): Promise<RequireAdminStaffResult> {
  const raw = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value
  if (!verifyAdminSessionCookieValue(raw)) {
    return { ok: false, msg: "Ikke innlogget." }
  }
  const staff = await pgStaff()
  if (!staff) return { ok: false, msg: "Mangler PostgREST staff-token." }
  return { ok: true, staff }
}
