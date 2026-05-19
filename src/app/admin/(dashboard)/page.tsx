import Link from "next/link"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { isStaffPostgrestJwtConfigured, pgStaff } from "@/lib/admin-postgrest"

import styles from "./page.module.css"

export const dynamic = "force-dynamic"

export default async function AdminDashboardPage() {
  const staff = await pgStaff()
  let registrationCount: number | null = null
  let countError: string | null = null

  if (staff) {
    const r = await staff.from("registrations").select("id", { count: "exact", head: true })
    if (r.error) countError = r.error.message
    else registrationCount = r.count ?? 0
  }

  let alertCount: number | null = null
  let alertErr: string | null = null
  if (staff) {
    const ac = await staff.rpc("app_log_alert_count", undefined, { get: true })
    if (ac.error) alertErr = ac.error.message
    else if (typeof ac.data === "number" && Number.isFinite(ac.data)) alertCount = ac.data
    else if (typeof ac.data === "string" && ac.data.trim() !== "") alertCount = Number(ac.data)
  }

  const jwtConfigured = await isStaffPostgrestJwtConfigured()

  return (
    <div className={styles.page}>
      <div className={styles.intro}>
        <h1 className={styles.title}>Oversikt</h1>
        <p className={styles.lead}>
          Førsteutkast til adminflate. Liste over registreringer krever en PostgREST-JWT som har
          kapabiliteten <code className={styles.code}>registrations:read</code>
          — vanligvis fra innlogging (økt‑cookie). Miljø‑JWT er valgfritt fallback for drift.
        </p>
      </div>

      {!jwtConfigured ? (
        <p className={styles.warningBanner}>
          Ingen gyldig staff‑bearer tilgjengelig. Logg inn med staff‑JWT på{" "}
          <code className={styles.codeOnLight}>/admin/login</code>, eller sett{" "}
          <code className={styles.codeOnLight}>POSTGREST_ADMIN_JWT</code> /{" "}
          <code className={styles.codeOnLight}>POSTGREST_STAFF_JWT_UIS</code> som server‑fallback (
          <code className={styles.codeOnLight}>08-auth.md</code>).
        </p>
      ) : null}

      <div className={styles.grid}>
        <Card>
          <CardHeader className={styles.cardHeaderTight}>
            <CardTitle className={styles.cardTitle}>Antall registreringer</CardTitle>
          </CardHeader>
          <CardContent>
            {!jwtConfigured ? (
              <p className={styles.muted}>Krever staff-JWT.</p>
            ) : countError ? (
              <p className={styles.errorText}>{countError}</p>
            ) : (
              <p className={styles.statNumber}>{registrationCount ?? "—"}</p>
            )}
            <Link href="/admin/registrations" className={styles.cardLink}>
              Åpne tabellen →
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className={styles.cardHeaderTight}>
            <CardTitle className={styles.cardTitle}>App‑log · åpne varsler</CardTitle>
          </CardHeader>
          <CardContent>
            {!jwtConfigured ? (
              <p className={styles.muted}>Krever staff-JWT.</p>
            ) : alertErr ? (
              <p className={styles.errorText}>{alertErr}</p>
            ) : alertCount !== null ? (
              <p className={alertCount > 0 ? styles.statNumberAlert : styles.statNumber}>{alertCount}</p>
            ) : (
              <p className={styles.muted}>—</p>
            )}
            <p className={styles.cardCaption}>
              Rader i <code className={styles.code}>railway.app_log</code> med{" "}
              <code className={styles.code}>alert = true</code>. Bruk helse‑endepunktet:
            </p>
            <div className={styles.linkCol}>
              <Link href="/admin/app-log" className={styles.cardLinkInline}>
                Åpne app‑logg →
              </Link>
              <Link href="/api/health" className={styles.cardLinkInline}>
                GET /api/health →
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className={styles.cardHeaderTight}>
            <CardTitle className={styles.cardTitle}>Skjemainnhold · aktiviteter</CardTitle>
          </CardHeader>
          <CardContent className={styles.cardBody}>
            <p>
              Velkomstteksten og aktivitetslista kommer fra PostgREST. Her slår du av/på rader eller justerer
              grenser og tekster på aktivitetsteget.
            </p>
            <ul className={styles.bulletList}>
              <li>
                <Link href="/admin/activities" className={styles.cardLinkInline}>
                  Aktivitetstabell
                </Link>
              </li>
              <li>
                <Link href="/admin/activity-categories" className={styles.cardLinkInline}>
                  Kategorier
                </Link>
              </li>
              <li>
                <Link href="/admin/activity-settings" className={styles.cardLinkInline}>
                  Valg‑grenser
                </Link>
              </li>
              <li>
                <Link href="/admin/activities-text" className={styles.cardLinkInline}>
                  Tekster på aktivitetsteget
                </Link>
              </li>
            </ul>
            <Link href="/" className={styles.cardLink}>
              Åpne frivilligskjema →
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className={styles.cardHeaderTight}>
            <CardTitle className={styles.cardTitle}>Videre innhold i skjema</CardTitle>
          </CardHeader>
          <CardContent className={styles.cardBody}>
            <p>
              Språkliste, medlemskapsspørsmål, alternativ for «ingen aktivitet», og evalueringsspørsmål ligger ved
              siden av aktivitetene i Postgres. Egne adminsider kan bygges når dere vil ha dem.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
