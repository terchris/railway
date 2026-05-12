import { RegistrationForm } from "@/components/form/registration-form"
import { buildRegistrationBundle } from "@/lib/public-form/bundle"
import { getPublicFormPayload } from "@/lib/content"

export const dynamic = "force-dynamic"

export default async function HomePage() {
  const result = await getPublicFormPayload()

  if (!result.ok) {
    return (
      <main className="rwr-main mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 px-6 py-16">
        <h1 className="text-2xl font-semibold text-zinc-900">Kunne ikke laste data</h1>
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
          {result.message}
        </p>
        <p className="text-sm text-zinc-600">
          Kontroller at PostgREST svarer på{" "}
          <code className="rounded bg-zinc-100 px-1 py-0.5">POSTGREST_URL</code>, og at{" "}
          <code className="rounded bg-zinc-100 px-1 py-0.5">POSTGREST_ANON_JWT</code> er satt i{" "}
          <code className="rounded bg-zinc-100 px-1 py-0.5">.env</code>.
        </p>
      </main>
    )
  }

  let bundle
  try {
    bundle = buildRegistrationBundle(result.payload)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return (
      <main className="rwr-main px-6 py-16">
        <p className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-900">
          Klarte ikke å tolke felldata: {msg}
        </p>
      </main>
    )
  }

  return (
    <main className="rwr-main pb-24">
      <header className="border-b border-zinc-100 bg-white py-10">
        <div className="mx-auto max-w-2xl px-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-red-700">
            Oslo Røde Kors · frivilligregistrering
          </p>
          <h1 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-zinc-900">
            {bundle.text.content_page_title || "Melding om frivillig"}
          </h1>
          {bundle.text.content_page_title ? null : (
            <p className="mt-2 text-lg text-zinc-600">
              Velg aktiviteter, fyll inn kontaktinformasjon og send inn på fire trinn.
            </p>
          )}
        </div>
      </header>
      <RegistrationForm bundle={bundle} />
    </main>
  )
}
