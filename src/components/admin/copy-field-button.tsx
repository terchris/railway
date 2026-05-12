"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"

/** Copies `value`; shows brief feedback (no toast dep). */
export function CopyFieldButton({ label, value }: { label: string; value: string }) {
  const [hint, setHint] = useState<string | null>(null)
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="h-8"
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
      {hint ? <span className="text-xs text-zinc-500">{hint}</span> : null}
    </div>
  )
}
