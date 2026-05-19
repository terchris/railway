import { redirect } from "next/navigation"

import { AdminLoginForm } from "@/components/admin/login-form"
import { DummyLoginPicker } from "@/components/admin/dummy-login-picker"
import { verifyAdminSessionCookieValue } from "@/lib/admin-session"
import { envStaffPostgrestJwt } from "@/lib/admin-postgrest"

type PageProps = { searchParams?: Promise<Record<string, string | undefined>> }

export default async function AdminLoginPage({ searchParams }: PageProps) {
  const sp = ((await searchParams) ?? {}) as Record<string, string | undefined>
  const jwtSecret = !!process.env.JWT_SECRET?.trim()
  const allowPassword = !!(jwtSecret && process.env.ADMIN_PASSWORD?.trim())

  const bootstrapAllowed =
    process.env.NODE_ENV === "development" || process.env.ADMIN_BOOTSTRAP_SESSION_FROM_ENV === "1"

  const envJwt = envStaffPostgrestJwt()
  const envJwtValid = jwtSecret && envJwt ? verifyAdminSessionCookieValue(envJwt) : false

  // Opt-in: ?auto=1 triggers the env-JWT bootstrap (CI / smoke / power users).
  // Default is the dummy picker.
  if (sp.auto === "1" && bootstrapAllowed && envJwtValid) {
    redirect("/api/admin/bootstrap-session")
  }

  const bootstrapMissing = sp.bootstrap === "missing"
  const showManual = sp.manual === "1"

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 px-4 py-16">
      {!jwtSecret ? (
        <p className="max-w-md rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          Sett <code className="rounded bg-white px-1">JWT_SECRET</code> i{" "}
          <code className="rounded bg-white px-1">.env</code> (samme verdi som PostgREST bruker). Da kan dummy‑login og
          manuell innlogging minte/verifisere staff‑JWT.
          {process.env.ADMIN_PASSWORD?.trim() ? (
            <>
              {" "}
              Du har <code className="rounded bg-white px-1">ADMIN_PASSWORD</code>, men bootstrap‑passord krever også{" "}
              <code className="rounded bg-white px-1">JWT_SECRET</code> for å minte økt‑JWT lokalt.
            </>
          ) : null}
        </p>
      ) : null}
      {bootstrapMissing ? (
        <p className="max-w-md rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          Fant ingen gyldig staff‑JWT i miljø (<code className="rounded bg-white px-1 text-xs">POSTGREST_ADMIN_JWT</code>{" "}
          / <code className="rounded bg-white px-1 text-xs">POSTGREST_STAFF_JWT_UIS</code>) som matcher{" "}
          <code className="rounded bg-white px-1 text-xs">JWT_SECRET</code>. Velg dummy‑rolle eller bruk manuell
          innlogging.
        </p>
      ) : null}
      {jwtSecret ? (
        <>
          <DummyLoginPicker />
          <div className="flex flex-col items-center gap-3">
            {showManual ? (
              <AdminLoginForm allowJwt allowPassword={allowPassword} />
            ) : (
              <a
                href="/admin/login?manual=1"
                className="text-sm font-medium text-red-700 underline-offset-2 hover:underline"
              >
                Manuell innlogging (lim inn staff‑JWT)
              </a>
            )}
          </div>
          <p className="max-w-2xl text-center text-xs text-zinc-500">
            Økta lagrer PostgREST‑kompatibel HS256‑JWT i HttpOnly‑cookie (
            <code className="rounded bg-zinc-100 px-1 text-[11px]">JWT_SECRET</code>
            ). Dummy‑login og bootstrap‑passord er utviklingsstillas — erstatt med OIDC/UIS‑flyt etter behov (
            <span className="font-mono text-[11px]">08-auth</span>).
            {bootstrapAllowed && envJwtValid ? (
              <>
                {" "}
                Gyldig miljø‑JWT finnes — bruk{" "}
                <a href="/admin/login?auto=1" className="font-medium text-red-700 hover:underline">
                  automatisk innlogging fra miljø
                </a>{" "}
                hvis du ikke vil velge rolle.
              </>
            ) : null}
          </p>
        </>
      ) : null}
    </main>
  )
}
