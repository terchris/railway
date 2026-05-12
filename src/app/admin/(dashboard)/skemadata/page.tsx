import Link from "next/link"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

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
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Skjemadata</h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-600">
          Oppslags- og struktur-data som også brukes på det åpne frivilligskjemaet. Endring her krever staff-JWT og
          rettigheter <span className="font-mono">content:write</span>. Sjå også{' '}
          <Link href="/admin/text-content" className="text-red-700 hover:underline">
            skjematekster
          </Link>
          {' · '}
          <Link href="/admin/activities" className="text-red-700 hover:underline">
            aktiviteter
          </Link>
          .
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {links.map((l) => (
          <Link key={l.href} href={l.href} className="block rounded-lg outline-none ring-red-700/40 focus-visible:ring-2">
            <Card className="h-full border-zinc-200 transition-colors hover:bg-zinc-50/90">
              <CardHeader className="border-b border-zinc-100 py-4">
                <CardTitle className="text-base text-red-900">{l.title}</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 text-sm text-zinc-600">{l.body}</CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
