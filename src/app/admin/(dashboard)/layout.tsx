import Link from "next/link"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"

import { AdminLogoutButton } from "@/components/admin/logout-button"
import {
  ADMIN_SESSION_COOKIE,
  verifyAdminSessionCookieValue,
} from "@/lib/admin-session"

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

  return (
    <div className="flex min-h-[calc(100vh-41px)] flex-col">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-medium">
            <Link href="/admin" className="text-zinc-900 hover:text-red-800">
              Oversikt
            </Link>
            <Link href="/admin/registrations" className="text-zinc-600 hover:text-red-800">
              Registreringer
            </Link>
          </nav>
          <AdminLogoutButton />
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-8">{children}</main>
    </div>
  )
}
