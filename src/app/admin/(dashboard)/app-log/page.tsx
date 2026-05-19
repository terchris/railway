import Link from "next/link"

import { ClearAppLogAlertButton } from "@/app/admin/(dashboard)/app-log/clear-alert-button"
import { StaffJwtMissing } from "@/components/admin/staff-jwt-missing"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { pgStaff } from "@/lib/admin-postgrest"

import adminStyles from "@/app/admin/(dashboard)/admin.module.css"
import styles from "./page.module.css"

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

function typeBadgeClass(t: string): string {
  switch (t) {
    case "ERROR":
      return styles.typeBadgeError
    case "WARNING":
      return styles.typeBadgeWarning
    case "REGISTRATION":
      return styles.typeBadgeInfo
    default:
      return styles.typeBadgeNeutral
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
    <div className={adminStyles.page}>
      <div className={adminStyles.pageHeader}>
        <div className={adminStyles.pageHeaderInner}>
          <h1 className={adminStyles.pageTitle}>App‑logg</h1>
          <p className={adminStyles.pageLead}>
            Drifts- og registreringsmeldinger i <span className={adminStyles.mono}>railway.app_log</span>. Krever{" "}
            <span className={adminStyles.mono}>app_log:read</span>
            {" · "}«Kvitt varsel» setter <span className={adminStyles.mono}>alert=false</span> og krever{" "}
            <span className={adminStyles.mono}>app_log:write</span>.
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin">← Oversikt</Link>
        </Button>
      </div>

      <div className={styles.filterRow}>
        <span className={styles.filterRowLabel}>Filter:</span>
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
        <p className={adminStyles.errorBanner}>{errMsg}</p>
      ) : (
        <Card className={adminStyles.sectionCard}>
          <CardHeader className={adminStyles.sectionCardHeaderRow}>
            <CardTitle className={adminStyles.sectionCardTitle}>Loggposter</CardTitle>
            <p className={adminStyles.sectionCardHint}>
              Totalt <strong>{total}</strong>
              {totalPages > 1 ? (
                <>
                  {" · "}side <strong>{page}</strong> av <strong>{totalPages}</strong>
                </>
              ) : null}
            </p>
          </CardHeader>
          <CardContent className={adminStyles.sectionCardBodyFlush}>
            {rows.length === 0 ? (
              <p className={adminStyles.tableEmpty}>Ingen rader matcher filteret (eller tom logg).</p>
            ) : (
              <div className={adminStyles.tableScroll}>
                <table className={`${adminStyles.table} ${styles.minWidthTable}`}>
                  <thead className={adminStyles.tableHead}>
                    <tr>
                      <th>Tid</th>
                      <th>Type</th>
                      <th>Kategori</th>
                      <th>Varsel</th>
                      <th>Melding</th>
                      <th>Handling</th>
                    </tr>
                  </thead>
                  <tbody className={adminStyles.tableBody}>
                    {rows.map((r) => (
                      <tr key={r.id} className={r.alert ? styles.rowAlert : undefined}>
                        <td className={styles.cellTime}>
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
                        <td className={adminStyles.tableCellNowrap}>
                          <span className={typeBadgeClass(r.type)}>{r.type}</span>
                        </td>
                        <td className={adminStyles.tableCell}>{r.category}</td>
                        <td className={adminStyles.tableCellNowrap}>{r.alert ? "Ja" : "Nei"}</td>
                        <td className={styles.cellMessage}>
                          <div className={styles.messageBox} title={r.message}>
                            {r.message}
                          </div>
                        </td>
                        <td className={adminStyles.tableCellNowrap}>
                          {r.alert ? <ClearAppLogAlertButton logId={r.id} /> : <span className={styles.dashCell}>—</span>}
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
        <div className={adminStyles.pagination}>
          {page > 1 ? (
            <Button variant="outline" size="sm" asChild>
              <Link href={buildQuery({ ...filterBase, page: page - 1 })}>Forrige side</Link>
            </Button>
          ) : (
            <Button variant="outline" size="sm" disabled>
              Forrige side
            </Button>
          )}
          <span className={adminStyles.paginationCount}>
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
