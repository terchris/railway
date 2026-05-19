import Link from "next/link"

import { ActivityEditorForm } from "@/app/admin/(dashboard)/activities/activity-form"
import { StaffJwtMissing } from "@/components/admin/staff-jwt-missing"
import { pgStaff } from "@/lib/admin-postgrest"

import adminStyles from "@/app/admin/(dashboard)/admin.module.css"

export const dynamic = "force-dynamic"

export default async function AdminNewActivityPage() {
  const staff = await pgStaff()
  if (!staff) return <StaffJwtMissing title="Ny aktivitet" />

  const { data, error } = await staff
    .from("activity_categories")
    .select("id,name,sort_order")
    .order("sort_order", { ascending: true })

  const categories = (Array.isArray(data) ? data : []).map((c) => ({
    id: Number((c as { id: unknown }).id),
    name: String((c as { name: unknown }).name),
  }))

  return (
    <div className={adminStyles.page}>
      <div className={adminStyles.pageHeader}>
        <div className={adminStyles.pageHeaderInner}>
          <h1 className={adminStyles.pageTitle}>Ny aktivitet</h1>
          <p className={adminStyles.pageLead}>
            Opprett rad i aktivitetstabellen og knytt den til en kategori. Synlighet og rekkefølge kan også settes her.
          </p>
        </div>
        <Link href="/admin/activities" className={adminStyles.actionLink}>
          ← Aktivitetstabell
        </Link>
      </div>

      {error ? (
        <p className={adminStyles.errorBanner}>{error.message}</p>
      ) : categories.length === 0 ? (
        <p className={adminStyles.warningBanner}>
          Det finnes ingen aktivitetskategori ennå. Opprett minst én kategori før du legger til aktiviteter.
        </p>
      ) : (
        <ActivityEditorForm mode="new" categories={categories} />
      )}
    </div>
  )
}
