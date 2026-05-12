"use client"

import Link from "next/link"

import { Button } from "@/components/ui/button"

type PrintToolbarProps = {
  backHref: string
  backLabel?: string
  siblingHref?: string
  siblingLabel?: string
}

/** Screen-only toolbar; hidden when printing via `admin-screen-toolbar` + globals print rules. */
export function PrintToolbar({
  backHref,
  backLabel = "Tilbake",
  siblingHref,
  siblingLabel,
}: PrintToolbarProps) {
  return (
    <div className="admin-screen-toolbar mb-8 flex flex-wrap items-center gap-3 print:hidden">
      <Button type="button" variant="default" onClick={() => window.print()}>
        Skriv ut
      </Button>
      {siblingHref && siblingLabel ? (
        <Button type="button" variant="outline" asChild>
          <Link href={siblingHref}>{siblingLabel}</Link>
        </Button>
      ) : null}
      <Button type="button" variant="outline" asChild>
        <Link href={backHref}>{backLabel}</Link>
      </Button>
    </div>
  )
}
