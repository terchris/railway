"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useTransition } from "react"

import { deleteRegistrationsByIds } from "@/app/admin/(dashboard)/registrations/actions"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import type { CheckedState } from "@radix-ui/react-checkbox"

type CtxValue = {
  idsOnPage: number[]
  selected: Set<number>
  toggle(id: number): void
  toggleAll(): void
}

const BulkCtx = React.createContext<CtxValue | null>(null)

function useBulk() {
  const c = React.useContext(BulkCtx)
  if (!c) throw new Error("Use bulk components inside RegistrationsBulkProvider.")
  return c
}

/** Velg kryss på gjeldende side; kryss-nullstilles når tabell-IDene bytter seg (annen side/filter). */
export function RegistrationsBulkProvider({
  idsOnPage,
  children,
}: Readonly<{ idsOnPage: number[]; children: React.ReactNode }>) {
  const [selected, setSelected] = React.useState(() => new Set<number>())

  const toggle = React.useCallback((id: number) => {
    setSelected((s) => {
      const n = new Set(s)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })
  }, [])

  const toggleAll = React.useCallback(() => {
    setSelected((s) => {
      if (idsOnPage.length === 0) return new Set<number>()
      const all = idsOnPage.every((id) => s.has(id))
      if (all) return new Set<number>()
      return new Set(idsOnPage)
    })
  }, [idsOnPage])

  const value = React.useMemo<CtxValue>(
    () => ({ idsOnPage, selected, toggle, toggleAll }),
    [idsOnPage, selected, toggle, toggleAll],
  )

  return <BulkCtx.Provider value={value}>{children}</BulkCtx.Provider>
}

export function RegistrationsBulkSelectHeader() {
  const { idsOnPage, selected, toggleAll } = useBulk()

  const allSel = idsOnPage.length > 0 && idsOnPage.every((id) => selected.has(id))
  const partial = idsOnPage.some((id) => selected.has(id)) && !allSel

  const checkedState: CheckedState = allSel ? true : partial ? "indeterminate" : false

  return (
    <Checkbox
      aria-label="Velg alle på denne siden"
      checked={checkedState}
      disabled={idsOnPage.length === 0}
      onCheckedChange={() => toggleAll()}
    />
  )
}

export function RegistrationRowSelectCheckbox({ id }: Readonly<{ id: number }>) {
  const { selected, toggle } = useBulk()
  return (
    <Checkbox
      aria-label={`Velg registrering ${id}`}
      checked={selected.has(id)}
      onCheckedChange={() => toggle(id)}
    />
  )
}

export function RegistrationsBulkDeleteBar() {
  const { idsOnPage, selected } = useBulk()
  const [pending, start] = useTransition()
  const router = useRouter()

  const ids = idsOnPage.filter((id) => selected.has(id))
  const label = ids.length === 0 ? "Slett valgte" : `Slett valgte (${ids.length})`

  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-zinc-100 bg-zinc-50/70 px-4 py-3 text-sm">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-9 border-red-800 text-red-900 hover:bg-red-50"
        disabled={pending || ids.length === 0}
        onClick={() => {
          if (ids.length === 0) return
          const msg = `Permanent sletting av ${ids.length} registrering(er). Denne handlinga kan ikke angrast. Bekreft?`
          if (typeof window !== "undefined" && !window.confirm(msg)) return
          start(async () => {
            await deleteRegistrationsByIds(ids)
            router.refresh()
          })
        }}
      >
        {pending ? "…" : label}
      </Button>
      <span className="text-xs text-zinc-600">Bare rader krysset av på gjeldende side slettes.</span>
    </div>
  )
}
