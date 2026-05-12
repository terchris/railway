"use server"

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"

import {
  ADMIN_SESSION_COOKIE,
  verifyAdminSessionCookieValue,
} from "@/lib/admin-session"
import { pgStaff } from "@/lib/admin-postgrest"
import { ALL_TEXT_CONTENT_KEYS } from "@/lib/text-content-keys"

async function staffConn() {
  const raw = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value
  if (!verifyAdminSessionCookieValue(raw)) {
    return { ok: false as const, msg: "Ikke innlogget." }
  }
  const staff = await pgStaff()
  if (!staff) return { ok: false as const, msg: "Mangler PostgREST staff-token." }
  return { ok: true as const, staff }
}

/** Oppdater alle redaksjonelle `railway.text_content`-felt på singleton-raden. */
export async function updateFullTextContent(formData: FormData) {
  const g = await staffConn()
  if (!g.ok) throw new Error(g.msg)

  const patch: Record<string, string> = {}
  for (const key of ALL_TEXT_CONTENT_KEYS) {
    patch[key] = String(formData.get(key) ?? "")
  }

  const { error } = await g.staff.from("text_content").update(patch).eq("id", true)
  if (error) throw new Error(error.message)

  revalidatePath("/admin/text-content")
  revalidatePath("/admin/activities-text")
  revalidatePath("/")
}
