import Link from "next/link"
import { notFound } from "next/navigation"

import { updateUserLanguageFromForm } from "@/app/admin/(dashboard)/languages/actions"
import { StaffJwtMissing } from "@/components/admin/staff-jwt-missing"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { pgStaff } from "@/lib/admin-postgrest"

import adminStyles from "@/app/admin/(dashboard)/admin.module.css"

export const dynamic = "force-dynamic"

export default async function AdminLanguageEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await params
  const id = Math.trunc(Number(rawId))
  const staff = await pgStaff()
  if (!staff) return <StaffJwtMissing title="Rediger språk" />

  if (!Number.isFinite(id) || id <= 0) notFound()

  const { data, error } = await staff.from("user_languages").select("id,name").eq("id", id).maybeSingle()

  if (error) {
    return <p className={adminStyles.errorBanner}>{error.message}</p>
  }
  if (!data) notFound()

  const row = data as { id: number; name: string }

  return (
    <div className={adminStyles.page}>
      <div className={adminStyles.pageHeader}>
        <div className={adminStyles.pageHeaderInner}>
          <h1 className={adminStyles.pageTitle}>Rediger språk</h1>
          <p className={adminStyles.pageLead}>ID {row.id}</p>
        </div>
        <Link href="/admin/languages" className={adminStyles.actionLink}>
          ← Lista
        </Link>
      </div>

      <Card>
        <CardHeader className={adminStyles.sectionCardHeader}>
          <CardTitle className={adminStyles.sectionCardTitle}>Navn i skjema</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={updateUserLanguageFromForm} className={adminStyles.editFormCompact}>
            <input type="hidden" name="id" value={row.id} />
            <div className={adminStyles.field}>
              <Label htmlFor="name">Navn</Label>
              <Input id="name" name="name" defaultValue={row.name} required />
            </div>
            <Button type="submit">Lagre</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
