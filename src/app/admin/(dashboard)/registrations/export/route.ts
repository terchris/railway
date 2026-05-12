import { cookies } from "next/headers"
import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

import {
  applyRegistrationListFilters,
  fetchRegistrationIdsWithActivities,
  parseRegistrationListSearchParams,
} from "@/app/admin/(dashboard)/registrations/list-filter-utils"
import {
  ADMIN_SESSION_COOKIE,
  verifyAdminSessionCookieValue,
} from "@/lib/admin-session"
import { pgStaff } from "@/lib/admin-postgrest"

type RegExportRow = {
  id: number
  is_confirmed: boolean
  name: string
  email: string
  phone: string
  membership_status_id: number
  comment: string
  created_at: string
  updated_at: string
}

function csvEscape(value: string): string {
  if (/[",\r\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`
  return value
}

function rowCsv(r: RegExportRow): string {
  return [
    String(r.id),
    r.is_confirmed ? "true" : "false",
    csvEscape(r.name),
    csvEscape(r.email),
    csvEscape(r.phone),
    String(r.membership_status_id),
    csvEscape(r.comment),
    csvEscape(typeof r.created_at === "string" ? r.created_at : ""),
    csvEscape(typeof r.updated_at === "string" ? r.updated_at : ""),
  ].join(",")
}

const HEADER =
  "id,is_confirmed,name,email,phone,membership_status_id,comment,created_at,updated_at"

const BATCH = 1000

function csvFilenameParts(filters: ReturnType<typeof parseRegistrationListSearchParams>): string {
  const chunks: string[] = []
  if (filters.confirmed === true) chunks.push("-bekreftet")
  if (filters.confirmed === false) chunks.push("-ikke-bekreftet")
  if (filters.olderThanUtcYmd) chunks.push(`-for-${filters.olderThanUtcYmd}`)
  if (filters.hasActivity === true) chunks.push("-har-akt")
  if (filters.hasActivity === false) chunks.push("-uten-akt")
  return chunks.join("")
}

/** CSV-nedlasting; samme filter som liste-visning (`confirmed`, `older_than`, `has_activity`). */
export async function GET(req: NextRequest) {
  const raw = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value
  if (!verifyAdminSessionCookieValue(raw)) {
    return new NextResponse("Ikke innlogget.", { status: 401 })
  }

  const staff = await pgStaff()
  if (!staff) {
    return new NextResponse("Mangler PostgREST staff-token.", { status: 503 })
  }

  const sp: Record<string, string | undefined> = {}
  req.nextUrl.searchParams.forEach((v, k) => {
    sp[k] = v
  })
  const listFilters = parseRegistrationListSearchParams(sp)

  let activityRegistrationIds: number[] = []
  if (listFilters.hasActivity !== null) {
    try {
      activityRegistrationIds = await fetchRegistrationIdsWithActivities(staff)
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      return new NextResponse(`aktivitet-filter-feil: ${msg}`, { status: 502 })
    }
  }

  const cols =
    "id,is_confirmed,name,email,phone,membership_status_id,comment,created_at,updated_at"

  const rows: RegExportRow[] = []
  let from = 0

  while (true) {
    let q = staff.from("registrations").select(cols).order("created_at", { ascending: false }).range(from, from + BATCH - 1)
    q = applyRegistrationListFilters(q, listFilters, activityRegistrationIds)

    const { data, error } = await q
    if (error) {
      return new NextResponse(error.message, { status: 502 })
    }
    const chunk = Array.isArray(data) ? data : []
    for (const item of chunk) {
      rows.push(item as RegExportRow)
    }
    if (chunk.length < BATCH) break
    from += BATCH
  }

  const body =
    `\uFEFF${HEADER}\n` +
    rows
      .map((r) =>
        rowCsv({
          ...r,
          id: Number(r.id),
          membership_status_id: Number(r.membership_status_id),
        }),
      )
      .join("\n") +
    "\n"

  const date = new Date().toISOString().slice(0, 10)
  const filterPart = csvFilenameParts(listFilters)
  const filename = `registreringer${filterPart}-${date}.csv`

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  })
}
