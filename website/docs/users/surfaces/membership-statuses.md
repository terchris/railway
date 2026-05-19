---
sidebar_position: 17
---

# Medlemskapsstatus — `/admin/membership-statuses`

**Hvem ser dette:** Full administrator, Innholdsredaktør
**Krever kapabilitet:** `content:read` (lesing), `content:write` (endring)

![Liste over medlemskapsstatuser](/img/screenshots/rwg-adm-membership-statuses.png)

![Detaljvisning for én medlemskapsstatus](/img/screenshots/rwg-adm-membership-status-detail.png)

## Hva siden gjør

Definerer **radio-valgene** brukeren ser på trinnet «Om deg» (typisk «frivillig», «medlem», «både og»). Hver status kan også styre om medlemskapsalternativene fra [Medlemskapsalternativer](membership-options.md) vises på takkesiden.

## Hva du ser

### Liste-visningen

Tabell med:

- **Tittel** på statusen (det brukeren leser ved radio-knappen)
- **Beskrivelse** / hjelpetekst under tittelen
- **Vis medlemsvalg** — om denne statusen trigger medlemsalternativ-listen på takkesiden
- **Rekkefølge** og **Aktiv** av/på

### Detalj-visningen (`/admin/membership-statuses/<id>`)

Skjema med tittel, beskrivelse, «vis medlemsvalg»-bryter, sorteringsrekkefølge, aktiv-bryter. Lagre-knapp.

## Vanlige oppgaver

- **Legge til en ny statusvariant** (f.eks. «æresmedlem») — opprett fra liste-toppen. Bestem om brukere som velger den skal se medlemsalternativene.
- **Justere rekkefølgen** — radio-knappene rangeres etter sorteringsrekkefølge.
- **Slå av en status midlertidig** — bruk aktiv-bryter. Eksisterende registreringer med statusen er ikke berørt.

## Fallgruver

- **«Vis medlemsvalg»** styrer kun takkesiden, ikke selve påmeldingsprosessen. Brukeren ser ikke noe annerledes før de har sendt skjemaet.
- **Minimum én aktiv status** — det offentlige skjemaet trenger minst ett radio-valg for å fungere.

## Relatert

- [Medlemskapsalternativer](membership-options.md) — alternativlisten som vises når «Vis medlemsvalg» er på
- [Skjemadata](skemadata.md) — hub-side
