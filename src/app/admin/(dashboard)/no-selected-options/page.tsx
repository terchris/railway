import Link from "next/link"

import { nudgeNoSelectedOptionOrder } from "@/app/admin/(dashboard)/no-selected-options/actions"
import { NoSelectedOptionToggleButton } from "@/app/admin/(dashboard)/no-selected-options/no-selected-buttons"
import { AdminOrderRowButtons } from "@/components/admin/admin-order-row-buttons"
import { StaffJwtMissing } from "@/components/admin/staff-jwt-missing"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { pgStaff } from "@/lib/admin-postgrest"

import adminStyles from "@/app/admin/(dashboard)/admin.module.css"

export const dynamic = "force-dynamic"

type Row = {
  id: number
  label: string
  has_input_field: boolean
  is_enabled: boolean
  sort_order: number
}

export default async function AdminNoSelectedOptionsPage() {
  const staff = await pgStaff()
  if (!staff) return <StaffJwtMissing title="Valg uten aktivitet" />

  const { data, error } = await staff
    .from("no_selected_activity_options")
    .select("id,label,has_input_field,is_enabled,sort_order")
    .order("sort_order", { ascending: true })

  const rows: Row[] = (Array.isArray(data) ? data : []).map((r) => ({
    id: Number((r as Row).id),
    label: String((r as Row).label),
    has_input_field: Boolean((r as Row).has_input_field),
    is_enabled: Boolean((r as Row).is_enabled),
    sort_order: Number((r as Row).sort_order),
  }))

  return (
    <div className={adminStyles.page}>
      <div className={adminStyles.pageHeader}>
        <div className={adminStyles.pageHeaderInner}>
          <h1 className={adminStyles.pageTitle}>Ingen aktivitet valgt</h1>
          <p className={adminStyles.pageLead}>
            Radiovalg som vises når deltager ikke krysser aktiviteter på aktivitetsteget.
          </p>
        </div>
        <Link href="/admin/skemadata" className={adminStyles.actionLink}>
          ← Alle skjemadata
        </Link>
      </div>

      {error ? (
        <p className={adminStyles.errorBanner}>{error.message}</p>
      ) : (
        <Card className={adminStyles.sectionCard}>
          <CardHeader className={adminStyles.sectionCardHeader}>
            <CardTitle className={adminStyles.sectionCardTitle}>no_selected_activity_options</CardTitle>
          </CardHeader>
          <CardContent className={adminStyles.sectionCardBodyFlush}>
            {rows.length === 0 ? (
              <p className={adminStyles.tableEmpty}>Ingen rader.</p>
            ) : (
              <table className={adminStyles.table}>
                <thead className={adminStyles.tableHead}>
                  <tr>
                    <th>Etikett</th>
                    <th>Fritekstfelt</th>
                    <th>Aktiv</th>
                    <th>Sortering</th>
                    <th>Flytt</th>
                    <th />
                  </tr>
                </thead>
                <tbody className={adminStyles.tableBody}>
                  {rows.map((r, i) => (
                    <tr key={r.id}>
                      <td className={adminStyles.tableCell}>{r.label}</td>
                      <td className={adminStyles.tableCell}>{r.has_input_field ? "Ja" : "—"}</td>
                      <td className={adminStyles.tableCell}>
                        <NoSelectedOptionToggleButton id={r.id} enabled={r.is_enabled} />
                      </td>
                      <td className={adminStyles.tableCellNum}>{r.sort_order}</td>
                      <td className={adminStyles.tableCell}>
                        <AdminOrderRowButtons
                          rowId={r.id}
                          canMoveUp={i > 0}
                          canMoveDown={i < rows.length - 1}
                          moveRow={nudgeNoSelectedOptionOrder}
                        />
                      </td>
                      <td className={adminStyles.tableCell}>
                        <Link href={`/admin/no-selected-options/${r.id}`} className={adminStyles.tableLinkSm}>
                          Rediger
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
