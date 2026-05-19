import { PrintToolbar } from "@/components/admin/print-toolbar"
import { StaffJwtMissing } from "@/components/admin/staff-jwt-missing"
import { fetchPrintActivities } from "@/lib/admin-print-data"
import { pgStaff } from "@/lib/admin-postgrest"

import adminStyles from "@/app/admin/(dashboard)/admin.module.css"
import styles from "./page.module.css"

export const dynamic = "force-dynamic"

function formatBody(text: string) {
  const t = text.trim()
  if (!t) return null
  return t.split(/\n{2,}/).map((para, i) => (
    <p key={i} className={styles.activityPara}>
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
    <div className={`print-document ${styles.document}`}>
      <PrintToolbar
        backHref="/admin/registrations"
        backLabel="Til registreringer"
        siblingHref="/admin/print/form"
        siblingLabel="Papirskjema"
      />

      <header className={styles.header}>
        <h1 className={styles.title}>Manuskript · aktiviteter</h1>
        <p className={styles.intro}>
          Tekst som vises til deltaker for hver aktivitet (feltet «Informasjon»), pluss internt notat
          til kursholder der det finnes. Kun aktiviteter som er <strong>aktive</strong> i skjemaet.
        </p>
        <p className={styles.timestamp}>
          Generert {new Date().toLocaleString("nb-NO", { dateStyle: "long", timeStyle: "short" })}
        </p>
      </header>

      {error ? (
        <p className={adminStyles.errorBanner}>{error}</p>
      ) : (
        <div className={styles.categoryList}>
          {grouped.map(({ cat, rows }) => (
            <section key={cat.id} className={styles.section}>
              <h2 className={styles.sectionTitle}>
                {cat.name}
                {cat.is_additional ? (
                  <span className={styles.sectionTitleHint}>(tilleggsaktiviteter)</span>
                ) : null}
              </h2>
              {rows.length === 0 ? (
                <p className={styles.empty}>Ingen aktive aktiviteter i denne kategorien.</p>
              ) : (
                <ol className={styles.list}>
                  {rows.map((a) => (
                    <li key={a.id} className={styles.listItem}>
                      <h3 className={styles.activityName}>{a.name}</h3>
                      <div className={styles.activityBody}>{formatBody(a.info)}</div>
                      {!a.internal_info.trim() ? null : (
                        <div className={styles.internalNote}>
                          <p className={styles.internalNoteTitle}>Internt notat (kun kursholder)</p>
                          <div className={styles.internalNoteBody}>{formatBody(a.internal_info)}</div>
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
