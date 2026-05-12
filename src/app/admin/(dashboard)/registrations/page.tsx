import Link from "next/link"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { pgStaff } from "@/lib/admin-postgrest"
import { cn } from "@/lib/utils"

export const dynamic = "force-dynamic"

type Row = {
  id: number
  name: string
  email: string
  phone: string
  is_confirmed: boolean
  created_at: string
}

export default async function AdminRegistrationsPage() {
  const staff = pgStaff()

  if (!staff) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Registreringer</h1>
        <p className="max-w-xl rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          Sett miljøvariabelen{" "}
          <code className="rounded bg-white px-1">POSTGREST_ADMIN_JWT</code> med en bearer-token
          som passerer RLS (<code className="rounded bg-white px-1">registrations:read</code>
          ).
        </p>
        <Link href="/admin" className="text-sm font-medium text-red-700 hover:underline">
          ← Tilbake til oversikt
        </Link>
      </div>
    )
  }

  const { data, error } = await staff
    .from("registrations")
    .select("id,name,email,phone,is_confirmed,created_at")
    .order("created_at", { ascending: false })
    .limit(200)

  const rows = (Array.isArray(data) ? data : []) as Row[]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Registreringer</h1>
          <p className="mt-1 text-sm text-zinc-600">Siste registreringene (maks 200 rader).</p>
        </div>
        <Link href="/admin" className="text-sm font-medium text-red-700 hover:underline">
          ← Oversikt
        </Link>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="border-b border-zinc-100 py-4">
          <CardTitle className="text-base">Tabell</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {error ? (
            <p className="px-6 py-8 text-sm text-red-700">{error.message}</p>
          ) : rows.length === 0 ? (
            <p className="px-6 py-8 text-sm text-zinc-500">Ingen rader ennå.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-left text-sm">
                <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">ID</th>
                    <th className="px-4 py-3 font-medium">Navn</th>
                    <th className="px-4 py-3 font-medium">E-post</th>
                    <th className="px-4 py-3 font-medium">Telefon</th>
                    <th className="px-4 py-3 font-medium">Bekreftet</th>
                    <th className="px-4 py-3 font-medium">Opprettet</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {rows.map((r) => (
                    <tr key={r.id} className="bg-white hover:bg-zinc-50/80">
                      <td className="px-4 py-2.5 tabular-nums">{r.id}</td>
                      <td className="max-w-[180px] truncate px-4 py-2.5">{r.name}</td>
                      <td className="max-w-[200px] truncate px-4 py-2.5">{r.email}</td>
                      <td className="whitespace-nowrap px-4 py-2.5">{r.phone}</td>
                      <td className="px-4 py-2.5">
                        <span
                          className={cn(
                            "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                            r.is_confirmed ? "bg-emerald-100 text-emerald-900" : "bg-zinc-100 text-zinc-700",
                          )}
                        >
                          {r.is_confirmed ? "Ja" : "Nei"}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-zinc-700">
                        {typeof r.created_at === "string"
                          ? new Date(r.created_at).toLocaleString("nb-NO")
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
