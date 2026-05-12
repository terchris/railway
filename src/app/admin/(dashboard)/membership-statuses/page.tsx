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
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Medlemsstatus</h1>
          <p className="mt-1 max-w-2xl text-sm text-zinc-600">
            Radiovalg på medlemskapssteget. «Vis valg» styrer om skjemaet skal liste{" "}
            <Link href="/admin/membership-options" className="text-red-700 hover:underline">
              medlemsalternativer
            </Link>{" "}
            etterpå.
          </p>
        </div>
        <Link href="/admin/skemadata" className="text-sm font-medium text-red-700 hover:underline">
          ← Alle skjemadata
        </Link>
      </div>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">{error.message}</p>
      ) : (
        <Card className="overflow-hidden">
          <CardHeader className="border-b border-zinc-100 py-4">
            <CardTitle className="text-base">membership_statuses</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {rows.length === 0 ? (
              <p className="px-6 py-8 text-sm text-zinc-500">Ingen rader.</p>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">Etikett</th>
                    <th className="px-4 py-3 font-medium">Medlemsvalg</th>
                    <th className="px-4 py-3 font-medium">Aktiv</th>
                    <th className="px-4 py-3 font-medium">Sortering</th>
                    <th className="px-4 py-3 font-medium">Flytt</th>
                    <th className="px-4 py-3 font-medium" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {rows.map((r, i) => (
                    <tr key={r.id} className="bg-white hover:bg-zinc-50/80">
                      <td className="px-4 py-2.5">{r.label}</td>
                      <td className="px-4 py-2.5">
                        <MembershipStatusShowOptionsButton id={r.id} showOptions={r.show_membership_options} />
                      </td>
                      <td className="px-4 py-2.5">
                        <MembershipStatusToggleButton id={r.id} enabled={r.is_enabled} />
                      </td>
                      <td className="px-4 py-2.5 tabular-nums">{r.sort_order}</td>
                      <td className="px-4 py-2.5">
                        <AdminOrderRowButtons
                          rowId={r.id}
                          canMoveUp={i > 0}
                          canMoveDown={i < rows.length - 1}
                          moveRow={nudgeMembershipStatusOrder}
                        />
                      </td>
                      <td className="px-4 py-2.5">
                        <Link
                          href={`/admin/membership-statuses/${r.id}`}
                          className="text-xs font-medium text-red-700 hover:underline"
                        >
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
