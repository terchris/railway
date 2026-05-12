import Link from "next/link"

type NavItem = { href: string; label: string; cap?: string }

const GROUPS: { title: string | null; items: NavItem[] }[] = [
  { title: null, items: [{ href: "/admin", label: "Oversikt" }] },
  {
    title: "Registreringer",
    items: [
      { href: "/admin/registrations", label: "Liste", cap: "registrations:read" },
      { href: "/admin/registrations/export", label: "CSV eksport", cap: "registrations:read" },
    ],
  },
  {
    title: "Utskrift",
    items: [
      { href: "/admin/print/manuscript", label: "Manuskript", cap: "content:read" },
      { href: "/admin/print/form", label: "Papirskjema", cap: "content:read" },
    ],
  },
  {
    title: "Aktivitet og skjema",
    items: [
      { href: "/admin/activities", label: "Aktiviteter", cap: "content:read" },
      { href: "/admin/additional-activities", label: "Tilleggsaktiviteter", cap: "content:read" },
      { href: "/admin/text-content", label: "Skjematekster", cap: "content:read" },
      { href: "/admin/skemadata", label: "Skjemadata", cap: "content:read" },
    ],
  },
  {
    title: "Drift",
    items: [{ href: "/admin/app-log", label: "App‑logg", cap: "app_log:read" }],
  },
  {
    title: "Konto",
    items: [{ href: "/admin/staff", label: "Mine tilganger" }],
  },
]

function itemVisible(item: NavItem, hasStaffJwt: boolean, caps: ReadonlySet<string>): boolean {
  if (!item.cap) return true
  if (!hasStaffJwt) return false
  return caps.has(item.cap)
}

export function AdminSidebarNav({
  hasStaffJwt,
  effectiveCaps,
}: {
  hasStaffJwt: boolean
  effectiveCaps: ReadonlySet<string>
}) {
  return (
    <nav className="flex flex-row flex-wrap gap-x-4 gap-y-6 md:flex-col md:gap-6">
      {GROUPS.map((group, gi) => {
        const visibleItems = group.items.filter((it) => itemVisible(it, hasStaffJwt, effectiveCaps))
        if (visibleItems.length === 0) return null

        return (
          <div key={gi} className="min-w-[10rem] flex-1 md:flex-none md:min-w-0">
            {group.title ? (
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">{group.title}</p>
            ) : null}
            <ul className="space-y-1">
              {visibleItems.map((it) => (
                <li key={it.href}>
                  <Link
                    href={it.href}
                    className="block rounded-md px-2 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100 hover:text-red-800"
                  >
                    {it.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )
      })}
      {!hasStaffJwt ? (
        <p className="w-full text-xs text-amber-800 md:border-t md:border-zinc-100 md:pt-4">
          Logg inn med staff‑JWT eller sett{" "}
          <span className="font-mono">POSTGREST_ADMIN_JWT</span> /{" "}
          <span className="font-mono">POSTGREST_STAFF_JWT_UIS</span> som fallback på server.
        </p>
      ) : null}
    </nav>
  )
}
