"use client"

import { useTransition } from "react"

import { nudgeCategoryOrder } from "@/app/admin/(dashboard)/activity-categories/actions"
import { Button } from "@/components/ui/button"

export function CategoryOrderButtons({
  categoryId,
  canMoveUp,
  canMoveDown,
}: {
  categoryId: number
  canMoveUp: boolean
  canMoveDown: boolean
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
        aria-label={`Flytt kategori ${categoryId} opp`}
        title="Flytt opp"
        onClick={() =>
          start(async () => {
            await nudgeCategoryOrder(categoryId, "up")
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
        aria-label={`Flytt kategori ${categoryId} ned`}
        title="Flytt ned"
        onClick={() =>
          start(async () => {
            await nudgeCategoryOrder(categoryId, "down")
          })
        }
      >
        Ned
      </Button>
    </div>
  )
}
