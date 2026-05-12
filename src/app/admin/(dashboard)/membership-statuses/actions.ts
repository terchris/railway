"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { nudgeLexicographicSortRows } from "@/lib/admin-sort-nudge"
import { requireAdminStaff } from "@/lib/require-admin-staff"

function rev() {
  revalidatePath("/admin/membership-statuses")
  revalidatePath("/admin/skemadata")
  revalidatePath("/")
  revalidatePath("/admin/print/form")
}

export async function nudgeMembershipStatusOrder(id: number, dir: "up" | "down") {
  const g = await requireAdminStaff()
  if (!g.ok) throw new Error(g.msg)
  await nudgeLexicographicSortRows(g.staff, "membership_statuses", id, dir)
  rev()
}

export async function toggleMembershipStatusEnabled(id: number, nextEnabled: boolean) {
  const g = await requireAdminStaff()
  if (!g.ok) throw new Error(g.msg)
  const { error } = await g.staff.from("membership_statuses").update({ is_enabled: nextEnabled }).eq("id", id)
  if (error) throw new Error(error.message)
  rev()
}

export async function toggleMembershipStatusShowOptions(id: number, showOptions: boolean) {
  const g = await requireAdminStaff()
  if (!g.ok) throw new Error(g.msg)
  const { error } = await g.staff
    .from("membership_statuses")
    .update({ show_membership_options: showOptions })
    .eq("id", id)
  if (error) throw new Error(error.message)
  rev()
}

export async function updateMembershipStatusLabelFromForm(formData: FormData) {
  const g = await requireAdminStaff()
  if (!g.ok) throw new Error(g.msg)
  const id = Math.trunc(Number(formData.get("id")))
  const label = String(formData.get("label") ?? "").trim()
  if (!Number.isFinite(id) || id <= 0) throw new Error("Ugyldig rad")
  if (!label) throw new Error("Etikett kan ikke være tom")
  const { error } = await g.staff.from("membership_statuses").update({ label }).eq("id", id)
  if (error) throw new Error(error.message)
  rev()
  redirect("/admin/membership-statuses")
}
