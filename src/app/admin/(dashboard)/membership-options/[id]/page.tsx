import Link from "next/link"
import { notFound } from "next/navigation"

import { updateMembershipOptionFromForm } from "@/app/admin/(dashboard)/membership-options/actions"
import { StaffJwtMissing } from "@/components/admin/staff-jwt-missing"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { pgStaff } from "@/lib/admin-postgrest"

export const dynamic = "force-dynamic"

const selectClass = cn(
  "flex h-10 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none",
  "focus:border-red-600 focus:ring-2 focus:ring-red-200 disabled:opacity-60",
)

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
    return (
      <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">{error.message}</p>
    )
  }
  if (!data) notFound()
  const row = data as Row

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Medlemsalternativ</h1>
          <p className="mt-1 text-sm text-zinc-600">ID {row.id}</p>
        </div>
        <Link href="/admin/membership-options" className="text-sm font-medium text-red-700 hover:underline">
          ← Lista
        </Link>
      </div>

      <Card>
        <CardHeader className="border-b border-zinc-100">
          <CardTitle className="text-base">Felter</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <form action={updateMembershipOptionFromForm} className="max-w-xl space-y-6">
            <input type="hidden" name="id" value={row.id} />
            <div className="space-y-2">
              <Label htmlFor="name">Navn</Label>
              <Input id="name" name="name" defaultValue={row.name} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="link">Lenke</Label>
              <Input id="link" name="link" defaultValue={row.link} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="info">Infotekst</Label>
              <Textarea id="info" name="info" rows={4} defaultValue={row.info} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="is_vipps_link">Vipps-lenke</Label>
              <select
                id="is_vipps_link"
                name="is_vipps_link"
                className={selectClass}
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
