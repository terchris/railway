"use client"

import { AdminToggleEnableButton } from "@/components/admin/admin-toggle-enable-button"

import { toggleEvaluationOptionEnabled } from "./actions"

export function EvaluationOptionToggleButton({
  id,
  enabled,
}: {
  id: number
  enabled: boolean
}) {
  return (
    <AdminToggleEnableButton id={id} enabled={enabled} setEnabled={toggleEvaluationOptionEnabled} />
  )
}
