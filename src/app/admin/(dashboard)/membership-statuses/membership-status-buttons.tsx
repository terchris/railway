"use client"

import { useTransition } from "react"

import {
  toggleMembershipStatusEnabled,
  toggleMembershipStatusShowOptions,
} from "@/app/admin/(dashboard)/membership-statuses/actions"
import { AdminToggleEnableButton } from "@/components/admin/admin-toggle-enable-button"
import { Button } from "@/components/ui/button"

export function MembershipStatusToggleButton({
  id,
  enabled,
}: {
  id: number
  enabled: boolean
}) {
  return <AdminToggleEnableButton id={id} enabled={enabled} setEnabled={toggleMembershipStatusEnabled} />
}

export function MembershipStatusShowOptionsButton({
  id,
  showOptions,
}: {
  id: number
  showOptions: boolean
}) {
  const [pending, start] = useTransition()
  const next = !showOptions
  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      disabled={pending}
      title="Når påslått kan skjemaet vise videre medlemsopsjoner etter dette svaret."
      onClick={() =>
        start(async () => {
          await toggleMembershipStatusShowOptions(id, next)
        })
      }
    >
      {pending ? "…" : showOptions ? "Skjul valg" : "Vis valg"}
    </Button>
  )
}
