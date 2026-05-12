"use client"

import { useTransition } from "react"

import {
  toggleUserLanguagePlaceAtTop,
  toggleUserLanguageEnabled,
} from "@/app/admin/(dashboard)/languages/actions"
import { AdminToggleEnableButton } from "@/components/admin/admin-toggle-enable-button"
import { Button } from "@/components/ui/button"

export function UserLanguagePinButton({ id, placeAtTop }: { id: number; placeAtTop: boolean }) {
  const [pending, start] = useTransition()
  const next = !placeAtTop
  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      disabled={pending}
      title="Sorteres først blant språk i skjemaet når øverst er på"
      onClick={() =>
        start(async () => {
          await toggleUserLanguagePlaceAtTop(id, next)
        })
      }
    >
      {pending ? "…" : placeAtTop ? "Ikke øverst" : "Pin øverst"}
    </Button>
  )
}

export function UserLanguageToggleButton({
  id,
  enabled,
}: {
  id: number
  enabled: boolean
}) {
  return <AdminToggleEnableButton id={id} enabled={enabled} setEnabled={toggleUserLanguageEnabled} />
}
