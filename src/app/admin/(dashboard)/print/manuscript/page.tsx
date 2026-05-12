import { PrintToolbar } from "@/components/admin/print-toolbar"
import { StaffJwtMissing } from "@/components/admin/staff-jwt-missing"
import { fetchPrintActivities } from "@/lib/admin-print-data"
import { pgStaff } from "@/lib/admin-postgrest"

export const dynamic = "force-dynamic"

function formatBody(text: string) {
  const t = text.trim()
  if (!t) return null
  return t.split(/\n{2,}/).map((para, i) => (
    <p key={i} className="mb-3 text-sm leading-relaxed last:mb-0">
      {para.trim()}
    </p>
  ))
}

export default async function AdminPrintManuscriptPage() {
  const staff = await pgStaff()
  if (!staff) return <StaffJwtMissing title="Utskrift – manuskript" />

  const { byCategory, error } = await fetchPrintActivities(staff)
  const grouped = byCategory()

  return (
    <div className="print-document max-w-[48rem] space-y-10 text-zinc-900">
      <PrintToolbar
        backHref="/admin/registrations"
        backLabel="Til registreringer"
        siblingHref="/admin/print/form"
        siblingLabel="Papirskjema"
      />

      <header className="border-b border-zinc-300 pb-4">
        <h1 className="text-2xl font-semibold tracking-tight">Manuskript · aktiviteter</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Tekst som vises til deltaker for hver aktivitet (feltet «Informasjon»), pluss internt notat
          til kursholder der det finnes. Kun aktiviteter som er <strong>aktive</strong> i skjemaet.
        </p>
        <p className="mt-1 text-xs text-zinc-500">
          Generert {new Date().toLocaleString("nb-NO", { dateStyle: "long", timeStyle: "short" })}
        </p>
      </header>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
          {error}
        </p>
      ) : (
        <div className="space-y-10">
          {grouped.map(({ cat, rows }) => (
            <section key={cat.id} className="break-inside-avoid">
              <h2 className="mb-4 border-b border-zinc-200 pb-1 text-lg font-semibold">
                {cat.name}
                {cat.is_additional ? (
                  <span className="ml-2 text-xs font-normal text-zinc-500">(tilleggsaktiviteter)</span>
                ) : null}
              </h2>
              {rows.length === 0 ? (
                <p className="text-sm italic text-zinc-500">Ingen aktive aktiviteter i denne kategorien.</p>
              ) : (
                <ol className="list-decimal space-y-8 pl-5 marker:text-zinc-500">
                  {rows.map((a) => (
                    <li key={a.id} className="break-inside-avoid pl-2">
                      <h3 className="text-base font-semibold">{a.name}</h3>
                      <div className="mt-3 border-l-2 border-zinc-200 pl-4">{formatBody(a.info)}</div>
                      {!a.internal_info.trim() ? null : (
                        <div className="mt-4 rounded-md border border-amber-200 bg-amber-50/90 px-4 py-3 text-sm print:border-amber-900/40">
                          <p className="font-medium text-amber-900">
                            Internt notat (kun kursholder)
                          </p>
                          <div className="mt-2 text-amber-950">{formatBody(a.internal_info)}</div>
                        </div>
                      )}
                    </li>
                  ))}
                </ol>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
