"use client"

import { AdminToggleEnableButton } from "@/components/admin/admin-toggle-enable-button"

import { toggleEvaluationQuestionEnabled } from "./actions"

export function EvaluationQuestionToggleButton({
  id,
  enabled,
}: {
  id: number
  enabled: boolean
}) {
  return (
    <AdminToggleEnableButton id={id} enabled={enabled} setEnabled={toggleEvaluationQuestionEnabled} />
  )
}
