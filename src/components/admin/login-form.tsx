"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert } from "@/components/ui/alert"

export function AdminLoginForm() {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
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
          Enkel lokallogin til administrasjonsoversikten (ikke JWT-basert enda).
        </p>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={(e) => void onSubmit(e)}>
          {error ? (
            <Alert variant="destructive" className="text-sm">
              {error}
            </Alert>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="admin-pw">Passord</Label>
            <Input
              id="admin-pw"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Logger inn…" : "Logg inn"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
