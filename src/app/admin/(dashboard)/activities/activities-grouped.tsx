import Link from "next/link"

import { ToggleActivityEnableButton } from "./toggle-enable-button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export type CatRow = { id: number; name: string; is_additional: boolean }
export type ActRow = {
  id: number
  category_id: number
  name: string
  is_enabled: boolean
  sort_order: number
  needs_volunteers: boolean
}

function groupByCategories(categories: CatRow[], activities: ActRow[]) {
  const m = new Map<number, ActRow[]>()
  for (const c of categories) m.set(c.id, [])
  for (const a of activities) {
    const list = m.get(a.category_id)
    if (list) list.push(a)
    else {
      const x: ActRow[] = []
      m.set(a.category_id, x)
      x.push(a)
    }
  }
  return categories.map((c) => ({ cat: c, rows: m.get(c.id) ?? [] }))
}

/** Aktivitetstabeller gruppert på kategori (som på `/admin/activities`). */
export function AdminActivitiesGroupedView({
  categories,
  activities,
}: {
  categories: CatRow[]
  activities: ActRow[]
}) {
  const grouped = groupByCategories(categories, activities)

  return (
    <div className="space-y-6">
      {grouped.map(({ cat, rows }) => (
        <Card key={cat.id} className="overflow-hidden">
          <CardHeader className="border-b border-zinc-100 bg-zinc-50/80 py-3">
            <CardTitle className="text-base">
              {cat.name}
              <span className="ml-2 text-xs font-normal text-zinc-500">
                {cat.is_additional ? "«tillegg» liste" : "hovedliste"}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {rows.length === 0 ? (
              <p className="px-4 py-6 text-sm text-zinc-500">Ingen aktiviteter under denne kategorien.</p>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="bg-white text-xs uppercase tracking-wide text-zinc-500">
                  <tr>
                    <th className="px-4 py-2 font-medium">Navn</th>
                    <th className="px-4 py-2 font-medium">Rekkefølge</th>
                    <th className="px-4 py-2 font-medium">Trenger folk</th>
                    <th className="px-4 py-2 font-medium">Status</th>
                    <th className="px-4 py-2 font-medium">Handling</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {rows.map((a) => (
                    <tr key={a.id} className="bg-white">
                      <td className="px-4 py-2.5 font-medium text-zinc-900">{a.name}</td>
                      <td className="px-4 py-2.5 tabular-nums text-zinc-700">{a.sort_order}</td>
                      <td className="px-4 py-2.5 text-zinc-700">{a.needs_volunteers ? "Ja" : "Nei"}</td>
                      <td className="px-4 py-2.5">
                        <span
                          className={cn(
                            "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                            a.is_enabled ? "bg-emerald-100 text-emerald-900" : "bg-zinc-100 text-zinc-600",
                          )}
                        >
                          {a.is_enabled ? "I bruk" : "Skjult"}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            href={`/admin/activities/${a.id}`}
                            className="rounded-md border border-zinc-300 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-zinc-50"
                          >
                            Rediger
                          </Link>
                          <ToggleActivityEnableButton id={a.id} enabled={a.is_enabled} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
