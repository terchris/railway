import Link from "next/link"

import { nudgeEvaluationQuestionOrder } from "@/app/admin/(dashboard)/evaluation/questions/actions"
import { EvaluationQuestionToggleButton } from "@/app/admin/(dashboard)/evaluation/questions/evaluation-question-buttons"
import { AdminOrderRowButtons } from "@/components/admin/admin-order-row-buttons"
import { StaffJwtMissing } from "@/components/admin/staff-jwt-missing"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { pgStaff } from "@/lib/admin-postgrest"

import adminStyles from "@/app/admin/(dashboard)/admin.module.css"

export const dynamic = "force-dynamic"

type Row = {
  id: number
  label: string
  question_type: "select" | "text"
  is_enabled: boolean
  sort_order: number
}

export default async function AdminEvaluationQuestionsPage() {
  const staff = await pgStaff()
  if (!staff) return <StaffJwtMissing title="Evaluerings­spørsmål" />

  const { data, error } = await staff
    .from("evaluation_questions")
    .select("id,label,question_type,is_enabled,sort_order")
    .order("sort_order", { ascending: true })

  const rows: Row[] = (Array.isArray(data) ? data : []).map((r) => {
    const qt = String((r as Row).question_type)
    const question_type = qt === "text" ? "text" : "select"
    return {
      id: Number((r as Row).id),
      label: String((r as Row).label),
      question_type,
      is_enabled: Boolean((r as Row).is_enabled),
      sort_order: Number((r as Row).sort_order),
    }
  })

  return (
    <div className={adminStyles.page}>
      <div className={adminStyles.pageHeader}>
        <div className={adminStyles.pageHeaderInner}>
          <h1 className={adminStyles.pageTitle}>Evaluering · spørsmål</h1>
          <p className={adminStyles.pageLead}>
            Spørsmål på «Evaluering av fysisk startkurs»-steget. Type <strong>select</strong> bruker den felles lista
            under{" "}
            <Link href="/admin/evaluation/options" className={adminStyles.actionLink}>
              Evaluering · alternativer
            </Link>
            .
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
            <CardTitle className={adminStyles.sectionCardTitle}>evaluation_questions</CardTitle>
          </CardHeader>
          <CardContent className={adminStyles.sectionCardBodyFlush}>
            {rows.length === 0 ? (
              <p className={adminStyles.tableEmpty}>Ingen rader.</p>
            ) : (
              <table className={adminStyles.table}>
                <thead className={adminStyles.tableHead}>
                  <tr>
                    <th>Spørsmål</th>
                    <th>Type</th>
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
                      <td className={adminStyles.tableCellCapitalize}>{r.question_type}</td>
                      <td className={adminStyles.tableCell}>
                        <EvaluationQuestionToggleButton id={r.id} enabled={r.is_enabled} />
                      </td>
                      <td className={adminStyles.tableCellNum}>{r.sort_order}</td>
                      <td className={adminStyles.tableCell}>
                        <AdminOrderRowButtons
                          rowId={r.id}
                          canMoveUp={i > 0}
                          canMoveDown={i < rows.length - 1}
                          moveRow={nudgeEvaluationQuestionOrder}
                        />
                      </td>
                      <td className={adminStyles.tableCell}>
                        <Link href={`/admin/evaluation/questions/${r.id}`} className={adminStyles.tableLinkSm}>
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
