import type { ReactNode } from "react"
import { RegistrationForm } from "@/components/form/registration-form"
import { buildRegistrationBundle } from "@/lib/public-form/bundle"
import { getPublicFormPayload } from "@/lib/content"

export const dynamic = "force-dynamic"

/** Renders markdown-style markers in copy (**token**) as emphasis or monospace. */

function hintSegments(line: string): ReactNode {
  const parts = line.split("**")
  return parts.map((part, i) => {
    if (part === "") return null
    if (i % 2 === 0) {
      return <span key={i}>{part}</span>
    }
    const mono =
      part === ".env" ||
      /^NEXT_PUBLIC[A-Z0-9_]+$/.test(part) ||
      /^[A-Z][A-Z0-9_*]*$/.test(part)

    return mono ? (
      <code key={i} className="rounded bg-zinc-100 px-1 py-0.5 text-xs font-medium text-zinc-800">
        {part}
      </code>
    ) : (
      <strong key={i} className="font-semibold">
        {part}
      </strong>
    )
  })
}

export default async function HomePage() {
  const result = await getPublicFormPayload()

  if (!result.ok) {
    const p = result.presentation

    return (
      <main className="rwr-main mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-16">
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Oppstart / backend
          </p>
          <h1 id="load-failure-title" className="text-balance text-2xl font-semibold tracking-tight text-zinc-900">
            {p.title}
          </h1>
          <p className="max-w-prose text-base leading-relaxed text-zinc-700">{hintSegments(p.lead)}</p>
        </header>

        <section
          className="space-y-3 rounded-lg border border-zinc-200 bg-zinc-50 px-5 py-4 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900/40 dark:text-zinc-100"
          aria-label="PostgREST-miljø slik serveren ser det nå"
        >
          <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-400">
            Miljø (server)
          </h2>
          <dl className="grid gap-4 text-sm">
            <div>
              <dt className="font-medium text-zinc-600 dark:text-zinc-400">POSTGREST_URL</dt>
              <dd className="mt-1">
                <code className="block break-all rounded border border-zinc-200 bg-white px-3 py-2 text-xs leading-relaxed text-zinc-900 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100">
                  {p.env.postgrestUrl ?? "ikke satt"}
                </code>
              </dd>
            </div>
            <div>
              <dt className="font-medium text-zinc-600 dark:text-zinc-400">POSTGREST_ANON_JWT</dt>
              <dd className="mt-1">
                <code className="inline-block rounded border border-zinc-200 bg-white px-3 py-2 text-xs tracking-widest text-zinc-900 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100">
                  {p.env.anonJwtMasked}
                </code>
                {p.env.anonJwtMasked === "ikke satt" ? (
                  <span className="mt-2 block text-xs text-zinc-500 dark:text-zinc-400">Token mangler i miljøet.</span>
                ) : (
                  <span className="mt-2 block text-xs text-zinc-500 dark:text-zinc-400">
                    Ekte JWT vises ikke — masken betyr at variabelen er satt og ikke tom.
                  </span>
                )}
              </dd>
            </div>
          </dl>
        </section>

        <section className="space-y-3 rounded-xl border border-amber-200/80 bg-amber-50/90 px-5 py-4 text-zinc-900 shadow-sm dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-zinc-100">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-amber-900/90 dark:text-amber-200/90">
            Feilsøking (kun for utviklere og drift)
          </h2>
          <ul className="list-disc space-y-2 ps-5 text-sm leading-relaxed marker:text-amber-800 dark:marker:text-amber-400">
            {p.hints.map((hint, hi) => (
              <li key={hi}>{hintSegments(hint)}</li>
            ))}
          </ul>
        </section>
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
