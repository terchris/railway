/** Delte liste-filter for `/admin/registrations` (+ CSV-eksport). */

import type { PostgrestClient } from "@supabase/postgrest-js"

/** Minimal query-chain brukt på `railway.registrations`. */
interface RegistrationsTableQuery {
  eq(column: string, value: unknown): this
  lt(column: string, value: string): this
  in(column: string, values: number[]): this
  not(column: string, operator: string, value: unknown): this
}

export type RegistrationListFilters = {
  confirmed: boolean | null
  /** Gyldig `YYYY-MM-DD` → `created_at` < midnight UTC på denne datoen. */
  olderThanUtcYmd: string | null
  hasActivity: boolean | null
}

const YMD = /^\d{4}-\d{2}-\d{2}$/

export function parseOlderThanUtcYmd(raw: string | undefined): string | null {
  const s = (raw ?? "").trim()
  if (!s || !YMD.test(s)) return null
  const d = Date.parse(`${s}T00:00:00.000Z`)
  if (!Number.isFinite(d)) return null
  return s
}

export function parseHasActivity(raw: string | undefined): boolean | null {
  if (raw === "true") return true
  if (raw === "false") return false
  return null
}

export function parseRegistrationListSearchParams(sp: Record<string, string | undefined>): RegistrationListFilters {
  let confirmed: boolean | null = null
  if (sp.confirmed === "true") confirmed = true
  else if (sp.confirmed === "false") confirmed = false

  return {
    confirmed,
    olderThanUtcYmd: parseOlderThanUtcYmd(typeof sp.older_than === "string" ? sp.older_than : undefined),
    hasActivity: parseHasActivity(typeof sp.has_activity === "string" ? sp.has_activity : undefined),
  }
}

export function registrationListPath(filters: RegistrationListFilters, page?: number): string {
  const q = new URLSearchParams()
  if (filters.confirmed === true) q.set("confirmed", "true")
  if (filters.confirmed === false) q.set("confirmed", "false")
  if (filters.olderThanUtcYmd) q.set("older_than", filters.olderThanUtcYmd)
  if (filters.hasActivity === true) q.set("has_activity", "true")
  if (filters.hasActivity === false) q.set("has_activity", "false")
  const p = page ?? 1
  if (p > 1) q.set("page", String(Math.trunc(p)))
  const s = q.toString()
  return s ? `/admin/registrations?${s}` : `/admin/registrations`
}

/** Samme QueryString som liste, til CSV-rute. */
export function registrationExportPath(filters: RegistrationListFilters): string {
  const q = new URLSearchParams()
  if (filters.confirmed === true) q.set("confirmed", "true")
  if (filters.confirmed === false) q.set("confirmed", "false")
  if (filters.olderThanUtcYmd) q.set("older_than", filters.olderThanUtcYmd)
  if (filters.hasActivity === true) q.set("has_activity", "true")
  if (filters.hasActivity === false) q.set("has_activity", "false")
  const s = q.toString()
  return s ? `/admin/registrations/export?${s}` : `/admin/registrations/export`
}

export async function fetchRegistrationIdsWithActivities(staff: PostgrestClient): Promise<number[]> {
  const { data, error } = await staff.from("registration_activities").select("registration_id")
  if (error) throw new Error(error.message)
  const rows = Array.isArray(data) ? data : []
  const nums = rows
    .map((r) => Number((r as { registration_id: unknown }).registration_id))
    .filter((x) => Number.isFinite(x) && x > 0)
  return [...new Set(nums)]
}

/** Brukes på kjeder som `.from('registrations').select(...)` etter `.order` før `.range`. */
export function applyRegistrationListFilters<Q extends RegistrationsTableQuery>(
  q: Q,
  f: RegistrationListFilters,
  activityRegistrationIds: readonly number[],
): Q {
  let x = q
  if (f.confirmed === true) x = x.eq("is_confirmed", true)
  if (f.confirmed === false) x = x.eq("is_confirmed", false)
  if (f.olderThanUtcYmd) {
    x = x.lt("created_at", `${f.olderThanUtcYmd}T00:00:00.000Z`)
  }
  if (f.hasActivity === true) {
    const ids = [...activityRegistrationIds]
    if (ids.length === 0) x = x.eq("id", -1)
    else x = x.in("id", ids)
  }
  if (f.hasActivity === false && activityRegistrationIds.length > 0) {
    x = x.not(
      "id",
      "in",
      `(${activityRegistrationIds.filter((id) => Number.isFinite(id) && id > 0).join(",")})`,
    )
  }
  return x
}
