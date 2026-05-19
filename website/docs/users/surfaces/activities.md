---
sidebar_position: 6
---

# Aktiviteter — `/admin/activities`

**Hvem ser dette:** Full administrator, Innholdsredaktør
**Krever kapabilitet:** `content:read` (lesing), `content:write` (av/på + opprettelse)

![Liste over aktiviteter gruppert etter hovedkategori](/img/screenshots/rwg-adm-activities.png)

![Detaljvisning for én aktivitet med skjema for redigering](/img/screenshots/rwg-adm-activity-detail.png)

![Skjema for å opprette ny aktivitet](/img/screenshots/rwg-adm-activities-new.png)

## Hva siden gjør

Listen og redigeringen av aktivitetene som vises på trinnet **«Velg aktiviteter»** i det offentlige skjemaet. Du kan slå aktiviteter av og på, opprette nye, og endre rekkefølge / kategorier.

## Hva du ser

### Liste-visningen

- **Aktiviteter gruppert etter hovedkategori** — for eksempel «Ungdom», «Vennefamilie», «Røde Kors Ungdom», etc.
- Hver aktivitet har en **av/på-knapp**, navn, og status «Trenger frivillige» (Ja/Nei).
- **Snarveier** øverst til høyre: **«Tilleggsaktiviteter»**, **«Ny aktivitet»**, **«Kategorier»**, **«Innstillinger»**.

### Detalj-visningen (`/admin/activities/<id>`)

Skjema med redigerbare felt: navn, kategori, sorteringsrekkefølge, om aktiviteten er aktiv, og om den trenger flere frivillige. Egen lagre-knapp.

### Ny aktivitet (`/admin/activities/new`)

Tomt skjema med samme felt som detaljvisningen. Standardvalg: «aktiv» av, må manuelt slås på etter opprettelse.

## Vanlige oppgaver

- **Skjule en aktivitet midlertidig** — klikk av/på-knappen i listen. Aktiviteten forsvinner umiddelbart fra det offentlige skjemaet, men data er bevart.
- **Opprette en ny aktivitet** — klikk **«Ny aktivitet»** øverst, fyll ut skjemaet, lagre. Husk å slå på «aktiv» etter at den er opprettet.
- **Flytte en aktivitet til en annen kategori** — klikk raden, endre kategori i nedtrekkslisten, lagre. Rekkefølgen innen kategorien styres av sorteringsrekkefølge.
- **Endre rekkefølge på en kategori** — fra [Aktivitetskategorier](activity-categories.md), bruk opp/ned-knappene.

## Fallgruver

- **Sletting finnes ikke** — av/på-knappen er den eneste måten å skjule en aktivitet. Sletting ville bryte foreliggende registreringer som peker på aktiviteten.
- **«Trenger frivillige»** er kun informasjonsfeltet — det styrer ikke om aktiviteten vises eller ikke.
- Endringer er **umiddelbart synlige** på det offentlige skjemaet (`/`). Ikke en utkast-modus.

## Relatert

- [Aktivitetskategorier](activity-categories.md) — gruppene aktiviteter sorteres under
- [Aktivitetsinnstillinger](activity-settings.md) — øvre/nedre grenser for hvor mange aktiviteter en bruker kan velge
- [Tilleggsaktiviteter](additional-activities.md) — separat liste for «sekundære» aktiviteter
- [Aktivitetstekster](activities-text.md) — overskrifter og hjelpetekster på trinnet
