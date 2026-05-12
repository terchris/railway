import { z } from "zod"

import type { PublicFormPayload } from "@/lib/content"

const activityCatSchema = z.object({
  id: z.coerce.number(),
  name: z.string(),
  sort_order: z.coerce.number(),
  is_additional: z.coerce.boolean(),
})

const activitySchema = z.object({
  id: z.coerce.number(),
  category_id: z.coerce.number(),
  name: z.string(),
  info: z.string(),
  needs_volunteers: z.boolean().optional(),
  sort_order: z.coerce.number(),
})

const langSchema = z.object({
  id: z.coerce.number(),
  name: z.string(),
  place_at_top: z.boolean().optional(),
})

const memberStatusSchema = z.object({
  id: z.coerce.number(),
  label: z.string(),
  show_membership_options: z.coerce.boolean(),
  sort_order: z.coerce.number(),
})

const noSelSchema = z.object({
  id: z.coerce.number(),
  label: z.string(),
  has_input_field: z.coerce.boolean(),
  input_field_label: z.string(),
  input_field_info: z.string(),
  sort_order: z.coerce.number(),
})

const evalQSchema = z.object({
  id: z.coerce.number(),
  label: z.string(),
  question_type: z.enum(["select", "text"]),
  sort_order: z.coerce.number(),
})

const evalOptSchema = z.object({
  id: z.coerce.number(),
  label: z.string(),
  value: z.string(),
  sort_order: z.coerce.number(),
})

const settingsSchema = z.object({
  activity_selection_limit: z.number(),
})

function parseRows<T>(raw: unknown, row: z.ZodType<T>): T[] {
  if (!Array.isArray(raw)) return []
  const out: T[] = []
  for (const x of raw) {
    const r = row.safeParse(x)
    if (r.success) out.push(r.data)
  }
  return out
}

export type RegistrationBundle = {
  text: Record<string, string>
  activitySelectionLimit: number
  activityCategories: z.infer<typeof activityCatSchema>[]
  /** Primary group: categories where is_additional=false. */
  primaryCategories: { category: z.infer<typeof activityCatSchema>; activities: z.infer<typeof activitySchema>[] }[]
  /** Additional group */
  additionalCategories: { category: z.infer<typeof activityCatSchema>; activities: z.infer<typeof activitySchema>[] }[]
  languages: z.infer<typeof langSchema>[]
  membershipStatuses: z.infer<typeof memberStatusSchema>[]
  noSelectedActivityOptions: z.infer<typeof noSelSchema>[]
  evaluationQuestions: z.infer<typeof evalQSchema>[]
  /** One shared pool for every select-type question (see `03-data-model.md`). */
  evaluationOptionsAll: z.infer<typeof evalOptSchema>[]
}

function groupActivities(
  categories: z.infer<typeof activityCatSchema>[],
  activities: z.infer<typeof activitySchema>[],
  additionalOnly: boolean,
): RegistrationBundle["primaryCategories"] {
  const filtered = categories
    .filter((c) => (additionalOnly ? c.is_additional : !c.is_additional))
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order)

  return filtered.map((category) => ({
    category,
    activities: activities
      .filter((a) => a.category_id === category.id)
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order),
  }))
}

export function buildRegistrationBundle(payload: PublicFormPayload): RegistrationBundle {
  const textRaw = payload.text_content ?? {}
  const text: Record<string, string> = {}
  for (const [k, v] of Object.entries(textRaw)) {
    if (v === null || v === undefined) text[k] = ""
    else if (typeof v === "string") text[k] = v
    else if (typeof v === "boolean") text[k] = v ? "true" : "false"
    else if (typeof v === "number") text[k] = String(v)
    else text[k] = JSON.stringify(v)
  }

  let activitySelectionLimit = 0
  const st = payload.activity_settings ?? {}
  const sp = settingsSchema.safeParse(st)
  if (sp.success) activitySelectionLimit = sp.data.activity_selection_limit

  const activityCategories = parseRows(payload.activity_categories, activityCatSchema)
  const activities = parseRows(payload.activities, activitySchema)
  const languages = parseRows(payload.user_languages, langSchema).sort((a, b) => {
    const pa = !!a.place_at_top
    const pb = !!b.place_at_top
    if (pa !== pb) return pa ? -1 : 1
    return a.name.localeCompare(b.name, "nb")
  })
  const membershipStatuses = parseRows(payload.membership_statuses, memberStatusSchema).sort(
    (a, b) => a.sort_order - b.sort_order,
  )
  const noSelectedActivityOptions = parseRows(payload.no_selected_activity_options, noSelSchema).sort(
    (a, b) => a.sort_order - b.sort_order,
  )
  const evaluationQuestions = parseRows(payload.evaluation_questions, evalQSchema).sort(
    (a, b) => a.sort_order - b.sort_order,
  )

  const evaluationOptionsAll = parseRows(payload.evaluation_options, evalOptSchema).sort(
    (a, b) => a.sort_order - b.sort_order,
  )

  return {
    text,
    activitySelectionLimit,
    activityCategories,
    primaryCategories: groupActivities(activityCategories, activities, false),
    additionalCategories: groupActivities(activityCategories, activities, true),
    languages,
    membershipStatuses,
    noSelectedActivityOptions,
    evaluationQuestions,
    evaluationOptionsAll,
  }
}
