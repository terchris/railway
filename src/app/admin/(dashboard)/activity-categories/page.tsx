import Link from "next/link"

import { CategoryOrderButtons } from "@/app/admin/(dashboard)/activity-categories/category-order-buttons"
import { StaffJwtMissing } from "@/components/admin/staff-jwt-missing"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { pgStaff } from "@/lib/admin-postgrest"

import adminStyles from "@/app/admin/(dashboard)/admin.module.css"

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
    <div className={adminStyles.page}>
      <div className={adminStyles.pageHeader}>
        <div className={adminStyles.pageHeaderInner}>
          <h1 className={adminStyles.pageTitle}>Aktivitetskategorier</h1>
          <p className={adminStyles.pageLead}>
            Overskrifter/blokker på aktivitetsteget. «Tillegg» bestemmer om listen vises som ekstra blokker i
            skjemaet.
          </p>
        </div>
        <Link href="/admin/activities" className={adminStyles.actionLink}>
          ← Aktivitetstabell
        </Link>
      </div>

      {error ? (
        <p className={adminStyles.errorBanner}>{error.message}</p>
      ) : (
        <Card className={adminStyles.sectionCard}>
          <CardHeader className={adminStyles.sectionCardHeader}>
            <CardTitle className={adminStyles.sectionCardTitle}>Kategorier</CardTitle>
          </CardHeader>
          <CardContent className={adminStyles.sectionCardBodyFlush}>
            {rows.length === 0 ? (
              <p className={adminStyles.tableEmpty}>Ingen rader.</p>
            ) : (
              <table className={adminStyles.table}>
                <thead className={adminStyles.tableHead}>
                  <tr>
                    <th>Navn</th>
                    <th>Rekkefølge</th>
                    <th>Type</th>
                    <th>Flytt</th>
                  </tr>
                </thead>
                <tbody className={adminStyles.tableBody}>
                  {rows.map((r, i) => (
                    <tr key={r.id}>
                      <td className={adminStyles.tableCell}>{r.name}</td>
                      <td className={adminStyles.tableCellNum}>{r.sort_order}</td>
                      <td className={adminStyles.tableCell}>
                        {r.is_additional ? "Tilleggsliste" : "Primær struktur"}
                      </td>
                      <td className={adminStyles.tableCell}>
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

      <p className={adminStyles.fineprint}>
        Bruk «Opp» / «Ned» for å endre visningsrekkefølge i skjemaet (alle kategorier får nye sorteringsnummer). Nye
        kategorier og navneendringer gjøres fortsatt via databasen eller UIS.
      </p>
    </div>
  )
}
