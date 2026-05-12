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
 * Pass a session JWT from admin flows; omit the argument for anon RSC/public reads.
 * Set **`POSTGREST_URL`** per environment (host dev: UIS Traefik, e.g. `http://api-railway.localhost`;
 * in-cluster: PostgREST Service URL). If your gateway adds a path prefix, append it here.
 * Relation and RPC names follow `helpers/railway/db/*.sql`; OpenAPI is at `GET {base}/` when enabled.
 */
export function pg(accessToken?: string): PostgrestClient {
  const url = requireEnv("POSTGREST_URL").replace(/\/$/, "")
  const bearer =
    accessToken !== undefined && accessToken.trim() !== ""
      ? accessToken
      : requireEnv("POSTGREST_ANON_JWT")

  return new PostgrestClient(url, {
    headers: { Authorization: `Bearer ${bearer}` },
  })
}
