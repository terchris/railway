"use client"

import { useTransition } from "react"

import { Button } from "@/components/ui/button"

export function AdminOrderRowButtons({
  rowId,
  canMoveUp,
  canMoveDown,
  moveRow,
}: {
  rowId: number
  canMoveUp: boolean
  canMoveDown: boolean
  moveRow: (id: number, dir: "up" | "down") => Promise<void>
}) {
  const [pending, start] = useTransition()

  return (
    <div className="flex flex-wrap items-center gap-1">
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="h-8 px-2 text-xs"
        disabled={pending || !canMoveUp}
        title="Flytt opp"
        onClick={() =>
          start(async () => {
            await moveRow(rowId, "up")
          })
        }
      >
        Opp
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="h-8 px-2 text-xs"
        disabled={pending || !canMoveDown}
        title="Flytt ned"
        onClick={() =>
          start(async () => {
            await moveRow(rowId, "down")
          })
        }
      >
        Ned
      </Button>
    </div>
  )
}
