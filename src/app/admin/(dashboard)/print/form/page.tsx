import { PrintToolbar } from "@/components/admin/print-toolbar"
import { StaffJwtMissing } from "@/components/admin/staff-jwt-missing"
import {
  fetchMembershipStatuses,
  fetchNoSelectionOptions,
  fetchPrintActivities,
  fetchUserLanguages,
} from "@/lib/admin-print-data"
import { pgStaff } from "@/lib/admin-postgrest"

import adminStyles from "@/app/admin/(dashboard)/admin.module.css"
import styles from "./page.module.css"

export const dynamic = "force-dynamic"

function CheckboxLine({ label }: { label: string }) {
  return (
    <label className={styles.optionLabel}>
      <span className={styles.boxCheckbox} aria-hidden />
      <span>{label}</span>
    </label>
  )
}

function RadioLine({ label }: { label: string }) {
  return (
    <label className={styles.optionLabel}>
      <span className={styles.boxRadio} aria-hidden />
      <span>{label}</span>
    </label>
  )
}

function RuleField({ label }: { label: string }) {
  return (
    <div className={styles.ruleField}>
      <span className={styles.ruleFieldLabel}>{label}</span>
      <div className={styles.ruleFieldLine}>&nbsp;</div>
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
    <div className={`print-document ${styles.document}`}>
      <PrintToolbar
        backHref="/admin/registrations"
        backLabel="Til registreringer"
        siblingHref="/admin/print/manuscript"
        siblingLabel="Manuskript"
      />

      <header className={styles.header}>
        <h1 className={styles.title}>Papirskjema · frivilligregistrering</h1>
        <p className={styles.intro}>
          Utkast til utfylling ved kurs eller uten nett. Samsvarer omtrent med nettskjemaets steg («Velg
          aktivitet», «Om deg», bekreftelse fylles på møte).
        </p>
        <p className={styles.timestamp}>
          Generert {new Date().toLocaleString("nb-NO", { dateStyle: "long", timeStyle: "short" })}
        </p>
      </header>

      {errs.length > 0 ? (
        <p className={adminStyles.errorBanner}>{errs.join(" · ")}</p>
      ) : null}

      {!actErr ? (
        <>
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Velg aktivitet</h2>
            <p className={styles.sectionHint}>
              Kryss av ønskede aktiviteter. Kun aktiviteter som er aktive i skjemaet er listet.
            </p>
            <div className={styles.categoryGroup}>
              {grouped.map(({ cat, rows }) => (
                <div key={cat.id}>
                  <h3 className={styles.categoryHeading}>{cat.name}</h3>
                  <div className={styles.optionBox}>
                    {rows.length === 0 ? (
                      <p className={styles.optionBoxEmpty}>—</p>
                    ) : (
                      rows.map((a) => <CheckboxLine key={a.id} label={a.name} />)
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {noSel.rows.length > 0 ? (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Ingen aktivitet valgt</h2>
              <p className={styles.sectionHint}>Kryss ett alternativ ved behov.</p>
              <div className={styles.optionBox}>
                {noSel.rows.map((o) => (
                  <RadioLine key={o.id} label={o.label} />
                ))}
              </div>
            </section>
          ) : null}

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Medlemskap</h2>
            <div className={styles.optionBox}>
              {mem.rows.map((m) => (
                <RadioLine key={m.id} label={m.label} />
              ))}
            </div>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Kontakt</h2>
            <RuleField label="Navn" />
            <RuleField label="E-post" />
            <RuleField label="Telefon" />
            <RuleField label="Kommentarer / øvrige opplysninger" />
          </section>

          {langs.rows.length > 0 ? (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Språk</h2>
              <p className={styles.sectionHint}>Kryss språk deltakeren behersker.</p>
              <div className={styles.langGrid}>
                {langs.rows.map((l) => (
                  <CheckboxLine key={l.id} label={l.name} />
                ))}
              </div>
            </section>
          ) : null}

          <section className={`${styles.section} ${styles.finalPad}`}>
            <h2 className={styles.sectionTitle}>Evaluering av fysisk startkurs</h2>
            <p className={styles.sectionHint}>Kryss/skriv som på nettskjemaet (skala og fri tekst).</p>
            <RuleField label="Hvor fornøyd er du med kurset totalt sett?" />
            <RuleField label="Hvor fornøyd er du med kursholderne og formidlingen av kurset?" />
            <div className={styles.ruleField}>
              <span className={styles.ruleFieldLabel}>
                Kommentarer eller forslag til forbedringer i kurset
              </span>
              <div className={styles.commentBox} />
            </div>
          </section>

          <section className={styles.footnoteBox}>
            <p className={styles.footnoteHeading}>Etter registrering på papir</p>
            <p className={styles.footnoteBody}>
              Før inn data manuellt i registreringstabellen eller be deltager om å bruke nettskjema når mulig.
            </p>
          </section>
        </>
      ) : null}
    </div>
  )
}
