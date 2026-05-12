import Link from "next/link"
import { notFound } from "next/navigation"

import { updateNoSelectedOptionFromForm } from "@/app/admin/(dashboard)/no-selected-options/actions"
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
  label: string
  has_input_field: boolean
  input_field_label: string
  input_field_info: string
}

export default async function AdminNoSelectedOptionEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await params
  const id = Math.trunc(Number(rawId))
  const staff = await pgStaff()
  if (!staff) return <StaffJwtMissing title="Rediger valg uten aktivitet" />
  if (!Number.isFinite(id) || id <= 0) notFound()

  const { data, error } = await staff
    .from("no_selected_activity_options")
    .select("id,label,has_input_field,input_field_label,input_field_info")
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
          <h1 className="text-2xl font-semibold tracking-tight">Valg uten aktivitet</h1>
          <p className="mt-1 text-sm text-zinc-600">ID {row.id}</p>
        </div>
        <Link href="/admin/no-selected-options" className="text-sm font-medium text-red-700 hover:underline">
          ← Lista
        </Link>
      </div>

      <Card>
        <CardHeader className="border-b border-zinc-100">
          <CardTitle className="text-base">Felter</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <form action={updateNoSelectedOptionFromForm} className="max-w-xl space-y-6">
            <input type="hidden" name="id" value={row.id} />
            <div className="space-y-2">
              <Label htmlFor="label">Etikett</Label>
              <Input id="label" name="label" defaultValue={row.label} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="has_input_field">Vil ha utfyllingsfelt?</Label>
              <select
                id="has_input_field"
                name="has_input_field"
                className={selectClass}
                defaultValue={row.has_input_field ? "true" : "false"}
              >
                <option value="false">Nei</option>
                <option value="true">Ja</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="input_field_label">Feltetikett</Label>
              <Input id="input_field_label" name="input_field_label" defaultValue={row.input_field_label} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="input_field_info">Felthjelp</Label>
              <Textarea id="input_field_info" name="input_field_info" rows={3} defaultValue={row.input_field_info} />
            </div>
            <Button type="submit">Lagre</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
