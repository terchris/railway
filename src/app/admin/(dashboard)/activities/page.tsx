import Link from "next/link"

import {
  AdminActivitiesGroupedView,
  type ActRow,
  type CatRow,
} from "@/app/admin/(dashboard)/activities/activities-grouped"
import { StaffJwtMissing } from "@/components/admin/staff-jwt-missing"
import { pgStaff } from "@/lib/admin-postgrest"

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
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Aktiviteter i skjemaet</h1>
          <p className="mt-1 max-w-2xl text-sm text-zinc-600">
            Det som vises på steg «Velg aktiviteter» på forsiden. Slå aktiviteter av/på eller gå videre til
            kategorier og tekster.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 text-sm font-medium">
          <Link href="/admin/additional-activities" className="text-red-700 hover:underline">
            Tilleggsaktiviteter
          </Link>
          <Link href="/admin/activities/new" className="text-red-700 hover:underline">
            Ny aktivitet
          </Link>
          <Link href="/admin/activity-categories" className="text-red-700 hover:underline">
            Kategorier
          </Link>
          <Link href="/admin/activity-settings" className="text-red-700 hover:underline">
            Innstillinger
          </Link>
          <Link href="/admin/activities-text" className="text-red-700 hover:underline">
            Tekster
          </Link>
        </div>
      </div>

      {(catErr || actErr) && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
          {catErr ?? actErr}
        </p>
      )}

      {!catErr && !actErr ? <AdminActivitiesGroupedView categories={categories} activities={activities} /> : null}
    </div>
  )
}
