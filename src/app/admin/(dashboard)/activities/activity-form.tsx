import Link from "next/link"

import { createActivityFromForm, updateActivityFromForm } from "@/app/admin/(dashboard)/activities/actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

import adminStyles from "@/app/admin/(dashboard)/admin.module.css"
import styles from "./activity-form.module.css"

export type ActivityCategoryOption = { id: number; name: string }

export type ActivityFormValues = {
  category_id: number
  name: string
  info: string
  internal_info: string
  needs_volunteers: boolean
  has_speaking_time: boolean
  has_film_clip: boolean
  is_enabled: boolean
  sort_order: number
}

function boolOpt(v: boolean) {
  return v ? "true" : "false"
}

export function ActivityEditorForm({
  mode,
  activityId,
  categories,
  initial,
}: {
  mode: "new" | "edit"
  activityId?: number
  categories: ActivityCategoryOption[]
  initial?: ActivityFormValues
}) {
  const v: ActivityFormValues =
    initial ??
    {
      category_id: categories[0]?.id ?? 0,
      name: "",
      info: "",
      internal_info: "",
      needs_volunteers: true,
      has_speaking_time: false,
      has_film_clip: false,
      is_enabled: true,
      sort_order: 0,
    }

  const action =
    mode === "new"
      ? createActivityFromForm
      : updateActivityFromForm.bind(null, activityId ?? 0)

  return (
    <form action={action} className={styles.form}>
      <Card>
        <CardHeader className={adminStyles.sectionCardHeader}>
          <CardTitle className={adminStyles.sectionCardTitle}>
            {mode === "new" ? "Ny aktivitet" : "Rediger aktivitet"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={adminStyles.formCardBody}>
            <div className={adminStyles.field}>
              <Label htmlFor="category_id">Kategori</Label>
              <select
                id="category_id"
                name="category_id"
                className={`${adminStyles.select} ${styles.maxInput}`}
                required
                defaultValue={v.category_id || ""}
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className={adminStyles.field}>
              <Label htmlFor="name">Navn (synlig i skjema)</Label>
              <Input id="name" name="name" defaultValue={v.name} required className={styles.maxInput} />
            </div>

            <div className={adminStyles.field}>
              <Label htmlFor="info">Beskrivelse / info til frivillige (HTML)</Label>
              <Textarea id="info" name="info" rows={5} defaultValue={v.info} className={adminStyles.monoTextarea} />
            </div>

            <div className={adminStyles.field}>
              <Label htmlFor="internal_info">Internt notat (HTML, valgfritt)</Label>
              <Textarea
                id="internal_info"
                name="internal_info"
                rows={3}
                defaultValue={v.internal_info}
                className={adminStyles.monoTextarea}
              />
            </div>

            <div className={`${adminStyles.formGrid2} ${styles.maxInput}`}>
              <div className={adminStyles.field}>
                <Label htmlFor="sort_order">Sortering (rekkefølge)</Label>
                <Input
                  id="sort_order"
                  name="sort_order"
                  type="number"
                  step={1}
                  defaultValue={v.sort_order}
                  required
                />
              </div>
              <div className={adminStyles.field}>
                <Label htmlFor="is_enabled">Synlig i skjema</Label>
                <select
                  id="is_enabled"
                  name="is_enabled"
                  className={adminStyles.select}
                  defaultValue={boolOpt(v.is_enabled)}
                >
                  <option value="true">Ja (i bruk)</option>
                  <option value="false">Nei (skjult)</option>
                </select>
              </div>
            </div>

            <div className={`${adminStyles.formGrid2} ${styles.maxInput}`}>
              <div className={adminStyles.field}>
                <Label htmlFor="needs_volunteers">Trenger frivillige</Label>
                <select
                  id="needs_volunteers"
                  name="needs_volunteers"
                  className={adminStyles.select}
                  defaultValue={boolOpt(v.needs_volunteers)}
                >
                  <option value="true">Ja</option>
                  <option value="false">Nei</option>
                </select>
              </div>
              <div className={adminStyles.field}>
                <Label htmlFor="has_speaking_time">Taletid</Label>
                <select
                  id="has_speaking_time"
                  name="has_speaking_time"
                  className={adminStyles.select}
                  defaultValue={boolOpt(v.has_speaking_time)}
                >
                  <option value="false">Nei</option>
                  <option value="true">Ja</option>
                </select>
              </div>
            </div>

            <div className={`${adminStyles.field} ${styles.maxXs}`}>
              <Label htmlFor="has_film_clip">Filmklipp</Label>
              <select
                id="has_film_clip"
                name="has_film_clip"
                className={adminStyles.select}
                defaultValue={boolOpt(v.has_film_clip)}
              >
                <option value="false">Nei</option>
                <option value="true">Ja</option>
              </select>
            </div>

            <div className={adminStyles.formActions}>
              <Button type="submit">{mode === "new" ? "Opprett" : "Lagre"}</Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/admin/activities">Avbryt</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}
