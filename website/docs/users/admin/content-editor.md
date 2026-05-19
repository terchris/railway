---
sidebar_position: 4
---

# Innholdsredaktør — styrer hva som vises på skjemaet

Innholdsredaktør har **innholds-kapabilitetene** — du eier alt som vises på det offentlige skjemaet og takkesidene, samt utskriftsversjonene. Du ser **ikke** selve påmeldingene som kommer inn; det er Registreringsadministratorens jobb.

## Slik logger du inn

Åpne `http://<host>/admin/login`. I rollevelgeren klikker du **Content editor**.

![Innloggingssiden med rollevelger — klikk «Content editor»-raden](/img/screenshots/rwg-adm-login.png)

Du lander på `/admin`. Sidemenyen viser **fire grupper**: Oversikt, Utskrift, Aktivitet og skjema, Konto.

JWT-en din inneholder `content:read` og `content:write`.

## Hva du kan gjøre

### Oversikt

Forsiden. Kortet «Skjemainnhold · aktiviteter» er din vanligste inngangspunkt — fire snarveier rett til innholdsredigering.

→ [Detaljer](../surfaces/overview.md)

### Utskrift

To utskriftsoptimaliserte sider for fysisk arbeid:

![Utskriftsvennlig manuskript for muntlig gjennomgang](/img/screenshots/rwg-adm-print-manuscript.png)

- [Manuskript](../surfaces/print-manuscript.md) — lese-versjon for stab som tar imot påmelding muntlig.
- [Papirskjema](../surfaces/print-form.md) — papirversjon med fyll-felt for offline-registrering.

### Aktivitet og skjema

Hovedtyngden av jobben. Alt som vises på det offentlige skjemaet kan redigeres her.

![Liste over aktiviteter gruppert etter kategori](/img/screenshots/rwg-adm-activities.png)

**Aktivitetstrinnet:**

- [Aktiviteter](../surfaces/activities.md) — av/på, opprette nye, redigere navn
- [Tilleggsaktiviteter](../surfaces/additional-activities.md) — sekundære aktiviteter
- [Aktivitetskategorier](../surfaces/activity-categories.md) — gruppe-overskriftene
- [Aktivitetsinnstillinger](../surfaces/activity-settings.md) — min/maks antall valg
- [Aktivitetstekster](../surfaces/activities-text.md) — overskrifter og hjelpetekster

**Alle tekster og oppslagsdata:**

- [Skjematekster](../surfaces/text-content.md) — alle redaksjonelle tekstfelt
- [Skjemadata](../surfaces/skemadata.md) — hub-side over evaluering, medlemskap, språk, m.m.

**Evaluering:**

- [Evalueringsspørsmål](../surfaces/eval-questions.md), [Evalueringssvar](../surfaces/eval-options.md)

**Medlemskap:**

- [Medlemskapsalternativer](../surfaces/membership-options.md), [Medlemskapsstatus](../surfaces/membership-statuses.md)

**Andre oppslag:**

- [Språk](../surfaces/languages.md)
- [«Ingen aktivitet»-alternativer](../surfaces/no-selected-options.md)

### Konto

Sjekke at JWT-en din er gyldig.

→ [Mine tilganger](../surfaces/staff.md)

## Hva du **ikke** kan gjøre

Sidemenyen mangler to grupper:

- **Registreringer** — krever `registrations:read`. Du kan ikke se hvem som har meldt seg, eller eksportere CSV. Hvis du må gjøre det, bytt til [Registreringsadministrator](registrations-admin.md) eller [Full administrator](full-admin.md).
- **Drift** (App-logg) — krever `app_log:read`. Du kan ikke se feilmeldinger eller varsler. Bytt til [App-logg-leser](app-log-viewer.md) eller [Full administrator](full-admin.md).

## Relatert

- [Slik logger du inn](../surfaces/login.md)
- [Mine tilganger](../surfaces/staff.md) — bekrefte JWT-status
- [Slik melder du deg på](../public-registration.md) — sluttbrukerens side, der innholdet ditt vises
- [Test av dummy-innlogging](../../contributors/testing-dummy-login.md) — utviklerens funksjonelle sjekkliste for denne rollen
