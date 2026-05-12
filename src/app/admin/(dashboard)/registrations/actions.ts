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

/** Updates `railway.registrations.is_confirmed` (requires registrations:write). */
export async function setRegistrationConfirmed(id: number, isConfirmed: boolean) {
  const g = await staffConn()
  if (!g.ok) throw new Error(g.msg)
  const { error } = await g.staff.from("registrations").update({ is_confirmed: isConfirmed }).eq("id", id)
  if (error) throw new Error(error.message)
  revalidatePath("/admin/registrations")
  revalidatePath(`/admin/registrations/${id}`)
  revalidatePath("/admin")
}

const DELETE_BATCH = 100

/** Hard delete `railway.registrations` (+ barn cascade). Krever registrations:delete policy. */
export async function deleteRegistrationsByIds(ids: number[]) {
  const g = await staffConn()
  if (!g.ok) throw new Error(g.msg)
  const uniq = [
    ...new Set(
      ids
        .map((x) => Math.trunc(Number(x)))
        .filter((x) => Number.isFinite(x) && x > 0),
    ),
  ]
  if (uniq.length === 0) throw new Error("Ingen gyldige id-er.")

  for (let i = 0; i < uniq.length; i += DELETE_BATCH) {
    const slice = uniq.slice(i, i + DELETE_BATCH)
    const { error } = await g.staff.from("registrations").delete().in("id", slice)
    if (error) throw new Error(error.message)
  }

  revalidatePath("/admin/registrations")
  revalidatePath("/admin")
}

export async function deleteRegistrationById(id: number) {
  const nid = Math.trunc(Number(id))
  if (!Number.isFinite(nid) || nid <= 0) throw new Error("Ugyldig id.")

  await deleteRegistrationsByIds([nid])
}
