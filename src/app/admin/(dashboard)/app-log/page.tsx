import Link from "next/link"

import { ClearAppLogAlertButton } from "@/app/admin/(dashboard)/app-log/clear-alert-button"
import { StaffJwtMissing } from "@/components/admin/staff-jwt-missing"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { pgStaff } from "@/lib/admin-postgrest"
import { cn } from "@/lib/utils"

export const dynamic = "force-dynamic"

const PAGE_SIZE = 50

const LOG_TYPES = ["INFO", "WARNING", "ERROR", "REGISTRATION"] as const
type LogType = (typeof LOG_TYPES)[number]

type LogRow = {
  id: number
  type: string
  category: string
  alert: boolean
  message: string
  created_at: string
}

type Search = {
  page: number
  alertOnly: boolean
  typeFilter: LogType | null
}

function parseSearch(sp: Record<string, string | undefined>): Search {
  const rawPage = Number(sp.page ?? "1")
  const page = Number.isFinite(rawPage) && rawPage > 0 ? Math.trunc(rawPage) : 1
  const alertOnly = sp.alert_only === "1" || sp.alert_only === "true"
  const t = sp.type?.toUpperCase() ?? ""
  const typeFilter = LOG_TYPES.includes(t as LogType) ? (t as LogType) : null
  return { page, alertOnly, typeFilter }
}

function buildQuery(s: Omit<Search, "page"> & { page?: number }) {
  const q = new URLSearchParams()
  if (s.page !== undefined && s.page > 1) q.set("page", String(s.page))
  if (s.alertOnly) q.set("alert_only", "1")
  if (s.typeFilter) q.set("type", s.typeFilter)
  const str = q.toString()
  return str ? `/admin/app-log?${str}` : "/admin/app-log"
}

function typeBadgeClasses(t: string) {
  switch (t) {
    case "ERROR":
      return "bg-red-100 text-red-900"
    case "WARNING":
      return "bg-amber-100 text-amber-950"
    case "REGISTRATION":
      return "bg-sky-100 text-sky-900"
    default:
      return "bg-zinc-100 text-zinc-800"
  }
}

type PageProps = { searchParams?: Promise<Record<string, string | undefined>> }

