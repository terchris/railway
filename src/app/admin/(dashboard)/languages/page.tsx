import Link from "next/link"

import { AdminOrderRowButtons } from "@/components/admin/admin-order-row-buttons"
import { StaffJwtMissing } from "@/components/admin/staff-jwt-missing"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { nudgeUserLanguageOrder } from "@/app/admin/(dashboard)/languages/actions"
import { UserLanguagePinButton, UserLanguageToggleButton } from "@/app/admin/(dashboard)/languages/language-buttons"
import { pgStaff } from "@/lib/admin-postgrest"

import adminStyles from "@/app/admin/(dashboard)/admin.module.css"

export const dynamic = "force-dynamic"

type Row = {
  id: number
  name: string
  place_at_top: boolean
  is_enabled: boolean
  sort_order: number
}

export default async function AdminLanguagesPage() {
  const staff = await pgStaff()
  if (!staff) return <StaffJwtMissing title="Språk · brukerespråk" />

  const { data, error } = await staff
    .from("user_languages")
    .select("id,name,place_at_top,is_enabled,sort_order")
    .order("sort_order", { ascending: true })

  const rows: Row[] = (Array.isArray(data) ? data : []).map((r) => ({
    id: Number((r as Row).id),
    name: String((r as Row).name),
    place_at_top: Boolean((r as Row).place_at_top),
    is_enabled: Boolean((r as Row).is_enabled),
    sort_order: Number((r as Row).sort_order),
  }))

  return (
    <div className={adminStyles.page}>
      <div className={adminStyles.pageHeader}>
        <div className={adminStyles.pageHeaderInner}>
          <h1 className={adminStyles.pageTitle}>Språk</h1>
          <p className={adminStyles.pageLead}>
            Språkalternativ på «Språk»-steget i frivilligskjemaet. Deaktiverte språk vises ikke. «Pin øverst» lar noen
            få språk hoppe fram i rekkefølgen (per datamodell).
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
            <CardTitle className={adminStyles.sectionCardTitle}>user_languages</CardTitle>
          </CardHeader>
          <CardContent className={adminStyles.sectionCardBodyFlush}>
            {rows.length === 0 ? (
              <p className={adminStyles.tableEmpty}>Ingen rader.</p>
            ) : (
              <table className={adminStyles.table}>
                <thead className={adminStyles.tableHead}>
                  <tr>
                    <th>Navn</th>
                    <th>Øverst</th>
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
                      <td className={adminStyles.tableCell}>
                        <UserLanguagePinButton id={r.id} placeAtTop={r.place_at_top} />
                      </td>
                      <td className={adminStyles.tableCell}>
                        <UserLanguageToggleButton id={r.id} enabled={r.is_enabled} />
                      </td>
                      <td className={adminStyles.tableCellNum}>{r.sort_order}</td>
                      <td className={adminStyles.tableCell}>
                        <AdminOrderRowButtons
                          rowId={r.id}
                          canMoveUp={i > 0}
                          canMoveDown={i < rows.length - 1}
                          moveRow={nudgeUserLanguageOrder}
                        />
                      </td>
                      <td className={adminStyles.tableCell}>
                        <Link href={`/admin/languages/${r.id}`} className={adminStyles.tableLinkSm}>
                          Navn …
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

      <p className={adminStyles.fineprint}>
        Nye språkkoder legges til i databasen; her styrer du synlighet og navn. Det åpne skjemaet sorterer etter navn og
        «pin øverst» — kolonnen rekkefølge under er mest for konsistens i admin.
      </p>
    </div>
  )
}
