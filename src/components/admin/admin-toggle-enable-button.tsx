"use client"

import { useTransition } from "react"

import { Button } from "@/components/ui/button"

export function AdminToggleEnableButton({
  id,
  enabled,
  setEnabled,
  enableLabel = "Aktiver",
  disableLabel = "Deaktiver",
}: {
  id: number
  enabled: boolean
  setEnabled: (rowId: number, nextEnabled: boolean) => Promise<void>
  enableLabel?: string
  disableLabel?: string
}) {
  const [pending, start] = useTransition()
  const next = !enabled
  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      disabled={pending}
      className={enabled ? "text-amber-900" : ""}
      onClick={() =>
        start(async () => {
          await setEnabled(id, next)
        })
      }
    >
      {pending ? "…" : enabled ? disableLabel : enableLabel}
    </Button>
  )
}
