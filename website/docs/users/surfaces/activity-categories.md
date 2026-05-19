---
sidebar_position: 7
---

# Aktivitetskategorier — `/admin/activity-categories`

**Hvem ser dette:** Full administrator, Innholdsredaktør
**Krever kapabilitet:** `content:read` (lesing), `content:write` (endring)

![Liste over aktivitetskategorier med rekkefølge-knapper](/img/screenshots/rwg-adm-activity-categories.png)

## Hva siden gjør

Definerer overskriftene aktivitetene grupperes under på trinnet «Velg aktiviteter». Eksempler: «Ungdom», «Vennefamilie», «Andre aktiviteter». Hver aktivitet på [Aktiviteter](activities.md) tilordnes én kategori.

## Hva du ser

Tabell med kolonnene:

- **Kategorinavn** (norsk overskrift)
- **Type** — om kategorien er for hovedaktiviteter eller tilleggsaktiviteter
- **Rekkefølge** — opp/ned-knapper som flytter kategorien én plass om gangen

## Vanlige oppgaver

- **Bytte rekkefølgen på to kategorier** — bruk opp/ned-knappene. Endringen oppdateres umiddelbart på det offentlige skjemaet.
- **Endre navnet på en kategori** — klikk raden, rediger navnet, lagre. Alle aktiviteter som tilhører kategorien beholder tilknytningen.

## Fallgruver

- **Sletting støttes ikke fra UI** i dag — hvis en kategori skal fjernes må aktivitetene først flyttes til en annen kategori. Be utvikleren slette i databasen direkte.
- **Rekkefølge styres per kategori-type** — hovedaktiviteter og tilleggsaktiviteter har egne rekkefølger.

## Relatert

- [Aktiviteter](activities.md) — selve aktivitetene som tilordnes kategoriene
- [Tilleggsaktiviteter](additional-activities.md) — viser kategorier med type «tillegg»
