import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { AdminLogoutButton } from "@/components/admin/logout-button"
import { AdminSidebarNav } from "@/components/admin/admin-sidebar-nav"
import {
  ADMIN_SESSION_COOKIE,
  verifyAdminSessionCookieValue,
} from "@/lib/admin-session"
import { isStaffPostgrestJwtConfigured } from "@/lib/admin-postgrest"
import { staffEffectiveCapabilitySet } from "@/lib/staff-jwt-caps"

import styles from "./layout.module.css"

export default async function AdminDashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const cookieStore = await cookies()
  const raw = cookieStore.get(ADMIN_SESSION_COOKIE)?.value
  if (!verifyAdminSessionCookieValue(raw)) {
    redirect("/admin/login")
  }

  const hasStaffJwt = await isStaffPostgrestJwtConfigured()
  const effectiveCaps = await staffEffectiveCapabilitySet()

  return (
    <div className={styles.shell}>
      <aside className={`admin-screen-nav ${styles.aside}`}>
        <div className={styles.asideInner}>
          <AdminSidebarNav hasStaffJwt={hasStaffJwt} effectiveCaps={effectiveCaps} />
          <div className={styles.asideFooter}>
            <AdminLogoutButton />
          </div>
        </div>
      </aside>
      <main className={styles.main}>{children}</main>
    </div>
  )
}
