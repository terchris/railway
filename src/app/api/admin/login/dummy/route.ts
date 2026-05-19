import { cookies } from "next/headers"
import { NextResponse } from "next/server"

import {
  ADMIN_SESSION_COOKIE,
  adminSessionCookieOptsForToken,
  verifyAdminSessionCookieValue,
} from "@/lib/admin-session"
import { findRoleProfile } from "@/lib/dummy-login-roles"
import { mintHs256Jwt } from "@/lib/staff-jwt-hs256"

const SESSION_TTL_SEC = 60 * 60 * 24 * 7

export async function POST(req: Request) {
  const jwtSecret = process.env.JWT_SECRET?.trim()
  if (!jwtSecret) {
    return NextResponse.json(
      {
        error:
          "Sett JWT_SECRET (samme Hemmelighet som PostgREST bruker til å verifisere staff‑JWT). Dummy‑login kan ikke minte økt‑JWT uten den.",
      },
      { status: 503 },
    )
  }

  let body: { profileId?: unknown }
  try {
    body = (await req.json()) as { profileId?: unknown }
  } catch {
    return NextResponse.json({ error: "Ugyldig JSON." }, { status: 400 })
  }

  const profileId = typeof body.profileId === "string" ? body.profileId.trim() : ""
  if (!profileId) {
    return NextResponse.json({ error: "Mangler profileId." }, { status: 400 })
  }

  const profile = findRoleProfile(profileId)
  if (!profile) {
    return NextResponse.json({ error: `Ukjent profileId: ${profileId}` }, { status: 404 })
  }
  if (profile.disabled) {
    return NextResponse.json(
      { error: `Profilen «${profile.label}» kan ikke logges inn som: ${profile.disabledReason ?? "non-session role."}` },
      { status: 409 },
    )
  }

  const cookieStore = await cookies()

  if (profile.sessionRole === "anon") {
    cookieStore.set(ADMIN_SESSION_COOKIE, "", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
    })
    return NextResponse.json({ ok: true, redirect: "/" })
  }

  if (profile.sessionRole !== "authenticated" || !profile.capabilities) {
    return NextResponse.json(
      { error: `Profilen «${profile.label}» mangler kapabiliteter for staff‑JWT.` },
      { status: 500 },
    )
  }

  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL_SEC
  const minted = mintHs256Jwt(jwtSecret, {
    role: "authenticated",
    capabilities: [...profile.capabilities],
    aud: "railway",
    exp,
  })

  if (!verifyAdminSessionCookieValue(minted)) {
    return NextResponse.json(
      { error: "Mintet JWT verifiserte ikke mot JWT_SECRET — sjekk konfigurasjon." },
      { status: 500 },
    )
  }

  cookieStore.set(ADMIN_SESSION_COOKIE, minted, adminSessionCookieOptsForToken(minted))
  return NextResponse.json({ ok: true, redirect: "/admin" })
}
