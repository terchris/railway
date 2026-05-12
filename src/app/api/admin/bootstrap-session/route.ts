import { NextResponse } from "next/server"

import {
  ADMIN_SESSION_COOKIE,
  adminSessionCookieOptsForToken,
  verifyAdminSessionCookieValue,
} from "@/lib/admin-session"
import { envStaffPostgrestJwt } from "@/lib/admin-postgrest"

/** Miljø‑JWT → HttpOnly økt‑cookie (kun dev eller eksplisitt opt‑in — ikke eksponer på åpent Internett). */
export async function GET(req: Request) {
  const allowed =
    process.env.NODE_ENV === "development" ||
    process.env.ADMIN_BOOTSTRAP_SESSION_FROM_ENV === "1"
  if (!allowed) {
    return NextResponse.json({ error: "Ikke aktivert." }, { status: 404 })
  }

  const jwt = envStaffPostgrestJwt()
  const loginMissing = new URL("/admin/login?bootstrap=missing", req.url)

  if (!jwt || !verifyAdminSessionCookieValue(jwt)) {
    return NextResponse.redirect(loginMissing)
  }

  const adminUrl = new URL("/admin", req.url)
  const res = NextResponse.redirect(adminUrl)
  const opts = adminSessionCookieOptsForToken(jwt)
  res.cookies.set(ADMIN_SESSION_COOKIE, jwt, opts)
  return res
}
