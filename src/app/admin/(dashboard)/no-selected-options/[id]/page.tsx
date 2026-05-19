import Link from "next/link"
import { notFound } from "next/navigation"

import { updateNoSelectedOptionFromForm } from "@/app/admin/(dashboard)/no-selected-options/actions"
import { StaffJwtMissing } from "@/components/admin/staff-jwt-missing"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { pgStaff } from "@/lib/admin-postgrest"

import adminStyles from "@/app/admin/(dashboard)/admin.module.css"

export const dynamic = "force-dynamic"

type Row = {
  id: number
  label: string
  has_input_field: boolean
  input_field_label: string
  input_field_info: string
}

export default async function AdminNoSelectedOptionEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await params
  const id = Math.trunc(Number(rawId))
  const staff = await pgStaff()
  if (!staff) return <StaffJwtMissing title="Rediger valg uten aktivitet" />
  if (!Number.isFinite(id) || id <= 0) notFound()

  const { data, error } = await staff
    .from("no_selected_activity_options")
    .select("id,label,has_input_field,input_field_label,input_field_info")
    .eq("id", id)
    .maybeSingle()

  if (error) {
    return <p className={adminStyles.errorBanner}>{error.message}</p>
  }
  if (!data) notFound()
  const row = data as Row

  return (
    <div className={adminStyles.page}>
      <div className={adminStyles.pageHeader}>
        <div className={adminStyles.pageHeaderInner}>
          <h1 className={adminStyles.pageTitle}>Valg uten aktivitet</h1>
          <p className={adminStyles.pageLead}>ID {row.id}</p>
        </div>
        <Link href="/admin/no-selected-options" className={adminStyles.actionLink}>
          ← Lista
        </Link>
      </div>

      <Card>
        <CardHeader className={adminStyles.sectionCardHeader}>
          <CardTitle className={adminStyles.sectionCardTitle}>Felter</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={updateNoSelectedOptionFromForm} className={adminStyles.editForm}>
            <input type="hidden" name="id" value={row.id} />
            <div className={adminStyles.field}>
              <Label htmlFor="label">Etikett</Label>
              <Input id="label" name="label" defaultValue={row.label} required />
            </div>
            <div className={adminStyles.field}>
              <Label htmlFor="has_input_field">Vil ha utfyllingsfelt?</Label>
              <select
                id="has_input_field"
                name="has_input_field"
                className={adminStyles.select}
                defaultValue={row.has_input_field ? "true" : "false"}
              >
                <option value="false">Nei</option>
                <option value="true">Ja</option>
              </select>
            </div>
            <div className={adminStyles.field}>
              <Label htmlFor="input_field_label">Feltetikett</Label>
              <Input id="input_field_label" name="input_field_label" defaultValue={row.input_field_label} />
            </div>
            <div className={adminStyles.field}>
              <Label htmlFor="input_field_info">Felthjelp</Label>
              <Textarea id="input_field_info" name="input_field_info" rows={3} defaultValue={row.input_field_info} />
            </div>
            <Button type="submit">Lagre</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
