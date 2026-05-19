import Link from "next/link"

import { getThankYouCopy } from "@/lib/content"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import styles from "./page.module.css"

type Props = { searchParams?: Promise<{ "complete-membership"?: string }> }

export const dynamic = "force-dynamic"

export default async function ThankYouPage(props: Props) {
  const sp = (await props.searchParams) ?? {}
  const showMembership = sp["complete-membership"] === "true"
  const copy = await getThankYouCopy()

  return (
    <main className={styles.main}>
      <Card>
        <CardHeader>
          <CardTitle className={styles.title}>
            {copy?.title ?? "Takk!"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {copy?.body ? (
            <div className={styles.editorial} dangerouslySetInnerHTML={{ __html: copy.body }} />
          ) : (
            <p className={styles.editorial}>Registreringen er mottatt. Vi tar kontakt så snart som mulig.</p>
          )}
        </CardContent>
      </Card>

      {showMembership && (copy?.memberTitle || copy?.memberBody) ? (
        <Card className={styles.memberCard}>
          <CardHeader>
            <CardTitle className={styles.memberTitle}>
              {copy.memberTitle ?? "Bli medlem"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {copy.memberBody ? (
              <div className={styles.memberBody} dangerouslySetInnerHTML={{ __html: copy.memberBody }} />
            ) : null}
            {copy.memberFootnote ? (
              <p className={styles.memberFootnote}>{copy.memberFootnote}</p>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <Button asChild variant="secondary" className={styles.backLink}>
        <Link href="/">Tilbake til forsiden</Link>
      </Button>
    </main>
  )
}
