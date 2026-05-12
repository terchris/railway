"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { nudgeLexicographicSortRows } from "@/lib/admin-sort-nudge"
import { requireAdminStaff } from "@/lib/require-admin-staff"

function rev() {
  revalidatePath("/admin/membership-options")
  revalidatePath("/admin/skemadata")
  revalidatePath("/")
}

function parseBool(v: FormDataEntryValue | null): boolean {
  return String(v ?? "") === "true"
}

export async function nudgeMembershipOptionOrder(id: number, dir: "up" | "down") {
  const g = await requireAdminStaff()
  if (!g.ok) throw new Error(g.msg)
  await nudgeLexicographicSortRows(g.staff, "membership_options", id, dir)
  rev()
}

export async function toggleMembershipOptionEnabled(id: number, nextEnabled: boolean) {
  const g = await requireAdminStaff()
  if (!g.ok) throw new Error(g.msg)
  const { error } = await g.staff.from("membership_options").update({ is_enabled: nextEnabled }).eq("id", id)
  if (error) throw new Error(error.message)
  rev()
}

export async function updateMembershipOptionFromForm(formData: FormData) {
  const g = await requireAdminStaff()
  if (!g.ok) throw new Error(g.msg)
  const id = Math.trunc(Number(formData.get("id")))
  const name = String(formData.get("name") ?? "").trim()
  const link = String(formData.get("link") ?? "").trim()
  const info = String(formData.get("info") ?? "")
  if (!Number.isFinite(id) || id <= 0) throw new Error("Ugyldig rad")
  if (!name) throw new Error("Navn er påkrevd")
  if (!link) throw new Error("Lenke er påkrevd")

  const patch = {
    name,
    link,
    info,
    is_vipps_link: parseBool(formData.get("is_vipps_link")),
  }
  const { error } = await g.staff.from("membership_options").update(patch).eq("id", id)
  if (error) throw new Error(error.message)
  rev()
  redirect("/admin/membership-options")
}
