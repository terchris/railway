"use client"

import { useTransition } from "react"

import { toggleActivityEnabled } from "./actions"
import { Button } from "@/components/ui/button"
import styles from "@/components/admin/admin-shared.module.css"

export function ToggleActivityEnableButton({ id, enabled }: { id: number; enabled: boolean }) {
  const [pending, start] = useTransition()
  const next = !enabled
  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      disabled={pending}
      className={enabled ? styles.toggleAmber : undefined}
      onClick={() =>
        start(async () => {
          await toggleActivityEnabled(id, next)
        })
      }
    >
      {pending ? "…" : enabled ? "Deaktiver" : "Aktiver"}
    </Button>
  )
}
