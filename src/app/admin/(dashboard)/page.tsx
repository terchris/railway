import Link from "next/link"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { isStaffPostgrestJwtConfigured, pgStaff } from "@/lib/admin-postgrest"

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
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Oversikt</h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-600">
          Førsteutkast til adminflate. Liste over registreringer krever en PostgREST-JWT som har
          kapabiliteten <code className="rounded bg-zinc-100 px-1">registrations:read</code>
          — vanligvis fra innlogging (økt‑cookie). Miljø‑JWT er valgfritt fallback for drift.
        </p>
      </div>

      {!jwtConfigured ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          Ingen gyldig staff‑bearer tilgjengelig. Logg inn med staff‑JWT på{" "}
          <code className="rounded bg-white px-1 text-xs">/admin/login</code>, eller sett{" "}
          <code className="rounded bg-white px-1 text-xs">POSTGREST_ADMIN_JWT</code> /{" "}
          <code className="rounded bg-white px-1 text-xs">POSTGREST_STAFF_JWT_UIS</code> som server‑fallback (
          <code className="rounded bg-white px-1 text-xs">08-auth.md</code>).
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Antall registreringer</CardTitle>
          </CardHeader>
          <CardContent>
            {!jwtConfigured ? (
              <p className="text-sm text-zinc-500">Krever staff-JWT.</p>
            ) : countError ? (
              <p className="text-sm text-red-700">{countError}</p>
            ) : (
              <p className="text-3xl font-semibold tabular-nums">{registrationCount ?? "—"}</p>
            )}
            <Link
              href="/admin/registrations"
              className="mt-4 inline-block text-sm font-medium text-red-700 hover:underline"
            >
              Åpne tabellen →
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">App‑log · åpne varsler</CardTitle>
          </CardHeader>
          <CardContent>
            {!jwtConfigured ? (
              <p className="text-sm text-zinc-500">Krever staff-JWT.</p>
            ) : alertErr ? (
              <p className="text-sm text-red-700">{alertErr}</p>
            ) : alertCount !== null ? (
              <p className={`text-3xl font-semibold tabular-nums ${alertCount > 0 ? "text-red-700" : "text-zinc-900"}`}>
                {alertCount}
              </p>
            ) : (
              <p className="text-sm text-zinc-500">—</p>
            )}
            <p className="mt-3 text-xs text-zinc-500">
              Rader i <code className="rounded bg-zinc-100 px-1">railway.app_log</code> med{" "}
              <code className="rounded bg-zinc-100 px-1">alert = true</code>. Bruk helse‑endepunktet:
            </p>
            <div className="mt-3 flex flex-col gap-2 text-sm font-medium">
              <Link href="/admin/app-log" className="text-red-700 hover:underline">
                Åpne app‑logg →
              </Link>
              <Link href="/api/health" className="text-red-700 hover:underline">
                GET /api/health →
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Skjemainnhold · aktiviteter</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-zinc-600">
            <p>Velkomstteksten og aktivitetslista kommer fra PostgREST. Her slår du av/på rader eller justerer
              grenser og tekster på aktivitetsteget.</p>
            <ul className="mt-4 list-disc space-y-1 pl-4">
              <li>
                <Link href="/admin/activities" className="font-medium text-red-700 hover:underline">
                  Aktivitetstabell
                </Link>
              </li>
              <li>
                <Link href="/admin/activity-categories" className="font-medium text-red-700 hover:underline">
                  Kategorier
                </Link>
              </li>
              <li>
                <Link href="/admin/activity-settings" className="font-medium text-red-700 hover:underline">
                  Valg‑grenser
                </Link>
              </li>
              <li>
                <Link href="/admin/activities-text" className="font-medium text-red-700 hover:underline">
                  Tekster på aktivitetsteget
                </Link>
              </li>
            </ul>
            <Link href="/" className="mt-6 inline-block font-medium text-red-700 hover:underline">
              Åpne frivilligskjema →
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Videre innhold i skjema</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-zinc-600">
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
