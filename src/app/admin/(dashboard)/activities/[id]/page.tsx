import Link from "next/link"
import { notFound } from "next/navigation"

import { ActivityEditorForm } from "@/app/admin/(dashboard)/activities/activity-form"
import { StaffJwtMissing } from "@/components/admin/staff-jwt-missing"
import { pgStaff } from "@/lib/admin-postgrest"

export const dynamic = "force-dynamic"

type PageProps = { params: Promise<{ id: string }> }

export default async function AdminEditActivityPage({ params }: PageProps) {
  const { id: idStr } = await params
  const activityId = Number(idStr)
  if (!Number.isFinite(activityId) || activityId <= 0) notFound()

  const staff = await pgStaff()
  if (!staff) return <StaffJwtMissing title="Rediger aktivitet" />

  const [catsR, actR] = await Promise.all([
    staff.from("activity_categories").select("id,name,sort_order").order("sort_order", { ascending: true }),
    staff.from("activities").select("*").eq("id", activityId).maybeSingle(),
  ])

  const catErr = catsR.error?.message
  const activity = actR.data && typeof actR.data === "object" ? actR.data : null
  if (actR.error?.message || !activity) notFound()

  const categories = (Array.isArray(catsR.data) ? catsR.data : []).map((c) => ({
    id: Number((c as { id: unknown }).id),
    name: String((c as { name: unknown }).name),
  }))

  const row = activity as Record<string, unknown>

  const initial = {
    category_id: Number(row.category_id),
    name: typeof row.name === "string" ? row.name : "",
    info: typeof row.info === "string" ? row.info : "",
    internal_info: typeof row.internal_info === "string" ? row.internal_info : "",
    needs_volunteers: Boolean(row.needs_volunteers),
    has_speaking_time: Boolean(row.has_speaking_time),
    has_film_clip: Boolean(row.has_film_clip),
    is_enabled: Boolean(row.is_enabled),
    sort_order: typeof row.sort_order === "number" ? row.sort_order : Math.trunc(Number(row.sort_order)),
  }

  const title = initial.name.trim() || `Aktivitet #${activityId}`

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-1 max-w-2xl text-sm text-zinc-600">Endre tekst, rekkefølge, tilleggstagger og synlighet.</p>
        </div>
        <Link href="/admin/activities" className="text-sm font-medium text-red-700 hover:underline">
          ← Aktivitetstabell
        </Link>
      </div>

      {catErr ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">{catErr}</p>
      ) : categories.length === 0 ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          Mangler kategori i databasen — kan ikke lagre endringer før kategorier finnes.
        </p>
      ) : (
        <ActivityEditorForm mode="edit" activityId={activityId} categories={categories} initial={initial} />
      )}
    </div>
  )
}
