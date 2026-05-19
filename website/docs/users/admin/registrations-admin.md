---
sidebar_position: 3
---

# Registreringsadministrator — tar imot påmeldinger

Registreringsadministrator har **kun de to registrerings-kapabilitetene** og holder seg til selve påmeldingsdataene. Innhold (aktiviteter, tekster, evaluering) og drift (app-logg) ligger utenfor.

<video controls width="100%" preload="metadata" poster="/img/screenshots/rwg-adm-registrations.png">
  <source src="/img/promo/railway-promo-registrations-admin.mp4" type="video/mp4" />
  Nettleseren din støtter ikke avspilling av video. Du kan laste den ned: <a href="/img/promo/railway-promo-registrations-admin.mp4">railway-promo-registrations-admin.mp4</a>.
</video>

## Slik logger du inn

Åpne `http://<host>/admin/login`. I rollevelgeren klikker du **Registrations admin**.

![Innloggingssiden med rollevelger — klikk «Registrations admin»-raden](/img/screenshots/rwg-adm-login.png)

Du lander på `/admin`. Sidemenyen viser **tre grupper**: Oversikt, Registreringer, Konto.

JWT-en din inneholder `registrations:read` og `registrations:write`. Andre kapabiliteter mangler — det er bevisst.

## Hva du kan gjøre

### Oversikt

Forsiden viser antallet påmeldinger som ett av kortene. Andre kort vil vise «Krever staff-JWT» for kapabiliteter du mangler.

→ [Detaljer](../surfaces/overview.md)

### Registreringer

Hovedflaten for jobben din. Liste og detalj over alle påmeldinger, med filter, paginering, bulk-sletting, og CSV-eksport.

![Listevisning av påmeldte med filter](/img/screenshots/rwg-adm-registrations.png)

→ [Registreringer](../surfaces/registrations.md) · [CSV-eksport](../surfaces/registrations-export.md)

### Konto

Sjekke at JWT-en din er gyldig og hvilke kapabiliteter den faktisk inneholder.

→ [Mine tilganger](../surfaces/staff.md)

## Hva du **ikke** kan gjøre

Sidemenyen mangler tre grupper sammenlignet med [Full administrator](full-admin.md):

- **Utskrift** og **Aktivitet og skjema** — krever `content:read`. Hvis du må endre aktivitetslisten eller skjematekstene, bytt til [Innholdsredaktør](content-editor.md) eller [Full administrator](full-admin.md).
- **Drift** (App-logg) — krever `app_log:read`. Hvis du må sjekke om en spam-bølge har truffet skjemaet eller om det er feilmeldinger i innsendinger, bytt til [App-logg-leser](app-log-viewer.md) eller [Full administrator](full-admin.md).

Hvis du prøver å åpne en flate du ikke har kapabilitet for, vil PostgREST avvise lese-kallet og siden viser tom-tilstand eller en feilmelding.

## Relatert

- [Slik logger du inn](../surfaces/login.md)
- [Mine tilganger](../surfaces/staff.md) — bekrefte JWT-status
- [Slik melder du deg på](../public-registration.md) — sluttbrukerens side av samme datastrøm
- [Test av dummy-innlogging](../../contributors/testing-dummy-login.md) — utviklerens funksjonelle sjekkliste for denne rollen
