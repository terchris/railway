"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import styles from "./admin-shared.module.css"

/** Copies `value`; shows brief feedback (no toast dep). */
export function CopyFieldButton({ label, value }: { label: string; value: string }) {
  const [hint, setHint] = useState<string | null>(null)
  return (
    <div className={styles.copyRow}>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className={styles.compactButton}
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(value)
            setHint("Kopiert")
            window.setTimeout(() => setHint(null), 1600)
          } catch {
            setHint("Kunne ikke kopiere")
            window.setTimeout(() => setHint(null), 2400)
          }
        }}
      >
        Kopier {label}
      </Button>
      {hint ? <span className={styles.copyHint}>{hint}</span> : null}
    </div>
  )
}
