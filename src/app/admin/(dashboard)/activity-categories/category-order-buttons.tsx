"use client"

import { nudgeCategoryOrder } from "@/app/admin/(dashboard)/activity-categories/actions"
import { AdminOrderRowButtons } from "@/components/admin/admin-order-row-buttons"

export function CategoryOrderButtons({
  categoryId,
  canMoveUp,
  canMoveDown,
}: {
  categoryId: number
  canMoveUp: boolean
  canMoveDown: boolean
}) {
  return (
    <AdminOrderRowButtons
      rowId={categoryId}
      canMoveUp={canMoveUp}
      canMoveDown={canMoveDown}
      moveRow={(id, dir) => nudgeCategoryOrder(id, dir)}
    />
  )
}
