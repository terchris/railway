---
sidebar_position: 4
---

# Registreringer — `/admin/registrations`

**Hvem ser dette:** Full administrator, Registreringsadministrator
**Krever kapabilitet:** `registrations:read` (lesing), `registrations:write` (sletting / bekreftelse)

![Listevisning av påmeldte med filter og paginering](/img/screenshots/rwg-adm-registrations.png)

![Detaljvisning for én registrering](/img/screenshots/rwg-adm-registration-detail.png)

## Hva siden gjør

Hovedlisten over alle påmeldinger fra det åpne registreringsskjemaet. Her ser staben hvem som har meldt seg, kan bekrefte hver enkelt, eller slette spam / dubletter.

## Hva du ser

### Liste-visningen

- **Tabell** med kolonnene navn, e-post, telefon, dato, og bekreftelsesstatus.
- **Filter** for å vise kun bekreftede / ubekreftede, søke i navn/e-post, eller filtrere på aktivitetsvalg.
- **Paginering** med 50 rader per side.
- **Bulk-handlinger** — kryss av flere rader for å slette i én operasjon.
- **CSV-eksport-lenke** øverst som tar deg til [CSV-eksport](registrations-export.md) med samme filter aktivt.

### Detalj-visningen (`/admin/registrations/<id>`)

Klikk på en rad for å se hele påmeldingen: alle skjemafeltene, valgte aktiviteter, valgte språk, evalueringssvar, og medlemskapsstatus. Egne knapper for bekreftelse og sletting.

## Vanlige oppgaver

- **Bekrefte en ny påmelding** — klikk på raden i listen, sjekk informasjonen på detaljsiden, klikk **«Bekreft»**. Statusen i listen oppdateres til bekreftet.
- **Slette én spam-påmelding** — fra detaljsiden, klikk **«Slett»**. Bekrefter handlingen i en dialog først.
- **Slette flere spam-påmeldinger samtidig** — kryss av relevante rader i listen, klikk **«Slett valgte»** i verktøylinjen som dukker opp øverst.
- **Eksportere alle bekreftede til CSV for videre behandling** — sett filteret «Kun bekreftede», klikk lenken til CSV-eksport.

## Fallgruver

- **Tom liste etter innlogging** — sjekk at rollen din har `registrations:read`. Innholdsredaktør og App-logg-leser har ikke den; bytt til Full administrator eller Registreringsadministrator. Se [Mine tilganger](staff.md).
- **Sletting er endelig** — det finnes ingen «angre»-knapp eller papirkurv. Sjekk at du virkelig vil slette før du bekrefter dialogen.
- **Paginering nullstilles ikke når du endrer filter** — hvis du står på side 3 og bytter filter, kan du havne på en tom side. Klikk side 1.

## Relatert

- [CSV-eksport](registrations-export.md) — samme data som flate-CSV-fil
- [Oversikt](overview.md) — kortet «Antall registreringer» peker hit
- [Slik melder du deg på](../public-registration.md) — sluttbrukerens side av samme datastrøm
