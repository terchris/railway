import { createHmac, timingSafeEqual } from "node:crypto"

export type JwtVerifyOk = { ok: true; payload: Record<string, unknown> }
export type JwtVerifyFail = { ok: false }

/** Decode JWT payload segment without verifying the signature (never trust alone). */
export function decodeJwtPayloadUnsafe(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".")
    const mid = parts[1]
    if (!mid || parts.length < 3) return null
    const padded = mid + "=".repeat((4 - (mid.length % 4)) % 4)
    const b64 = padded.replace(/-/g, "+").replace(/_/g, "/")
    const json = Buffer.from(b64, "base64").toString("utf8")
    const obj = JSON.parse(json) as unknown
    return typeof obj === "object" && obj !== null ? (obj as Record<string, unknown>) : null
  } catch {
    return null
  }
}

function base64UrlDecode(s: string): Buffer {
  const padded = s + "=".repeat((4 - (s.length % 4)) % 4)
  const b64 = padded.replace(/-/g, "+").replace(/_/g, "/")
  return Buffer.from(b64, "base64")
}

function base64UrlEncode(buf: Buffer): string {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

export function mintHs256Jwt(secret: string, payload: Record<string, unknown>): string {
  const header = { alg: "HS256", typ: "JWT" }
  const hb = Buffer.from(JSON.stringify(header))
  const pb = Buffer.from(JSON.stringify(payload))
  const h = base64UrlEncode(hb)
  const p = base64UrlEncode(pb)
  const sig = createHmac("sha256", secret).update(`${h}.${p}`).digest()
  return `${h}.${p}.${base64UrlEncode(sig)}`
}

export function verifyHs256Jwt(secret: string, token: string): JwtVerifyOk | JwtVerifyFail {
  const parts = token.trim().split(".")
  if (parts.length !== 3) return { ok: false }
  const [hb64, pb64, sigB64] = parts
  if (!hb64 || !pb64 || !sigB64) return { ok: false }

  let headerJson: unknown
  try {
    headerJson = JSON.parse(base64UrlDecode(hb64).toString("utf8"))
  } catch {
    return { ok: false }
  }
  if (!headerJson || typeof headerJson !== "object") return { ok: false }
  const alg = (headerJson as { alg?: unknown }).alg
  if (alg !== "HS256") return { ok: false }

  const expectedSig = createHmac("sha256", secret).update(`${hb64}.${pb64}`).digest()
  let sigBuf: Buffer
  try {
    sigBuf = base64UrlDecode(sigB64)
  } catch {
    return { ok: false }
  }
  if (sigBuf.length !== expectedSig.length) return { ok: false }
  try {
    if (!timingSafeEqual(sigBuf, expectedSig)) return { ok: false }
  } catch {
    return { ok: false }
  }

  let payload: Record<string, unknown>
  try {
    const parsed = JSON.parse(base64UrlDecode(pb64).toString("utf8"))
    if (!parsed || typeof parsed !== "object") return { ok: false }
    payload = parsed as Record<string, unknown>
  } catch {
    return { ok: false }
  }

  const exp = payload.exp
  if (typeof exp !== "number" || !Number.isFinite(exp)) return { ok: false }
  if (Math.floor(Date.now() / 1000) >= exp) return { ok: false }

  return { ok: true, payload }
}
