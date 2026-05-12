import Link from "next/link"

import { updateActivityStepText } from "@/app/admin/(dashboard)/activities/actions"
import { StaffJwtMissing } from "@/components/admin/staff-jwt-missing"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { pgStaff } from "@/lib/admin-postgrest"

export const dynamic = "force-dynamic"

type CopyRow = {
  content_activities_title: string
  content_activities_text: string
  content_activity_categories_text: string
  content_activities_footnote: string
}

const emptyCopy: CopyRow = {
  content_activities_title: "",
  content_activities_text: "",
  content_activity_categories_text: "",
  content_activities_footnote: "",
}

export default async function AdminActivitiesTextPage() {
  const staff = await pgStaff()
  if (!staff) return <StaffJwtMissing title="Tekster · aktivitetsteg" />

  const { data, error } = await staff
    .from("text_content")
    .select([
      "content_activities_title",
      "content_activities_text",
      "content_activity_categories_text",
      "content_activities_footnote",
    ].join(","))
    .limit(1)
    .maybeSingle()

  let copy = emptyCopy
  if (!error && data && typeof data === "object") {
    const row = data as Record<string, unknown>
    copy = {
      content_activities_title: typeof row.content_activities_title === "string" ? row.content_activities_title : "",
      content_activities_text: typeof row.content_activities_text === "string" ? row.content_activities_text : "",
      content_activity_categories_text:
        typeof row.content_activity_categories_text === "string" ? row.content_activity_categories_text : "",
      content_activities_footnote:
        typeof row.content_activities_footnote === "string" ? row.content_activities_footnote : "",
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tekster på aktivitetsteget</h1>
          <p className="mt-1 max-w-2xl text-sm text-zinc-600">
            Overskrift, introtekst og HTML-snutter som dukker opp sammen med «Velg aktiviteter» på
            registreringsskjemaet.
          </p>
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium">
          <Link href="/admin/text-content" className="text-red-700 hover:underline">
            Alle skjematekster →
          </Link>
          <Link href="/admin/activities" className="text-zinc-600 hover:text-red-800">
            ← Aktivitetstabell
          </Link>
        </div>
      </div>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">{error.message}</p>
      ) : (
        <form action={updateActivityStepText} className="space-y-8">
          <Card>
            <CardHeader className="border-b border-zinc-100">
              <CardTitle className="text-base">Sidetittel & brødtekst</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="space-y-2">
                <Label htmlFor="content_activities_title">Tittel (plain text)</Label>
                <Textarea id="content_activities_title" name="content_activities_title" rows={2} defaultValue={copy.content_activities_title} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="content_activities_text">Intro (HTML til blogg-visning på skjemaet)</Label>
                <Textarea id="content_activities_text" name="content_activities_text" rows={6} defaultValue={copy.content_activities_text} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="content_activity_categories_text">Tekst over kategoriblokkene (HTML)</Label>
                <Textarea
                  id="content_activity_categories_text"
                  name="content_activity_categories_text"
                  rows={4}
                  defaultValue={copy.content_activity_categories_text}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="content_activities_footnote">Fotnote under liste (HTML, valgfritt)</Label>
                <Textarea id="content_activities_footnote" name="content_activities_footnote" rows={3} defaultValue={copy.content_activities_footnote} />
              </div>
              <Button type="submit">Lagre tekster</Button>
            </CardContent>
          </Card>
        </form>
      )}

      <p className="text-xs text-zinc-600">
        Innhold sanitiser ikke her — behold samme disiplin som i Craft («klipp HTML fra nettsiden»).
      </p>
    </div>
  )
}
