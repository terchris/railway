import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Admin · Frivilligregistrering",
  description: "Intern oversikt og lister (utkast).",
}

export default function AdminRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="min-h-full bg-zinc-100 text-zinc-900">
      <div className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-2 text-xs">
          <span className="font-medium text-zinc-600">Administrasjon (utkast)</span>
          <Link href="/" className="text-red-700 hover:underline">
            Til forsiden
          </Link>
        </div>
      </div>
      {children}
    </div>
  )
}
