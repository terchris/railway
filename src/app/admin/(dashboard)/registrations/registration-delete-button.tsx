"use client"

import { useRouter } from "next/navigation"
import { useTransition } from "react"

import { deleteRegistrationById } from "@/app/admin/(dashboard)/registrations/actions"
import { Button } from "@/components/ui/button"

import styles from "./registrations.module.css"

export function RegistrationDeleteButton({ registrationId }: Readonly<{ registrationId: number }>) {
  const [pending, start] = useTransition()
  const router = useRouter()

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={styles.deleteButton}
      disabled={pending}
      onClick={() => {
        const msg =
          `Slett registrering #${registrationId}?` +
          "\nAlle tilknyttede valg og svar fjernes. Denne handlinga kan ikke angrast."
        if (typeof window !== "undefined" && !window.confirm(msg)) return
        start(async () => {
          await deleteRegistrationById(registrationId)
          router.push("/admin/registrations")
          router.refresh()
        })
      }}
    >
      {pending ? "…" : "Slett registrering"}
    </Button>
  )
}
