import Link from "next/link"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import adminStyles from "@/app/admin/(dashboard)/admin.module.css"
import styles from "./page.module.css"

const links = [
  { href: "/admin/languages", title: "Språk", body: "user_languages — språkalternativ på skjemaet." },
  { href: "/admin/membership-statuses", title: "Medlemsstatus", body: "membership_statuses — radiovalg og «vis medlemsvalg»." },
  { href: "/admin/membership-options", title: "Medlems­alternativer", body: "membership_options — lenker og infotekst." },
  { href: "/admin/no-selected-options", title: "Uten aktivitet", body: "no_selected_activity_options — når ingen aktivitet krysses av." },
  { href: "/admin/evaluation/questions", title: "Evaluering · spørsmål", body: "evaluation_questions — tekst og type (liste/fritekst)." },
  { href: "/admin/evaluation/options", title: "Evaluering · alternativer", body: "evaluation_options — felles svarliste for liste-spørsmål." },
] as const

export default function AdminSkemadataHubPage() {
  return (
    <div className={adminStyles.pageWide}>
      <div className={adminStyles.pageHeaderInner}>
        <h1 className={adminStyles.pageTitle}>Skjemadata</h1>
        <p className={adminStyles.pageLead}>
          Oppslags- og struktur-data som også brukes på det åpne frivilligskjemaet. Endring her krever staff-JWT og
          rettigheter <span className={adminStyles.mono}>content:write</span>. Sjå også{" "}
          <Link href="/admin/text-content" className={adminStyles.actionLink}>
            skjematekster
          </Link>
          {" · "}
          <Link href="/admin/activities" className={adminStyles.actionLink}>
            aktiviteter
          </Link>
          .
        </p>
      </div>

      <div className={styles.grid}>
        {links.map((l) => (
          <Link key={l.href} href={l.href} className={styles.linkWrap}>
            <Card className={styles.linkCard}>
              <CardHeader className={adminStyles.sectionCardHeader}>
                <CardTitle className={styles.linkTitle}>{l.title}</CardTitle>
              </CardHeader>
              <CardContent className={styles.linkBody}>{l.body}</CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
