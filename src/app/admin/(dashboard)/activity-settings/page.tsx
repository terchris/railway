import Link from "next/link"

import { updateActivitySelectionLimitForm } from "@/app/admin/(dashboard)/activities/actions"
import { StaffJwtMissing } from "@/components/admin/staff-jwt-missing"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { pgStaff } from "@/lib/admin-postgrest"

import adminStyles from "@/app/admin/(dashboard)/admin.module.css"
import styles from "./page.module.css"

export const dynamic = "force-dynamic"

export default async function AdminActivitySettingsPage() {
  const staff = await pgStaff()
  if (!staff) return <StaffJwtMissing title="Aktivitetsinnstillinger" />

  const { data, error } = await staff
    .from("activity_settings")
    .select("activity_selection_limit")
    .eq("id", true)
    .maybeSingle()

  const limitRaw =
    data && typeof data === "object" && "activity_selection_limit" in data
      ? (data as { activity_selection_limit: number }).activity_selection_limit
      : 0

  return (
    <div className={adminStyles.page}>
      <div className={adminStyles.pageHeader}>
        <div className={adminStyles.pageHeaderInner}>
          <h1 className={adminStyles.pageTitle}>Aktivitetsskjema · innstillinger</h1>
          <p className={adminStyles.pageLead}>
            Hvor mange primæraktiviteter registranten kan velge (0 betyr ingen begrensning på server —
            gjeldende UIS-oppsett kan være 1).
          </p>
        </div>
        <Link href="/admin/activities" className={adminStyles.actionLink}>
          ← Aktivitetstabell
        </Link>
      </div>

      {error ? (
        <p className={adminStyles.errorBanner}>{error.message}</p>
      ) : (
        <Card className={styles.card}>
          <CardHeader className={adminStyles.sectionCardHeader}>
            <CardTitle className={adminStyles.sectionCardTitle}>Begrens valg av primæraktivitet</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={updateActivitySelectionLimitForm} className={adminStyles.formCardBodyTight}>
              <div className={adminStyles.field}>
                <Label htmlFor="limit">activity_selection_limit</Label>
                <Input
                  id="limit"
                  name="limit"
                  type="number"
                  min={0}
                  max={999}
                  defaultValue={limitRaw}
                  required
                  className={styles.numField}
                />
                <p className={adminStyles.fineprint}>
                  Nedre liste «tilleggsaktiviteter» påvirkes ikke av dette tallet på samme måte som i dagens UX.
                </p>
              </div>
              <Button type="submit">Lagre</Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
