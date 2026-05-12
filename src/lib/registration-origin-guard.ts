/**
 * Origin / CSRF-related checks for POST /api/registrations when PRIMARY_SITE_URL is set.
 * Uses real URL origins (not string prefix) so e.g. http://localhost:3001.evil.test cannot match.
 */

export type RegistrationOriginResult =
  | { ok: true }
  | { ok: false; status: number; error: string }

function trimOriginList(raw: string): string[] {
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
}

function configEntryToOrigin(entry: string): string | null {
  try {
    const u = new URL(entry.trim())
    if (!u.protocol || u.protocol === ":") return null
    return u.origin
  } catch {
    return null
  }
}

function allowedOriginsFromEnv(): Set<string> {
  const raw = process.env.PRIMARY_SITE_URL?.trim()
  if (!raw) return new Set()
  const out = new Set<string>()
  for (const part of trimOriginList(raw)) {
    const o = configEntryToOrigin(part)
    if (o) out.add(o)
  }
  return out
}

function originFromBrowserOriginHeader(originHeader: string | null): string | null {
  if (!originHeader) return null
  const t = originHeader.trim()
  if (t === "" || t.toLowerCase() === "null") return null
  return configEntryToOrigin(t)
}

function originFromReferer(referer: string | null): string | null {
  if (!referer) return null
  try {
    return new URL(referer.trim()).origin
  } catch {
    return null
  }
}

/**
 * When `PRIMARY_SITE_URL` lists at least one valid origin, require a matching `Origin` or
 * `Referer`, and reject browser `Sec-Fetch-Site: cross-site` unless relaxed via env.
 */
export function validateRegistrationPostOrigin(req: Request): RegistrationOriginResult {
  const allowed = allowedOriginsFromEnv()
  if (allowed.size === 0) return { ok: true }

  const relaxFetch = process.env.REGISTRATION_RELAX_FETCH_METADATA === "1"
  if (!relaxFetch) {
    const sfs = req.headers.get("Sec-Fetch-Site")
    if (sfs === "cross-site") {
      return { ok: false, status: 403, error: "Kryss-verts forespørsel avvist (Sec-Fetch-Site)." }
    }
  }

  const fromOrigin = originFromBrowserOriginHeader(req.headers.get("origin"))
  const fromReferer = originFromReferer(req.headers.get("referer"))

  const candidates = [fromOrigin, fromReferer].filter((x): x is string => typeof x === "string" && x.length > 0)

  if (candidates.length === 0) {
    return { ok: false, status: 403, error: "Mangler gyldig Origin eller Referer." }
  }

  if (!candidates.some((c) => allowed.has(c))) {
    return { ok: false, status: 403, error: "Tillatt kun fra primær verts-URL (Origin/Referer)." }
  }

  return { ok: true }
}
