import { redirect } from "next/navigation"

import { AdminLoginForm } from "@/components/admin/login-form"
import { DummyLoginPicker } from "@/components/admin/dummy-login-picker"
import { verifyAdminSessionCookieValue } from "@/lib/admin-session"
import { envStaffPostgrestJwt } from "@/lib/admin-postgrest"

import styles from "./page.module.css"

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
    <main className={styles.main}>
      {!jwtSecret ? (
        <p className={styles.notice}>
          Sett <code className={styles.codeOnLight}>JWT_SECRET</code> i{" "}
          <code className={styles.codeOnLight}>.env</code> (samme verdi som PostgREST bruker). Da kan dummy‑login og
          manuell innlogging minte/verifisere staff‑JWT.
          {process.env.ADMIN_PASSWORD?.trim() ? (
            <>
              {" "}
              Du har <code className={styles.codeOnLight}>ADMIN_PASSWORD</code>, men bootstrap‑passord krever også{" "}
              <code className={styles.codeOnLight}>JWT_SECRET</code> for å minte økt‑JWT lokalt.
            </>
          ) : null}
        </p>
      ) : null}
      {bootstrapMissing ? (
        <p className={styles.notice}>
          Fant ingen gyldig staff‑JWT i miljø (<code className={styles.codeOnLight}>POSTGREST_ADMIN_JWT</code>{" "}
          / <code className={styles.codeOnLight}>POSTGREST_STAFF_JWT_UIS</code>) som matcher{" "}
          <code className={styles.codeOnLight}>JWT_SECRET</code>. Velg dummy‑rolle eller bruk manuell innlogging.
        </p>
      ) : null}
      {jwtSecret ? (
        <>
          <DummyLoginPicker />
          <div className={styles.manualBlock}>
            {showManual ? (
              <AdminLoginForm allowJwt allowPassword={allowPassword} />
            ) : (
              <a href="/admin/login?manual=1" className={styles.manualLink}>
                Manuell innlogging (lim inn staff‑JWT)
              </a>
            )}
          </div>
          <p className={styles.footnote}>
            Økta lagrer PostgREST‑kompatibel HS256‑JWT i HttpOnly‑cookie (
            <code className={styles.code}>JWT_SECRET</code>
            ). Dummy‑login og bootstrap‑passord er utviklingsstillas — erstatt med OIDC/UIS‑flyt etter behov (
            <span className={styles.mono}>08-auth</span>).
            {bootstrapAllowed && envJwtValid ? (
              <>
                {" "}
                Gyldig miljø‑JWT finnes — bruk{" "}
                <a href="/admin/login?auto=1" className={styles.footnoteLink}>
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
