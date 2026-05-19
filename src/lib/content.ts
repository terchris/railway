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

/** Rich UI copy when the bundle cannot load; never surfaces raw upstream HTML bodies. */
export type PublicFormConnectionEnvUi = {
  /** Trimmed configured base URL; `null` if missing or blank in `.env` / runtime. */
  postgrestUrl: string | null
  /** Never the real JWT; fixed mask when configured, plain text label when absent. */
  anonJwtMasked: string
}

export type PublicFormLoadFailurePresentation = {
  title: string
  lead: string
  hints: string[]
  env: PublicFormConnectionEnvUi
}

function snapshotPostgrestEnvForUi(): PublicFormConnectionEnvUi {
  const url = process.env.POSTGREST_URL?.trim()
  const jwt = process.env.POSTGREST_ANON_JWT
  const jwtSet = jwt !== undefined && jwt.trim() !== ""
  return {
    postgrestUrl: url && url !== "" ? url : null,
    anonJwtMasked: jwtSet ? "**************" : "ikke satt",
  }
}

function decorateFailurePresentation(base: Omit<PublicFormLoadFailurePresentation, "env">): PublicFormLoadFailurePresentation {
  return { ...base, env: snapshotPostgrestEnvForUi() }
}

export type PublicFormPayloadResult =
  | { ok: true; payload: PublicFormPayload }
  | { ok: false; presentation: PublicFormLoadFailurePresentation }

/** Plain sentence for bullets (no inline markup). */
const envHintSentence =
  "POSTGREST_URL må være full base-adresse til PostgREST for skjemaet railway på server-siden." as const

const jwtHintSentence =
  "POSTGREST_ANON_JWT må finnes i .env og ha leserettigheter som UIS har avtalt for offentlige views." as const

const hintEnvExpanded =
  `**POSTGREST_URL** skal ikke peke til en tilfeldig webvert eller default-side i nginx/proxy: du **skal** treffe PostgREST (JSON-API-et som utstiller railway-skjemaet). Serveren bruker bare denne verdien på server-side — ikke eksponeres som NEXT_PUBLIC_* med mindre det er gjort med vilje.` as const

const hintJwtExpanded =
  "**POSTGREST_ANON_JWT** må være gyldig i miljøet (normalt JWT fra UIS) slik at Accept-Profile: railway og Bearer-token stemmer." as const

