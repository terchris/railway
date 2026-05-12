import Link from "next/link"

import { updateActivitySelectionLimitForm } from "@/app/admin/(dashboard)/activities/actions"
import { StaffJwtMissing } from "@/components/admin/staff-jwt-missing"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { pgStaff } from "@/lib/admin-postgrest"

export const dynamic = "force-dynamic"

export default async function AdminActivitySettingsPage() {
  const staff = await pgStaff()
  if (!staff) return <StaffJwtMissing title="Aktivitetsinnstillinger" />

  const { data, error } = await staff.from("activity_settings").select("activity_selection_limit").eq("id", true).maybeSingle()

  const limitRaw = data && typeof data === "object" && "activity_selection_limit" in data
    ? (data as { activity_selection_limit: number }).activity_selection_limit
    : 0

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Aktivitetsskjema · innstillinger</h1>
          <p className="mt-1 max-w-2xl text-sm text-zinc-600">
            Hvor mange primæraktiviteter registranten kan velge (0 betyr ingen begrensning på server —
            gjeldende UIS-oppsett kan være 1).
          </p>
        </div>
        <Link href="/admin/activities" className="text-sm font-medium text-red-700 hover:underline">
          ← Aktivitetstabell
        </Link>
      </div>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">{error.message}</p>
      ) : (
        <Card className="max-w-lg">
          <CardHeader className="border-b border-zinc-100">
            <CardTitle className="text-base">Begrens valg av primæraktivitet</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form action={updateActivitySelectionLimitForm} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="limit">activity_selection_limit</Label>
                <Input
                  id="limit"
                  name="limit"
                  type="number"
                  min={0}
                  max={999}
                  defaultValue={limitRaw}
                  required
                  className="max-w-[12rem]"
                />
                <p className="text-xs text-zinc-500">
                  Nedre liste «tilleggsaktiviteter» påvirkes ikke av dette tallet på samme måte som i dagens UX.
                </p>
              </div>
              <Button type="submit">Lagre</Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
