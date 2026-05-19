"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

import { Alert } from "@/components/ui/alert"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DUMMY_LOGIN_ROLES, type RoleProfile } from "@/lib/dummy-login-roles"

import styles from "./dummy-login-picker.module.css"

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
    <Card className={styles.card}>
      <CardHeader className={styles.header}>
        <CardTitle className={styles.title}>Dummy‑innlogging</CardTitle>
        <p className={styles.intro}>
          Velg en PostgreSQL‑rolle eller capability‑profil for å logge inn. Stillas for Okta/Authentik‑integrasjon —
          erstattes senere.
        </p>
      </CardHeader>
      <CardContent>
        {error ? (
          <Alert variant="destructive" className={styles.errorAlert}>
            {error}
          </Alert>
        ) : null}
        <ul className={styles.list}>
          {DUMMY_LOGIN_ROLES.map((p) => {
            const isPg = p.kind === "pg-role"
            const busy = pendingId === p.id
            const buttonClass = busy ? styles.pickerButtonBusy : styles.pickerButton
            return (
              <li key={p.id} className={p.disabled ? styles.rowDisabled : styles.row}>
                <button
                  type="button"
                  disabled={p.disabled || pendingId !== null}
                  onClick={() => void pick(p)}
                  className={buttonClass}
                  aria-disabled={p.disabled}
                >
                  <span className={styles.kindBadge}>{isPg ? "PG role" : "Profile"}</span>
                  <div className={styles.rowMain}>
                    <div className={styles.rowTitleLine}>
                      <span className={styles.profileLabel}>{p.label}</span>
                      {p.sessionRole ? (
                        <span className={styles.sessionRole}>
                          SET ROLE <span className={styles.sessionRoleMono}>{p.sessionRole}</span>
                        </span>
                      ) : null}
                    </div>
                    <p className={styles.description}>{p.description}</p>
                    {p.capabilities && p.capabilities.length > 0 ? (
                      <ul className={styles.capList}>
                        {p.capabilities.map((c) => (
                          <li key={c} className={styles.cap}>
                            {c}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    {p.disabled && p.disabledReason ? (
                      <p className={styles.disabledReason}>{p.disabledReason}</p>
                    ) : null}
                  </div>
                  {!p.disabled ? (
                    <span className={styles.actionLabel}>{busy ? "logger inn…" : "logg inn →"}</span>
                  ) : null}
                </button>
              </li>
            )
          })}
        </ul>
        <p className={styles.footnote}>
          Mintede tokens er ekte HS256‑JWT signert med <span className={styles.mono}>JWT_SECRET</span>. PostgREST/RLS
          håndhever capabilities på vanlig måte; «dummy» refererer til at brukeridentiteten ikke kommer fra en IdP enda.
        </p>
      </CardContent>
    </Card>
  )
}
