"use client"

import { useTransition } from "react"

import { Button } from "@/components/ui/button"
import styles from "./admin-shared.module.css"

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
    <div className={styles.orderRow}>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className={styles.orderButton}
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
        className={styles.orderButton}
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
