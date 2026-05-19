import Link from "next/link"

import {
  AdminActivitiesGroupedView,
  type ActRow,
  type CatRow,
} from "@/app/admin/(dashboard)/activities/activities-grouped"
import { StaffJwtMissing } from "@/components/admin/staff-jwt-missing"
import { pgStaff } from "@/lib/admin-postgrest"

import adminStyles from "@/app/admin/(dashboard)/admin.module.css"

export const dynamic = "force-dynamic"

export default async function AdminAdditionalActivitiesPage() {
  const staff = await pgStaff()
  if (!staff) return <StaffJwtMissing title="Tilleggsaktiviteter" />

  const [catsR, actsR] = await Promise.all([
    staff.from("activity_categories").select("id,name,is_additional,sort_order").order("sort_order", {
      ascending: true,
    }),
    staff.from("activities").select("id,category_id,name,is_enabled,sort_order,needs_volunteers").order("sort_order", {
      ascending: true,
    }),
  ])

  const catErr = catsR.error?.message
  const actErr = actsR.error?.message

  const categoriesRaw = ((Array.isArray(catsR.data) ? catsR.data : []) as CatRow[]).map((c) => ({
    ...c,
    id: Number(c.id),
  }))
  const additionalCategories = categoriesRaw.filter((c) => c.is_additional)
  const additionalIds = new Set(additionalCategories.map((c) => c.id))

  const activities = ((Array.isArray(actsR.data) ? actsR.data : []) as ActRow[])
    .filter((a) => additionalIds.has(Number(a.category_id)))
    .map((a) => ({
      ...a,
      id: Number(a.id),
      category_id: Number(a.category_id),
    }))

  return (
    <div className={adminStyles.pageWide}>
      <div className={adminStyles.pageHeader}>
        <div className={adminStyles.pageHeaderInner}>
          <h1 className={adminStyles.pageTitle}>Tilleggsaktiviteter</h1>
          <p className={adminStyles.pageLead}>
            Kun aktiviteter i kategori­er merket «tillegg» i datamodellen — samme data som på hovedlista, bare
            uten primær-blokker. Grensen for hvor mange aktiviteter deltaker kan velge står under{" "}
            <Link href="/admin/activity-settings" className={adminStyles.actionLink}>
              innstillinger
            </Link>
            .
          </p>
        </div>
        <div className={adminStyles.pageActions}>
          <Link href="/admin/activities" className={adminStyles.actionLink}>
            Alle aktiviteter
          </Link>
          <Link href="/admin/activities/new" className={adminStyles.actionLink}>
            Ny aktivitet
          </Link>
          <Link href="/admin/activity-categories" className={adminStyles.actionLink}>
            Kategorier
          </Link>
        </div>
      </div>

      {(catErr || actErr) && <p className={adminStyles.errorBanner}>{catErr ?? actErr}</p>}

      {!catErr && !actErr ? (
        additionalCategories.length === 0 ? (
          <p className={adminStyles.warningBanner}>
            Ingen «tillegg»-kategorier ennå (alle kategori­er har{" "}
            <span className={adminStyles.mono}>is_additional=false</span>). Opprett eller merk en kategori under{" "}
            <Link href="/admin/activity-categories" className={adminStyles.actionLink}>
              Aktivitetskategorier
            </Link>
            .
          </p>
        ) : (
          <AdminActivitiesGroupedView categories={additionalCategories} activities={activities} />
        )
      ) : null}
    </div>
  )
}
