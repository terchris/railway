import { getPublicFormPayload, summarizePublicPayload } from "@/lib/content"

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
          Kontroller at PostgREST svarer på <code className="rounded bg-zinc-100 px-1 py-0.5">POSTGREST_URL</code>
          , og at <code className="rounded bg-zinc-100 px-1 py-0.5">POSTGREST_ANON_JWT</code> er satt i{" "}
          <code className="rounded bg-zinc-100 px-1 py-0.5">.env</code> (kopier fra{" "}
          <code className="rounded bg-zinc-100 px-1 py-0.5">.env.example</code>).
        </p>
      </main>
    )
  }

  const summary = summarizePublicPayload(result.payload)

  return (
    <main className="rwr-main mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-6 py-16">
      <header className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-wide text-red-700">
          Oslo Røde Kors · frivilligregistrering
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">Velkommen</h1>
        <p className="text-lg text-zinc-600">
          Neste steg er hele firestegsskjemaet. Akkurat nå er Next.js koblet til PostgREST og har hentet{" "}
          <code className="rounded bg-zinc-100 px-1 py-0.5">public_form_payload</code>.
        </p>
      </header>

      <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-zinc-800">Data fra API (anon JWT)</h2>
        <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
          {Object.entries(summary).map(([key, value]) => (
            <div key={key}>
              <dt className="font-mono text-xs text-zinc-500">{key}</dt>
              <dd className="font-medium text-zinc-900">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <p className="text-xs text-zinc-500">
        Helsesjekk: <code className="rounded bg-zinc-100 px-1">GET /api/health</code>
      </p>
    </main>
  )
}
