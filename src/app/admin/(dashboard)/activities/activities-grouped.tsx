import Link from "next/link"

import { ToggleActivityEnableButton } from "./toggle-enable-button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import adminStyles from "@/app/admin/(dashboard)/admin.module.css"

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
    <div className={adminStyles.page}>
      {grouped.map(({ cat, rows }) => (
        <Card key={cat.id} className={adminStyles.sectionCard}>
          <CardHeader className={adminStyles.sectionCardHeaderTinted}>
            <CardTitle className={adminStyles.sectionCardTitle}>
              {cat.name}
              <span className={adminStyles.subHint}>
                {cat.is_additional ? "«tillegg» liste" : "hovedliste"}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className={adminStyles.sectionCardBodyFlush}>
            {rows.length === 0 ? (
              <p className={adminStyles.tableEmpty}>Ingen aktiviteter under denne kategorien.</p>
            ) : (
              <table className={adminStyles.table}>
                <thead className={adminStyles.tableHead}>
                  <tr>
                    <th>Navn</th>
                    <th>Rekkefølge</th>
                    <th>Trenger folk</th>
                    <th>Status</th>
                    <th>Handling</th>
                  </tr>
                </thead>
                <tbody className={adminStyles.tableBody}>
                  {rows.map((a) => (
                    <tr key={a.id}>
                      <td className={adminStyles.tableCell}>{a.name}</td>
                      <td className={adminStyles.tableCellNum}>{a.sort_order}</td>
                      <td className={adminStyles.tableCell}>{a.needs_volunteers ? "Ja" : "Nei"}</td>
                      <td className={adminStyles.tableCell}>
                        <span className={a.is_enabled ? adminStyles.statusPillPositive : adminStyles.statusPill}>
                          {a.is_enabled ? "I bruk" : "Skjult"}
                        </span>
                      </td>
                      <td className={adminStyles.tableCell}>
                        <div className={adminStyles.rowActions}>
                          <Link href={`/admin/activities/${a.id}`} className={adminStyles.editRowLink}>
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
