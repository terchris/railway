import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto"

export const ADMIN_SESSION_COOKIE = "railway_admin_session"

const SESSION_TTL_SEC = 60 * 60 * 24 * 7 // 7 days

/** SHA-256 hashes for fixed-length timing-safe comparison. */
function digestPassword(pw: string): Buffer {
  return createHash("sha256").update(pw, "utf8").digest()
}

/** True when provided password matches `ADMIN_PASSWORD`. */
export function adminPasswordMatches(provided: string, expectedPlain: string): boolean {
  if (!provided || !expectedPlain) return false
  try {
    return timingSafeEqual(digestPassword(provided), digestPassword(expectedPlain))
  } catch {
    return false
  }
}

export function mintAdminSessionCookieValue(): string {
  const secret = requireEnvTrim("ADMIN_COOKIE_SECRET")
  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL_SEC
  const nonce = randomBytes(12).toString("hex")
  const payload = `${exp}.${nonce}`
  const sig = createHmac("sha256", secret).update(payload).digest("hex")
  return `${payload}.${sig}`
}

export function verifyAdminSessionCookieValue(token: string | undefined): boolean {
  if (!token || typeof token !== "string") return false
  const secret = process.env.ADMIN_COOKIE_SECRET?.trim()
  if (!secret) return false
  const parts = token.split(".")
  if (parts.length !== 3) return false
  const [expStr, nonce, sigHex] = parts
  const exp = Number(expStr)
  if (!nonce || !/^[0-9a-f]+$/.test(nonce)) return false
  if (!sigHex || !/^[0-9a-f]{64}$/.test(sigHex)) return false
  if (!Number.isFinite(exp)) return false
  if (Math.floor(Date.now() / 1000) > exp) return false
  const payload = `${expStr}.${nonce}`
  const expected = createHmac("sha256", secret).update(payload).digest("hex")
  try {
    return timingSafeEqual(Buffer.from(sigHex, "hex"), Buffer.from(expected, "hex"))
  } catch {
    return false
  }
}

export function adminSessionCookieOpts() {
  return {
    httpOnly: true as const,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SEC,
  }
}

function requireEnvTrim(name: string): string {
  const v = process.env[name]
  if (v === undefined || v.trim() === "") {
    throw new Error(`${name} is not set`)
  }
  return v.trim()
}
