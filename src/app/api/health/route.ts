import { pg } from "@/lib/postgrest"
import { NextResponse } from "next/server"

/**
 * Mirrors `04-postgrest-api.md` — `app_log_alert_count()` via PostgREST RPC.
 */
export async function GET() {
  try {
    const { data, error } = await pg().rpc("app_log_alert_count", undefined, { get: true })
    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 502 })
    }
    return NextResponse.json({ ok: true, alerts: data })
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ ok: false, error: message }, { status: 503 })
  }
}
