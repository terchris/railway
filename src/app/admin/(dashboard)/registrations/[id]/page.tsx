import Link from "next/link"
import { notFound } from "next/navigation"

import { RegistrationConfirmedCheckbox } from "@/app/admin/(dashboard)/registrations/confirmed-checkbox"
import { RegistrationDeleteButton } from "@/app/admin/(dashboard)/registrations/registration-delete-button"
import { CopyFieldButton } from "@/components/admin/copy-field-button"
import { StaffJwtMissing } from "@/components/admin/staff-jwt-missing"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { pgStaff } from "@/lib/admin-postgrest"
import { cn } from "@/lib/utils"

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
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Registrering</h1>
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">{error.message}</p>
        <Link href="/admin/registrations" className="text-sm font-medium text-red-700 hover:underline">
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
    <div className="mx-auto flex max-w-2xl flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Registrering #{row.id}</h1>
          <p className="mt-1 text-sm text-zinc-600">Mottatt {created}</p>
        </div>
        <Link href="/admin/registrations" className="text-sm font-medium text-red-700 hover:underline">
          ← Alle
        </Link>
      </div>

      <Card>
        <CardHeader className="border-b border-zinc-100">
          <CardTitle className="text-base">Handling</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <RegistrationConfirmedCheckbox registrationId={row.id} initialConfirmed={row.is_confirmed} />
          <RegistrationDeleteButton registrationId={row.id} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b border-zinc-100">
          <CardTitle className="text-base">Kontakt</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 pt-4 text-sm">
          <dl className="grid gap-4">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Navn</dt>
              <dd className="mt-1 text-zinc-900">{row.name}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">E-post</dt>
              <dd className="mt-1 break-all text-zinc-900">{row.email}</dd>
              <div className="mt-2">
                <CopyFieldButton label="e-post" value={row.email} />
              </div>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Telefon</dt>
              <dd className="mt-1 text-zinc-900">{row.phone}</dd>
              <div className="mt-2">
                <CopyFieldButton label="telefon" value={row.phone} />
              </div>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Medlemskapsalternativ</dt>
              <dd className="mt-1 text-zinc-900">{statusLabel}</dd>
              <dd className="mt-1 text-xs text-zinc-500">status-id {row.membership_status_id}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Kommentar</dt>
              <dd className="mt-1 whitespace-pre-wrap text-zinc-900">{row.comment.trim() === "" ? "—" : row.comment}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Bekreftet</dt>
              <dd className="mt-1">
                <span
                  className={cn(
                    "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                    row.is_confirmed ? "bg-emerald-100 text-emerald-900" : "bg-zinc-100 text-zinc-700",
                  )}
                >
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
