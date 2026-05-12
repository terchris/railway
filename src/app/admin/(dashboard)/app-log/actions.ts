"use server"

import { revalidatePath } from "next/cache"

import { requireAdminStaff } from "@/lib/require-admin-staff"

export async function clearAppLogAlert(logId: number) {
  const g = await requireAdminStaff()
  if (!g.ok) throw new Error(g.msg)
  const id = Math.trunc(Number(logId))
  if (!Number.isFinite(id) || id <= 0) throw new Error("Ugyldig logg-id")

  const { error } = await g.staff.from("app_log").update({ alert: false }).eq("id", id).eq("alert", true)
  if (error) throw new Error(error.message)

  revalidatePath("/admin/app-log")
  revalidatePath("/admin")
}