function interpretPublicFormLoadFailure(raw: string): Omit<PublicFormLoadFailurePresentation, "env"> {
  const msg = raw.trim()
  const low = msg.toLowerCase()

  if (msg === "POSTGREST_URL is not set") {
    return {
      title: "Mangler POSTGREST_URL",
      lead: "Applikasjonen vet ikke hvor PostgREST skal kontaktes.",
      hints: [`Sett POSTGREST_URL i **.env**. ${hintEnvExpanded}`, hintJwtExpanded],
    }
  }

  if (msg === "POSTGREST_ANON_JWT is not set") {
    return {
      title: "Mangler POSTGREST_ANON_JWT",
      lead: "Det finnes ikke noe gyldig anonymt Bearer-token å sende til PostgREST.",
      hints: [`Sett POSTGREST_ANON_JWT i **.env** (verdi fra UIS). ${hintJwtExpanded}`, hintEnvExpanded],
    }
  }

  /** PostgREST HTTP 503 body when JWT verification is disabled / secret not configured (`PGRST_JWT_SECRET` etc.). */
  if (/server lacks jwt secret|lacks jwt secret|jwt secret\s+is\s+not\s+/i.test(msg)) {
    return {
      title: "PostgREST har ikke JWT-nøkkel konfigurert",
      lead:
        "PostgREST svarer, men avviser kallet fordi tjenesten ikke er satt opp med Hemmeligheten som trengs for å verifisere HS256‑Bearer‑tokens. Da nytter ikke **POSTGREST_ANON_JWT** før PostgREST og token‑utstedelse bruker samme hemmelighet.",
      hints: [
        "I UIS/Docker må PostgREST få JWT‑secret tilsvarende appens **JWT_SECRET** (eller det UIS kaller signeringsmaterial for anon‑JWT) — sett `PGRST_JWT_SECRET`/tilsvarende i PostgREST‑miljøet og start på nytt.",
        "**POSTGREST_ANON_JWT** må være signert med nøkkelen PostgREST faktisk bruker. Hvis du minter lokalt, bruk **`JWT_SECRET`** fra **`.env.example`**‑flyten og UIS‑dokumentasjon.",
        hintJwtExpanded,
      ],
    }
  }

  const hasHtmlEnvelope = low.includes("<html") || low.includes("</html>")
  const hasDoctypeHtml = low.includes("<!doctype html")
  const looksLikeJsonParseOfHtml =
    low.includes("unexpected token") ||
    msg.includes("'<'") ||
    msg.includes('"<"')

  const looksLikeNginxOrProxyPage =
    (hasHtmlEnvelope || hasDoctypeHtml || looksLikeJsonParseOfHtml) &&
    (low.includes("nginx") || /\b404\b/.test(low) || low.includes("not found"))

  if (looksLikeNginxOrProxyPage || ((hasHtmlEnvelope || hasDoctypeHtml) && !low.includes('"code"'))) {
    return {
      title: "POSTGREST_URL treffer ikke PostgREST",
      lead:
        "Tjeneren svarte med en ordinær HTML-side (ofte nginx 404), ikke JSON fra PostgREST. Da viser nettleserkallet feil mål: feil host, manglende sti gjennom proxy, eller at API-et ikke kjører der du tror.",
      hints: [
        `${hintEnvExpanded} Sjekk vertsnavn, http/https, eventuelt /rest eller annen UIS-basesti, og at reverse proxy rutet til PostgREST – ikke til en statisk eller default-behandler.`,
        "UIS med både **railway-postgrest** og **atlas-postgrest**: **POSTGREST_URL** må peke på **railway-postgrest** — bekreft nåværende HTTP-adresse via **./uis status** eller Traefik-ingress (hostnavn endres når konfigurasjon oppdateres).",
        hintJwtExpanded,
      ],
    }
  }

  const isNetworkish =
    low.includes("fetch failed") ||
    low.includes("network") ||
    low.includes("econnrefused") ||
    low.includes("enotfound") ||
    low.includes("etimedout") ||
    low.includes("socket hang up")

  if (isNetworkish) {
    return {
      title: "Ingen stabilt svar fra PostgREST",
      lead: "Tilkoblingen ble avvist, utløp, eller brøt før et gyldig svar kunne tolkes.",
      hints: [
        `${envHintSentence} Verifiser at tjenesten kjører, at DNS/hostfiler stemmer i dev, og at brannmur tillater utgående kall.`,
        jwtHintSentence,
      ],
    }
  }

  const looksLikePostgrestJson =
    /\bPGRST\d{3}\b/i.test(msg) ||
    /\b"pgrst/i.test(low) ||
    (low.includes("postgrest") && low.includes("code"))

  if (looksLikePostgrestJson) {
    return {
      title: "PostgREST avviste kallet",
      lead:
        "Her kom faktisk svar fra PostgREST, men spørringen feilet — typisk ACL/RLS, manglende relasjon eller at visningen public_form_payload ikke er utstilt.",
      hints: [
        hintJwtExpanded,
        "Åpne serverlogger eller UIS OpenAPI beskrivelse; sammenstill feilkoden med eksponering av railway-skjemaet og policies for anonym lese-rollen.",
      ],
    }
  }

  return {
    title: "Kunne ikke laste skjemadata",
    lead:
      msg.includes("<html") &&
        !msg.includes("PGRST") &&
        msg.length > 480
        ? "Trolig ren HTML eller en lang feilkropp fra en mellomtjener (vises ikke ordrett her). Juster POSTGREST_URL og verifiser at du treffer JSON-API-et."
        : msg.length <= 520
          ? msg
          : `${msg.slice(0, 400).trim()}… (melding forkortet)` +
            (msg.includes("<") ? " Det kan være HTML fra nginx eller en annen proxy." : ""),
    hints: [jwtHintSentence, envHintSentence],
  }
}

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
      return { ok: false, presentation: decorateFailurePresentation(interpretPublicFormLoadFailure(error.message)) }
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
      return {
        ok: false,
        presentation: decorateFailurePresentation({
          title: "Skjemadata mangler eller har uventet format",
          lead: "public_form_payload returnerte ikke et brukbart JSON-objekt. Visningen kan være tom, eller PostgREST eksponerer ikke feltene slik appen forventer.",
          hints: [jwtHintSentence, envHintSentence],
        }),
      }
    }

    return { ok: true, payload: raw as PublicFormPayload }
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    return { ok: false, presentation: decorateFailurePresentation(interpretPublicFormLoadFailure(message)) }
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
