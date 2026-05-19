import Link from "next/link"
import { notFound } from "next/navigation"

import { updateEvaluationQuestionFromForm } from "@/app/admin/(dashboard)/evaluation/questions/actions"
import { StaffJwtMissing } from "@/components/admin/staff-jwt-missing"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { pgStaff } from "@/lib/admin-postgrest"

import adminStyles from "@/app/admin/(dashboard)/admin.module.css"

export const dynamic = "force-dynamic"

type Row = {
  id: number
  label: string
  question_type: "select" | "text"
}

export default async function AdminEvaluationQuestionEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await params
  const id = Math.trunc(Number(rawId))
  const staff = await pgStaff()
  if (!staff) return <StaffJwtMissing title="Evalueringsspørsmål" />
  if (!Number.isFinite(id) || id <= 0) notFound()

  const { data, error } = await staff
    .from("evaluation_questions")
    .select("id,label,question_type")
    .eq("id", id)
    .maybeSingle()

  if (error) {
    return <p className={adminStyles.errorBanner}>{error.message}</p>
  }
  if (!data) notFound()
  const row = data as Row
  const qt = row.question_type === "text" ? "text" : "select"

  return (
    <div className={adminStyles.page}>
      <div className={adminStyles.pageHeader}>
        <div className={adminStyles.pageHeaderInner}>
          <h1 className={adminStyles.pageTitle}>Evaluerings­spørsmål</h1>
          <p className={adminStyles.pageLead}>ID {row.id}</p>
        </div>
        <Link href="/admin/evaluation/questions" className={adminStyles.actionLink}>
          ← Lista
        </Link>
      </div>

      <Card>
        <CardHeader className={adminStyles.sectionCardHeader}>
          <CardTitle className={adminStyles.sectionCardTitle}>Felter</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={updateEvaluationQuestionFromForm} className={adminStyles.editForm}>
            <input type="hidden" name="id" value={row.id} />
            <div className={adminStyles.field}>
              <Label htmlFor="label">Spørsmålstekst</Label>
              <Input id="label" name="label" defaultValue={row.label} required />
            </div>
            <div className={adminStyles.field}>
              <Label htmlFor="question_type">Type</Label>
              <select
                id="question_type"
                name="question_type"
                className={adminStyles.select}
                defaultValue={qt === "select" ? "select" : "text"}
              >
                <option value="select">Valgliste (felles alternativer)</option>
                <option value="text">Fritekst</option>
              </select>
              <p className={adminStyles.fineprint}>
                Endring av type påvirker innsending dersom gamle registreringer allerede har svar på spørsmålet.
              </p>
            </div>
            <Button type="submit">Lagre</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
