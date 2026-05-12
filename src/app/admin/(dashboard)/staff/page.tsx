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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Mine tilganger</h1>
        <p className="mt-1 max-w-2xl text-sm text-zinc-600">
          Ev. <span className="font-mono">capabilities</span> fra staff-JWT som brukes mot PostgREST. Selve databasen
          avgjør med RLS — dette er kun hva du ser i sidefeltet og hva Next prøver å vise.
        </p>
      </div>

      <Card>
        <CardHeader className="border-b border-zinc-100">
          <CardTitle className="text-base">JWT</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-4 text-sm text-zinc-700">
          <p>
            Bearer: <strong>{tokenPresent ? "tilgjengelig (økt eller server‑fallback)" : "mangler"}</strong>
          </p>
          <p>
            Utløp (<span className="font-mono">exp</span>): <strong>{expLabel}</strong>
          </p>
          <p className="text-xs text-zinc-500">
            Oppdater ved å logge inn på nytt med en fersk staff‑JWT. Valgfritt server‑fallback:{" "}
            <span className="font-mono">POSTGREST_ADMIN_JWT</span> /{" "}
            <span className="font-mono">POSTGREST_STAFF_JWT_UIS</span>. Lokal mint:{" "}
            <code className="rounded bg-zinc-100 px-1">node scripts/mint-staff-jwt.mjs</code>
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b border-zinc-100">
          <CardTitle className="text-base">Rå kapabiliteter (JWT)</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {sortedRaw.length === 0 ? (
            <p className="text-sm text-zinc-500">
              Klarte ikke å lese <span className="font-mono">capabilities</span> fra token — ugyldig JWT eller ukjent
              format.
            </p>
          ) : (
            <ul className="list-inside list-disc space-y-1 font-mono text-sm text-zinc-800">
              {sortedRaw.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b border-zinc-100">
          <CardTitle className="text-base">Effektiv meny‑tilgang</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <p className="mb-3 text-xs text-zinc-500">
            Om JWT inneholder <span className="font-mono">admin</span>, antar Next full kjent liste for meny ({KNOWN_CAPABILITY_GROUPS.length}{" "}
            roller).
          </p>
          <ul className="list-inside list-disc space-y-1 font-mono text-sm text-zinc-800">
            {sortedEff.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b border-zinc-100">
          <CardTitle className="text-base">
            Brukeradministrasjon (<span className="font-mono font-normal">auth.users</span>)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-4 text-sm text-zinc-700">
          <p>
            Postgres‑skjema <span className="font-mono">auth</span> er{" "}
            <strong>ikke eksponert gjennom PostgREST</strong> i Railway-oppsettet (kun{" "}
            <span className="font-mono">railway</span>-skjema). Invitasjoner, passord og tilgangsstyring for ansatte
            gjøres derfor via{" "}
            <strong>UIS</strong> og direkte tilkobling til databasen — ikke fra denne Next-appen ennå.
          </p>
          <p className="text-xs text-zinc-500">
            Se <span className="font-mono">db/02-schemas-and-extensions.sql</span> og auth‑notatene i prose-repo (
            <span className="font-mono">08-auth.md</span>) for målbilde.
          </p>
          <Link href="/admin" className="inline-block text-sm font-medium text-red-700 hover:underline">
            ← Oversikt
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
