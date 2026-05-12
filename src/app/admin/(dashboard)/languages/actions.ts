"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { nudgeLexicographicSortRows } from "@/lib/admin-sort-nudge"
import { requireAdminStaff } from "@/lib/require-admin-staff"

function revPublic() {
  revalidatePath("/admin/languages")
  revalidatePath("/admin/skemadata")
  revalidatePath("/")
}

export async function nudgeUserLanguageOrder(id: number, dir: "up" | "down") {
  const g = await requireAdminStaff()
  if (!g.ok) throw new Error(g.msg)
  await nudgeLexicographicSortRows(g.staff, "user_languages", id, dir)
  revPublic()
  revalidatePath("/admin/print/form")
}

export async function toggleUserLanguageEnabled(id: number, nextEnabled: boolean) {
  const g = await requireAdminStaff()
  if (!g.ok) throw new Error(g.msg)
  const { error } = await g.staff.from("user_languages").update({ is_enabled: nextEnabled }).eq("id", id)
  if (error) throw new Error(error.message)
  revPublic()
  revalidatePath("/admin/print/form")
}

export async function toggleUserLanguagePlaceAtTop(id: number, placeAtTop: boolean) {
  const g = await requireAdminStaff()
  if (!g.ok) throw new Error(g.msg)
  const { error } = await g.staff.from("user_languages").update({ place_at_top: placeAtTop }).eq("id", id)
  if (error) throw new Error(error.message)
  revPublic()
}

export async function updateUserLanguageFromForm(formData: FormData) {
  const g = await requireAdminStaff()
  if (!g.ok) throw new Error(g.msg)

  const id = Math.trunc(Number(formData.get("id")))
  const name = String(formData.get("name") ?? "").trim()
  if (!Number.isFinite(id) || id <= 0) throw new Error("Ugyldig språk")
  if (!name) throw new Error("Navn kan ikke være tomt")

  const { error } = await g.staff.from("user_languages").update({ name }).eq("id", id)
  if (error) throw new Error(error.message)
  revPublic()
  redirect("/admin/languages")
}
