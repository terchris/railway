import Link from "next/link"
import { notFound } from "next/navigation"

import { ActivityEditorForm } from "@/app/admin/(dashboard)/activities/activity-form"
import { StaffJwtMissing } from "@/components/admin/staff-jwt-missing"
import { pgStaff } from "@/lib/admin-postgrest"

import adminStyles from "@/app/admin/(dashboard)/admin.module.css"

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
    <div className={adminStyles.page}>
      <div className={adminStyles.pageHeader}>
        <div className={adminStyles.pageHeaderInner}>
          <h1 className={adminStyles.pageTitle}>{title}</h1>
          <p className={adminStyles.pageLead}>Endre tekst, rekkefølge, tilleggstagger og synlighet.</p>
        </div>
        <Link href="/admin/activities" className={adminStyles.actionLink}>
          ← Aktivitetstabell
        </Link>
      </div>

      {catErr ? (
        <p className={adminStyles.errorBanner}>{catErr}</p>
      ) : categories.length === 0 ? (
        <p className={adminStyles.warningBanner}>
          Mangler kategori i databasen — kan ikke lagre endringer før kategorier finnes.
        </p>
      ) : (
        <ActivityEditorForm mode="edit" activityId={activityId} categories={categories} initial={initial} />
      )}
    </div>
  )
}
