import Link from "next/link"
import { notFound } from "next/navigation"

import { updateMembershipStatusLabelFromForm } from "@/app/admin/(dashboard)/membership-statuses/actions"
import { StaffJwtMissing } from "@/components/admin/staff-jwt-missing"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { pgStaff } from "@/lib/admin-postgrest"

export const dynamic = "force-dynamic"

export default async function AdminMembershipStatusEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await params
  const id = Math.trunc(Number(rawId))
  const staff = await pgStaff()
  if (!staff) return <StaffJwtMissing title="Rediger medlemsstatus" />
  if (!Number.isFinite(id) || id <= 0) notFound()

  const { data, error } = await staff.from("membership_statuses").select("id,label").eq("id", id).maybeSingle()
  if (error) {
    return (
      <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">{error.message}</p>
    )
  }
  if (!data) notFound()
  const row = data as { id: number; label: string }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Rediger medlemsstatus</h1>
          <p className="mt-1 text-sm text-zinc-600">ID {row.id}</p>
        </div>
        <Link href="/admin/membership-statuses" className="text-sm font-medium text-red-700 hover:underline">
          ← Lista
        </Link>
      </div>

      <Card>
        <CardHeader className="border-b border-zinc-100">
          <CardTitle className="text-base">Etikett i skjema</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <form action={updateMembershipStatusLabelFromForm} className="space-y-4">
            <input type="hidden" name="id" value={row.id} />
            <div className="space-y-2">
              <Label htmlFor="label">Etikett</Label>
              <Input id="label" name="label" defaultValue={row.label} required className="max-w-xl" />
            </div>
            <Button type="submit">Lagre</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
