---
sidebar_position: 16
---

# Medlemskapsalternativer — `/admin/membership-options`

**Hvem ser dette:** Full administrator, Innholdsredaktør
**Krever kapabilitet:** `content:read` (lesing), `content:write` (endring)

![Liste over medlemskapsalternativer](/img/screenshots/rwg-adm-membership-options.png)

![Detaljvisning for ett medlemskapsalternativ](/img/screenshots/rwg-adm-membership-option-detail.png)

## Hva siden gjør

Definerer hvilke **medlemskaps-alternativer** brukeren får etter de har valgt en medlemskapsstatus som krever oppfølging (f.eks. «medlem» som krever betaling). Lista vises på takkesiden for medlems-flyten.

## Hva du ser

### Liste-visningen

Tabell med:

- **Tittel** på alternativet (det brukeren ser)
- **Beskrivelse** / hjelpetekst
- **URL** (lenken til betalingsside eller info)
- **Rekkefølge** og **Aktiv** av/på

### Detalj-visningen (`/admin/membership-options/<id>`)

Skjema med tittel, beskrivelsestekst, lenke-URL, sorteringsrekkefølge, aktiv-bryter. Lagre-knapp.

## Vanlige oppgaver

- **Oppdatere lenken til Røde Kors' medlemsbetalingsside** — finn alternativet, klikk inn, endre URL, lagre.
- **Legge til et nytt alternativ** for en ny type medlemskap — opprett fra liste-toppen.
- **Pensjonere et utgått alternativ** — bruk aktiv-bryter.

## Fallgruver

- **URL må være fullstendig** (inkludert `https://`) — relative lenker blir forvirret av brukerens nettleser.
- **Endringer er umiddelbart synlige** på takkesiden for nye påmeldinger.

## Relatert

- [Medlemskapsstatus](membership-statuses.md) — hvilke statusvalg som trigger alternativene
- [Skjemadata](skemadata.md) — hub-side
- [Slik melder du deg på](../public-registration.md#som-medlem) — den brukerorienterte siden
