import Link from "next/link"
import { notFound } from "next/navigation"

import { updateEvaluationQuestionFromForm } from "@/app/admin/(dashboard)/evaluation/questions/actions"
import { StaffJwtMissing } from "@/components/admin/staff-jwt-missing"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { pgStaff } from "@/lib/admin-postgrest"

export const dynamic = "force-dynamic"

const selectClass = cn(
  "flex h-10 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none",
  "focus:border-red-600 focus:ring-2 focus:ring-red-200 disabled:opacity-60",
)

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
    return (
      <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">{error.message}</p>
    )
  }
  if (!data) notFound()
  const row = data as Row
  const qt = row.question_type === "text" ? "text" : "select"

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Evaluerings­spørsmål</h1>
          <p className="mt-1 text-sm text-zinc-600">ID {row.id}</p>
        </div>
        <Link href="/admin/evaluation/questions" className="text-sm font-medium text-red-700 hover:underline">
          ← Lista
        </Link>
      </div>

      <Card>
        <CardHeader className="border-b border-zinc-100">
          <CardTitle className="text-base">Felter</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <form action={updateEvaluationQuestionFromForm} className="max-w-xl space-y-6">
            <input type="hidden" name="id" value={row.id} />
            <div className="space-y-2">
              <Label htmlFor="label">Spørsmålstekst</Label>
              <Input id="label" name="label" defaultValue={row.label} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="question_type">Type</Label>
              <select
                id="question_type"
                name="question_type"
                className={selectClass}
                defaultValue={qt === "select" ? "select" : "text"}
              >
                <option value="select">Valgliste (felles alternativer)</option>
                <option value="text">Fritekst</option>
              </select>
              <p className="text-xs text-zinc-500">
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
