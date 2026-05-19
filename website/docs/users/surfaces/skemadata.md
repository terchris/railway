---
sidebar_position: 12
---

# Skjemadata — `/admin/skemadata`

**Hvem ser dette:** Full administrator, Innholdsredaktør
**Krever kapabilitet:** `content:read` (lesing — endring krever `content:write` på undersider)

![Hub-side med 6 kort som lenker til underliggende oppslagsdata](/img/screenshots/rwg-adm-skemadata.png)

## Hva siden gjør

Hub-side over alle **oppslags- og strukturdata** som styrer det offentlige skjemaet utenom selve aktivitetene. Hver kort lenker til en egen redigeringsside. Bruk denne siden for å finne hva som ligger hvor før du redigerer.

## Hva du ser

Seks kort i et rutenett:

- **Språk** — peker til [Språk](languages.md) (`user_languages` — språkalternativ på skjemaet).
- **Medlemsstatus** — peker til [Medlemskapsstatus](membership-statuses.md) (`membership_statuses` — radiovalg for «frivillig» vs «medlem»).
- **Medlemsalternativer** — peker til [Medlemskapsalternativer](membership-options.md) (`membership_options` — lenker og infotekst på medlemsflyten).
- **Uten aktivitet** — peker til [«Ingen aktivitet»-alternativer](no-selected-options.md) (`no_selected_activity_options` — alternativene som vises når brukeren ikke vil ha aktivitet).
- **Evaluering · spørsmål** — peker til [Evalueringsspørsmål](eval-questions.md) (`evaluation_questions` — spørsmålstekst og type: liste eller fritekst).
- **Evaluering · alternativer** — peker til [Evalueringssvar](eval-options.md) (`evaluation_options` — svarliste for nedtrekks-spørsmål).

## Vanlige oppgaver

Skjemadata er en ren navigasjons-side; selve redigeringen skjer på undersidene den lenker til.

- **Legge til et nytt språk** → [Språk](languages.md)
- **Justere medlemskapsalternativer** → [Medlemskapsalternativer](membership-options.md)
- **Endre et evalueringsspørsmål** → [Evalueringsspørsmål](eval-questions.md)

## Fallgruver

Ingen — siden er passiv navigasjon. Alle handlinger ligger på undersidene.

## Relatert

- [Skjematekster](text-content.md) — redaksjonelle tekstfelt (et annet datasett)
- [Aktiviteter](activities.md) — selve aktivitetene
