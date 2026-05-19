import Link from "next/link"

import { updateFullTextContent } from "@/app/admin/(dashboard)/text-content/actions"
import { StaffJwtMissing } from "@/components/admin/staff-jwt-missing"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { pgStaff } from "@/lib/admin-postgrest"
import { ALL_TEXT_CONTENT_KEYS, TEXT_CONTENT_GROUPS } from "@/lib/text-content-keys"

import adminStyles from "@/app/admin/(dashboard)/admin.module.css"

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
    <div className={adminStyles.pageWide}>
      <div className={adminStyles.pageHeader}>
        <div className={adminStyles.pageHeaderInner}>
          <h1 className={adminStyles.pageTitle}>Alle skjematekster</h1>
          <p className={adminStyles.pageLead}>
            Alle redaksjonelle tekstfelt som brukes på registreringsskjema og takkeside ({" "}
            <code className={adminStyles.code}>railway.text_content</code>). Aktivitetsteget kan også redigeres fra{" "}
            <Link href="/admin/activities-text" className={adminStyles.actionLink}>
              den korte aktivitetssiden
            </Link>
            .
          </p>
        </div>
        <Link href="/admin/activities" className={adminStyles.actionLink}>
          ← Aktiviteter
        </Link>
      </div>

      {error ? (
        <p className={adminStyles.errorBanner}>{error.message}</p>
      ) : (
        <form action={updateFullTextContent} className={adminStyles.pageWide}>
          {TEXT_CONTENT_GROUPS.map((group) => (
            <Card key={group.title}>
              <CardHeader className={adminStyles.sectionCardHeader}>
                <CardTitle className={adminStyles.sectionCardTitle}>{group.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={adminStyles.formCardBody}>
                  {group.fields.map((f) => (
                    <div key={f.key} className={adminStyles.field}>
                      <Label htmlFor={f.key}>{f.label}</Label>
                      <Textarea
                        id={f.key}
                        name={f.key}
                        rows={f.multiline ? 5 : 2}
                        defaultValue={values[f.key] ?? ""}
                        className={adminStyles.monoTextarea}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
          <Button type="submit">Lagre alle tekster</Button>
        </form>
      )}

      <p className={adminStyles.fineprint}>
        HTML fra Craft overføres som i dag — ingen automatisk sanitising i admin.
      </p>
    </div>
  )
}
