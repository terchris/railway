import Link from "next/link"

import { StaffJwtMissing } from "@/components/admin/staff-jwt-missing"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { isStaffPostgrestJwtConfigured, staffPostgrestJwt } from "@/lib/admin-postgrest"
import {
  KNOWN_CAPABILITY_GROUPS,
  parseStaffJwtCapabilitiesRaw,
  staffEffectiveCapabilitySet,
  staffJwtExpiryUnix,
} from "@/lib/staff-jwt-caps"

import adminStyles from "@/app/admin/(dashboard)/admin.module.css"
import styles from "./page.module.css"

export const dynamic = "force-dynamic"

export default async function AdminStaffPage() {
  const configured = await isStaffPostgrestJwtConfigured()
  const tokenPresent = !!(await staffPostgrestJwt())

  if (!configured) {
    return <StaffJwtMissing title="Mine tilganger" />
  }

  const rawCaps = await parseStaffJwtCapabilitiesRaw()
  const effective = await staffEffectiveCapabilitySet()
  const exp = await staffJwtExpiryUnix()
  const expLabel =
    exp === null
      ? "Ukjent"
      : new Date(exp * 1000).toLocaleString("nb-NO", { dateStyle: "medium", timeStyle: "short" })

  const sortedRaw = [...rawCaps].sort((a, b) => a.localeCompare(b))
  const sortedEff = [...effective].sort((a, b) => a.localeCompare(b))

  return (
    <div className={adminStyles.page}>
      <div className={adminStyles.pageHeaderInner}>
        <h1 className={adminStyles.pageTitle}>Mine tilganger</h1>
        <p className={adminStyles.pageLead}>
          Ev. <span className={adminStyles.mono}>capabilities</span> fra staff-JWT som brukes mot PostgREST. Selve databasen
          avgjør med RLS — dette er kun hva du ser i sidefeltet og hva Next prøver å vise.
        </p>
      </div>

      <Card>
        <CardHeader className={adminStyles.sectionCardHeader}>
          <CardTitle className={adminStyles.sectionCardTitle}>JWT</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={styles.cardBody}>
            <p>
              Bearer: <strong>{tokenPresent ? "tilgjengelig (økt eller server‑fallback)" : "mangler"}</strong>
            </p>
            <p>
              Utløp (<span className={adminStyles.mono}>exp</span>): <strong>{expLabel}</strong>
            </p>
            <p className={adminStyles.fineprint}>
              Oppdater ved å logge inn på nytt med en fersk staff‑JWT. Valgfritt server‑fallback:{" "}
              <span className={adminStyles.mono}>POSTGREST_ADMIN_JWT</span> /{" "}
              <span className={adminStyles.mono}>POSTGREST_STAFF_JWT_UIS</span>. Lokal mint:{" "}
              <code className={adminStyles.code}>node scripts/mint-staff-jwt.mjs</code>
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className={adminStyles.sectionCardHeader}>
          <CardTitle className={adminStyles.sectionCardTitle}>Rå kapabiliteter (JWT)</CardTitle>
        </CardHeader>
        <CardContent>
          {sortedRaw.length === 0 ? (
            <p className={adminStyles.smallMuted}>
              Klarte ikke å lese <span className={adminStyles.mono}>capabilities</span> fra token — ugyldig JWT eller ukjent
              format.
            </p>
          ) : (
            <ul className={styles.capList}>
              {sortedRaw.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className={adminStyles.sectionCardHeader}>
          <CardTitle className={adminStyles.sectionCardTitle}>Effektiv meny‑tilgang</CardTitle>
        </CardHeader>
        <CardContent>
          <p className={adminStyles.fineprint}>
            Om JWT inneholder <span className={adminStyles.mono}>admin</span>, antar Next full kjent liste for meny ({KNOWN_CAPABILITY_GROUPS.length}{" "}
            roller).
          </p>
          <ul className={styles.capList}>
            {sortedEff.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className={adminStyles.sectionCardHeader}>
          <CardTitle className={adminStyles.sectionCardTitle}>
            Brukeradministrasjon (<span className={adminStyles.mono}>auth.users</span>)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={styles.cardBody}>
            <p>
              Postgres‑skjema <span className={adminStyles.mono}>auth</span> er{" "}
              <strong>ikke eksponert gjennom PostgREST</strong> i Railway-oppsettet (kun{" "}
              <span className={adminStyles.mono}>railway</span>-skjema). Invitasjoner, passord og tilgangsstyring for ansatte
              gjøres derfor via <strong>UIS</strong> og direkte tilkobling til databasen — ikke fra denne Next-appen ennå.
            </p>
            <p className={adminStyles.fineprint}>
              Se <span className={adminStyles.mono}>db/02-schemas-and-extensions.sql</span> og auth‑notatene i prose-repo (
              <span className={adminStyles.mono}>08-auth.md</span>) for målbilde.
            </p>
            <Link href="/admin" className={adminStyles.actionLink}>
              ← Oversikt
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
