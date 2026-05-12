"use client"

import { useState, useTransition } from "react"

import { clearAppLogAlert } from "@/app/admin/(dashboard)/app-log/actions"
import { Button } from "@/components/ui/button"

export function ClearAppLogAlertButton({ logId }: { logId: number }) {
  const [pending, start] = useTransition()
  const [err, setErr] = useState<string | null>(null)

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="h-8 text-xs"
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
      {err ? <span className="max-w-[12rem] text-right text-xs text-red-700">{err}</span> : null}
    </div>
  )
}
