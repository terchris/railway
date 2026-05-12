import Link from "next/link"

import { ActivityEditorForm } from "@/app/admin/(dashboard)/activities/activity-form"
import { StaffJwtMissing } from "@/components/admin/staff-jwt-missing"
import { pgStaff } from "@/lib/admin-postgrest"

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
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Ny aktivitet</h1>
          <p className="mt-1 max-w-2xl text-sm text-zinc-600">
            Opprett rad i aktivitetstabellen og knytt den til en kategori. Synlighet og rekkefølge kan også settes her.
          </p>
        </div>
        <Link href="/admin/activities" className="text-sm font-medium text-red-700 hover:underline">
          ← Aktivitetstabell
        </Link>
      </div>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">{error.message}</p>
      ) : categories.length === 0 ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          Det finnes ingen aktivitetskategori ennå. Opprett minst én kategori før du legger til aktiviteter.
        </p>
      ) : (
        <ActivityEditorForm mode="new" categories={categories} />
      )}
    </div>
  )
}
