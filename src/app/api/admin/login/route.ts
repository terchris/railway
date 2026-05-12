import { NextResponse } from "next/server"
import { cookies } from "next/headers"

import {
  ADMIN_SESSION_COOKIE,
  adminPasswordMatches,
  adminSessionCookieOpts,
  mintAdminSessionCookieValue,
} from "@/lib/admin-session"

export async function POST(req: Request) {
  const adminPw = process.env.ADMIN_PASSWORD?.trim()
  if (!adminPw) {
    return NextResponse.json(
      { error: "Admin er ikke konfigurert (mangler ADMIN_PASSWORD)." },
      { status: 503 },
    )
  }

  let body: { password?: string }
  try {
    body = (await req.json()) as { password?: string }
  } catch {
    return NextResponse.json({ error: "Ugyldig JSON." }, { status: 400 })
  }

  const provided = typeof body.password === "string" ? body.password : ""
  if (!adminPasswordMatches(provided, adminPw)) {
    return NextResponse.json({ error: "Feil passord." }, { status: 401 })
  }

  let token: string
  try {
    token = mintAdminSessionCookieValue()
  } catch {
    return NextResponse.json(
      { error: "Mangler ADMIN_COOKIE_SECRET (hemmelig nøkkel for økt)." },
      { status: 503 },
    )
  }

  const cookieStore = await cookies()
  cookieStore.set(ADMIN_SESSION_COOKIE, token, adminSessionCookieOpts())

  return NextResponse.json({ ok: true })
}
