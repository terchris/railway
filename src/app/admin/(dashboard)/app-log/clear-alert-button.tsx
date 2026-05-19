"use client"

import { useState, useTransition } from "react"

import { clearAppLogAlert } from "@/app/admin/(dashboard)/app-log/actions"
import { Button } from "@/components/ui/button"

import styles from "./page.module.css"

export function ClearAppLogAlertButton({ logId }: { logId: number }) {
  const [pending, start] = useTransition()
  const [err, setErr] = useState<string | null>(null)

  return (
    <div className={styles.clearButtonWrap}>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className={styles.clearButton}
        disabled={pending}
        onClick={() =>
          start(async () => {
            setErr(null)
            try {
              await clearAppLogAlert(logId)
            } catch (e) {
              setErr(e instanceof Error ? e.message : "Ukjent feil")
            }
          })
        }
      >
        {pending ? "…" : "Kvitt varsel"}
      </Button>
      {err ? <span className={styles.clearError}>{err}</span> : null}
    </div>
  )
}
