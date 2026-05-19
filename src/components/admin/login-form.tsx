"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert } from "@/components/ui/alert"

import styles from "./login-form.module.css"

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
    <Card className={styles.card}>
      <CardHeader className={styles.header}>
        <CardTitle className={styles.title}>Admin</CardTitle>
        <p className={styles.intro}>
          Innlogging med gyldig staff‑JWT {allowPassword ? "eller valgfritt bootstrap‑passord for utvikling." : "."}
        </p>
      </CardHeader>
      <CardContent>
        <form className={styles.form} onSubmit={(e) => void onSubmit(e)}>
          {error ? (
            <Alert variant="destructive" className={styles.errorAlert}>
              {error}
            </Alert>
          ) : null}
          {allowJwt ? (
            <div className={styles.field}>
              <Label htmlFor="admin-jwt">Staff‑JWT</Label>
              <textarea
                id="admin-jwt"
                name="staffJwt"
                rows={4}
                spellCheck={false}
                autoComplete="off"
                className={styles.jwtInput}
                placeholder="Lim inn bearer‑JWT fra UIS eller mint‑script …"
                value={staffJwt}
                onChange={(e) => setStaffJwt(e.target.value)}
                disabled={loading}
              />
              <p className={styles.fieldHelp}>
                Samme Hemmelighet som PostgREST (<span className={styles.mono}>JWT_SECRET</span>) — ikke lim inn tokens i
                usikre kanaler.
              </p>
            </div>
          ) : null}
          {allowPassword ? (
            <div className={styles.field}>
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
              <p className={styles.fieldHelp}>
                Mint bred staff‑JWT lokalt via <span className={styles.mono}>ADMIN_PASSWORD</span> — ikke for produksjon.
              </p>
            </div>
          ) : null}
          <Button type="submit" className={styles.submitButton} disabled={loading}>
            {loading ? "Logger inn…" : "Logg inn"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
