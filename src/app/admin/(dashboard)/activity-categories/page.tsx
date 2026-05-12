import Link from "next/link"

import { CategoryOrderButtons } from "@/app/admin/(dashboard)/activity-categories/category-order-buttons"
import { StaffJwtMissing } from "@/components/admin/staff-jwt-missing"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { pgStaff } from "@/lib/admin-postgrest"

export const dynamic = "force-dynamic"

type Row = {
  id: number
  name: string
  sort_order: number
  is_additional: boolean
}

export default async function AdminActivityCategoriesPage() {
  const staff = await pgStaff()
  if (!staff) return <StaffJwtMissing title="Aktivitetskategorier" />

  const { data, error } = await staff
    .from("activity_categories")
    .select("id,name,sort_order,is_additional")
    .order("sort_order", { ascending: true })

  const rows = ((Array.isArray(data) ? data : []) as Row[]).map((r) => ({
    ...r,
    id: Number(r.id),
  }))

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Aktivitetskategorier</h1>
          <p className="mt-1 max-w-2xl text-sm text-zinc-600">
            Overskrifter/blokker på aktivitetsteget. «Tillegg» bestemmer om listen vises som ekstra blokker i
            skjemaet.
          </p>
        </div>
        <Link href="/admin/activities" className="text-sm font-medium text-red-700 hover:underline">
          ← Aktivitetstabell
        </Link>
      </div>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">{error.message}</p>
      ) : (
        <Card className="overflow-hidden">
          <CardHeader className="border-b border-zinc-100 py-4">
            <CardTitle className="text-base">Kategorier</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {rows.length === 0 ? (
              <p className="px-6 py-8 text-sm text-zinc-500">Ingen rader.</p>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">Navn</th>
                    <th className="px-4 py-3 font-medium">Rekkefølge</th>
                    <th className="px-4 py-3 font-medium">Type</th>
                    <th className="px-4 py-3 font-medium">Flytt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {rows.map((r, i) => (
                    <tr key={r.id} className="bg-white hover:bg-zinc-50/80">
                      <td className="px-4 py-2.5 font-medium">{r.name}</td>
                      <td className="px-4 py-2.5 tabular-nums">{r.sort_order}</td>
                      <td className="px-4 py-2.5 text-zinc-700">
                        {r.is_additional ? "Tilleggsliste" : "Primær struktur"}
                      </td>
                      <td className="px-4 py-2.5">
                        <CategoryOrderButtons
                          categoryId={r.id}
                          canMoveUp={i > 0}
                          canMoveDown={i < rows.length - 1}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      )}

      <p className="text-xs text-zinc-500">
        Bruk «Opp» / «Ned» for å endre visningsrekkefølge i skjemaet (alle kategorier får nye sorteringsnummer). Nye
        kategorier og navneendringer gjøres fortsatt via databasen eller UIS.
      </p>
    </div>
  )
}
