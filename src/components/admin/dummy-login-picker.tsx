"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

import { Alert } from "@/components/ui/alert"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DUMMY_LOGIN_ROLES, type RoleProfile } from "@/lib/dummy-login-roles"

export function DummyLoginPicker() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [pendingId, setPendingId] = useState<string | null>(null)

  async function pick(profile: RoleProfile) {
    if (profile.disabled || pendingId) return
    setError(null)
    setPendingId(profile.id)
    try {
      const res = await fetch("/api/admin/login/dummy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId: profile.id }),
      })
      const data = (await res.json()) as { ok?: boolean; redirect?: string; error?: string }
      if (!res.ok || !data.ok) {
        setError(data.error ?? `Dummy‑login feilet (${res.status}).`)
        setPendingId(null)
        return
      }
      const target = data.redirect ?? "/admin"
      router.push(target)
      router.refresh()
    } catch {
      setError("Nettverksfeil — prøv igjen.")
      setPendingId(null)
    }
  }

  return (
    <Card className="mx-auto w-full max-w-2xl border-zinc-200 shadow-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-xl">Dummy‑innlogging</CardTitle>
        <p className="text-sm text-zinc-500">
          Velg en PostgreSQL‑rolle eller capability‑profil for å logge inn. Stillas for Okta/Authentik‑integrasjon —
          erstattes senere.
        </p>
      </CardHeader>
      <CardContent>
        {error ? (
          <Alert variant="destructive" className="mb-4 text-sm">
            {error}
          </Alert>
        ) : null}
        <ul className="divide-y divide-zinc-200">
          {DUMMY_LOGIN_ROLES.map((p) => {
            const isPg = p.kind === "pg-role"
            const busy = pendingId === p.id
            return (
              <li
                key={p.id}
                className={p.disabled ? "cursor-not-allowed py-3" : "py-3"}
              >
                <button
                  type="button"
                  disabled={p.disabled || pendingId !== null}
                  onClick={() => void pick(p)}
                  className={[
                    "flex w-full items-start gap-3 rounded-md px-3 py-2 text-left transition",
                    p.disabled
                      ? "cursor-not-allowed bg-zinc-50 text-zinc-400"
                      : "hover:bg-red-50 focus-visible:bg-red-50 focus-visible:outline-2 focus-visible:outline-red-600",
                    busy ? "opacity-60" : "",
                  ].join(" ")}
                  aria-disabled={p.disabled}
                >
                  <span className="mt-1 inline-flex h-6 w-16 shrink-0 items-center justify-center rounded-sm border text-[10px] font-semibold tracking-wide uppercase">
                    {isPg ? "PG role" : "Profile"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-2">
                      <span className="font-mono text-sm font-semibold">{p.label}</span>
                      {p.sessionRole ? (
                        <span className="text-[11px] text-zinc-500">
                          SET ROLE <span className="font-mono">{p.sessionRole}</span>
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-0.5 text-xs text-zinc-600">{p.description}</p>
                    {p.capabilities && p.capabilities.length > 0 ? (
                      <ul className="mt-1.5 flex flex-wrap gap-1">
                        {p.capabilities.map((c) => (
                          <li
                            key={c}
                            className="rounded-sm border border-zinc-200 bg-white px-1.5 py-0.5 font-mono text-[10px] text-zinc-700"
                          >
                            {c}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    {p.disabled && p.disabledReason ? (
                      <p className="mt-1 text-[11px] text-zinc-500 italic">{p.disabledReason}</p>
                    ) : null}
                  </div>
                  {!p.disabled ? (
                    <span className="mt-1 text-xs text-red-700">{busy ? "logger inn…" : "logg inn →"}</span>
                  ) : null}
                </button>
              </li>
            )
          })}
        </ul>
        <p className="mt-4 text-[11px] text-zinc-500">
          Mintede tokens er ekte HS256‑JWT signert med <span className="font-mono">JWT_SECRET</span>. PostgREST/RLS
          håndhever capabilities på vanlig måte; «dummy» refererer til at brukeridentiteten ikke kommer fra en IdP enda.
        </p>
      </CardContent>
    </Card>
  )
}
