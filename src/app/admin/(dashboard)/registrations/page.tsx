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

import adminStyles from "@/app/admin/(dashboard)/admin.module.css"
import styles from "./registrations.module.css"

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
      <div className={adminStyles.page}>
        <h1 className={adminStyles.pageTitle}>Registreringer</h1>
        <p className={adminStyles.errorBanner}>
          Kunne ikke hente aktivitetsfilter: {activityFetchError}
        </p>
        <Link href="/admin/registrations" className={adminStyles.actionLink}>
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
    <Link href={href} className={active ? adminStyles.filterPillActive : adminStyles.filterPill}>
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
    <div className={adminStyles.page}>
      <div className={adminStyles.pageHeader}>
        <div className={adminStyles.pageHeaderInner}>
          <h1 className={adminStyles.pageTitle}>Registreringer</h1>
          <p className={adminStyles.pageLead}>
            Paginerte rader ({PAGE_SIZE} per side){totalPages > 1 ? `. Side ${page} av ${totalPages}.` : null}
          </p>
          <div className={adminStyles.filterPillRow}>
            {pill(hrefAll, "Alle", listFilters.confirmed === null)}
            {pill(hrefConfirmed, "Bekreftet", listFilters.confirmed === true)}
            {pill(hrefUnconfirmed, "Ikke bekreftet", listFilters.confirmed === false)}
            <Button type="button" variant="secondary" size="sm" asChild>
              <a href={exportHref}>Eksporter CSV</a>
            </Button>
          </div>
        </div>
        <Link href="/admin" className={adminStyles.actionLink}>
          ← Oversikt
        </Link>
      </div>

      <Card className={adminStyles.sectionCard}>
        <CardHeader className={adminStyles.sectionCardHeader}>
          <CardTitle className={adminStyles.sectionCardTitle}>Filtrér</CardTitle>
          <p className={adminStyles.sectionCardHint}>
            Kombiner med bekreftet-filter og paginering. «Eldre enn» bruker UTC‑midnatt ved starten av datoen («opprettet
            før», strengere enn datoen).
          </p>
          <form method="get" className={styles.filterForm}>
            {listFilters.confirmed === true && <input type="hidden" name="confirmed" value="true" />}
            {listFilters.confirmed === false && <input type="hidden" name="confirmed" value="false" />}
            <div className={styles.filterField}>
              <Label htmlFor="filter-older_than" className={adminStyles.fieldLabelEyebrow}>
                Opprettet før (UTC‑dato)
              </Label>
              <Input
                id="filter-older_than"
                name="older_than"
                type="date"
                className={styles.filterDateInput}
                defaultValue={sp.older_than ?? ""}
              />
            </div>
            <div className={styles.filterField}>
              <Label htmlFor="filter-has_activity" className={adminStyles.fieldLabelEyebrow}>
                Aktivitetsvalg
              </Label>
              <select
                id="filter-has_activity"
                name="has_activity"
                defaultValue={hasActivityParam}
                className={adminStyles.selectInline}
              >
                <option value="">Alle</option>
                <option value="true">Har minst én aktivitet</option>
                <option value="false">Ingen aktivitet valgt</option>
              </select>
            </div>
            <div className={adminStyles.formActions}>
              <Button type="submit">Bruk filter</Button>
              <Button type="button" variant="secondary" asChild>
                <Link href="/admin/registrations">Nullstill alle filter</Link>
              </Button>
            </div>
          </form>
        </CardHeader>
      </Card>

      <Card className={adminStyles.sectionCard}>
        <CardHeader className={adminStyles.sectionCardHeaderRow}>
          <CardTitle className={adminStyles.sectionCardTitle}>Tabell</CardTitle>
          <p className={adminStyles.sectionCardHint}>
            Viser{" "}
            <span className={adminStyles.numCell}>
              {showRangeStart}-{showRangeEnd}
            </span>{" "}
            av <span className={adminStyles.numCell}>{total}</span>
          </p>
        </CardHeader>
        <CardContent className={adminStyles.sectionCardBodyFlush}>
          {fetchErrorMsg ? (
            <p className={adminStyles.tableError}>{fetchErrorMsg}</p>
          ) : rows.length === 0 ? (
            <p className={adminStyles.tableEmpty}>Ingen rader matcher filteret eller databasen er tom.</p>
          ) : (
            <RegistrationsBulkProvider key={registrationListPath(listFilters, page)} idsOnPage={idsOnPage}>
              <RegistrationsBulkDeleteBar />
              <div className={adminStyles.tableScroll}>
                <table className={`${adminStyles.table} ${styles.minWidthTable}`}>
                  <thead className={adminStyles.tableHead}>
                    <tr>
                      <th className={adminStyles.tableHeadCenter}>
                        <RegistrationsBulkSelectHeader />
                      </th>
                      <th>ID</th>
                      <th>Navn</th>
                      <th>E-post</th>
                      <th>Telefon</th>
                      <th className={adminStyles.tableHeadCenter}>Bekr.</th>
                      <th>Opprettet</th>
                    </tr>
                  </thead>
                  <tbody className={adminStyles.tableBody}>
                    {rows.map((r) => (
                      <tr key={r.id}>
                        <td className={adminStyles.tableCellCenter}>
                          <RegistrationRowSelectCheckbox id={Number(r.id)} />
                        </td>
                        <td className={adminStyles.tableCellNum}>
                          <Link href={`/admin/registrations/${r.id}`} className={styles.idLink}>
                            {r.id}
                          </Link>
                        </td>
                        <td className={`${adminStyles.tableCell} ${adminStyles.truncMid}`}>{r.name}</td>
                        <td className={`${adminStyles.tableCell} ${adminStyles.truncWide}`}>{r.email}</td>
                        <td className={adminStyles.tableCellNowrap}>{r.phone}</td>
                        <td className={adminStyles.tableCellCenter}>
                          <RegistrationListConfirmedToggle registrationId={Number(r.id)} initialConfirmed={r.is_confirmed} />
                        </td>
                        <td suppressHydrationWarning className={adminStyles.tableCellNowrap}>
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
        <nav aria-label="Sidevisning" className={adminStyles.pagination}>
          <div>
            {page > 1 ? (
              <Link className={adminStyles.paginationLink} href={prevHref}>
                ← Forrige
              </Link>
            ) : (
              <span className={adminStyles.paginationDisabled}>← Forrige</span>
            )}
          </div>
          <span className={adminStyles.paginationCount}>
            Side {page} / {totalPages}
          </span>
          <div>
            {page < totalPages ? (
              <Link className={adminStyles.paginationLink} href={nextHref}>
                Neste →
              </Link>
            ) : (
              <span className={adminStyles.paginationDisabled}>Neste →</span>
            )}
          </div>
        </nav>
      ) : null}
    </div>
  )
}
