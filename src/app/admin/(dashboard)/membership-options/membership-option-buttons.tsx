"use client"

import { AdminToggleEnableButton } from "@/components/admin/admin-toggle-enable-button"

import { toggleMembershipOptionEnabled } from "./actions"

export function MembershipOptionToggleButton({
  id,
  enabled,
}: {
  id: number
  enabled: boolean
}) {
  return <AdminToggleEnableButton id={id} enabled={enabled} setEnabled={toggleMembershipOptionEnabled} />
}
