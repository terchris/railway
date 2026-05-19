---
sidebar_position: 15
---

# Språk — `/admin/languages`

**Hvem ser dette:** Full administrator, Innholdsredaktør
**Krever kapabilitet:** `content:read` (lesing), `content:write` (endring)

![Liste over tilgjengelige språk i påmeldingsskjemaet](/img/screenshots/rwg-adm-languages.png)

![Detaljvisning for ett språk](/img/screenshots/rwg-adm-language-detail.png)

## Hva siden gjør

Vedlikeholder listen over **språk** brukeren kan velge på trinnet «Om deg» (feltet «Hvilke språk behersker du»). Tabellen ligger i `railway.user_languages` og brukes også av staben for matching mot aktiviteter som krever et bestemt språk.

## Hva du ser

### Liste-visningen

Tabell med:

- **Språknavn** (norsk visning, f.eks. «Norsk», «Engelsk», «Tigrinja»)
- **Rekkefølge**
- **Aktiv** — av/på

### Detalj-visningen (`/admin/languages/<id>`)

Skjema med språknavn, sorteringsrekkefølge, aktiv-bryter, og lagre-knapp.

## Vanlige oppgaver

- **Legge til et nytt språk** — opprett fra liste-toppen. Det blir umiddelbart tilgjengelig på det offentlige skjemaet.
- **Endre rekkefølgen** — juster sorteringsrekkefølge per språk (typisk «Norsk» og «Engelsk» på topp).
- **Slå av et språk** — bruk aktiv-bryter. Eksisterende registreringer som har valgt språket, beholder valget.

## Fallgruver

- **Sletting** bryter historiske registreringer; foretrekk «slå av».
- **Brukeren må velge minst ett språk** for å sende skjemaet — sørg for at lista alltid har minst ett aktivt alternativ.

## Relatert

- [Skjemadata](skemadata.md) — hub-side
- [Slik melder du deg på](../public-registration.md) — der brukeren velger språk
