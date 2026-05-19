import Link from "next/link"

import { nudgeEvaluationOptionOrder } from "@/app/admin/(dashboard)/evaluation/options/actions"
import { EvaluationOptionToggleButton } from "@/app/admin/(dashboard)/evaluation/options/evaluation-option-buttons"
import { AdminOrderRowButtons } from "@/components/admin/admin-order-row-buttons"
import { StaffJwtMissing } from "@/components/admin/staff-jwt-missing"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { pgStaff } from "@/lib/admin-postgrest"

import adminStyles from "@/app/admin/(dashboard)/admin.module.css"

export const dynamic = "force-dynamic"

type Row = {
  id: number
  label: string
  value: string
  is_enabled: boolean
  sort_order: number
}

export default async function AdminEvaluationOptionsPage() {
  const staff = await pgStaff()
  if (!staff) return <StaffJwtMissing title="Evaluerings­alternativer" />

  const { data, error } = await staff
    .from("evaluation_options")
    .select("id,label,value,is_enabled,sort_order")
    .order("sort_order", { ascending: true })

  const rows: Row[] = (Array.isArray(data) ? data : []).map((r) => ({
    id: Number((r as Row).id),
    label: String((r as Row).label),
    value: String((r as Row).value),
    is_enabled: Boolean((r as Row).is_enabled),
    sort_order: Number((r as Row).sort_order),
  }))

  return (
    <div className={adminStyles.page}>
      <div className={adminStyles.pageHeader}>
        <div className={adminStyles.pageHeaderInner}>
          <h1 className={adminStyles.pageTitle}>Evaluering · alternativer</h1>
          <p className={adminStyles.pageLead}>
            Felles liste over svaralternativer for alle <strong>select</strong>-spørsmål i evalueringssteget ({" "}
            <Link href="/admin/evaluation/questions" className={adminStyles.actionLink}>
              evalueringsspørsmål
            </Link>
            ). <span className={adminStyles.mono}>value</span> er det som sendes ved innsending.
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
            <CardTitle className={adminStyles.sectionCardTitle}>evaluation_options</CardTitle>
          </CardHeader>
          <CardContent className={adminStyles.sectionCardBodyFlush}>
            {rows.length === 0 ? (
              <p className={adminStyles.tableEmpty}>Ingen rader.</p>
            ) : (
              <table className={`${adminStyles.table} ${adminStyles.tableFixed}`}>
                <thead className={adminStyles.tableHead}>
                  <tr>
                    <th>Etikett (UI)</th>
                    <th>Verdi</th>
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
                      <td className={adminStyles.tableCellMonoTrunc}>{r.value}</td>
                      <td className={adminStyles.tableCell}>
                        <EvaluationOptionToggleButton id={r.id} enabled={r.is_enabled} />
                      </td>
                      <td className={adminStyles.tableCellNum}>{r.sort_order}</td>
                      <td className={adminStyles.tableCell}>
                        <AdminOrderRowButtons
                          rowId={r.id}
                          canMoveUp={i > 0}
                          canMoveDown={i < rows.length - 1}
                          moveRow={nudgeEvaluationOptionOrder}
                        />
                      </td>
                      <td className={adminStyles.tableCell}>
                        <Link href={`/admin/evaluation/options/${r.id}`} className={adminStyles.tableLinkSm}>
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
