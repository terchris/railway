import type { ReactNode } from "react"
import { RegistrationForm } from "@/components/form/registration-form"
import { buildRegistrationBundle } from "@/lib/public-form/bundle"
import { getPublicFormPayload } from "@/lib/content"
import styles from "./page.module.css"

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
      <code key={i} className={styles.hintMono}>
        {part}
      </code>
    ) : (
      <strong key={i} className={styles.hintStrong}>
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
      <main className={styles.failureMain}>
        <header className={styles.failureHeader}>
          <p className={styles.eyebrow}>Oppstart / backend</p>
          <h1 id="load-failure-title" className={styles.failureTitle}>
            {p.title}
          </h1>
          <p className={styles.failureLead}>{hintSegments(p.lead)}</p>
        </header>

        <section className={styles.envPanel} aria-label="PostgREST-miljø slik serveren ser det nå">
          <h2 className={styles.envPanelHeading}>Miljø (server)</h2>
          <dl className={styles.envList}>
            <div>
              <dt className={styles.envTerm}>POSTGREST_URL</dt>
              <dd>
                <code className={styles.envValueBlock}>{p.env.postgrestUrl ?? "ikke satt"}</code>
              </dd>
            </div>
            <div>
              <dt className={styles.envTerm}>POSTGREST_ANON_JWT</dt>
              <dd>
                <code className={styles.envValueInline}>{p.env.anonJwtMasked}</code>
                {p.env.anonJwtMasked === "ikke satt" ? (
                  <span className={styles.envNote}>Token mangler i miljøet.</span>
                ) : (
                  <span className={styles.envNote}>
                    Ekte JWT vises ikke — masken betyr at variabelen er satt og ikke tom.
                  </span>
                )}
              </dd>
            </div>
          </dl>
        </section>

        <section className={styles.hintsPanel}>
          <h2 className={styles.hintsHeading}>Feilsøking (kun for utviklere og drift)</h2>
          <ul className={styles.hintsList}>
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
      <main className={styles.parseMain}>
        <p className={styles.parseError}>Klarte ikke å tolke felldata: {msg}</p>
      </main>
    )
  }

  return (
    <main className={styles.formMain}>
      <header className={styles.formHeader}>
        <div className={styles.formHeaderInner}>
          <p className={styles.eyebrowBrand}>Oslo Røde Kors · frivilligregistrering</p>
          <h1 className={styles.formHeaderTitle}>
            {bundle.text.content_page_title || "Melding om frivillig"}
          </h1>
          {bundle.text.content_page_title ? null : (
            <p className={styles.formHeaderSubtitle}>
              Velg aktiviteter, fyll inn kontaktinformasjon og send inn på fire trinn.
            </p>
          )}
        </div>
      </header>
      <RegistrationForm bundle={bundle} />
    </main>
  )
}
