import Link from "next/link"
import { notFound } from "next/navigation"

import { updateEvaluationOptionFromForm } from "@/app/admin/(dashboard)/evaluation/options/actions"
import { StaffJwtMissing } from "@/components/admin/staff-jwt-missing"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { pgStaff } from "@/lib/admin-postgrest"

import adminStyles from "@/app/admin/(dashboard)/admin.module.css"

export const dynamic = "force-dynamic"

type Row = { id: number; label: string; value: string }

export default async function AdminEvaluationOptionEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await params
  const id = Math.trunc(Number(rawId))
  const staff = await pgStaff()
  if (!staff) return <StaffJwtMissing title="Evalueringsalternativ" />
  if (!Number.isFinite(id) || id <= 0) notFound()

  const { data, error } = await staff.from("evaluation_options").select("id,label,value").eq("id", id).maybeSingle()
  if (error) {
    return <p className={adminStyles.errorBanner}>{error.message}</p>
  }
  if (!data) notFound()
  const row = data as Row

  return (
    <div className={adminStyles.page}>
      <div className={adminStyles.pageHeader}>
        <div className={adminStyles.pageHeaderInner}>
          <h1 className={adminStyles.pageTitle}>Evaluerings­alternativ</h1>
          <p className={adminStyles.pageLead}>ID {row.id}</p>
        </div>
        <Link href="/admin/evaluation/options" className={adminStyles.actionLink}>
          ← Lista
        </Link>
      </div>

      <Card>
        <CardHeader className={adminStyles.sectionCardHeader}>
          <CardTitle className={adminStyles.sectionCardTitle}>Felter</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={updateEvaluationOptionFromForm} className={adminStyles.editForm}>
            <input type="hidden" name="id" value={row.id} />
            <div className={adminStyles.field}>
              <Label htmlFor="label">Etikett (visning)</Label>
              <Input id="label" name="label" defaultValue={row.label} required />
            </div>
            <div className={adminStyles.field}>
              <Label htmlFor="value">Lagret verdi</Label>
              <Input
                id="value"
                name="value"
                defaultValue={row.value}
                required
                className={adminStyles.mono}
              />
              <p className={adminStyles.fineprint}>
                Ved select-spørsmål sendes valgt rad sin <span className={adminStyles.mono}>id</span> som del av RPC-innsendingen.
              </p>
            </div>
            <Button type="submit">Lagre</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
