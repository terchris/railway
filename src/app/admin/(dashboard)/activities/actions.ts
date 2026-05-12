"use server"

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

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

export async function toggleActivityEnabled(id: number, nextEnabled: boolean) {
  const g = await staffConn()
  if (!g.ok) throw new Error(g.msg)
  const { error } = await g.staff.from("activities").update({ is_enabled: nextEnabled }).eq("id", id)
  if (error) throw new Error(error.message)
  revalidatePath("/admin/activities")
  revalidatePath(`/admin/activities/${id}`)
  revalidatePath("/")
}

export async function updateActivitySelectionLimit(limit: number) {
  const g = await staffConn()
  if (!g.ok) throw new Error(g.msg)
  if (!Number.isFinite(limit) || limit < 0 || limit > 999) {
    throw new Error("Grensen må være et tall mellom 0 og 999 (0 = ubegrenset).")
  }
  const rounded = Math.trunc(limit)
  const { error } = await g.staff.from("activity_settings").update({ activity_selection_limit: rounded }).eq("id", true)
  if (error) throw new Error(error.message)
  revalidatePath("/admin/activity-settings")
  revalidatePath("/admin")
}

export async function updateActivitySelectionLimitForm(formData: FormData) {
  const n = Number(formData.get("limit"))
  await updateActivitySelectionLimit(n)
}

export async function updateActivityStepText(formData: FormData) {
  const g = await staffConn()
  if (!g.ok) throw new Error(g.msg)
  const title = String(formData.get("content_activities_title") ?? "").trim()
  const bodyHtml = String(formData.get("content_activities_text") ?? "")
  const catHtml = String(formData.get("content_activity_categories_text") ?? "")
  const foot = String(formData.get("content_activities_footnote") ?? "")

  const { error } = await g.staff
    .from("text_content")
    .update({
      content_activities_title: title,
      content_activities_text: bodyHtml,
      content_activity_categories_text: catHtml,
      content_activities_footnote: foot,
    })
    .eq("id", true)

  if (error) throw new Error(error.message)
  revalidatePath("/admin/activities-text")
  revalidatePath("/admin/text-content")
  revalidatePath("/")
}

function parseBoolSel(v: FormDataEntryValue | null): boolean {
  return String(v ?? "") === "true"
}

export async function updateActivityFromForm(activityId: number, formData: FormData) {
  const g = await staffConn()
  if (!g.ok) throw new Error(g.msg)
  const categoryId = Number(formData.get("category_id"))
  const name = String(formData.get("name") ?? "").trim()
  const info = String(formData.get("info") ?? "")
  const internalInfo = String(formData.get("internal_info") ?? "")
  const sortOrder = Math.trunc(Number(formData.get("sort_order")))
  if (!Number.isFinite(activityId) || activityId <= 0) throw new Error("Ugyldig aktivitet")
  if (!Number.isFinite(categoryId) || categoryId <= 0) throw new Error("Velg kategori")
  if (name.length < 1) throw new Error("Navn er påkrevd")
  if (!Number.isFinite(sortOrder)) throw new Error("Rekkefølge må være tall")

  const patch = {
    category_id: categoryId,
    name,
    info,
    internal_info: internalInfo,
    needs_volunteers: parseBoolSel(formData.get("needs_volunteers")),
    has_speaking_time: parseBoolSel(formData.get("has_speaking_time")),
    has_film_clip: parseBoolSel(formData.get("has_film_clip")),
    is_enabled: parseBoolSel(formData.get("is_enabled")),
    sort_order: sortOrder,
  }

  const { error } = await g.staff.from("activities").update(patch).eq("id", activityId)
  if (error) throw new Error(error.message)
  revalidatePath("/admin/activities")
  revalidatePath(`/admin/activities/${activityId}`)
  revalidatePath("/")
}

export async function createActivityFromForm(formData: FormData) {
  const g = await staffConn()
  if (!g.ok) throw new Error(g.msg)
  const categoryId = Number(formData.get("category_id"))
  const name = String(formData.get("name") ?? "").trim()
  const info = String(formData.get("info") ?? "")
  const internalInfo = String(formData.get("internal_info") ?? "")
  const sortOrder = Math.trunc(Number(formData.get("sort_order")))
  if (!Number.isFinite(categoryId) || categoryId <= 0) throw new Error("Velg kategori")
  if (name.length < 1) throw new Error("Navn er påkrevd")
  if (!Number.isFinite(sortOrder)) throw new Error("Rekkefølge må være tall")

  const row = {
    category_id: categoryId,
    name,
    info,
    internal_info: internalInfo,
    needs_volunteers: parseBoolSel(formData.get("needs_volunteers")),
    has_speaking_time: parseBoolSel(formData.get("has_speaking_time")),
    has_film_clip: parseBoolSel(formData.get("has_film_clip")),
    is_enabled: parseBoolSel(formData.get("is_enabled")),
    sort_order: sortOrder,
  }

  const { data, error } = await g.staff.from("activities").insert(row).select("id").single()
  if (error) throw new Error(error.message)
  const rid = data && typeof data === "object" && "id" in data ? Number((data as { id: number }).id) : NaN
  if (!Number.isFinite(rid)) throw new Error("Kunne ikke lese ny id")
  revalidatePath("/admin/activities")
  revalidatePath("/")
  redirect(`/admin/activities/${rid}`)
}
