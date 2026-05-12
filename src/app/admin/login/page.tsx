import { redirect } from "next/navigation"

import { AdminLoginForm } from "@/components/admin/login-form"
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
  if (
    sp.manual !== "1" &&
    bootstrapAllowed &&
    jwtSecret &&
    envJwt &&
    verifyAdminSessionCookieValue(envJwt)
  ) {
    redirect("/api/admin/bootstrap-session")
  }

  const bootstrapMissing = sp.bootstrap === "missing"

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-16">
      {!jwtSecret ? (
        <p className="mb-8 max-w-md rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          Sett <code className="rounded bg-white px-1">JWT_SECRET</code> i{" "}
          <code className="rounded bg-white px-1">.env</code> (samme verdi som PostgREST bruker). Da kan du lime inn en
          gyldig staff‑JWT ved innlogging.
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
        <p className="mb-8 max-w-md rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          Fant ingen gyldig staff‑JWT i miljø (<code className="rounded bg-white px-1 text-xs">POSTGREST_ADMIN_JWT</code>{" "}
          / <code className="rounded bg-white px-1 text-xs">POSTGREST_STAFF_JWT_UIS</code>) som matcher{" "}
          <code className="rounded bg-white px-1 text-xs">JWT_SECRET</code>. Lim inn JWT eller bruk bootstrap‑passord.
        </p>
      ) : null}
      {jwtSecret ? (
        <>
          <AdminLoginForm allowJwt allowPassword={allowPassword} />
          <p className="mt-10 max-w-md text-center text-xs text-zinc-500">
            Økta lagrer PostgREST‑kompatibel HS256‑JWT i HttpOnly‑cookie (
            <code className="rounded bg-zinc-100 px-1 text-[11px]">JWT_SECRET</code>
            ). Bootstrap‑passord er valgfritt for utvikling — erstatt med OIDC/UIS‑flyt etter behov (
            <span className="font-mono text-[11px]">08-auth</span>).
            {bootstrapAllowed ? (
              <>
                {" "}
                Gyldig miljø‑JWT utløser automatisk innlogging ved besøk her — eller{" "}
                <a href="/admin/login?manual=1" className="font-medium text-red-700 hover:underline">
                  manuell innlogging
                </a>
                .
              </>
            ) : null}
          </p>
        </>
      ) : null}
    </main>
  )
}
