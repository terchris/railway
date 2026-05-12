"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { nudgeLexicographicSortRows } from "@/lib/admin-sort-nudge"
import { requireAdminStaff } from "@/lib/require-admin-staff"

function rev() {
  revalidatePath("/admin/no-selected-options")
  revalidatePath("/admin/skemadata")
  revalidatePath("/")
  revalidatePath("/admin/print/form")
}

function parseBool(v: FormDataEntryValue | null): boolean {
  return String(v ?? "") === "true"
}

export async function nudgeNoSelectedOptionOrder(id: number, dir: "up" | "down") {
  const g = await requireAdminStaff()
  if (!g.ok) throw new Error(g.msg)
  await nudgeLexicographicSortRows(g.staff, "no_selected_activity_options", id, dir)
  rev()
}

export async function toggleNoSelectedOptionEnabled(id: number, nextEnabled: boolean) {
  const g = await requireAdminStaff()
  if (!g.ok) throw new Error(g.msg)
  const { error } = await g.staff.from("no_selected_activity_options").update({ is_enabled: nextEnabled }).eq("id", id)
  if (error) throw new Error(error.message)
  rev()
}

export async function updateNoSelectedOptionFromForm(formData: FormData) {
  const g = await requireAdminStaff()
  if (!g.ok) throw new Error(g.msg)
  const id = Math.trunc(Number(formData.get("id")))
  const label = String(formData.get("label") ?? "").trim()
  const input_field_label = String(formData.get("input_field_label") ?? "")
  const input_field_info = String(formData.get("input_field_info") ?? "")
  if (!Number.isFinite(id) || id <= 0) throw new Error("Ugyldig rad")
  if (!label) throw new Error("Etikett er påkrevd")

  const patch = {
    label,
    has_input_field: parseBool(formData.get("has_input_field")),
    input_field_label,
    input_field_info,
  }
  const { error } = await g.staff.from("no_selected_activity_options").update(patch).eq("id", id)
  if (error) throw new Error(error.message)
  rev()
  redirect("/admin/no-selected-options")
}
