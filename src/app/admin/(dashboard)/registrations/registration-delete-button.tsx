"use client"

import { useRouter } from "next/navigation"
import { useTransition } from "react"

import { deleteRegistrationById } from "@/app/admin/(dashboard)/registrations/actions"
import { Button } from "@/components/ui/button"

export function RegistrationDeleteButton({ registrationId }: Readonly<{ registrationId: number }>) {
  const [pending, start] = useTransition()
  const router = useRouter()

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="border-red-800 text-red-900 hover:bg-red-50"
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
