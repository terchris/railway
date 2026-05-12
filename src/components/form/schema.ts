import { z } from "zod"

import type { RegistrationBundle } from "@/lib/public-form/bundle"

/** Working state for react-hook-form (partial consent OK until submission). */
export const draftShape = z.object({
  name: z.string(),
  email: z.string(),
  phone: z.string(),
  membership_status_id: z.number(),
  language_ids: z.array(z.number().int()),
  primary_activity_ids: z.array(z.number().int()),
  additional_activity_ids: z.array(z.number().int()),
  no_selected_activity_option_id: z.number().int().positive().nullable(),
  no_selected_activity_input: z.string(),
  comment: z.string(),
  evaluation: z.record(z.string(), z.string()),
  consentAccepted: z.boolean(),
})

export type RegistrationFormValues = z.infer<typeof draftShape>

export const registrationEmptyValues: RegistrationFormValues = {
  name: "",
  email: "",
  phone: "",
  membership_status_id: 0,
  language_ids: [],
  primary_activity_ids: [],
  additional_activity_ids: [],
  no_selected_activity_option_id: null,
  no_selected_activity_input: "",
  comment: "",
  evaluation: {},
  consentAccepted: false,
}

export type SubmitPayloadRpc = {
  name: string
  email: string
  phone: string
  primary_activity_ids: number[]
  additional_activity_ids: number[]
  language_ids: number[]
  membership_status_id: number
  no_selected_activity_option_id: number | null
  no_selected_activity_input: string
  comment: string
  evaluation_answers: { question_id: number; option_id?: number; input_value?: string }[]
}

export function validateRegistrationSubmit(values: RegistrationFormValues, bundle: RegistrationBundle) {
  const validator = draftShape
    .extend({
      membership_status_id: z.number({ message: "Velg status" }).int().positive("Velg medlemskapsalternativ"),
      name: z.string().trim().min(2, "Navnet må ha minst to tegn"),
      email: z.string().trim().email("Skriv inn en gyldig e-postadresse"),
      phone: z.string().trim().min(6, "Telefonnummer må fylles ut"),
      language_ids: z.array(z.number().int()).min(1, "Velg minst ett språk du kan snakke på møtene"),
      consentAccepted: z.boolean().refine((x) => x === true, {
        message: "Du må godta vilkår og samtykke for å registrere deg",
      }),
    })
    .superRefine((data, ctx) => {
      const totalActivities = data.primary_activity_ids.length + data.additional_activity_ids.length
      const hasNone = !!data.no_selected_activity_option_id
      if (totalActivities === 0 && !hasNone) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "Velg minst én aktivitet eller forklar hvorfor du ikke ønsker å velge aktivitet akkurat nå.",
          path: ["primary_activity_ids"],
        })
      }
      if (totalActivities > 0 && hasNone) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Du kan ikke både velge aktiviteter og samtidig bruke «ingen aktivitet»-alternativ.",
          path: ["no_selected_activity_option_id"],
        })
      }

      const opt =
        bundle.noSelectedActivityOptions.find((o) => o.id === data.no_selected_activity_option_id) ??
        null
      if (
        totalActivities === 0 &&
        opt?.has_input_field &&
        !(data.no_selected_activity_input ?? "").trim()
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Dette påkrevde feltet mangler",
          path: ["no_selected_activity_input"],
        })
      }

      const limit = bundle.activitySelectionLimit
      if (limit > 0 && data.primary_activity_ids.length > limit) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            limit === 1 ? "Du kan kun velge én hovedaktivitet." : `Maks ${limit} primæraktivitet(er).`,
          path: ["primary_activity_ids"],
        })
      }

      for (const q of bundle.evaluationQuestions) {
        const val = data.evaluation[String(q.id)]?.trim()
        if (!val) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Besvar alle evalueringsspørsmålene",
            path: ["evaluation", String(q.id)],
          })
          continue
        }
        if (q.question_type === "select") {
          const id = Number(val)
          if (!Number.isFinite(id) || !bundle.evaluationOptionsAll.some((o) => o.id === id)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "Velg et svaralternativ",
              path: ["evaluation", String(q.id)],
            })
          }
        }
      }
    })

  return validator.safeParse(values)
}

export function buildRpcPayload(bundle: RegistrationBundle, vals: RegistrationFormValues): SubmitPayloadRpc {
  const acts = vals.primary_activity_ids.length + vals.additional_activity_ids.length
  const evaluationAnswers: SubmitPayloadRpc["evaluation_answers"] = []
  for (const q of bundle.evaluationQuestions) {
    const raw = vals.evaluation[String(q.id)]?.trim()
    if (!raw) continue
    if (q.question_type === "select") {
      evaluationAnswers.push({ question_id: q.id, option_id: Number(raw) })
    } else {
      evaluationAnswers.push({ question_id: q.id, input_value: raw })
    }
  }

  return {
    name: vals.name.trim(),
    email: vals.email.trim(),
    phone: vals.phone.trim(),
    primary_activity_ids: vals.primary_activity_ids,
    additional_activity_ids: vals.additional_activity_ids,
    language_ids: vals.language_ids,
    membership_status_id: vals.membership_status_id,
    no_selected_activity_option_id:
      acts === 0 ? (vals.no_selected_activity_option_id ?? null) : null,
    no_selected_activity_input:
      acts === 0 && vals.no_selected_activity_option_id ? (vals.no_selected_activity_input ?? "") : "",
    comment: vals.comment.trim(),
    evaluation_answers: evaluationAnswers,
  }
}
