import Link from "next/link"

import styles from "./admin-sidebar-nav.module.css"

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
    <nav className={styles.nav}>
      {GROUPS.map((group, gi) => {
        const visibleItems = group.items.filter((it) => itemVisible(it, hasStaffJwt, effectiveCaps))
        if (visibleItems.length === 0) return null

        return (
          <div key={gi} className={styles.group}>
            {group.title ? <p className={styles.groupTitle}>{group.title}</p> : null}
            <ul className={styles.list}>
              {visibleItems.map((it) => (
                <li key={it.href}>
                  <Link href={it.href} className={styles.link}>
                    {it.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )
      })}
      {!hasStaffJwt ? (
        <p className={styles.fallbackNotice}>
          Logg inn med staff‑JWT eller sett{" "}
          <span className={styles.mono}>POSTGREST_ADMIN_JWT</span> /{" "}
          <span className={styles.mono}>POSTGREST_STAFF_JWT_UIS</span> som fallback på server.
        </p>
      ) : null}
    </nav>
  )
}
