"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { nudgeLexicographicSortRows } from "@/lib/admin-sort-nudge"
import { requireAdminStaff } from "@/lib/require-admin-staff"

function revEvalOpts() {
  revalidatePath("/admin/evaluation/options")
  revalidatePath("/admin/evaluation/questions")
  revalidatePath("/admin/skemadata")
  revalidatePath("/")
}

export async function nudgeEvaluationOptionOrder(id: number, dir: "up" | "down") {
  const g = await requireAdminStaff()
  if (!g.ok) throw new Error(g.msg)
  await nudgeLexicographicSortRows(g.staff, "evaluation_options", id, dir)
  revEvalOpts()
}

export async function toggleEvaluationOptionEnabled(id: number, nextEnabled: boolean) {
  const g = await requireAdminStaff()
  if (!g.ok) throw new Error(g.msg)
  const { error } = await g.staff.from("evaluation_options").update({ is_enabled: nextEnabled }).eq("id", id)
  if (error) throw new Error(error.message)
  revEvalOpts()
}

export async function updateEvaluationOptionFromForm(formData: FormData) {
  const g = await requireAdminStaff()
  if (!g.ok) throw new Error(g.msg)
  const id = Math.trunc(Number(formData.get("id")))
  const label = String(formData.get("label") ?? "").trim()
  const value = String(formData.get("value") ?? "").trim()
  if (!Number.isFinite(id) || id <= 0) throw new Error("Ugyldig rad")
  if (!label) throw new Error("Etikett kan ikke være tom")
  if (!value) throw new Error("Verdi (lagret svar) kan ikke være tom")

  const { error } = await g.staff.from("evaluation_options").update({ label, value }).eq("id", id)
  if (error) throw new Error(error.message)
  revEvalOpts()
  redirect("/admin/evaluation/options")
}
