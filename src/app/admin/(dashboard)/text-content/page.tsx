import Link from "next/link"

import { updateFullTextContent } from "@/app/admin/(dashboard)/text-content/actions"
import { StaffJwtMissing } from "@/components/admin/staff-jwt-missing"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { pgStaff } from "@/lib/admin-postgrest"
import { ALL_TEXT_CONTENT_KEYS, TEXT_CONTENT_GROUPS } from "@/lib/text-content-keys"

export const dynamic = "force-dynamic"

export default async function AdminTextContentPage() {
  const staff = await pgStaff()
  if (!staff) return <StaffJwtMissing title="Skjematekster" />

  const selectList = ALL_TEXT_CONTENT_KEYS.join(",")
  const { data, error } = await staff.from("text_content").select(selectList).eq("id", true).maybeSingle()

  const defaults: Record<string, string> = {}
  for (const k of ALL_TEXT_CONTENT_KEYS) defaults[k] = ""

  let values = defaults
  if (!error && data && typeof data === "object") {
    const row = data as Record<string, unknown>
    values = { ...defaults }
    for (const k of ALL_TEXT_CONTENT_KEYS) {
      const raw = row[k]
      values[k] = typeof raw === "string" ? raw : raw == null ? "" : String(raw)
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Alle skjematekster</h1>
          <p className="mt-1 max-w-2xl text-sm text-zinc-600">
            Alle redaksjonelle tekstfelt som brukes på registreringsskjema og takkeside (`railway.text_content`).
            Aktivitetsteget kan også redigeres fra{" "}
            <Link href="/admin/activities-text" className="text-red-700 hover:underline">
              den korte aktivitetssiden
            </Link>
            .
          </p>
        </div>
        <Link href="/admin/activities" className="text-sm font-medium text-red-700 hover:underline">
          ← Aktiviteter
        </Link>
      </div>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">{error.message}</p>
      ) : (
        <form action={updateFullTextContent} className="space-y-8">
          {TEXT_CONTENT_GROUPS.map((group) => (
            <Card key={group.title}>
              <CardHeader className="border-b border-zinc-100">
                <CardTitle className="text-base">{group.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                {group.fields.map((f) => (
                  <div key={f.key} className="space-y-2">
                    <Label htmlFor={f.key}>{f.label}</Label>
                    <Textarea
                      id={f.key}
                      name={f.key}
                      rows={f.multiline ? 5 : 2}
                      defaultValue={values[f.key] ?? ""}
                      className="font-mono text-xs md:text-sm"
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
          <Button type="submit">Lagre alle tekster</Button>
        </form>
      )}

      <p className="text-xs text-zinc-600">
        HTML fra Craft overføres som i dag — ingen automatisk sanitising i admin.
      </p>
    </div>
  )
}
