"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert } from "@/components/ui/alert"

export function AdminLoginForm({
  allowJwt,
  allowPassword,
}: {
  allowJwt: boolean
  allowPassword: boolean
}) {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [staffJwt, setStaffJwt] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const jwtTrim = staffJwt.trim()
      let body: { password?: string; staffJwt?: string }
      if (jwtTrim.length > 0) {
        body = { staffJwt: jwtTrim }
      } else if (allowPassword && password.length > 0) {
        body = { password }
      } else {
        setError(
          allowJwt && allowPassword
            ? "Lim inn staff‑JWT eller skriv bootstrap‑passord."
            : allowJwt
              ? "Lim inn staff‑JWT."
              : "Konfigurasjonsfeil — kontakt administrator.",
        )
        setLoading(false)
        return
      }

      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = (await res.json()) as { error?: string }
      if (!res.ok) {
        setError(data.error ?? `Innlogging feilet (${res.status}).`)
        setLoading(false)
        return
      }
      router.push("/admin")
      router.refresh()
    } catch {
      setError("Nettverksfeil — prøv igjen.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="mx-auto w-full max-w-md border-zinc-200 shadow-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-xl">Admin</CardTitle>
        <p className="text-sm text-zinc-500">
          Innlogging med gyldig staff‑JWT {allowPassword ? "eller valgfritt bootstrap‑passord for utvikling." : "."}
        </p>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={(e) => void onSubmit(e)}>
          {error ? (
            <Alert variant="destructive" className="text-sm">
              {error}
            </Alert>
          ) : null}
          {allowJwt ? (
            <div className="space-y-2">
              <Label htmlFor="admin-jwt">Staff‑JWT</Label>
              <textarea
                id="admin-jwt"
                name="staffJwt"
                rows={4}
                spellCheck={false}
                autoComplete="off"
                className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[96px] w-full rounded-md border px-3 py-2 font-mono text-xs focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Lim inn bearer‑JWT fra UIS eller mint‑script …"
                value={staffJwt}
                onChange={(e) => setStaffJwt(e.target.value)}
                disabled={loading}
              />
              <p className="text-[11px] text-zinc-500">
                Samme Hemmelighet som PostgREST (<span className="font-mono">JWT_SECRET</span>) — ikke lim inn tokens i
                usikre kanaler.
              </p>
            </div>
          ) : null}
          {allowPassword ? (
            <div className="space-y-2">
              <Label htmlFor="admin-pw">Bootstrap‑passord</Label>
              <Input
                id="admin-pw"
                name="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
              <p className="text-[11px] text-zinc-500">
                Mint bred staff‑JWT lokalt via <span className="font-mono">ADMIN_PASSWORD</span> — ikke for produksjon.
              </p>
            </div>
          ) : null}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Logger inn…" : "Logg inn"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
