"use client"

import { useTransition } from "react"

import { setRegistrationConfirmed } from "@/app/admin/(dashboard)/registrations/actions"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

import styles from "./registrations.module.css"

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
    <div className={styles.confirmedToggleBlock}>
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
      <Label htmlFor="reg-confirmed" className={styles.confirmedToggleLabel}>
        Bekreftet frivillig (liste, CSV-eksport)
      </Label>
    </div>
  )
}
