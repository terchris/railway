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

export default async function AdminActivitiesPage() {
  const staff = await pgStaff()
  if (!staff) return <StaffJwtMissing title="Aktiviteter" />

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
  const categories = ((Array.isArray(catsR.data) ? catsR.data : []) as CatRow[]).map((c) => ({
    ...c,
    id: Number(c.id),
  }))
  const activities = ((Array.isArray(actsR.data) ? actsR.data : []) as ActRow[]).map((a) => ({
    ...a,
    id: Number(a.id),
    category_id: Number(a.category_id),
  }))

  return (
    <div className={adminStyles.pageWide}>
      <div className={adminStyles.pageHeader}>
        <div className={adminStyles.pageHeaderInner}>
          <h1 className={adminStyles.pageTitle}>Aktiviteter i skjemaet</h1>
          <p className={adminStyles.pageLead}>
            Det som vises på steg «Velg aktiviteter» på forsiden. Slå aktiviteter av/på eller gå videre til
            kategorier og tekster.
          </p>
        </div>
        <div className={adminStyles.pageActions}>
          <Link href="/admin/additional-activities" className={adminStyles.actionLink}>
            Tilleggsaktiviteter
          </Link>
          <Link href="/admin/activities/new" className={adminStyles.actionLink}>
            Ny aktivitet
          </Link>
          <Link href="/admin/activity-categories" className={adminStyles.actionLink}>
            Kategorier
          </Link>
          <Link href="/admin/activity-settings" className={adminStyles.actionLink}>
            Innstillinger
          </Link>
          <Link href="/admin/activities-text" className={adminStyles.actionLink}>
            Tekster
          </Link>
        </div>
      </div>

      {(catErr || actErr) && <p className={adminStyles.errorBanner}>{catErr ?? actErr}</p>}

      {!catErr && !actErr ? <AdminActivitiesGroupedView categories={categories} activities={activities} /> : null}
    </div>
  )
}
