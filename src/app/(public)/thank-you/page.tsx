import Link from "next/link"

import { getThankYouCopy } from "@/lib/content"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type Props = { searchParams?: Promise<{ "complete-membership"?: string }> }

export const dynamic = "force-dynamic"

export default async function ThankYouPage(props: Props) {
  const sp = (await props.searchParams) ?? {}
  const showMembership = sp["complete-membership"] === "true"
  const copy = await getThankYouCopy()

  return (
    <main className="rwr-main mx-auto flex max-w-2xl flex-1 flex-col gap-10 px-6 py-16">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">
            {copy?.title ?? "Takk!"}
          </CardTitle>
        </CardHeader>
        <CardContent className="prose prose-neutral max-w-none text-zinc-700">
          {copy?.body ? (
            <div dangerouslySetInnerHTML={{ __html: copy.body }} />
          ) : (
            <p>Registreringen er mottatt. Vi tar kontakt så snart som mulig.</p>
          )}
        </CardContent>
      </Card>

      {showMembership && (copy?.memberTitle || copy?.memberBody) ? (
        <Card className="border-emerald-200 bg-emerald-50/60">
          <CardHeader>
            <CardTitle className="text-lg text-emerald-900">
              {copy.memberTitle ?? "Bli medlem"}
            </CardTitle>
          </CardHeader>
          <CardContent className="prose prose-neutral max-w-none text-emerald-950">
            {copy.memberBody ? (
              <div dangerouslySetInnerHTML={{ __html: copy.memberBody }} />
            ) : null}
            {copy.memberFootnote ? (
              <p className="mt-4 text-sm text-emerald-900">{copy.memberFootnote}</p>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <Button asChild variant="secondary" className="w-fit">
        <Link href="/">Tilbake til forsiden</Link>
      </Button>
    </main>
  )
}
