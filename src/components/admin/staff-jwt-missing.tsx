import Link from "next/link"

/** Shown when `POSTGREST_ADMIN_JWT` / `POSTGREST_STAFF_JWT_UIS` is unset. */
export function StaffJwtMissing({ title }: { title: string }) {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="max-w-xl rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
        Sett <code className="rounded bg-white px-1">POSTGREST_ADMIN_JWT</code> eller{" "}
        <code className="rounded bg-white px-1">POSTGREST_STAFF_JWT_UIS</code> med en bearer-token som
        har kapabiliteten <code className="rounded bg-white px-1">content:read</code> /
        <code className="rounded bg-white px-1">content:write</code> ·{" "}
        <Link href="/admin" className="font-medium text-red-700 hover:underline">
          Tilbake til oversikt
        </Link>
      </p>
    </div>
  )
}
