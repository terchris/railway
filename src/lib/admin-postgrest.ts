import { pg } from "@/lib/postgrest"

/** PostgREST client using staff JWT; `null` when `POSTGREST_ADMIN_JWT` is unset. */
export function pgStaff() {
  const token = process.env.POSTGREST_ADMIN_JWT?.trim()
  if (!token) return null
  return pg(token)
}
