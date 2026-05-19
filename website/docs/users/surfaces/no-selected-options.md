---
sidebar_position: 18
---

# «Ingen aktivitet»-alternativer — `/admin/no-selected-options`

**Hvem ser dette:** Full administrator, Innholdsredaktør
**Krever kapabilitet:** `content:read` (lesing), `content:write` (endring)

![Liste over alternativer en bruker kan velge når de ikke vil ha aktivitet](/img/screenshots/rwg-adm-no-selected-options.png)

![Detaljvisning for ett alternativ](/img/screenshots/rwg-adm-no-selected-option-detail.png)

## Hva siden gjør

Definerer **valgalternativene** brukeren ser hvis de krysser av for «Jeg ønsker ikke aktivitet» på aktivitetstrinnet. Lar staben skille mellom for eksempel «vil bli kontaktet senere», «trenger informasjon først», eller «kun medlemskap».

## Hva du ser

### Liste-visningen

Tabell med:

- **Tittel** (det brukeren ser ved alternativet)
- **Beskrivelse** / hjelpetekst
- **Rekkefølge** og **Aktiv** av/på

### Detalj-visningen (`/admin/no-selected-options/<id>`)

Skjema med tittel, beskrivelse, sorteringsrekkefølge, aktiv-bryter. Lagre-knapp.

## Vanlige oppgaver

- **Legge til et nytt alternativ** — opprett fra liste-toppen, fyll ut tittel og beskrivelse, lagre.
- **Endre rekkefølgen** — juster sorteringsrekkefølge per alternativ.
- **Pensjonere et alternativ** — bruk aktiv-bryter.

## Fallgruver

- **Brukes kun når [Aktivitetsinnstillinger](activity-settings.md) tillater 0 aktiviteter** — hvis minimum-antallet er 1 eller mer, vil brukere aldri se denne listen.
- **Sletting bryter registreringer** som har valgt alternativet; foretrekk å slå av.

## Relatert

- [Aktivitetsinnstillinger](activity-settings.md) — minimum-grensen som styrer om listen vises
- [Aktiviteter](activities.md) — selve aktivitetstrinnet
- [Skjemadata](skemadata.md) — hub-side
