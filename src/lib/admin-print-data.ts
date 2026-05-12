import type { PostgrestClient } from "@supabase/postgrest-js"

/** Shared row shapes for print views (`07-admin-app.md`). */
export type PrintCategoryRow = {
  id: number
  name: string
  is_additional: boolean
  sort_order: number
}

export type PrintActivityRow = {
  id: number
  category_id: number
  name: string
  info: string
  internal_info: string
  sort_order: number
}

export type PrintMembershipRow = {
  id: number
  label: string
  sort_order: number
}

export type PrintLanguageRow = {
  id: number
  name: string
  sort_order: number
}

export type PrintNoSelectionRow = {
  id: number
  label: string
  sort_order: number
}

export async function fetchPrintActivities(staff: PostgrestClient) {
  const [catsR, actsR] = await Promise.all([
    staff.from("activity_categories").select("id,name,is_additional,sort_order").order("sort_order", {
      ascending: true,
    }),
    staff
      .from("activities")
      .select("id,category_id,name,info,internal_info,sort_order,is_enabled")
      .eq("is_enabled", true)
      .order("sort_order", { ascending: true }),
  ])

  const categories = (
    Array.isArray(catsR.data) ? (catsR.data as Omit<PrintCategoryRow, never>[]) : []
  ).map((c) => ({
    ...c,
    id: Number(c.id),
    sort_order: Number(c.sort_order),
  }))

  const activities = (
    Array.isArray(actsR.data)
      ? (actsR.data as (PrintActivityRow & { is_enabled: boolean })[])
      : []
  ).map((a) => ({
    id: Number(a.id),
    category_id: Number(a.category_id),
    name: a.name,
    info: a.info,
    internal_info: a.internal_info,
    sort_order: Number(a.sort_order),
  }))

  const byCategory = (): { cat: PrintCategoryRow; rows: PrintActivityRow[] }[] => {
    const m = new Map<number, PrintActivityRow[]>()
    for (const c of categories) m.set(c.id, [])
    for (const a of activities) {
      const list = m.get(a.category_id)
      if (list) list.push(a)
      else m.set(a.category_id, [a])
    }
    return categories.map((cat) => ({ cat, rows: m.get(cat.id) ?? [] }))
  }

  return {
    categories,
    activities,
    byCategory,
    error: catsR.error?.message ?? actsR.error?.message ?? null,
  }
}

export async function fetchMembershipStatuses(staff: PostgrestClient) {
  const r = await staff
    .from("membership_statuses")
    .select("id,label,sort_order")
    .eq("is_enabled", true)
    .order("sort_order", { ascending: true })

  const rows = (
    Array.isArray(r.data) ? (r.data as Omit<PrintMembershipRow, never>[]) : []
  ).map((x) => ({
    id: Number(x.id),
    label: x.label,
    sort_order: Number(x.sort_order),
  }))

  return { rows, error: r.error?.message ?? null }
}

export async function fetchUserLanguages(staff: PostgrestClient) {
  const r = await staff
    .from("user_languages")
    .select("id,name,sort_order")
    .eq("is_enabled", true)
    .order("sort_order", { ascending: true })

  const rows = (
    Array.isArray(r.data) ? (r.data as Omit<PrintLanguageRow, never>[]) : []
  ).map((x) => ({
    id: Number(x.id),
    name: x.name,
    sort_order: Number(x.sort_order),
  }))

  return { rows, error: r.error?.message ?? null }
}

export async function fetchNoSelectionOptions(staff: PostgrestClient) {
  const r = await staff
    .from("no_selected_activity_options")
    .select("id,label,sort_order")
    .eq("is_enabled", true)
    .order("sort_order", { ascending: true })

  const rows = (
    Array.isArray(r.data) ? (r.data as Omit<PrintNoSelectionRow, never>[]) : []
  ).map((x) => ({
    id: Number(x.id),
    label: x.label,
    sort_order: Number(x.sort_order),
  }))

  return { rows, error: r.error?.message ?? null }
}
