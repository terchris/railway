"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

import { Button } from "@/components/ui/button"

export function AdminLogoutButton() {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      disabled={busy}
      className="shrink-0"
      onClick={() => {
        setBusy(true)
        void fetch("/api/admin/logout", { method: "POST" })
          .then(() => {
            router.push("/admin/login")
            router.refresh()
          })
          .finally(() => setBusy(false))
      }}
    >
      {busy ? "Logger ut…" : "Logg ut"}
    </Button>
  )
}
