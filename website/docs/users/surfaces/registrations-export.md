---
sidebar_position: 5
---

# CSV-eksport — `/admin/registrations/export`

**Hvem ser dette:** Full administrator, Registreringsadministrator
**Krever kapabilitet:** `registrations:read`

> **Skjermbilde mangler.** `npm run docs:screens` fanger ikke denne siden i dagens fangstskript ([`scripts/capture-screen-docs.mjs`](https://github.com/terchris/railway/blob/main/scripts/capture-screen-docs.mjs)). Legg til en linje i `adminShots`-tabellen for å oppdatere. Se [Skjermbilder og video](../../contributors/screenshots-and-video.md).

## Hva siden gjør

Last ned alle registreringer (med samme filter du har satt på listen) som en kommaseparert tekstfil. Brukes for videre behandling i regneark eller for håndoverlevering til lokallag.

## Hva du ser

En knapp eller lenke som starter nedlastingen direkte. Navnet på den nedlastede filen inneholder typisk dato og filterinfo, for eksempel `registrations-2026-05-19.csv`.

URL-parametre fra [Registreringer-listen](registrations.md) videreføres hit — hvis du klikker eksport-lenken fra en filtrert liste, ser den eksporterte CSV-en kun de filtrerte radene.

## Vanlige oppgaver

- **Eksportere bekreftede påmeldinger fra siste uke** — gå til [Registreringer](registrations.md), sett filteret «Kun bekreftede», sett datointervall, klikk **«Eksporter CSV»**-lenken.
- **Eksportere alle påmeldinger til en bestemt aktivitet** — fra [Registreringer](registrations.md), filtrer på aktivitet, klikk eksport-lenken.

## Fallgruver

- **CSV-en kan inneholde personopplysninger** — behandle filen i samsvar med GDPR. Ikke send på e-post uten kryptering; ikke lagre på personlig sky-disk.
- **Filter må settes før eksport** — eksport-knappen tar med det aktive filteret. Hvis du eksporterer fra «alle uten filter», får du hele databasen.
- Sjekk **«Kun bekreftede»** før eksport hvis du bare vil ha kvalifiserte påmeldinger.

## Relatert

- [Registreringer](registrations.md) — selve listen som eksporteres
