import { PostgrestClient } from "@supabase/postgrest-js"

function requireEnv(name: string): string {
  const value = process.env[name]
  if (value === undefined || value.trim() === "") {
    throw new Error(`${name} is not set`)
  }
  return value
}

/**
 * Server-side PostgREST client (`terchris/new/05-nextjs-frontend.md`).
 *
 * Uses **schema `railway`** (`Accept-Profile`).
 * Pass a session JWT from admin flows; omit for anon RSC/public reads.
 * Set **`POSTGREST_URL`** to the **railway-postgrest** HTTP base UIS exposes (Railway schema), not atlas-postgrest.
 * UIS/Traefik hostnames drift — verify with `./uis status` / ingress before relying on examples like `http://api-railway.localhost`.
 * Relation and RPC names follow `helpers/railway/db/*.sql`; OpenAPI is at `GET {base}/` when enabled.
 */
export function pg(accessToken?: string): PostgrestClient {
  const url = requireEnv("POSTGREST_URL").replace(/\/$/, "")
  const bearer =
    accessToken !== undefined && accessToken.trim() !== ""
      ? accessToken
      : requireEnv("POSTGREST_ANON_JWT")

  return new PostgrestClient(url, {
    schema: "railway",
    headers: { Authorization: `Bearer ${bearer}` },
  }) as unknown as PostgrestClient
}
