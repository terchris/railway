import Link from "next/link"

import {
  RegistrationRowSelectCheckbox,
  RegistrationsBulkDeleteBar,
  RegistrationsBulkProvider,
  RegistrationsBulkSelectHeader,
} from "@/app/admin/(dashboard)/registrations/bulk-delete-toolbar"
import { RegistrationListConfirmedToggle } from "@/app/admin/(dashboard)/registrations/registration-list-confirmed"
import {
  applyRegistrationListFilters,
  fetchRegistrationIdsWithActivities,
  parseRegistrationListSearchParams,
  registrationExportPath,
  registrationListPath,
} from "@/app/admin/(dashboard)/registrations/list-filter-utils"
import { StaffJwtMissing } from "@/components/admin/staff-jwt-missing"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { pgStaff } from "@/lib/admin-postgrest"
import { cn } from "@/lib/utils"

export const dynamic = "force-dynamic"

type Row = {
  id: number
  name: string
  email: string
  phone: string
  is_confirmed: boolean
  created_at: string
}

type PageProps = {
  searchParams?: Promise<Record<string, string | undefined>>
}

const PAGE_SIZE = 50

export default async function AdminRegistrationsPage({ searchParams }: PageProps) {
  const sp = ((await searchParams) ?? {}) as Record<string, string | undefined>

  const listFilters = parseRegistrationListSearchParams(sp)
  const rawPageNum = Number(sp.page ?? "1")
  const requestedPage =
    Number.isFinite(rawPageNum) && rawPageNum > 0 ? Math.trunc(rawPageNum) : 1

  const staff = await pgStaff()

  if (!staff) {
    return <StaffJwtMissing title="Registreringer" />
  }

  let activityRegistrationIds: number[] = []
  let activityFetchError: string | null = null
  if (listFilters.hasActivity !== null) {
    try {
      activityRegistrationIds = await fetchRegistrationIdsWithActivities(staff)
    } catch (e) {
      activityFetchError = e instanceof Error ? e.message : String(e)
    }
  }

  if (activityFetchError) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight">Registreringer</h1>
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
          Kunne ikke hente aktivitetsfilter: {activityFetchError}
        </p>
        <Link href="/admin/registrations" className="text-sm font-medium text-red-700 hover:underline">
          Nullstill filter
        </Link>
      </div>
    )
  }

  let baseCount = staff.from("registrations").select("id", { count: "exact", head: true })
  baseCount = applyRegistrationListFilters(baseCount, listFilters, activityRegistrationIds)

  const { count, error: countErr } = await baseCount
  const total = typeof count === "number" ? count : 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const page = Math.min(requestedPage, totalPages)
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  let pageQuery = staff.from("registrations").select("id,name,email,phone,is_confirmed,created_at").order("created_at", {
    ascending: false,
  })

  pageQuery = applyRegistrationListFilters(pageQuery, listFilters, activityRegistrationIds)

  pageQuery = pageQuery.range(from, to)

  const pageResult = await pageQuery

  const postgErr = countErr ?? pageResult.error
  const fetchErrorMsg = postgErr ? postgErr.message : null
  const rows = (Array.isArray(pageResult.data) ? pageResult.data : []) as Row[]
  const idsOnPage = rows.map((r) => Number(r.id))
  const showRangeStart = total === 0 ? 0 : from + 1
  const showRangeEnd = Math.min(from + PAGE_SIZE, total)

  const pill = (href: string, label: string, active: boolean) => (
    <Link
      href={href}
      className={cn(
        "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
        active
          ? "border-red-800 bg-red-50 text-red-900"
          : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-400",
      )}
    >
      {label}
    </Link>
  )

  const hrefAll = registrationListPath({ ...listFilters, confirmed: null }, 1)
  const hrefConfirmed = registrationListPath({ ...listFilters, confirmed: true }, 1)
  const hrefUnconfirmed = registrationListPath({ ...listFilters, confirmed: false }, 1)

  const exportHref = registrationExportPath(listFilters)

  const prevHref = registrationListPath(listFilters, Math.max(1, page - 1))
  const nextHref = registrationListPath(listFilters, page + 1)

  const hasActivityParam = typeof sp.has_activity === "string" ? sp.has_activity : ""

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Registreringer</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Paginerte rader ({PAGE_SIZE} per side){totalPages > 1 ? `. Side ${page} av ${totalPages}.` : null}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {pill(hrefAll, "Alle", listFilters.confirmed === null)}
            {pill(hrefConfirmed, "Bekreftet", listFilters.confirmed === true)}
            {pill(hrefUnconfirmed, "Ikke bekreftet", listFilters.confirmed === false)}
            <Button type="button" variant="secondary" size="sm" className="h-8" asChild>
              <a href={exportHref}>Eksporter CSV</a>
            </Button>
          </div>
        </div>
        <Link href="/admin" className="text-sm font-medium text-red-700 hover:underline">
          ← Oversikt
        </Link>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="border-b border-zinc-100 py-4">
          <CardTitle className="text-base">Filtrér</CardTitle>
          <p className="mt-1 text-xs text-zinc-500">
            Kombiner med bekreftet-filter og paginering. «Eldre enn» bruker UTC‑midnatt ved starten av datoen («opprettet
            før», strengere enn datoen).
          </p>
          <form method="get" className="mt-4 flex max-w-3xl flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
            {listFilters.confirmed === true && <input type="hidden" name="confirmed" value="true" />}
            {listFilters.confirmed === false && <input type="hidden" name="confirmed" value="false" />}
            <div className="space-y-1.5">
              <Label htmlFor="filter-older_than" className="text-xs uppercase tracking-wide text-zinc-500">
                Opprettet før (UTC‑dato)
              </Label>
              <Input id="filter-older_than" name="older_than" type="date" className="h-10 w-auto min-w-[10rem]" defaultValue={sp.older_than ?? ""} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="filter-has_activity" className="text-xs uppercase tracking-wide text-zinc-500">
                Aktivitetsvalg
              </Label>
              <select
                id="filter-has_activity"
                name="has_activity"
                defaultValue={hasActivityParam}
                className="flex h-10 min-w-[12rem] rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-red-600 focus:ring-2 focus:ring-red-200"
              >
                <option value="">Alle</option>
                <option value="true">Har minst én aktivitet</option>
                <option value="false">Ingen aktivitet valgt</option>
              </select>
            </div>
            <div className="flex flex-wrap gap-2 pb-px">
              <Button type="submit">Bruk filter</Button>
              <Button type="button" variant="secondary" size="sm" className="h-10 px-4" asChild>
                <Link href="/admin/registrations">Nullstill alle filter</Link>
              </Button>
            </div>
          </form>
        </CardHeader>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 border-b border-zinc-100 py-4">
          <CardTitle className="text-base">Tabell</CardTitle>
          <p className="text-xs text-zinc-500">
            Viser{" "}
            <span className="tabular-nums">
              {showRangeStart}-{showRangeEnd}
            </span>{" "}
            av{" "}
            <span className="tabular-nums">{total}</span>
          </p>
        </CardHeader>
        <CardContent className="p-0">
      {fetchErrorMsg ? (
            <p className="px-6 py-8 text-sm text-red-700">{fetchErrorMsg}</p>
          ) : rows.length === 0 ? (
            <p className="px-6 py-8 text-sm text-zinc-500">Ingen rader matcher filteret eller databasen er tom.</p>
          ) : (
            <RegistrationsBulkProvider key={registrationListPath(listFilters, page)} idsOnPage={idsOnPage}>
              <RegistrationsBulkDeleteBar />
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px] text-left text-sm">
                  <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
                    <tr>
                      <th className="text-center px-4 py-3 font-medium">
                        <RegistrationsBulkSelectHeader />
                      </th>
                      <th className="px-4 py-3 font-medium">ID</th>
                      <th className="px-4 py-3 font-medium">Navn</th>
                      <th className="px-4 py-3 font-medium">E-post</th>
                      <th className="px-4 py-3 font-medium">Telefon</th>
                      <th className="text-center px-4 py-3 font-medium">Bekr.</th>
                      <th className="px-4 py-3 font-medium">Opprettet</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {rows.map((r) => (
                      <tr key={r.id} className="bg-white hover:bg-zinc-50/80">
                        <td className="w-px px-2 py-2 text-center">
                          <RegistrationRowSelectCheckbox id={Number(r.id)} />
                        </td>
                        <td className="px-4 py-2.5 tabular-nums">
                          <Link href={`/admin/registrations/${r.id}`} className="font-medium text-red-700 hover:underline">
                            {r.id}
                          </Link>
                        </td>
                        <td className="max-w-[180px] truncate px-4 py-2.5">{r.name}</td>
                        <td className="max-w-[200px] truncate px-4 py-2.5">{r.email}</td>
                        <td className="whitespace-nowrap px-4 py-2.5">{r.phone}</td>
                        <td className="w-px px-2 py-2">
                          <RegistrationListConfirmedToggle registrationId={Number(r.id)} initialConfirmed={r.is_confirmed} />
                        </td>
                        <td suppressHydrationWarning className="whitespace-nowrap px-4 py-2.5 text-zinc-700">
                          {typeof r.created_at === "string" ? new Date(r.created_at).toLocaleString("nb-NO") : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </RegistrationsBulkProvider>
          )}
        </CardContent>
      </Card>

      {fetchErrorMsg === null && totalPages > 1 ? (
        <nav
          aria-label="Sidevisning"
          className="flex flex-wrap items-center justify-between gap-3 text-sm"
        >
          <div className="text-zinc-600">
            {page > 1 ? (
              <Link className="font-medium text-red-700 hover:underline" href={prevHref}>
                ← Forrige
              </Link>
            ) : (
              <span className="text-zinc-400">← Forrige</span>
            )}
          </div>
          <span className="tabular-nums text-zinc-700">
            Side {page} / {totalPages}
          </span>
          <div className="text-zinc-600">
            {page < totalPages ? (
              <Link className="font-medium text-red-700 hover:underline" href={nextHref}>
                Neste →
              </Link>
            ) : (
              <span className="text-zinc-400">Neste →</span>
            )}
          </div>
        </nav>
      ) : null}
    </div>
  )
}
