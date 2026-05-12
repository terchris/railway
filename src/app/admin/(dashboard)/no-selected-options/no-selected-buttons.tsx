"use client"

import { AdminToggleEnableButton } from "@/components/admin/admin-toggle-enable-button"

import { toggleNoSelectedOptionEnabled } from "./actions"

export function NoSelectedOptionToggleButton({
  id,
  enabled,
}: {
  id: number
  enabled: boolean
}) {
  return <AdminToggleEnableButton id={id} enabled={enabled} setEnabled={toggleNoSelectedOptionEnabled} />
}
