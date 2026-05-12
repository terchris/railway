"use server"

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"

import {
  ADMIN_SESSION_COOKIE,
  verifyAdminSessionCookieValue,
} from "@/lib/admin-session"
import { pgStaff } from "@/lib/admin-postgrest"

async function staffConn() {
  const raw = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value
  if (!verifyAdminSessionCookieValue(raw)) {
    return { ok: false as const, msg: "Ikke innlogget." }
  }
  const staff = await pgStaff()
  if (!staff) return { ok: false as const, msg: "Mangler PostgREST staff-token." }
  return { ok: true as const, staff }
}

type Dir = "up" | "down"

/**
 * Flytt én aktivitetskategori én posisjon i rekkefølgen (determinert av `sort_order`, deretter id).
 * Re-nummeriserer alle kategoriers `sort_order` sekvensielt for å slippe kollisterte verdier ved bytte.
 */
export async function nudgeCategoryOrder(categoryId: number, dir: Dir) {
  const g = await staffConn()
  if (!g.ok) throw new Error(g.msg)
  const cid = Math.trunc(Number(categoryId))
  if (!Number.isFinite(cid) || cid <= 0) throw new Error("Ugyldig kategori")

  const { data, error } = await g.staff.from("activity_categories").select("id,sort_order")

  if (error) throw new Error(error.message)
  const typed = (
    Array.isArray(data)
      ? (data as { id: unknown; sort_order: unknown }[]).map((r) => ({
          id: Number(r.id),
          sort_order: Math.trunc(Number(r.sort_order)),
        }))
      : []
  ).filter((r) => Number.isFinite(r.id) && Number.isFinite(r.sort_order))

  typed.sort((a, b) => (a.sort_order !== b.sort_order ? a.sort_order - b.sort_order : a.id - b.id))

  const ids = typed.map((r) => r.id)
  const idx = ids.indexOf(cid)
  if (idx < 0) throw new Error("Kategorien ble ikke funnet")

  const nextIds = [...ids]
  if (dir === "up" && idx > 0) {
    const t = nextIds[idx - 1]
    nextIds[idx - 1] = nextIds[idx]
    nextIds[idx] = t
  } else if (dir === "down" && idx < nextIds.length - 1) {
    const t = nextIds[idx]
    nextIds[idx] = nextIds[idx + 1]
    nextIds[idx + 1] = t
  }

  for (let i = 0; i < nextIds.length; i++) {
    const { error: uErr } = await g.staff.from("activity_categories").update({ sort_order: i }).eq("id", nextIds[i])
    if (uErr) throw new Error(uErr.message)
  }

  revalidatePath("/admin/activity-categories")
  revalidatePath("/admin/activities")
  revalidatePath("/")
}
