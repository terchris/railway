"use client"

import { useTransition } from "react"

import { setRegistrationConfirmed } from "@/app/admin/(dashboard)/registrations/actions"
import { Checkbox } from "@/components/ui/checkbox"

import styles from "./registrations.module.css"

/** Kompakt celle-variant; server oppdaterer listen via `revalidatePath`. */
export function RegistrationListConfirmedToggle({
  registrationId,
  initialConfirmed,
}: {
  registrationId: number
  initialConfirmed: boolean
}) {
  const [pending, start] = useTransition()

  return (
    <div className={styles.listConfirmedCell}>
      <Checkbox
        checked={initialConfirmed}
        disabled={pending}
        aria-label={`Bekreftet (${registrationId})`}
        title="Bekreftet påmeldingsstatus"
        onCheckedChange={(c) => {
          const next = c === true
          start(async () => {
            await setRegistrationConfirmed(registrationId, next)
          })
        }}
      />
    </div>
  )
}
