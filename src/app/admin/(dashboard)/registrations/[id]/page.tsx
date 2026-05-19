import Link from "next/link"
import { notFound } from "next/navigation"

import { RegistrationConfirmedCheckbox } from "@/app/admin/(dashboard)/registrations/confirmed-checkbox"
import { RegistrationDeleteButton } from "@/app/admin/(dashboard)/registrations/registration-delete-button"
import { CopyFieldButton } from "@/components/admin/copy-field-button"
import { StaffJwtMissing } from "@/components/admin/staff-jwt-missing"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { pgStaff } from "@/lib/admin-postgrest"

import adminStyles from "@/app/admin/(dashboard)/admin.module.css"
import styles from "../registrations.module.css"

export const dynamic = "force-dynamic"

type Row = {
  id: number
  name: string
  email: string
  phone: string
  comment: string
  is_confirmed: boolean
  created_at: string
  membership_status_id: number
  membership_statuses: { label: string } | { label: string }[] | null
}

export default async function AdminRegistrationDetailPage(props: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id: idStr } = await props.params
  const idNum = Number(idStr)
  if (!Number.isFinite(idNum) || idNum <= 0) notFound()

  const staff = await pgStaff()
  if (!staff) return <StaffJwtMissing title={`Registrering #${idStr}`} />

  const { data, error } = await staff
    .from("registrations")
    .select("id,name,email,phone,comment,is_confirmed,created_at,membership_status_id,membership_statuses(label)")
    .eq("id", idNum)
    .maybeSingle()

  if (error) {
    return (
      <div className={adminStyles.page}>
        <h1 className={adminStyles.pageTitle}>Registrering</h1>
        <p className={adminStyles.errorBanner}>{error.message}</p>
        <Link href="/admin/registrations" className={adminStyles.actionLink}>
          ← Alle registreringer
        </Link>
      </div>
    )
  }

  const rowRaw = data as Row | null
  if (!rowRaw) notFound()

  const row = rowRaw
  let statusLabel = "—"
  const ms = row.membership_statuses
  if (ms && !Array.isArray(ms) && typeof ms.label === "string") statusLabel = ms.label
  if (Array.isArray(ms) && ms[0] && typeof ms[0].label === "string") statusLabel = ms[0].label

  const created =
    typeof row.created_at === "string" ? new Date(row.created_at).toLocaleString("nb-NO") : String(row.created_at)

  return (
    <div className={styles.detailShell}>
      <div className={styles.detailHeader}>
        <div className={adminStyles.pageHeaderInner}>
          <h1 className={adminStyles.pageTitle}>Registrering #{row.id}</h1>
          <p className={adminStyles.pageLead}>Mottatt {created}</p>
        </div>
        <Link href="/admin/registrations" className={adminStyles.actionLink}>
          ← Alle
        </Link>
      </div>

      <Card>
        <CardHeader className={adminStyles.sectionCardHeader}>
          <CardTitle className={adminStyles.sectionCardTitle}>Handling</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={adminStyles.field}>
            <RegistrationConfirmedCheckbox registrationId={row.id} initialConfirmed={row.is_confirmed} />
            <RegistrationDeleteButton registrationId={row.id} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className={adminStyles.sectionCardHeader}>
          <CardTitle className={adminStyles.sectionCardTitle}>Kontakt</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className={styles.detailDl}>
            <div>
              <dt className={styles.detailDt}>Navn</dt>
              <dd className={styles.detailDd}>{row.name}</dd>
            </div>
            <div>
              <dt className={styles.detailDt}>E-post</dt>
              <dd className={styles.detailDdBreak}>{row.email}</dd>
              <div className={styles.copySlot}>
                <CopyFieldButton label="e-post" value={row.email} />
              </div>
            </div>
            <div>
              <dt className={styles.detailDt}>Telefon</dt>
              <dd className={styles.detailDd}>{row.phone}</dd>
              <div className={styles.copySlot}>
                <CopyFieldButton label="telefon" value={row.phone} />
              </div>
            </div>
            <div>
              <dt className={styles.detailDt}>Medlemskapsalternativ</dt>
              <dd className={styles.detailDd}>{statusLabel}</dd>
              <dd className={styles.detailDdSub}>status-id {row.membership_status_id}</dd>
            </div>
            <div>
              <dt className={styles.detailDt}>Kommentar</dt>
              <dd className={styles.detailDdMultiline}>{row.comment.trim() === "" ? "—" : row.comment}</dd>
            </div>
            <div>
              <dt className={styles.detailDt}>Bekreftet</dt>
              <dd className={styles.detailDd}>
                <span className={row.is_confirmed ? adminStyles.statusPillPositive : adminStyles.statusPill}>
                  {row.is_confirmed ? "Ja" : "Nei"}
                </span>
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  )
}
