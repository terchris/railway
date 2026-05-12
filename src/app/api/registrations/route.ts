import { NextResponse } from "next/server"

import { honeypotField } from "@/components/form/persist"
import type { SubmitPayloadRpc } from "@/components/form/schema"
import { submissionErrorFromPostgrestMessage } from "@/lib/public-form/errors"
import { pg } from "@/lib/postgrest"
import { validateRegistrationPostOrigin } from "@/lib/registration-origin-guard"

/** Public submit handler — proxies to PostgREST `submit_registration`. */
export async function POST(req: Request) {
  const ct = req.headers.get("content-type") ?? ""
  if (!ct.toLowerCase().startsWith("application/json")) {
    return NextResponse.json({ error: "Content-Type må være application/json." }, { status: 415 })
  }

  const originCheck = validateRegistrationPostOrigin(req)
  if (!originCheck.ok) {
    return NextResponse.json({ error: originCheck.error }, { status: originCheck.status })
  }

  let rawJson: Record<string, unknown>
  try {
    rawJson = (await req.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: "Ugyldig JSON." }, { status: 400 })
  }

  const hpKey = honeypotField()
  const hpVal = typeof rawJson[hpKey] === "string" ? rawJson[hpKey] : ""
  if (hpVal !== undefined && hpVal !== null && String(hpVal).length > 0) {
    try {
      await pg().rpc("log_event", {
        p_type: "REGISTRATION",
        p_category: "honeypot",
        p_alert: true,
        p_message: JSON.stringify({ field: hpKey }),
      })
    } catch {
      /* best-effort */
    }
    return NextResponse.json({ redirect: "/thank-you" })
  }

  const reg = rawJson.registration as SubmitPayloadRpc | undefined
  if (!reg || typeof reg !== "object") {
    return NextResponse.json({ error: "Mangler «registration» objekt." }, { status: 400 })
  }

  try {
    const { data, error } = await pg().rpc("submit_registration", { payload: reg as never })
    if (error) {
      return NextResponse.json(
        {
          error: submissionErrorFromPostgrestMessage(
            `${error.code ?? ""} ${error.message ?? ""}`.trim(),
          ),
        },
        { status: 400 },
      )
    }
    const envelope = data as { show_membership_options?: boolean } | null
    const showMember = !!(envelope && typeof envelope === "object" && envelope.show_membership_options)
    const redirect = showMember ? "/thank-you?complete-membership=true" : "/thank-you"
    return NextResponse.json({ ok: true, redirect })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json(
      {
        error: submissionErrorFromPostgrestMessage(msg),
      },
      { status: 400 },
    )
  }
}
