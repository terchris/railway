---
sidebar_position: 20
---

# Papirskjema — `/admin/print/form`

**Hvem ser dette:** Full administrator, Innholdsredaktør
**Krever kapabilitet:** `content:read`

![Utskriftsvennlig papirskjema for offline-påmelding](/img/screenshots/rwg-adm-print-form.png)

## Hva siden gjør

En **fysisk variant av påmeldingsskjemaet** med tomme felter brukere kan fylle ut for hånd. Brukes når deltakere ikke har tilgang til datamaskin eller smarttelefon under registreringen (typisk i feltarbeid, eldreomsorg, eller når internett ikke er tilgjengelig).

## Hva du ser

Hele skjemaet i utskriftsformat med fyll-felt:

- Linjer for navn, e-post, telefon
- Avkrysningsbokser for språk
- Radio-knapper for medlemskapsstatus
- Liste med aktiviteter med avkrysningsbokser
- Evalueringsspørsmål med plass for skriftlige svar eller avkrysninger

Stilen er optimalisert for A4-utskrift med Ctrl/Cmd+P.

## Vanlige oppgaver

- **Skrive ut N papirskjemaer før et arrangement** — åpne siden, Ctrl/Cmd+P, sett antall kopier, skriv ut.
- **Sjekke at en ny aktivitet vises på papirskjemaet etter endring** — papirversjonen oppdaterer seg umiddelbart etter at du har slått på aktiviteten i [Aktiviteter](activities.md).

## Fallgruver

- **Papirpåmeldinger må tastes inn manuelt** i ettertid — det finnes ingen «skann og les inn»-funksjon. Bruk det åpne skjemaet på `/` til å taste inn papirpåmeldinger.
- **Lange aktivitetslister gir flersides papirskjema** — vurder å redusere antall synlige aktiviteter før utskrift om det er upraktisk.

## Relatert

- [Manuskript](print-manuscript.md) — lese-versjonen for muntlig gjennomgang
- [Aktiviteter](activities.md) — listen som dukker opp på papiret
- [Slik melder du deg på](../public-registration.md) — digital versjon
