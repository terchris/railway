import Link from "next/link"
import { notFound } from "next/navigation"

import { updateEvaluationOptionFromForm } from "@/app/admin/(dashboard)/evaluation/options/actions"
import { StaffJwtMissing } from "@/components/admin/staff-jwt-missing"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { pgStaff } from "@/lib/admin-postgrest"

export const dynamic = "force-dynamic"

type Row = { id: number; label: string; value: string }

export default async function AdminEvaluationOptionEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await params
  const id = Math.trunc(Number(rawId))
  const staff = await pgStaff()
  if (!staff) return <StaffJwtMissing title="Evalueringsalternativ" />
  if (!Number.isFinite(id) || id <= 0) notFound()

  const { data, error } = await staff.from("evaluation_options").select("id,label,value").eq("id", id).maybeSingle()
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
          <h1 className="text-2xl font-semibold tracking-tight">Evaluerings­alternativ</h1>
          <p className="mt-1 text-sm text-zinc-600">ID {row.id}</p>
        </div>
        <Link href="/admin/evaluation/options" className="text-sm font-medium text-red-700 hover:underline">
          ← Lista
        </Link>
      </div>

      <Card>
        <CardHeader className="border-b border-zinc-100">
          <CardTitle className="text-base">Felter</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <form action={updateEvaluationOptionFromForm} className="max-w-xl space-y-6">
            <input type="hidden" name="id" value={row.id} />
            <div className="space-y-2">
              <Label htmlFor="label">Etikett (visning)</Label>
              <Input id="label" name="label" defaultValue={row.label} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="value">Lagret verdi</Label>
              <Input id="value" name="value" defaultValue={row.value} required className="font-mono text-sm" />
              <p className="text-xs text-zinc-500">
                Ved select-spørsmål sendes valgt rad sin <span className="font-mono">id</span> som del av RPC-innsendingen.
              </p>
            </div>
            <Button type="submit">Lagre</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
