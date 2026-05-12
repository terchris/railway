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
    <div className="flex min-h-[calc(100vh-41px)] flex-col md:flex-row">
      <aside className="admin-screen-nav shrink-0 border-b border-zinc-200 bg-white md:flex md:w-56 md:flex-col md:border-b-0 md:border-r md:border-zinc-200">
        <div className="flex flex-col gap-6 p-4 md:flex-1 md:gap-8 md:pb-6 md:pt-6">
          <AdminSidebarNav hasStaffJwt={hasStaffJwt} effectiveCaps={effectiveCaps} />
          <div className="border-t border-zinc-100 pt-4 md:mt-auto md:border-zinc-100 md:pt-4">
            <AdminLogoutButton />
          </div>
        </div>
      </aside>
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-8 md:px-8">{children}</main>
    </div>
  )
}
