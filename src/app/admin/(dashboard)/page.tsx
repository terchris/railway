import Link from "next/link"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { pgStaff } from "@/lib/admin-postgrest"

export const dynamic = "force-dynamic"

export default async function AdminDashboardPage() {
  const staff = pgStaff()
  let registrationCount: number | null = null
  let countError: string | null = null

  if (staff) {
    const r = await staff.from("registrations").select("id", { count: "exact", head: true })
    if (r.error) countError = r.error.message
    else registrationCount = r.count ?? 0
  }

  const jwtConfigured = !!process.env.POSTGREST_ADMIN_JWT?.trim()

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Oversikt</h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-600">
          Førsteutkast til adminflate. Liste over registreringer krever en PostgREST-JWT som har
          kapabiliteten <code className="rounded bg-zinc-100 px-1">registrations:read</code>.
        </p>
      </div>

      {!jwtConfigured ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          Sett <code className="rounded bg-white px-1 text-xs">POSTGREST_ADMIN_JWT</code> i{" "}
          <code className="rounded bg-white px-1 text-xs">.env</code> med en gyldig staff-token fra
          UIS (samme roller som beskrevet i <code className="rounded bg-white px-1">08-auth.md</code>
          ).
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
            <CardTitle className="text-base">Offentlig skjema</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-zinc-600">
            <p>Endringsfunksjon for innhold kommer seinere; skjemaet ligger på forsiden.</p>
            <Link href="/" className="mt-4 inline-block font-medium text-red-700 hover:underline">
              Åpne frivilligskjema →
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
