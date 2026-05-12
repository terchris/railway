"use client"

import { useTransition } from "react"

import { setRegistrationConfirmed } from "@/app/admin/(dashboard)/registrations/actions"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

/** Server passes fresh `initialConfirmed` after `revalidatePath`; disabled while PATCH is in flight. */
export function RegistrationConfirmedCheckbox({
  registrationId,
  initialConfirmed,
}: {
  registrationId: number
  initialConfirmed: boolean
}) {
  const [pending, start] = useTransition()

  return (
    <div className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-zinc-50/80 px-4 py-3">
      <Checkbox
        id="reg-confirmed"
        checked={initialConfirmed}
        disabled={pending}
        onCheckedChange={(c) => {
          const next = c === true
          start(async () => {
            await setRegistrationConfirmed(registrationId, next)
          })
        }}
      />
      <Label htmlFor="reg-confirmed" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed">
        Bekreftet frivillig (liste, CSV-eksport)
      </Label>
    </div>
  )
}
