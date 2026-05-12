import { PrintToolbar } from "@/components/admin/print-toolbar"
import { StaffJwtMissing } from "@/components/admin/staff-jwt-missing"
import {
  fetchMembershipStatuses,
  fetchNoSelectionOptions,
  fetchPrintActivities,
  fetchUserLanguages,
} from "@/lib/admin-print-data"
import { pgStaff } from "@/lib/admin-postgrest"

export const dynamic = "force-dynamic"

function CheckboxLine({ label }: { label: string }) {
  return (
    <label className="flex cursor-default items-start gap-3 py-1.5 text-sm leading-snug print:py-1">
      <span className="mt-0.5 inline-block size-4 shrink-0 rounded-sm border border-zinc-900 print:border-black" aria-hidden />
      <span>{label}</span>
    </label>
  )
}

function RadioLine({ label }: { label: string }) {
  return (
    <label className="flex cursor-default items-start gap-3 py-1.5 text-sm leading-snug print:py-1">
      <span
        className="mt-1 inline-block size-3.5 shrink-0 rounded-full border border-zinc-900 print:border-black"
        aria-hidden
      />
      <span>{label}</span>
    </label>
  )
}

function RuleField({ label }: { label: string }) {
  return (
    <div className="mb-4">
      <span className="text-sm font-medium">{label}</span>
      <div className="mt-1 border-b border-zinc-400 pb-1 print:border-black">&nbsp;</div>
    </div>
  )
}

export default async function AdminPrintPaperFormPage() {
  const staff = await pgStaff()
  if (!staff) return <StaffJwtMissing title="Utskrift · papirskjema" />

  const [{ byCategory, error: actErr }, mem, langs, noSel] = await Promise.all([
    fetchPrintActivities(staff),
    fetchMembershipStatuses(staff),
    fetchUserLanguages(staff),
    fetchNoSelectionOptions(staff),
  ])

  const grouped = byCategory()
  const errs = [actErr, mem.error, langs.error, noSel.error].filter(Boolean) as string[]

  return (
    <div className="print-document max-w-[52rem] space-y-8 text-zinc-900">
      <PrintToolbar
        backHref="/admin/registrations"
        backLabel="Til registreringer"
        siblingHref="/admin/print/manuscript"
        siblingLabel="Manuskript"
      />

      <header className="border-b border-zinc-300 pb-4">
        <h1 className="text-2xl font-semibold tracking-tight">Papirskjema · frivilligregistrering</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Utkast til utfylling ved kurs eller uten nett. Samsvarer omtrent med nettskjemaets steg («Velg
          aktivitet», «Om deg», bekreftelse fylles på møte).
        </p>
        <p className="mt-1 text-xs text-zinc-500">
          Generert {new Date().toLocaleString("nb-NO", { dateStyle: "long", timeStyle: "short" })}
        </p>
      </header>

      {errs.length > 0 ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
          {errs.join(" · ")}
        </p>
      ) : null}

      {!actErr ? (
        <>
          <section className="break-inside-avoid">
            <h2 className="mb-3 text-lg font-semibold border-b border-zinc-200 pb-1">
              Velg aktivitet
            </h2>
            <p className="mb-4 text-xs text-zinc-600">
              Kryss av ønskede aktiviteter. Kun aktiviteter som er aktive i skjemaet er listet.
            </p>
            <div className="space-y-8">
              {grouped.map(({ cat, rows }) => (
                <div key={cat.id}>
                  <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-700">
                    {cat.name}
                  </h3>
                  <div className="space-y-0 border border-zinc-200 px-4 py-2 print:border-black">
                    {rows.length === 0 ? (
                      <p className="py-2 text-sm italic text-zinc-500">—</p>
                    ) : (
                      rows.map((a) => <CheckboxLine key={a.id} label={a.name} />)
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {noSel.rows.length > 0 ? (
            <section className="break-inside-avoid">
              <h2 className="mb-3 text-lg font-semibold border-b border-zinc-200 pb-1">
                Ingen aktivitet valgt
              </h2>
              <p className="mb-4 text-xs text-zinc-600">Kryss ett alternativ ved behov.</p>
              <div className="space-y-0 border border-zinc-200 px-4 py-2 print:border-black">
                {noSel.rows.map((o) => (
                  <RadioLine key={o.id} label={o.label} />
                ))}
              </div>
            </section>
          ) : null}

          <section className="break-inside-avoid">
            <h2 className="mb-3 text-lg font-semibold border-b border-zinc-200 pb-1">Medlemskap</h2>
            <div className="space-y-0 border border-zinc-200 px-4 py-2 print:border-black">
              {mem.rows.map((m) => (
                <RadioLine key={m.id} label={m.label} />
              ))}
            </div>
          </section>

          <section className="break-inside-avoid">
            <h2 className="mb-3 text-lg font-semibold border-b border-zinc-200 pb-1">Kontakt</h2>
            <RuleField label="Navn" />
            <RuleField label="E-post" />
            <RuleField label="Telefon" />
            <RuleField label="Kommentarer / øvrige opplysninger" />
          </section>

          {langs.rows.length > 0 ? (
            <section className="break-inside-avoid">
              <h2 className="mb-3 text-lg font-semibold border-b border-zinc-200 pb-1">Språk</h2>
              <p className="mb-2 text-xs text-zinc-600">Kryss språk deltakeren behersker.</p>
              <div className="columns-2 gap-x-6 border border-zinc-200 px-4 py-2 print:border-black sm:columns-3">
                {langs.rows.map((l) => (
                  <CheckboxLine key={l.id} label={l.name} />
                ))}
              </div>
            </section>
          ) : null}

          <section className="break-inside-avoid pb-12">
            <h2 className="mb-3 text-lg font-semibold border-b border-zinc-200 pb-1">
              Evaluering av fysisk startkurs
            </h2>
            <p className="mb-4 text-xs text-zinc-600">
              Kryss/skriv som på nettskjemaet (skala og fri tekst).
            </p>
            <RuleField label="Hvor fornøyd er du med kurset totalt sett?" />
            <RuleField label="Hvor fornøyd er du med kursholderne og formidlingen av kurset?" />
            <div className="mb-4">
              <span className="text-sm font-medium">
                Kommentarer eller forslag til forbedringer i kurset
              </span>
              <div className="mt-1 min-h-[5rem] border border-zinc-300 p-2 text-sm print:border-black" />
            </div>
          </section>

          <section className="break-inside-avoid border border-dashed border-zinc-300 p-4 text-xs text-zinc-600 print:border-black">
            <p className="font-medium text-zinc-800">Etter registrering på papir</p>
            <p className="mt-1">
              Før inn data manuellt i registreringstabellen eller be deltager om å bruke nettskjema når mulig.
            </p>
          </section>
        </>
      ) : null}
    </div>
  )
}
