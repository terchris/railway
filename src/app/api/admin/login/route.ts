import { NextResponse } from "next/server"
import { cookies } from "next/headers"

import {
  ADMIN_SESSION_COOKIE,
  adminPasswordMatches,
  adminSessionCookieOptsForToken,
  mintBootstrapStaffJwt,
  verifyAdminSessionCookieValue,
} from "@/lib/admin-session"

export async function POST(req: Request) {
  const jwtSecret = process.env.JWT_SECRET?.trim()
  if (!jwtSecret) {
    return NextResponse.json(
      {
        error:
          "Sett JWT_SECRET (samme Hemmelighet som PostgREST bruker til å verifisere staff‑JWT). Da kan du lime inn staff‑JWT eller bruke bootstrap‑passord.",
      },
      { status: 503 },
    )
  }

  const adminPw = process.env.ADMIN_PASSWORD?.trim()

  let body: { password?: string; staffJwt?: string }
  try {
    body = (await req.json()) as { password?: string; staffJwt?: string }
  } catch {
    return NextResponse.json({ error: "Ugyldig JSON." }, { status: 400 })
  }

  const trimmedJwt = typeof body.staffJwt === "string" ? body.staffJwt.trim() : ""
  const password = typeof body.password === "string" ? body.password : ""

  const cookieStore = await cookies()

  if (trimmedJwt.length > 0) {
    if (!verifyAdminSessionCookieValue(trimmedJwt)) {
      return NextResponse.json({ error: "Ugyldig eller utløpt staff‑JWT." }, { status: 401 })
    }
    cookieStore.set(ADMIN_SESSION_COOKIE, trimmedJwt, adminSessionCookieOptsForToken(trimmedJwt))
    return NextResponse.json({ ok: true })
  }

  if (adminPw && password.length > 0) {
    if (!adminPasswordMatches(password, adminPw)) {
      return NextResponse.json({ error: "Feil passord." }, { status: 401 })
    }
    const minted = mintBootstrapStaffJwt(jwtSecret)
    cookieStore.set(ADMIN_SESSION_COOKIE, minted, adminSessionCookieOptsForToken(minted))
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json(
    { error: adminPw ? "Lim inn staff‑JWT eller skriv bootstrap‑passord." : "Lim inn gyldig staff‑JWT." },
    { status: 400 },
  )
}
