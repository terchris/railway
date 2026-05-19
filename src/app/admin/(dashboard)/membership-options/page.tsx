import Link from "next/link"

import { nudgeMembershipOptionOrder } from "@/app/admin/(dashboard)/membership-options/actions"
import { MembershipOptionToggleButton } from "@/app/admin/(dashboard)/membership-options/membership-option-buttons"
import { AdminOrderRowButtons } from "@/components/admin/admin-order-row-buttons"
import { StaffJwtMissing } from "@/components/admin/staff-jwt-missing"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { pgStaff } from "@/lib/admin-postgrest"

import adminStyles from "@/app/admin/(dashboard)/admin.module.css"

export const dynamic = "force-dynamic"

type Row = {
  id: number
  name: string
  link: string
  is_vipps_link: boolean
  is_enabled: boolean
  sort_order: number
}

export default async function AdminMembershipOptionsPage() {
  const staff = await pgStaff()
  if (!staff) return <StaffJwtMissing title="Medlemsalternativer" />

  const { data, error } = await staff
    .from("membership_options")
    .select("id,name,link,is_vipps_link,is_enabled,sort_order")
    .order("sort_order", { ascending: true })

  const rows: Row[] = (Array.isArray(data) ? data : []).map((r) => ({
    id: Number((r as Row).id),
    name: String((r as Row).name),
    link: String((r as Row).link),
    is_vipps_link: Boolean((r as Row).is_vipps_link),
    is_enabled: Boolean((r as Row).is_enabled),
    sort_order: Number((r as Row).sort_order),
  }))

  return (
    <div className={adminStyles.page}>
      <div className={adminStyles.pageHeader}>
        <div className={adminStyles.pageHeaderInner}>
          <h1 className={adminStyles.pageTitle}>Medlemsalternativer</h1>
          <p className={adminStyles.pageLead}>
            Lenker og tekster som kan vises etter medlemskapsvalg når tilhørende status har{" "}
            <strong>Vis valg</strong> aktivt ({" "}
            <Link href="/admin/membership-statuses" className={adminStyles.actionLink}>
              medlemsstatus
            </Link>
            ).
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
            <CardTitle className={adminStyles.sectionCardTitle}>membership_options</CardTitle>
          </CardHeader>
          <CardContent className={adminStyles.sectionCardBodyFlush}>
            {rows.length === 0 ? (
              <p className={adminStyles.tableEmpty}>Ingen rader.</p>
            ) : (
              <table className={`${adminStyles.table} ${adminStyles.tableFixed}`}>
                <thead className={adminStyles.tableHead}>
                  <tr>
                    <th>Navn</th>
                    <th>Lenke</th>
                    <th>Vipps</th>
                    <th>Aktiv</th>
                    <th>Sortering</th>
                    <th>Flytt</th>
                    <th />
                  </tr>
                </thead>
                <tbody className={adminStyles.tableBody}>
                  {rows.map((r, i) => (
                    <tr key={r.id}>
                      <td className={adminStyles.tableCell}>{r.name}</td>
                      <td className={adminStyles.tableCellMonoTrunc}>{r.link}</td>
                      <td className={adminStyles.tableCell}>{r.is_vipps_link ? "Ja" : "—"}</td>
                      <td className={adminStyles.tableCell}>
                        <MembershipOptionToggleButton id={r.id} enabled={r.is_enabled} />
                      </td>
                      <td className={adminStyles.tableCellNum}>{r.sort_order}</td>
                      <td className={adminStyles.tableCell}>
                        <AdminOrderRowButtons
                          rowId={r.id}
                          canMoveUp={i > 0}
                          canMoveDown={i < rows.length - 1}
                          moveRow={nudgeMembershipOptionOrder}
                        />
                      </td>
                      <td className={adminStyles.tableCell}>
                        <Link href={`/admin/membership-options/${r.id}`} className={adminStyles.tableLinkSm}>
                          Rediger
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