export default async function AdminAppLogPage({ searchParams }: PageProps) {
  const sp = ((await searchParams) ?? {}) as Record<string, string | undefined>
  const { page, alertOnly, typeFilter } = parseSearch(sp)

  const staff = await pgStaff()
  if (!staff) return <StaffJwtMissing title="App‑logg" />

  const fromIdx = (page - 1) * PAGE_SIZE
  const toIdx = fromIdx + PAGE_SIZE - 1

  let qb = staff
    .from("app_log")
    .select("id,type,category,alert,message,created_at", { count: "exact" })
    .order("created_at", { ascending: false })

  if (alertOnly) qb = qb.eq("alert", true)
  if (typeFilter) qb = qb.eq("type", typeFilter)

  const result = await qb.range(fromIdx, toIdx)

  const errMsg = result.error?.message ?? null
  const total = result.count ?? 0
  const rows: LogRow[] = (Array.isArray(result.data) ? result.data : []).map((r) => ({
    id: Number((r as LogRow).id),
    type: String((r as LogRow).type),
    category: String((r as LogRow).category),
    alert: Boolean((r as LogRow).alert),
    message: String((r as LogRow).message ?? ""),
    created_at: String((r as LogRow).created_at ?? ""),
  }))

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const filterBase = { alertOnly, typeFilter }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">App‑logg</h1>
          <p className="mt-1 max-w-2xl text-sm text-zinc-600">
            Drifts- og registreringsmeldinger i <span className="font-mono">railway.app_log</span>. Krever{' '}
            <span className="font-mono">app_log:read</span>
            {' · '}«Kvitt varsel» setter <span className="font-mono">alert=false</span> og krever{' '}
            <span className="font-mono">app_log:write</span>.
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin">← Oversikt</Link>
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="mr-2 text-zinc-500">Filter:</span>
        <Button variant={alertOnly ? "default" : "outline"} size="sm" asChild>
          <Link href={buildQuery({ ...filterBase, alertOnly: !alertOnly, page: 1 })}>
            {alertOnly ? "Kun åpne varsler (på)" : "Kun åpne varsler"}
          </Link>
        </Button>
        <Button variant={typeFilter === null ? "default" : "outline"} size="sm" asChild>
          <Link href={buildQuery({ alertOnly, typeFilter: null, page: 1 })}>Alle typer</Link>
        </Button>
        {LOG_TYPES.map((t) => (
          <Button key={t} variant={typeFilter === t ? "default" : "outline"} size="sm" asChild>
            <Link href={buildQuery({ alertOnly, typeFilter: t, page: 1 })}>{t}</Link>
          </Button>
        ))}
      </div>

      {errMsg ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">{errMsg}</p>
      ) : (
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row flex-wrap items-end justify-between gap-2 border-b border-zinc-100 py-4">
            <CardTitle className="text-base">Loggposter</CardTitle>
            <p className="text-xs text-zinc-500 tabular-nums">
              Totalt <strong>{total}</strong>
              {totalPages > 1 ? (
                <>
                  {' · '}side <strong>{page}</strong> av <strong>{totalPages}</strong>
                </>
              ) : null}
            </p>
          </CardHeader>
          <CardContent className="p-0">
            {rows.length === 0 ? (
              <p className="px-6 py-8 text-sm text-zinc-500">Ingen rader matcher filteret (eller tom logg).</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="border-b border-zinc-100 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
                    <tr>
                      <th className="whitespace-nowrap px-4 py-3 font-medium">Tid</th>
                      <th className="whitespace-nowrap px-4 py-3 font-medium">Type</th>
                      <th className="px-4 py-3 font-medium">Kategori</th>
                      <th className="whitespace-nowrap px-4 py-3 font-medium">Varsel</th>
                      <th className="min-w-[200px] px-4 py-3 font-medium">Melding</th>
                      <th className="whitespace-nowrap px-4 py-3 font-medium">Handling</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {rows.map((r) => (
                      <tr key={r.id} className={cn("align-top", r.alert ? "bg-red-50/40" : "bg-white")}>
                        <td className="whitespace-nowrap px-4 py-2.5 text-xs tabular-nums text-zinc-700">
                          {(() => {
                            const d = new Date(r.created_at)
                            return Number.isNaN(d.getTime())
                              ? r.created_at
                              : d.toLocaleString("nb-NO", {
                                  dateStyle: "short",
                                  timeStyle: "medium",
                                })
                          })()}
                        </td>
                        <td className="whitespace-nowrap px-4 py-2.5">
                          <span
                            className={cn(
                              "inline-flex rounded-full px-2 py-0.5 text-xs font-semibold uppercase",
                              typeBadgeClasses(r.type),
                            )}
                          >
                            {r.type}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-zinc-800">{r.category}</td>
                        <td className="whitespace-nowrap px-4 py-2.5">{r.alert ? "Ja" : "Nei"}</td>
                        <td className="max-w-xl px-4 py-2.5 text-xs text-zinc-800">
                          <div className="max-h-32 overflow-auto whitespace-pre-wrap break-words" title={r.message}>
                            {r.message}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-4 py-2.5">
                          {r.alert ? <ClearAppLogAlertButton logId={r.id} /> : <span className="text-xs text-zinc-400">—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {totalPages > 1 && !errMsg ? (
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
          {page > 1 ? (
            <Button variant="outline" size="sm" asChild>
              <Link href={buildQuery({ ...filterBase, page: page - 1 })}>Forrige side</Link>
            </Button>
          ) : (
            <Button variant="outline" size="sm" disabled>
              Forrige side
            </Button>
          )}
          <span className="tabular-nums text-zinc-600">
            Side {page} av {totalPages}
          </span>
          {page < totalPages ? (
            <Button variant="outline" size="sm" asChild>
              <Link href={buildQuery({ ...filterBase, page: page + 1 })}>Neste side</Link>
            </Button>
          ) : (
            <Button variant="outline" size="sm" disabled>
              Neste side
            </Button>
          )}
        </div>
      ) : null}
    </div>
  )
}
