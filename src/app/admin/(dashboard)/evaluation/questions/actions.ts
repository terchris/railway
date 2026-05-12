"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { nudgeLexicographicSortRows } from "@/lib/admin-sort-nudge"
import { requireAdminStaff } from "@/lib/require-admin-staff"

function revEval() {
  revalidatePath("/admin/evaluation/questions")
  revalidatePath("/admin/evaluation/options")
  revalidatePath("/admin/skemadata")
  revalidatePath("/")
}

export async function nudgeEvaluationQuestionOrder(id: number, dir: "up" | "down") {
  const g = await requireAdminStaff()
  if (!g.ok) throw new Error(g.msg)
  await nudgeLexicographicSortRows(g.staff, "evaluation_questions", id, dir)
  revEval()
}

export async function toggleEvaluationQuestionEnabled(id: number, nextEnabled: boolean) {
  const g = await requireAdminStaff()
  if (!g.ok) throw new Error(g.msg)
  const { error } = await g.staff.from("evaluation_questions").update({ is_enabled: nextEnabled }).eq("id", id)
  if (error) throw new Error(error.message)
  revEval()
}

export async function updateEvaluationQuestionFromForm(formData: FormData) {
  const g = await requireAdminStaff()
  if (!g.ok) throw new Error(g.msg)
  const id = Math.trunc(Number(formData.get("id")))
  const label = String(formData.get("label") ?? "").trim()
  const question_type = formData.get("question_type") === "text" ? "text" : ("select" as const)
  if (!Number.isFinite(id) || id <= 0) throw new Error("Ugyldig rad")
  if (!label) throw new Error("Spørsmålstekst kan ikke være tom")

  const { error } = await g.staff.from("evaluation_questions").update({ label, question_type }).eq("id", id)
  if (error) throw new Error(error.message)
  revEval()
  redirect("/admin/evaluation/questions")
}
