import Link from "next/link"
import { notFound } from "next/navigation"

import { updateMembershipStatusLabelFromForm } from "@/app/admin/(dashboard)/membership-statuses/actions"
import { StaffJwtMissing } from "@/components/admin/staff-jwt-missing"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { pgStaff } from "@/lib/admin-postgrest"

import adminStyles from "@/app/admin/(dashboard)/admin.module.css"

export const dynamic = "force-dynamic"

export default async function AdminMembershipStatusEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await params
  const id = Math.trunc(Number(rawId))
  const staff = await pgStaff()
  if (!staff) return <StaffJwtMissing title="Rediger medlemsstatus" />
  if (!Number.isFinite(id) || id <= 0) notFound()

  const { data, error } = await staff.from("membership_statuses").select("id,label").eq("id", id).maybeSingle()
  if (error) {
    return <p className={adminStyles.errorBanner}>{error.message}</p>
  }
  if (!data) notFound()
  const row = data as { id: number; label: string }

  return (
    <div className={adminStyles.page}>
      <div className={adminStyles.pageHeader}>
        <div className={adminStyles.pageHeaderInner}>
          <h1 className={adminStyles.pageTitle}>Rediger medlemsstatus</h1>
          <p className={adminStyles.pageLead}>ID {row.id}</p>
        </div>
        <Link href="/admin/membership-statuses" className={adminStyles.actionLink}>
          ← Lista
        </Link>
      </div>

      <Card>
        <CardHeader className={adminStyles.sectionCardHeader}>
          <CardTitle className={adminStyles.sectionCardTitle}>Etikett i skjema</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={updateMembershipStatusLabelFromForm} className={adminStyles.editFormCompact}>
            <input type="hidden" name="id" value={row.id} />
            <div className={adminStyles.field}>
              <Label htmlFor="label">Etikett</Label>
              <Input id="label" name="label" defaultValue={row.label} required />
            </div>
            <Button type="submit">Lagre</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
