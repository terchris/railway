import Link from "next/link"
import { notFound } from "next/navigation"

import { updateMembershipOptionFromForm } from "@/app/admin/(dashboard)/membership-options/actions"
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
  name: string
  link: string
  info: string
  is_vipps_link: boolean
}

export default async function AdminMembershipOptionEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await params
  const id = Math.trunc(Number(rawId))
  const staff = await pgStaff()
  if (!staff) return <StaffJwtMissing title="Rediger medlemsalternativ" />
  if (!Number.isFinite(id) || id <= 0) notFound()

  const { data, error } = await staff
    .from("membership_options")
    .select("id,name,link,info,is_vipps_link")
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
          <h1 className={adminStyles.pageTitle}>Medlemsalternativ</h1>
          <p className={adminStyles.pageLead}>ID {row.id}</p>
        </div>
        <Link href="/admin/membership-options" className={adminStyles.actionLink}>
          ← Lista
        </Link>
      </div>

      <Card>
        <CardHeader className={adminStyles.sectionCardHeader}>
          <CardTitle className={adminStyles.sectionCardTitle}>Felter</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={updateMembershipOptionFromForm} className={adminStyles.editForm}>
            <input type="hidden" name="id" value={row.id} />
            <div className={adminStyles.field}>
              <Label htmlFor="name">Navn</Label>
              <Input id="name" name="name" defaultValue={row.name} required />
            </div>
            <div className={adminStyles.field}>
              <Label htmlFor="link">Lenke</Label>
              <Input id="link" name="link" defaultValue={row.link} required />
            </div>
            <div className={adminStyles.field}>
              <Label htmlFor="info">Infotekst</Label>
              <Textarea id="info" name="info" rows={4} defaultValue={row.info} />
            </div>
            <div className={adminStyles.field}>
              <Label htmlFor="is_vipps_link">Vipps-lenke</Label>
              <select
                id="is_vipps_link"
                name="is_vipps_link"
                className={adminStyles.select}
                defaultValue={row.is_vipps_link ? "true" : "false"}
              >
                <option value="false">Nei</option>
                <option value="true">Ja</option>
              </select>
            </div>
            <Button type="submit">Lagre</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
