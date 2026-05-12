import { pg } from "@/lib/postgrest"

/** Shape of `payload` from `railway.public_form_payload` (see `db/04-rpcs-and-views.sql`). */
export type PublicFormPayload = {
  text_content?: Record<string, unknown>
  activity_settings?: Record<string, unknown>
  activity_categories?: unknown[]
  activities?: unknown[]
  user_languages?: unknown[]
  membership_statuses?: unknown[]
  no_selected_activity_options?: unknown[]
  evaluation_questions?: unknown[]
  evaluation_options?: unknown[]
}

export type PublicFormPayloadResult =
  | { ok: true; payload: PublicFormPayload }
  | { ok: false; message: string }

/**
 * Single PostgREST read for the public registration surface (`06-public-form.md`).
 */
export async function getPublicFormPayload(): Promise<PublicFormPayloadResult> {
  try {
    const { data, error } = await pg()
      .from("public_form_payload")
      .select("payload")
      .limit(1)

    if (error) {
      return { ok: false, message: error.message }
    }

    const row = Array.isArray(data) ? data[0] : undefined
    const raw =
      row &&
      typeof row === "object" &&
      "payload" in row &&
      (row as { payload: unknown }).payload !== null
        ? (row as { payload: unknown }).payload
        : undefined

    if (!raw || typeof raw !== "object") {
      return { ok: false, message: "Tomt svar fra public_form_payload" }
    }

    return { ok: true, payload: raw as PublicFormPayload }
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    return { ok: false, message }
  }
}

export function summarizePublicPayload(p: PublicFormPayload): Record<string, number | string> {
  const n = (x: unknown) => (Array.isArray(x) ? x.length : 0)
  return {
    activity_categories: n(p.activity_categories),
    activities: n(p.activities),
    user_languages: n(p.user_languages),
    membership_statuses: n(p.membership_statuses),
    no_selected_activity_options: n(p.no_selected_activity_options),
    evaluation_questions: n(p.evaluation_questions),
    evaluation_options: n(p.evaluation_options),
    has_text_content: p.text_content ? "ja" : "nei",
    has_activity_settings: p.activity_settings ? "ja" : "nei",
  }
}

/** Thank-you snippets from the editorial singleton (`text_content`). */
export type ThankYouCopy = {
  title: string
  body: string
  memberTitle?: string
  memberBody?: string
  memberFootnote?: string
}

export async function getThankYouCopy(): Promise<ThankYouCopy | null> {
  try {
    const { data, error } = await pg()
      .from("text_content")
      .select(
        [
          "content_submitted_title",
          "content_submitted_text",
          "content_become_member_title",
          "content_become_member_text",
          "content_become_member_footnote",
        ].join(","),
      )
      .limit(1)

    if (error) return null

    const row = Array.isArray(data) ? data[0] : undefined
    if (!row || typeof row !== "object") return null
    const r = row as Record<string, unknown>
    const pick = (k: string): string =>
      typeof r[k] === "string" ? (r[k] as string) : ""
    return {
      title: pick("content_submitted_title"),
      body: pick("content_submitted_text"),
      memberTitle: pick("content_become_member_title"),
      memberBody: pick("content_become_member_text"),
      memberFootnote: pick("content_become_member_footnote"),
    }
  } catch {
    return null
  }
}
