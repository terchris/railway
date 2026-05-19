import Link from "next/link"

import {
  MembershipStatusShowOptionsButton,
  MembershipStatusToggleButton,
} from "@/app/admin/(dashboard)/membership-statuses/membership-status-buttons"
import { nudgeMembershipStatusOrder } from "@/app/admin/(dashboard)/membership-statuses/actions"
import { AdminOrderRowButtons } from "@/components/admin/admin-order-row-buttons"
import { StaffJwtMissing } from "@/components/admin/staff-jwt-missing"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { pgStaff } from "@/lib/admin-postgrest"

import adminStyles from "@/app/admin/(dashboard)/admin.module.css"

export const dynamic = "force-dynamic"

type Row = {
  id: number
  label: string
  show_membership_options: boolean
  is_enabled: boolean
  sort_order: number
}

export default async function AdminMembershipStatusesPage() {
  const staff = await pgStaff()
  if (!staff) return <StaffJwtMissing title="Medlemsstatus" />

  const { data, error } = await staff
    .from("membership_statuses")
    .select("id,label,show_membership_options,is_enabled,sort_order")
    .order("sort_order", { ascending: true })

  const rows: Row[] = (Array.isArray(data) ? data : []).map((r) => ({
    id: Number((r as Row).id),
    label: String((r as Row).label),
    show_membership_options: Boolean((r as Row).show_membership_options),
    is_enabled: Boolean((r as Row).is_enabled),
    sort_order: Number((r as Row).sort_order),
  }))

  return (
    <div className={adminStyles.page}>
      <div className={adminStyles.pageHeader}>
        <div className={adminStyles.pageHeaderInner}>
          <h1 className={adminStyles.pageTitle}>Medlemsstatus</h1>
          <p className={adminStyles.pageLead}>
            Radiovalg på medlemskapssteget. «Vis valg» styrer om skjemaet skal liste{" "}
            <Link href="/admin/membership-options" className={adminStyles.actionLink}>
              medlemsalternativer
            </Link>{" "}
            etterpå.
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
            <CardTitle className={adminStyles.sectionCardTitle}>membership_statuses</CardTitle>
          </CardHeader>
          <CardContent className={adminStyles.sectionCardBodyFlush}>
            {rows.length === 0 ? (
              <p className={adminStyles.tableEmpty}>Ingen rader.</p>
            ) : (
              <table className={adminStyles.table}>
                <thead className={adminStyles.tableHead}>
                  <tr>
                    <th>Etikett</th>
                    <th>Medlemsvalg</th>
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
                      <td className={adminStyles.tableCell}>
                        <MembershipStatusShowOptionsButton id={r.id} showOptions={r.show_membership_options} />
                      </td>
                      <td className={adminStyles.tableCell}>
                        <MembershipStatusToggleButton id={r.id} enabled={r.is_enabled} />
                      </td>
                      <td className={adminStyles.tableCellNum}>{r.sort_order}</td>
                      <td className={adminStyles.tableCell}>
                        <AdminOrderRowButtons
                          rowId={r.id}
                          canMoveUp={i > 0}
                          canMoveDown={i < rows.length - 1}
                          moveRow={nudgeMembershipStatusOrder}
                        />
                      </td>
                      <td className={adminStyles.tableCell}>
                        <Link href={`/admin/membership-statuses/${r.id}`} className={adminStyles.tableLinkSm}>
                          Tekst …
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
