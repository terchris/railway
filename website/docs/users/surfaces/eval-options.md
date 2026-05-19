---
sidebar_position: 14
---

# Evalueringssvar — `/admin/evaluation/options`

**Hvem ser dette:** Full administrator, Innholdsredaktør
**Krever kapabilitet:** `content:read` (lesing), `content:write` (endring)

![Liste over svaralternativer for evalueringsspørsmål](/img/screenshots/rwg-adm-eval-options.png)

![Detaljvisning for ett svaralternativ](/img/screenshots/rwg-adm-eval-option-detail.png)

## Hva siden gjør

Definerer **svaralternativene** som vises i nedtrekkslisten for alle `select`-type [Evalueringsspørsmål](eval-questions.md). Lista er felles — alle nedtrekks-spørsmål peker på samme sett alternativer.

## Hva du ser

### Liste-visningen

Tabell med:

- **Alternativets tekst** (det brukeren ser i nedtrekkslisten)
- **Rekkefølge** — hvor alternativet vises i listen
- **Aktiv** — av/på

### Detalj-visningen (`/admin/evaluation/options/<id>`)

Skjema med tekst, sorteringsrekkefølge, aktiv-bryter. Lagre-knapp.

## Vanlige oppgaver

- **Legge til et nytt svaralternativ** — opprett fra liste-toppen. Det blir umiddelbart tilgjengelig i alle `select`-spørsmål.
- **Endre rekkefølgen i nedtrekkslisten** — juster sorteringsrekkefølge per alternativ.
- **Pensjonere et alternativ** — bruk aktiv-bryter. Eksisterende registreringer som har valgt alternativet, beholder valget; nye påmeldinger ser det ikke lenger.

## Fallgruver

- **Felles liste på tvers av spørsmål** — hvis du fjerner et alternativ fordi det er irrelevant for spørsmål A, forsvinner det også fra spørsmål B. Sjekk hvilke spørsmål som er aktive først.
- **Sletting kan bryte historikk** — foretrekk å slå av i stedet for å slette.

## Relatert

- [Evalueringsspørsmål](eval-questions.md) — spørsmålene som bruker disse alternativene
- [Skjemadata](skemadata.md) — hub-side
