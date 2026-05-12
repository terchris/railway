import Link from "next/link"

import {
  AdminActivitiesGroupedView,
  type ActRow,
  type CatRow,
} from "@/app/admin/(dashboard)/activities/activities-grouped"
import { StaffJwtMissing } from "@/components/admin/staff-jwt-missing"
import { pgStaff } from "@/lib/admin-postgrest"

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
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tilleggsaktiviteter</h1>
          <p className="mt-1 max-w-2xl text-sm text-zinc-600">
            Kun aktiviteter i kategori­er merket «tillegg» i datamodellen — samme data som på hovedlista, bare
            uten primær-blokker. Grensen for hvor mange aktiviteter deltaker kan velge står under{' '}
            <Link href="/admin/activity-settings" className="text-red-700 hover:underline">
              innstillinger
            </Link>
            .
          </p>
        </div>
        <div className="flex flex-wrap gap-3 text-sm font-medium">
          <Link href="/admin/activities" className="text-red-700 hover:underline">
            Alle aktiviteter
          </Link>
          <Link href="/admin/activities/new" className="text-red-700 hover:underline">
            Ny aktivitet
          </Link>
          <Link href="/admin/activity-categories" className="text-red-700 hover:underline">
            Kategorier
          </Link>
        </div>
      </div>

      {(catErr || actErr) && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
          {catErr ?? actErr}
        </p>
      )}

      {!catErr && !actErr ? (
        additionalCategories.length === 0 ? (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            Ingen «tillegg»-kategorier ennå (alle kategori­er har{' '}
            <span className="font-mono">is_additional=false</span>). Opprett eller merk en kategori under{' '}
            <Link href="/admin/activity-categories" className="font-medium underline">
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
